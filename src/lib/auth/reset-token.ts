/**
 * Password-reset links — stateless, signed, single-use, and no migration.
 *
 * A token is `base64url("<userId>.<expiresUnix>.<mac>")`, where
 *
 *   mac = base64url(HMAC-SHA256(AUTH_TOKEN_SECRET,
 *           "pwreset.v1|<userId>|<expiresUnix>|<current password_hash or "">"))
 *
 * Nothing is stored. What makes the link single-use is the last field: the
 * MAC covers the account's *current* password hash, and every scrypt hash
 * carries a fresh salt, so the moment the password changes — through this
 * link, through /admin/usuarios, through `user:create` — every link minted
 * before it stops verifying. An account with no password yet (NULL hash, a
 * /publicar owner) signs over the empty string; the reset gives it its first
 * password, which kills the link the same way.
 *
 * The `pwreset.v1|` prefix is domain separation: a future signed token that
 * reuses AUTH_TOKEN_SECRET cannot be replayed as a reset link, or vice versa.
 *
 * Pure apart from reading the environment: no `next/*`, no database — the
 * caller loads the user between `parseResetToken()` and `verifyResetToken()`.
 * `npm run verify:reset` drives it directly.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { isEmailConfigured } from "@/lib/email";

/** How long a link works. Short, because it sits in a mailbox and in access logs. */
export const RESET_TOKEN_TTL_SECONDS = 60 * 60;

/** Below this the secret is refused as if unset: a short HMAC key is a guessable one. */
export const MIN_SECRET_LENGTH = 32;

/** Longest token we will even try to decode — the real ones are ~90 chars. */
const MAX_TOKEN_LENGTH = 200;

const MAC_DOMAIN = "pwreset.v1";

/** `AUTH_TOKEN_SECRET`, or null when unset or too short to be a key. */
export function resetSecret(): string | null {
  const s = process.env.AUTH_TOKEN_SECRET?.trim();
  return s && s.length >= MIN_SECRET_LENGTH ? s : null;
}

/**
 * Whether "forgot password" exists at all. It needs a key to sign with AND a
 * way to deliver the link: offering a reset that can never arrive would be a
 * form that lies ("we sent you a link"), so without either the link on /login
 * is hidden and /recuperar says the feature is unavailable.
 */
export function isPasswordResetEnabled(): boolean {
  return resetSecret() !== null && isEmailConfigured();
}

function mac(secret: string, userId: number, expires: number, passwordHash: string | null): Buffer {
  return createHmac("sha256", secret)
    .update(`${MAC_DOMAIN}|${userId}|${expires}|${passwordHash ?? ""}`)
    .digest();
}

export function mintResetToken(p: {
  userId: number;
  passwordHash: string | null;
  secret: string;
  /** Unix seconds; injectable for tests. */
  now?: number;
}): string {
  const now = p.now ?? Math.floor(Date.now() / 1000);
  const expires = now + RESET_TOKEN_TTL_SECONDS;
  const sig = mac(p.secret, p.userId, expires, p.passwordHash).toString("base64url");
  return Buffer.from(`${p.userId}.${expires}.${sig}`, "utf8").toString("base64url");
}

export interface ParsedResetToken {
  userId: number;
  expires: number;
  mac: Buffer;
}

/**
 * Structure only — which user the token *claims* to be for, so the caller can
 * load that user's current hash. Proves nothing; `verifyResetToken()` does.
 * Null for anything that is not exactly the shape `mintResetToken()` makes.
 */
export function parseResetToken(token: unknown): ParsedResetToken | null {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return null;
  }
  if (!/^[A-Za-z0-9_-]+$/.test(token)) return null;
  const decoded = Buffer.from(token, "base64url").toString("utf8");
  // Canonical encodings only. Node's decoder ignores a dangling character and
  // the spare bits of the last one, so without this several different strings
  // would name the same token — harmless to the MAC, but a link should have
  // exactly one spelling.
  if (Buffer.from(decoded, "utf8").toString("base64url") !== token) return null;
  // A SHA-256 MAC is 32 bytes = 43 base64url characters, unpadded.
  const m = /^([1-9]\d{0,9})\.([1-9]\d{0,11})\.([A-Za-z0-9_-]{43})$/.exec(decoded);
  if (!m) return null;
  const userId = Number(m[1]);
  const expires = Number(m[2]);
  if (!Number.isSafeInteger(userId) || !Number.isSafeInteger(expires)) return null;
  const sig = Buffer.from(m[3], "base64url");
  if (sig.length !== 32 || sig.toString("base64url") !== m[3]) return null;
  return { userId, expires, mac: sig };
}

export type ResetTokenCheck =
  | { ok: true; userId: number }
  | { ok: false; reason: "malformed" | "expired" | "invalid" };

/**
 * Is this token a live reset link for this user as they are *now*?
 * `passwordHash` must be the hash just read from the database for the id the
 * token claims — never a value that came with the request.
 */
export function verifyResetToken(
  token: unknown,
  user: { id: number; passwordHash: string | null },
  opts: { secret: string; now?: number },
): ResetTokenCheck {
  const parsed = parseResetToken(token);
  if (!parsed) return { ok: false, reason: "malformed" };
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  // The MAC is checked first and in constant time, so a response never tells
  // a forger which half they got wrong.
  const expected = mac(opts.secret, parsed.userId, parsed.expires, user.passwordHash);
  const sameUser = parsed.userId === user.id;
  const macOk = timingSafeEqual(expected, parsed.mac);
  if (!sameUser || !macOk) return { ok: false, reason: "invalid" };
  // Also refuse an expiry further out than we ever mint: only reachable with
  // the secret, but then a leaked key cannot mint links that live for years.
  if (parsed.expires <= now || parsed.expires > now + RESET_TOKEN_TTL_SECONDS + 60) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, userId: parsed.userId };
}
