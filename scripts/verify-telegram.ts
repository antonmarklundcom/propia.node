/**
 * Verify Telegram's pure half (plan-agency batch 4) — no database, no network,
 * no bot token, never a call to api.telegram.org.
 *
 * - Start-link tokens: round-trip, a one-hour expiry, tamper and forgery
 *   refused, the old never-expiring format refused, and always inside
 *   Telegram's 64-character `[A-Za-z0-9_-]` `start` parameter.
 * - Alert texts: each partner's own language, nothing but what happened, the
 *   listing title and the panel link.
 * - The webhook's secret-header comparison.
 *
 * Run: npm run verify:telegram   (also part of npm run verify:local)
 */
import { createHmac } from "node:crypto";
import {
  LINK_TTL_SECONDS,
  secretMatches,
  telegramConnectUrl,
  telegramLinkToken,
  verifyTelegramLinkToken,
} from "../src/lib/telegram";
import {
  emailReplyText,
  reminderText,
  shareText,
  telegramCopy,
  titleIn,
} from "../src/lib/telegram-text";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`  ok    ${name}`);
  }
}

const SECRET = "verify-telegram-secret-0123456789";
const T0 = Date.UTC(2026, 8, 27, 12, 0, 0);

/** Flip one character of the signature (the last 24). */
function tamperSig(token: string): string {
  const i = token.length - 5;
  const c = token[i] === "A" ? "B" : "A";
  return token.slice(0, i) + c + token.slice(i + 1);
}

