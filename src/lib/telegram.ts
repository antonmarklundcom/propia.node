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
 * id, the time it was issued and an HMAC of both under
 * `TELEGRAM_WEBHOOK_SECRET`, so there is no token column. A token is good for
 * `LINK_TTL_SECONDS` (one hour) after it was issued: a forwarded or
 * screenshotted link stops working on its own, and /agencia/perfil mints a
 * fresh one on every render. Telegram delivers the `/start <token>` message to
 * `/api/telegram`, which checks the HMAC and the age and stores the chat id
 * on `users.telegram_chat_id` — never over a different chat already linked
 * (the partner disconnects first; `linkTelegramChat()`). Rotating the secret
 * invalidates every unused link (already-linked chats keep working: the chat
 * id is what is stored).
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

/** How long a start link works after it was issued. */
export const LINK_TTL_SECONDS = 60 * 60;

/** A token "issued" further in the future than this is refused (clock skew allowance). */
const LINK_FUTURE_SKEW_SECONDS = 5 * 60;

/**
 * `v2` separates these signatures from the old never-expiring ones (an HMAC
 * of the user id alone): no old link can be replayed in the new format.
 */
function linkSig(userId: number, issuedAt: number, secret: string): string {
  return createHmac("sha256", secret)
    .update(`tg-link:v2:${userId}:${issuedAt}`)
    .digest("base64url")
    .slice(0, LINK_SIG_CHARS);
}

function nowSeconds(nowMs: number): number {
  return Math.floor(nowMs / 1000);
}

/**
 * `<userId>_<issuedAt base36>_<sig>` — only `[A-Za-z0-9_-]` and at most 43
 * characters (10 + 1 + 7 + 1 + 24), inside Telegram's 64-character `start`
 * parameter limit. Null when the secret is not configured. `nowMs` is for the
 * pure checks (`npm run verify:telegram`); callers leave it out.
 */
export function telegramLinkToken(userId: number, nowMs: number = Date.now()): string | null {
  const secret = telegramWebhookSecret();
  if (!secret || !Number.isSafeInteger(userId) || userId <= 0 || userId > 9_999_999_999) return null;
  const issuedAt = nowSeconds(nowMs);
  return `${userId}_${issuedAt.toString(36)}_${linkSig(userId, issuedAt, secret)}`;
}

/**
 * The user id a start token was issued for, or null when it is forged,
 * malformed, unsigned, older than `LINK_TTL_SECONDS` or dated in the future.
 * The signature is compared in constant time, and only after the shape has
 * been checked by a bounded regex.
 */
export function verifyTelegramLinkToken(token: string, nowMs: number = Date.now()): number | null {
  const secret = telegramWebhookSecret();
  if (!secret || token.length > 64) return null;
  const m = new RegExp(`^(\\d{1,10})_([0-9a-z]{1,7})_([A-Za-z0-9_-]{${LINK_SIG_CHARS}})$`).exec(token);
  if (!m) return null;
  const userId = Number(m[1]);
  const issuedAt = parseInt(m[2], 36);
  if (!Number.isSafeInteger(userId) || userId <= 0 || !Number.isSafeInteger(issuedAt)) return null;
  // Canonical spelling only: "007" or a padded base36 would sign the same numbers.
  if (String(userId) !== m[1] || issuedAt.toString(36) !== m[2]) return null;
  const want = Buffer.from(linkSig(userId, issuedAt, secret));
  const got = Buffer.from(m[3]);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const age = nowSeconds(nowMs) - issuedAt;
  if (age > LINK_TTL_SECONDS || age < -LINK_FUTURE_SKEW_SECONDS) return null;
  return userId;
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
