/**
 * Verify the password-reset token (`src/lib/auth/reset-token.ts`) — pure: no
 * database, no network, no email.
 *
 * - round trip: a freshly minted token verifies for its user, and parses back
 *   to that user and an expiry one TTL out;
 * - tamper: any changed character, a swapped user id or expiry, a truncated
 *   MAC — all refused;
 * - expiry: refused at and after the TTL, and an expiry further out than we
 *   ever mint is refused too;
 * - single use: once the password hash changes (including NULL → first
 *   password) the old token no longer verifies;
 * - wrong secret, too-short secret, and the enable switch;
 * - malformed input of every shape a URL segment can carry.
 *
 * Run: npm run verify:reset   (also part of npm run verify:local)
 */
import { createHmac } from "node:crypto";
import {
  isPasswordResetEnabled,
  MIN_SECRET_LENGTH,
  mintResetToken,
  parseResetToken,
  RESET_TOKEN_TTL_SECONDS,
  resetSecret,
  verifyResetToken,
} from "../src/lib/auth/reset-token";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`  ok    ${name}`);
  }
}

const SECRET = "test-secret-for-verify-reset-0123456789abcdef";
const OTHER = "another-secret-for-verify-reset-0123456789abc";
const NOW = 1_790_000_000; // a fixed clock: 2026-09
const HASH = `scrypt$${"a".repeat(32)}$${"b".repeat(128)}`;
const HASH2 = `scrypt$${"c".repeat(32)}$${"d".repeat(128)}`;
const user = { id: 42, passwordHash: HASH };

function decode(token: string): string {
  return Buffer.from(token, "base64url").toString("utf8");
}
function encode(raw: string): string {
  return Buffer.from(raw, "utf8").toString("base64url");
}
/** A token signed the real way but over arbitrary fields — for expiry edge cases. */
function forge(userId: number, expires: number, hash: string | null, secret = SECRET): string {
  const mac = createHmac("sha256", secret)
    .update(`pwreset.v2|${userId}|${expires}|${hash ?? ""}|`)
    .digest("base64url");
  return encode(`${userId}.${expires}.${mac}`);
}