function main() {
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_BOT_USERNAME;

  console.log("link tokens: off without a secret");
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
  check("no secret → no token", telegramLinkToken(42, T0) === null);
  process.env.TELEGRAM_WEBHOOK_SECRET = "short";
  check("a secret under 16 characters → no token", telegramLinkToken(42, T0) === null);
  process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;

  console.log("link tokens: round trip and shape");
  const tok = telegramLinkToken(42, T0);
  check("a token is issued", typeof tok === "string", String(tok));
  check("it verifies for the same user", tok !== null && verifyTelegramLinkToken(tok, T0) === 42);
  const maxTok = telegramLinkToken(9_999_999_999, T0) ?? "";
  check(
    "the longest token fits Telegram's start parameter (≤ 64, [A-Za-z0-9_-])",
    maxTok.length > 0 && maxTok.length <= 64 && /^[A-Za-z0-9_-]+$/.test(maxTok),
    `${maxTok.length}: ${maxTok}`,
  );
  check("a user id past 10 digits gets no token", telegramLinkToken(10_000_000_000, T0) === null);
  check("user id 0 gets no token", telegramLinkToken(0, T0) === null);
  check("a negative user id gets no token", telegramLinkToken(-1, T0) === null);
  check("a fractional user id gets no token", telegramLinkToken(1.5, T0) === null);

  console.log("link tokens: expiry");
  const ttlMs = LINK_TTL_SECONDS * 1000;
  check("the TTL is one hour", LINK_TTL_SECONDS === 3600);
  check("valid a minute before expiry", tok !== null && verifyTelegramLinkToken(tok, T0 + ttlMs - 60_000) === 42);
  check("valid at exactly one hour", tok !== null && verifyTelegramLinkToken(tok, T0 + ttlMs) === 42);
  check("refused one second past one hour", tok !== null && verifyTelegramLinkToken(tok, T0 + ttlMs + 1000) === null);
  check("refused a day later", tok !== null && verifyTelegramLinkToken(tok, T0 + 86_400_000) === null);
  check(
    "a token dated more than 5 minutes in the future is refused",
    tok !== null && verifyTelegramLinkToken(tok, T0 - 6 * 60_000) === null,
  );
  check(
    "…but small clock skew is tolerated",
    tok !== null && verifyTelegramLinkToken(tok, T0 - 60_000) === 42,
  );

  console.log("link tokens: tamper and forgery");
  if (tok) {
    const [uid, issued, ...sigParts] = tok.split("_");
    const sig = sigParts.join("_");
    check("a flipped signature character is refused", verifyTelegramLinkToken(tamperSig(tok), T0) === null);
    check("another user id with the same signature is refused", verifyTelegramLinkToken(`43_${issued}_${sig}`, T0) === null);
    check(
      "a later issue time with the same signature is refused (no self-renewal)",
      verifyTelegramLinkToken(`${uid}_${(parseInt(issued, 36) + 3600).toString(36)}_${sig}`, T0 + ttlMs * 2) === null,
    );
    check("a zero-padded user id is refused", verifyTelegramLinkToken(`0${tok}`, T0) === null);
    check("an upper-cased issue time is refused", verifyTelegramLinkToken(`${uid}_${issued.toUpperCase()}_${sig}`, T0) === null || issued === issued.toUpperCase());
    check("a truncated signature is refused", verifyTelegramLinkToken(tok.slice(0, -1), T0) === null);
    check("an extra character is refused", verifyTelegramLinkToken(`${tok}A`, T0) === null);
    check("an empty token is refused", verifyTelegramLinkToken("", T0) === null);
    check("a 10 000-character token is refused", verifyTelegramLinkToken("1".repeat(10_000), T0) === null);
    process.env.TELEGRAM_WEBHOOK_SECRET = "another-secret-0123456789abcdef";
    check("a rotated secret invalidates it", verifyTelegramLinkToken(tok, T0) === null);
    process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
  }
  // The format #226 shipped: `<userId>_<HMAC("tg-link:"+userId)[0..24]>`, valid forever.
  const oldSig = createHmac("sha256", SECRET).update("tg-link:42").digest("base64url").slice(0, 24);
  check("an old never-expiring link is refused", verifyTelegramLinkToken(`42_${oldSig}`, T0) === null);

  console.log("connect link");
  check("no link without a bot token and username", telegramConnectUrl(42) === null);
  process.env.TELEGRAM_BOT_TOKEN = "123:verify-only-never-called";
  process.env.TELEGRAM_BOT_USERNAME = "@VerifyBot";
  const url = telegramConnectUrl(42) ?? "";
  const start = new URL(url || "https://x.invalid").searchParams.get("start") ?? "";
  check("the link points at the bot", url.startsWith("https://t.me/VerifyBot?start="), url);
  check("the link's token verifies now", verifyTelegramLinkToken(start) === 42);
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_BOT_USERNAME;

  console.log("webhook secret header");
  check("the right secret matches", secretMatches(SECRET, SECRET));
  check("a wrong secret does not", !secretMatches(`${SECRET}x`, SECRET));
  check("a missing header does not", !secretMatches(null, SECRET) && !secretMatches("", SECRET));

  console.log("alert texts: the partner's own language");
  const link = "https://inmobiliaria.com.py/agencia/leads";
  const es = shareText({ locale: "es", count: 1, title: "Casa en Villa Morra", url: link });
  const en = shareText({ locale: "en", count: 1, title: "House in Villa Morra", url: link });
  check("Spanish share notice", es.startsWith("Te compartieron una consulta nueva."), es);
  check("English share notice", en.startsWith("A new enquiry was shared with you."), en);
  check("the English one carries no Spanish line", !/compartieron|Abrila|Aviso:/.test(en), en);
  check("both end with the panel link", es.endsWith(link) && en.endsWith(link));
  check("the title line is there once", en.split("\n").filter((l) => l.includes("Villa Morra")).length === 1);
  check("no title → two lines", shareText({ locale: "en", count: 3, title: null, url: link }).split("\n").length === 2);
  const rem = reminderText({ locale: "en", count: 2, hours: 4, title: "X", url: link });
  check("a reminder about two leads never names a title", !rem.includes("X\n") && !rem.includes("Listing:"), rem);
  check("English reminder", rem.startsWith("You have 2 shared enquiries"), rem);
  check(
    "English email-reply notice",
    emailReplyText({ locale: "en", title: null, url: link }).startsWith("The buyer of an enquiry"),
  );
  check("an unknown locale falls back to Spanish", telegramCopy("fr").bot.help === telegramCopy("es").bot.help);
  check("the bot answers a foreign link in English", telegramCopy("en").bot.otherChat.includes("Disconnect"));
  check("titleIn: English reader, translated", titleIn("en", { title: "Casa", titleEn: "House" }) === "House");
  check("titleIn: English reader, not yet translated", titleIn("en", { title: "Casa", titleEn: null }) === "Casa");
  check("titleIn: Spanish reader", titleIn("es", { title: "Casa", titleEn: "House" }) === "Casa");
  check("titleIn: no listing", titleIn("en", undefined) === null);

  console.log(
    failures === 0 ? "\nAll Telegram checks passed.\n" : `\n${failures} Telegram check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
