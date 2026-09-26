/**
 * Telegram — the one file that knows how a Telegram message leaves this app,
 * and how a partner's Telegram chat gets tied to their login
 * (docs/plan-agency-2026-09-26.md batch 4).
 *
 * Same contract as every other outbound message (`src/lib/crm.ts`,
 * `src/lib/email.ts`):
 *
 * - **Optional by construction.** Without `TELEGRAM_BOT_TOKEN` a send is a
 *   no-op that answers `{ ok: false, error: "telegram not configured" }` —
 *   never a success nobody received, and never a log line pretending one.
 * - **Never throws.** Every caller is a lead, a share or a reminder whose row
 *   is already in MySQL; a ping is a "go look", not the record.
 * - **Bounded** at 5 s, like the webhook and the email round-trips: on this
 *   host a stalled provider keeps a Node process alive, and processes are the
 *   account-wide limit (the 503 post-mortem in PLAN.md).
 *
 * Linking is stateless: the `t.me/<bot>?start=<token>` link carries the user
 * id and an HMAC of it under `TELEGRAM_WEBHOOK_SECRET`, so there is no token
 * column and nothing to expire. Telegram delivers the `/start <token>` message
 * to `/api/telegram`, which checks the HMAC and stores the chat id on
 * `users.telegram_chat_id`. Rotating the secret invalidates every unused link
 * (already-linked chats keep working: the chat id is what is stored).
 *
 * No `next/*`, no database: the CLI jobs import this unchanged.
 */
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Same ceiling as crm.ts's webhook: strictly faster than the DB's 8 s connect timeout. */
const TELEGRAM_TIMEOUT_MS = 5_000;

/** Telegram refuses a message over 4096 characters; ours are a few lines. */
const TEXT_MAX = 4_000;

/**
 * The webhook secret doubles as the link-signing key, so it has to be long
 * enough to be one. Shorter (or unset) = the whole feature is off: the webhook
 * answers 503 and /agencia/perfil offers no link.
 */
const MIN_SECRET_LENGTH = 16;

/** Characters of the base64url HMAC kept in a link token (144 bits). */
const LINK_SIG_CHARS = 24;

export interface TelegramResult {
  ok: boolean;
  error?: string;
}

function isTimeout(e: unknown): boolean {
  return e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
}

export function telegramBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

/** A Telegram chat id as we store it: an integer, sign included, as text. */
export function isChatId(v: string): boolean {
  return /^-?\d{1,20}$/.test(v);
}

/**
 * Send one plain-text message to one chat. `{ ok: false }` when the bot is not
 * configured, the chat id is malformed, Telegram refuses it (the person
 * blocked the bot → 403) or it times out. Never throws.
 */
export async function sendTelegramTo(chatId: string, text: string): Promise<TelegramResult> {
  const token = telegramBotToken();
  if (!token) return { ok: false, error: "telegram not configured" };
  if (!isChatId(chatId)) return { ok: false, error: "telegram bad chat id" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, TEXT_MAX),
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
    });
    return res.ok ? { ok: true } : { ok: false, error: `telegram ${res.status}` };
  } catch (e) {
    return { ok: false, error: isTimeout(e) ? "telegram timeout" : "telegram network error" };
  }
}

/* -------------------------------------------------------------------------- */
/* Linking a partner's chat — signed start links and the webhook secret        */
/* -------------------------------------------------------------------------- */

/** `TELEGRAM_WEBHOOK_SECRET`, or null when unset or too short to sign with. */
export function telegramWebhookSecret(): string | null {
  const s = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  return s && s.length >= MIN_SECRET_LENGTH ? s : null;
}

/** `TELEGRAM_BOT_USERNAME` without a leading @, or null when unset or not a bot username. */
export function telegramBotUsername(): string | null {
  const u = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  return u && /^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(u) ? u : null;
}

function linkSig(userId: number, secret: string): string {
  return createHmac("sha256", secret)
    .update(`tg-link:${userId}`)
    .digest("base64url")
    .slice(0, LINK_SIG_CHARS);
}

/**
 * `<userId>_<sig>` — only `[A-Za-z0-9_-]` and at most 35 characters, inside
 * Telegram's 64-character `start` parameter limit. Null when the secret is
 * not configured.
 */
export function telegramLinkToken(userId: number): string | null {
  const secret = telegramWebhookSecret();
  if (!secret || !Number.isSafeInteger(userId) || userId <= 0) return null;
  return `${userId}_${linkSig(userId, secret)}`;
}

/** The user id a start token was issued for, or null when forged, malformed or unsigned. */
export function verifyTelegramLinkToken(token: string): number | null {
  const secret = telegramWebhookSecret();
  if (!secret) return null;
  const m = new RegExp(`^(\\d{1,10})_([A-Za-z0-9_-]{${LINK_SIG_CHARS}})$`).exec(token);
  if (!m) return null;
  const userId = Number(m[1]);
  if (!Number.isSafeInteger(userId) || userId <= 0) return null;
  const want = Buffer.from(linkSig(userId, secret));
  const got = Buffer.from(m[2]);
  return want.length === got.length && timingSafeEqual(want, got) ? userId : null;
}

/**
 * The "Conectar Telegram" link for this user, or null unless the bot token,
 * its username and the webhook secret are all configured — a link that leads
 * to a bot nobody is listening for is worse than no link.
 */
export function telegramConnectUrl(userId: number): string | null {
  const username = telegramBotUsername();
  if (!telegramBotToken() || !username) return null;
  const token = telegramLinkToken(userId);
  return token ? `https://t.me/${username}?start=${token}` : null;
}

/**
 * Constant-time equality for a secret header. Both sides are hashed first, so
 * neither the comparison nor an early length check reveals the secret's length.
 */
export function secretMatches(got: string | null | undefined, want: string): boolean {
  if (!got) return false;
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(want).digest();
  return timingSafeEqual(a, b);
}