function main() {
  console.log("round trip");
  const token = mintResetToken({ userId: 42, passwordHash: HASH, secret: SECRET, now: NOW });
  check("token is base64url only", /^[A-Za-z0-9_-]+$/.test(token), token);
  check("token fits in a URL segment comfortably", token.length < 120, String(token.length));
  const v = verifyResetToken(token, user, { secret: SECRET, now: NOW });
  check("fresh token verifies", v.ok && v.userId === 42, JSON.stringify(v));
  const p = parseResetToken(token);
  check("parses to the user id", p?.userId === 42);
  check("expires one TTL out", p?.expires === NOW + RESET_TOKEN_TTL_SECONDS);
  check("verifies one second before expiry", verifyResetToken(token, user, { secret: SECRET, now: NOW + RESET_TOKEN_TTL_SECONDS - 1 }).ok);
  check("TTL is 60 minutes", RESET_TOKEN_TTL_SECONDS === 3600);

  console.log("tamper");
  const raw = decode(token);
  const [id, exp, mac] = raw.split(".");
  check("other user id refused", !verifyResetToken(encode(`43.${exp}.${mac}`), { id: 43, passwordHash: HASH }, { secret: SECRET, now: NOW }).ok);
  check("token for 42 does not open account 43", !verifyResetToken(token, { id: 43, passwordHash: HASH }, { secret: SECRET, now: NOW }).ok);
  check("extended expiry refused", !verifyResetToken(encode(`${id}.${Number(exp) + 3600}.${mac}`), user, { secret: SECRET, now: NOW }).ok);
  let flipped = 0;
  for (let i = 0; i < mac.length; i++) {
    const c = mac[i] === "A" ? "B" : "A";
    const t = encode(`${id}.${exp}.${mac.slice(0, i)}${c}${mac.slice(i + 1)}`);
    if (!verifyResetToken(t, user, { secret: SECRET, now: NOW }).ok) flipped += 1;
  }
  // Including the last character, whose spare bits Node's decoder would
  // ignore: parseResetToken() accepts canonical encodings only.
  check("every changed MAC character refused", flipped === mac.length, `${flipped}/${mac.length}`);
  const spare = mac.slice(0, -1) + String.fromCharCode(mac.charCodeAt(mac.length - 1) ^ 1);
  check("non-canonical MAC spelling refused", !verifyResetToken(encode(`${id}.${exp}.${spare}`), user, { secret: SECRET, now: NOW }).ok);
  check("truncated MAC refused", !verifyResetToken(encode(`${id}.${exp}.${mac.slice(0, 42)}`), user, { secret: SECRET, now: NOW }).ok);
  check("token with a character appended refused", !verifyResetToken(`${token}A`, user, { secret: SECRET, now: NOW }).ok);
  const r = verifyResetToken(encode(`43.${exp}.${mac}`), { id: 43, passwordHash: HASH }, { secret: SECRET, now: NOW });
  check("a tampered token reports 'invalid'", !r.ok && r.reason === "invalid", JSON.stringify(r));

  console.log("expiry");
  const at = verifyResetToken(token, user, { secret: SECRET, now: NOW + RESET_TOKEN_TTL_SECONDS });
  check("refused exactly at expiry", !at.ok && at.reason === "expired", JSON.stringify(at));
  check("refused a day later", !verifyResetToken(token, user, { secret: SECRET, now: NOW + 86_400 }).ok);
  const far = forge(42, NOW + 30 * 86_400, HASH);
  check("a validly signed expiry beyond the TTL is refused", !verifyResetToken(far, user, { secret: SECRET, now: NOW }).ok);
  const expiredForge = forge(42, NOW - 1, HASH);
  const e = verifyResetToken(expiredForge, user, { secret: SECRET, now: NOW });
  check("a validly signed past expiry reports 'expired'", !e.ok && e.reason === "expired", JSON.stringify(e));

  console.log("single use (password hash in the MAC)");
  check("refused after the hash changes", !verifyResetToken(token, { id: 42, passwordHash: HASH2 }, { secret: SECRET, now: NOW }).ok);
  check("refused after the hash is cleared", !verifyResetToken(token, { id: 42, passwordHash: null }, { secret: SECRET, now: NOW }).ok);
  const first = mintResetToken({ userId: 7, passwordHash: null, secret: SECRET, now: NOW });
  check("NULL-hash account: token verifies while still NULL", verifyResetToken(first, { id: 7, passwordHash: null }, { secret: SECRET, now: NOW }).ok);
  check("NULL-hash account: dead once a first password is set", !verifyResetToken(first, { id: 7, passwordHash: HASH }, { secret: SECRET, now: NOW }).ok);
  check("NULL and empty-string hash sign the same (documented)", verifyResetToken(first, { id: 7, passwordHash: "" }, { secret: SECRET, now: NOW }).ok);

  console.log("bound to the account email (audit 2026-10 A4)");
  const mailed = mintResetToken({ userId: 9, passwordHash: HASH, email: "Ana@Example.test", secret: SECRET, now: NOW });
  check("verifies for the address it was sent to", verifyResetToken(mailed, { id: 9, passwordHash: HASH, email: "ana@example.test" }, { secret: SECRET, now: NOW }).ok);
  check("refused once the account email changes", !verifyResetToken(mailed, { id: 9, passwordHash: HASH, email: "new@example.test" }, { secret: SECRET, now: NOW }).ok);
  check("refused once the account email is cleared", !verifyResetToken(mailed, { id: 9, passwordHash: HASH, email: null }, { secret: SECRET, now: NOW }).ok);

  console.log("secret");
  check("wrong secret refused", !verifyResetToken(token, user, { secret: OTHER, now: NOW }).ok);
  const saved = { secret: process.env.AUTH_TOKEN_SECRET, acct: process.env.CLOUDFLARE_ACCOUNT_ID, tok: process.env.CLOUDFLARE_EMAIL_TOKEN };
  delete process.env.AUTH_TOKEN_SECRET;
  check("unset secret → null", resetSecret() === null);
  process.env.AUTH_TOKEN_SECRET = "x".repeat(MIN_SECRET_LENGTH - 1);
  check("secret shorter than the minimum → null", resetSecret() === null);
  process.env.AUTH_TOKEN_SECRET = `  ${SECRET}  `;
  check("secret is trimmed", resetSecret() === SECRET);
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  delete process.env.CLOUDFLARE_EMAIL_TOKEN;
  check("disabled without email, even with a secret", !isPasswordResetEnabled());
  process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
  process.env.CLOUDFLARE_EMAIL_TOKEN = "tok";
  check("enabled with secret + email", isPasswordResetEnabled());
  delete process.env.AUTH_TOKEN_SECRET;
  check("disabled without a secret, even with email", !isPasswordResetEnabled());
  for (const [k, val] of [["AUTH_TOKEN_SECRET", saved.secret], ["CLOUDFLARE_ACCOUNT_ID", saved.acct], ["CLOUDFLARE_EMAIL_TOKEN", saved.tok]] as const) {
    if (val === undefined) delete process.env[k];
    else process.env[k] = val;
  }

  console.log("malformed");
  const bad: unknown[] = [
    undefined,
    null,
    42,
    "",
    ".",
    "..",
    "not a token",
    "../../etc/passwd",
    "%2F%2Fevil.com",
    token.replace(/[A-Za-z]/, "/"),
    encode("42.123"),
    encode(`42.${exp}.${mac}.extra`),
    encode(`0.${exp}.${mac}`),
    encode(`-1.${exp}.${mac}`),
    encode(`042.${exp}.${mac}`),
    encode(`4.2.${exp}.${mac}`),
    encode(`42.${exp}.${mac.replace(/.$/, "=")}`),
    encode(`99999999999.${exp}.${mac}`),
    encode(`42 .${exp}.${mac}`),
    "A".repeat(500),
  ];
  let allNull = true;
  for (const b of bad) {
    if (parseResetToken(b) !== null) {
      allNull = false;
      console.log(`        parsed unexpectedly: ${JSON.stringify(b)}`);
    }
    const res = verifyResetToken(b, user, { secret: SECRET, now: NOW });
    if (res.ok) allNull = false;
  }
  check(`${bad.length} malformed inputs parse to null and never verify`, allNull);
  const m = verifyResetToken("garbage", user, { secret: SECRET, now: NOW });
  check("malformed reports 'malformed'", !m.ok && m.reason === "malformed");

  if (failures > 0) {
    console.log(`\nverify:reset — ${failures} FAILED`);
    process.exit(1);
  }
  console.log("\nverify:reset — all checks passed");
}

main();
