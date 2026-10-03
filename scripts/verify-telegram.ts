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
import { errorCause, errorKey, planErrorAlert, resetErrorThrottle } from "../src/lib/error-alerts";
import { liveHosts, sampleSitemap, sitemapLocs } from "../src/lib/ops/live-check";
import {
  EMPTY_LIVE_CHECK_STATE,
  LIVE_CHECK_REMIND_MS,
  failureFingerprint,
  parseLiveCheckState,
  planLiveCheckAlert,
} from "../src/lib/live-check-alerts";
import { isVitalMetricName, p75, pageTypeOf, vitalRating } from "../src/lib/web-vitals-shared";

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

  // Server-error alerts (src/lib/error-alerts.ts): throttled, never on control flow.
  resetErrorThrottle();
  const ctx = { path: "/propiedad/casa-123", method: "GET", host: "inmobiliaria.com.py" };
  const t0 = 1_000_000_000_000;
  check("an error alerts", planErrorAlert(new Error("boom"), ctx, t0) !== null);
  check(
    "the same error on the same kind of page is quiet within the hour",
    planErrorAlert(new Error("boom"), { ...ctx, path: "/propiedad/casa-456" }, t0 + 60_000) === null,
  );
  const again = planErrorAlert(new Error("boom"), ctx, t0 + 61 * 60_000);
  check("…alerts again after an hour, with the repeat count", again?.detail.includes("1 veces") === true, again?.detail);
  check(
    "a redirect is control flow, never an alert",
    planErrorAlert(Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/x;307;" }), ctx, t0) === null,
  );
  check(
    "a notFound() is control flow, never an alert",
    planErrorAlert(Object.assign(new Error("x"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" }), ctx, t0) === null,
  );
  resetErrorThrottle();
  let sent = 0;
  for (let i = 0; i < 30; i++) if (planErrorAlert(new Error(`bug ${"abcdefghijklmnopqrstuvwxyz"[i % 26]}${i}`), { ...ctx, path: `/p${"xyz"[i % 3]}` }, t0)) sent++;
  check("a burst is capped: ten alerts plus one 'muted' line an hour", sent === 11, String(sent));
  check("ids and numbers do not split one bug into many", errorKey("row 12 missing", "/a/12") === errorKey("row 99 missing", "/a/99"));

  // The reason under a Drizzle "Failed query" (report 2026-10-03 §C-1).
  const failed = (cause: unknown) =>
    Object.assign(new Error("Failed query: select `id` from `locations` where slug = ?"), { cause });
  const poolFull = { code: "ER_CON_COUNT_ERROR", errno: 1040, sqlMessage: "Too many connections" };
  resetErrorThrottle();
  const withCause = planErrorAlert(failed(poolFull), ctx, t0);
  check(
    "a driver error under the message is named in the alert",
    withCause?.detail.includes("causa: ER_CON_COUNT_ERROR (1040) Too many connections") === true,
    withCause?.detail,
  );
  check(
    "…a second cause on the same page is a second alert, not a repeat",
    planErrorAlert(failed(new Error("Queue limit reached.")), ctx, t0 + 1000) !== null,
  );
  check(
    "…the same cause again is still throttled",
    planErrorAlert(failed({ ...poolFull }), ctx, t0 + 2000) === null,
  );
  check("a cause two wrappers deep is found", errorCause(failed({ cause: { code: "ECONNRESET" } }))?.code === "ECONNRESET");
  resetErrorThrottle();
  check(
    "an error without a cause alerts exactly as before",
    planErrorAlert(new Error("boom"), ctx, t0)?.detail.includes("causa:") === false,
  );

  // Live check (src/lib/ops/live-check.ts): what it loads.
  const xml = `<urlset><url><loc>https://a.com/</loc></url><url><loc>https://a.com/venta?x=1&amp;y=2</loc></url></urlset>`;
  check("sitemap <loc> values are read and unescaped", sitemapLocs(xml).join() === "https://a.com/,https://a.com/venta?x=1&y=2");
  const many = [
    ...Array.from({ length: 50 }, (_, i) => `https://a.com/venta/c${i}`),
    ...Array.from({ length: 50 }, (_, i) => `https://a.com/propiedad/p${i}`),
    "https://b.com/venta/other-host",
  ];
  const picked = sampleSitemap(many, "a.com");
  check("the sitemap sample is bounded", picked.length === 25, String(picked.length));
  check("…holds a few listing pages", picked.filter((u) => u.includes("/propiedad/")).length === 5);
  check("…and never another host's URL", picked.every((u) => u.startsWith("https://a.com/")));
  const hosts = liveHosts();
  check("unpurchased / unconfirmed doors are not checked", !hosts.includes("alquiler.com.py") && !hosts.includes("landforsaleparaguay.com"), hosts.join());
  check("the marketplace primary is checked", hosts.includes("inmobiliaria.com.py"));

  // Live check alerts (src/lib/live-check-alerts.ts): once per failure set.
  const setA = [{ url: "https://a.com/x", why: "404" }, { url: "https://a.com/y", why: "500" }];
  const setB = [{ url: "https://b.com/z", why: "404" }];
  check("the fingerprint ignores order", failureFingerprint(setA) === failureFingerprint([...setA].reverse()));
  const T = 1_000_000_000_000;
  const lcFirst = planLiveCheckAlert(EMPTY_LIVE_CHECK_STATE, setA, T);
  check("a new failure set alerts", lcFirst.kind === "new");
  const lcAgain = planLiveCheckAlert(lcFirst.next!, [...setA].reverse(), T + 60_000);
  check("the same set a minute later is silent", lcAgain.kind === "none");
  const lcOther = planLiveCheckAlert(lcFirst.next!, setB, T + 120_000);
  check("a different set alerts", lcOther.kind === "new");
  const lcFlip = planLiveCheckAlert(lcOther.next!, setA, T + 180_000);
  check("two builds seeing two sets do not alert each other's set", lcFlip.kind === "none");
  const lcLater = planLiveCheckAlert(lcFirst.next!, setA, T + LIVE_CHECK_REMIND_MS + 1);
  check("the same set a day later is one reminder", lcLater.kind === "reminder");
  const lcOk = planLiveCheckAlert(lcFirst.next!, [], T + 300_000);
  check("a recovery after an alert is announced once", lcOk.kind === "resolved" && lcOk.next?.failing === false);
  check("…and not again", planLiveCheckAlert(lcOk.next!, [], T + 360_000).kind === "none");
  check("a healthy run with nothing alerted is silent", planLiveCheckAlert(EMPTY_LIVE_CHECK_STATE, [], T).kind === "none");
  check("the stored state survives a round trip", JSON.stringify(parseLiveCheckState(JSON.stringify(lcFirst.next))) === JSON.stringify(lcFirst.next));
  check("garbage state reads as empty", Object.keys(parseLiveCheckState("{not json").seen).length === 0);

  // Page speed (src/lib/web-vitals-shared.ts): what a path is, p75, the colours.
  const types: Array<[string, string]> = [
    ["/", "home"],
    ["/?utm_source=x", "home"],
    ["/propiedad/casa-en-luque-abc123", "listing"],
    ["/venta", "hub"],
    ["/alquiler-temporal", "hub"],
    ["/venta/asuncion", "category"],
    ["/alquiler/asuncion/departamentos#mapa", "category"],
    ["/guias/comprar-en-paraguay", "guide"],
    ["/guias", "other"],
    ["/contacto", "other"],
  ];
  for (const [path, want] of types) check(`pageTypeOf(${path}) is ${want}`, pageTypeOf(path) === want, pageTypeOf(path));
  check("p75 of nothing is null", p75([]) === null);
  check("p75 of one value is that value", p75([42]) === 42);
  check("p75 is nearest-rank, order-independent", p75([4, 1, 3, 2]) === 3 && p75([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]) === 8);
  check("LCP at the good limit is good", vitalRating("LCP", 2500) === "good");
  check("LCP between the limits needs improvement", vitalRating("LCP", 3000) === "needs-improvement");
  check("LCP at the poor limit is not yet poor", vitalRating("LCP", 4000) === "needs-improvement");
  check("LCP past the poor limit is poor", vitalRating("LCP", 4001) === "poor");
  check("CLS uses its own unitless scale", vitalRating("CLS", 0.05) === "good" && vitalRating("CLS", 0.3) === "poor");
  check("INP 250 ms needs improvement", vitalRating("INP", 250) === "needs-improvement");
  check("the five vitals are stored", ["LCP", "INP", "CLS", "FCP", "TTFB"].every(isVitalMetricName));
  check("Next's own timings are not", !isVitalMetricName("Next.js-hydration") && !isVitalMetricName("FID"));

  console.log(
    failures === 0 ? "\nAll Telegram checks passed.\n" : `\n${failures} Telegram check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
