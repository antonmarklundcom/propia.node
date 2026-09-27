/**
 * The Telegram bot's webhook (docs/plan-agency-2026-09-26.md batch 4). The
 * founder registers it once with `setWebhook?url=…/api/telegram&secret_token=…`;
 * Telegram then POSTs every update for the bot here with the
 * `X-Telegram-Bot-Api-Secret-Token` header.
 *
 * - **Off until configured**: no `TELEGRAM_WEBHOOK_SECRET` (or one under 16
 *   characters) → 503. A wrong or missing header → 401, compared in constant
 *   time (`secretMatches()`).
 * - `/start <token>` in a private chat links that chat to the user the token
 *   was signed for (`verifyTelegramLinkToken()`, constant time, one-hour
 *   expiry) — unless that user already has a different chat linked, which is
 *   never replaced silently: the bot asks them to disconnect first on
 *   /agencia/perfil. `/stop` unlinks every account using the chat; anything
 *   else gets a one-line help.
 * - Replies are in the linked user's `users.locale` once the token names
 *   one, else in the Telegram app's language (`from.language_code`: English
 *   for `en*`, Spanish otherwise).
 * - **Replies ride on the response.** Telegram lets a webhook answer with a
 *   Bot API call in its body (`{"method":"sendMessage",…}`), so a reply costs
 *   no outbound request and cannot stall this one.
 * - Every authenticated, well-formed update is answered 200 — including ones
 *   we ignore (groups, edits, stickers) and ones over the per-chat rate limit
 *   — so Telegram never retries them. A database failure is a 500, which
 *   Telegram does retry.
 * - **Never logs** a message text, a chat id or a user id.
 */
import { NextRequest, NextResponse } from "next/server";
import { allowRequest } from "@/lib/rate-limit";
import { isChatId, secretMatches, telegramWebhookSecret, verifyTelegramLinkToken } from "@/lib/telegram";
import { linkTelegramChat, unlinkTelegramChat } from "@/lib/telegram-accounts";
import { telegramCopy } from "@/lib/telegram-text";

export const dynamic = "force-dynamic";

/** Telegram updates are small; anything bigger is not one we act on. */
const BODY_MAX_BYTES = 256 * 1024;
/** Commands per chat per window — enough for a person, not for a script. */
const CHAT_MAX = 20;
const CHAT_WINDOW_MS = 10 * 60_000;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

/** 200 with a sendMessage for Telegram to perform on our behalf. */
function reply(chatId: string, text: string) {
  return json(200, { method: "sendMessage", chat_id: chatId, text });
}

async function readCapped(req: NextRequest): Promise<string | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > BODY_MAX_BYTES) return null;
  const buf = await req.arrayBuffer();
  return buf.byteLength > BODY_MAX_BYTES ? null : new TextDecoder().decode(buf);
}

interface TelegramUpdate {
  message?: {
    chat?: { id?: unknown; type?: unknown };
    text?: unknown;
    from?: { language_code?: unknown };
  };
}

export async function POST(req: NextRequest) {
  const secret = telegramWebhookSecret();
  if (!secret) return json(503, { ok: false, error: "telegram not configured" });
  if (!secretMatches(req.headers.get("x-telegram-bot-api-secret-token"), secret)) {
    return json(401, { ok: false, error: "unauthorized" });
  }

  const body = await readCapped(req);
  if (body === null) return json(413, { ok: false, error: "too large" });
  let update: TelegramUpdate;
  try {
    update = JSON.parse(body) as TelegramUpdate;
  } catch {
    return json(400, { ok: false, error: "invalid update" });
  }
  if (!update || typeof update !== "object") return json(400, { ok: false, error: "invalid update" });

  // Only a text message in a private chat is a command we answer. Everything
  // else is acknowledged and dropped: a group must never be linked to a login.
  const msg = update.message;
  const rawChat = msg?.chat?.id;
  if (
    !msg ||
    msg.chat?.type !== "private" ||
    typeof msg.text !== "string" ||
    (typeof rawChat !== "number" && typeof rawChat !== "string")
  ) {
    return json(200, { ok: true });
  }
  const chatId = String(rawChat);
  if (!isChatId(chatId)) return json(200, { ok: true });
  if (!allowRequest(`telegram:${chatId}`, CHAT_MAX, CHAT_WINDOW_MS)) return json(200, { ok: true });

  const lang = msg.from?.language_code;
  const bot = telegramCopy(typeof lang === "string" && /^en\b/i.test(lang) ? "en" : "es").bot;

  // `/start@BotName payload` is how the command looks from a group or a menu.
  const m = /^\/(start|stop)(?:@[A-Za-z0-9_]+)?(?:\s+(\S+))?\s*$/.exec(msg.text.trim());
  try {
    if (m?.[1] === "start") {
      if (!m[2]) return reply(chatId, bot.help);
      const userId = verifyTelegramLinkToken(m[2]);
      if (userId == null) return reply(chatId, bot.invalidLink);
      const res = await linkTelegramChat(userId, chatId);
      if (res.status === "missing") return reply(chatId, bot.invalidLink);
      const own = telegramCopy(res.locale).bot;
      return reply(chatId, res.status === "linked" ? own.linked : own.otherChat);
    }
    if (m?.[1] === "stop") {
      return reply(chatId, (await unlinkTelegramChat(chatId)) > 0 ? bot.stopped : bot.notLinked);
    }
  } catch (e) {
    console.error(`[telegram] update not applied: ${e instanceof Error ? e.name : "error"}`);
    return json(500, { ok: false, error: "not applied" });
  }
  return reply(chatId, bot.help);
}
