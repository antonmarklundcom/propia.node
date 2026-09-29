/**
 * Verify the email inbox's pure half (waves E2 + E3) — no database, no
 * network, no Cloudflare.
 *
 * - The Worker → app signature: the app's node:crypto HMAC and a WebCrypto
 *   HMAC (the Worker's code path) agree; a stale, tampered or malformed
 *   request is refused.
 * - Lead reply addresses: signed, round-trip, and a guessed or foreign one is
 *   not a lead.
 * - The HTML sanitizer: nothing executable survives, remote images only when
 *   asked for.
 * - The sender rule: root-mailbox sending only with EMAIL_ROOT_SENDING=true,
 *   threading headers only as Message-IDs (no header injection).
 *
 * Run: npm run verify:inbox   (also part of npm run verify:local)
 */
import { webcrypto } from "node:crypto";
import {
  guessWhatsapp,
  leadReplyAddress,
  machineDomain,
  messageIdsIn,
  normalizeSubject,
  parseLeadAddress,
  rootDomain,
  signInbound,
  verifyInbound,
} from "../src/lib/inbox-address";
import { emailFrameDocument, emailHtmlForView, hasRemoteImages, sanitizeEmailHtml } from "../src/lib/inbox-html";
import { emailRequestBody, sendEmail } from "../src/lib/email";
import {
  CLOUDFLARE_MAX_MESSAGE_BYTES,
  CLOUDFLARE_MAX_RECIPIENTS,
  DEFAULT_DAILY_QUOTA,
  dailyQuota,
  emailLimitError,
  freshQuotaState,
  isQuotaRefusal,
  quotaAlertText,
  recordRefusal,
  recordSent,
  type QuotaState,
} from "../src/lib/email-quota";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`  ok    ${name}`);
  }
}

async function webcryptoSign(secret: string, ts: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await webcrypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await webcrypto.subtle.sign("HMAC", key, enc.encode(`${ts}.${body}`));
  return Buffer.from(sig).toString("hex");
}

async function main() {
  process.env.EMAIL_FROM = "Inmobiliaria Paraguay <avisos@mail.inmobiliaria.com.py>";
  delete process.env.EMAIL_REPLY_DOMAIN;
  delete process.env.EMAIL_ROOT_SENDING;
  const secret = "test-secret-0123456789abcdef";
  process.env.INBOUND_EMAIL_SECRET = secret;

  console.log("domains");
  check("machine domain from EMAIL_FROM", machineDomain() === "mail.inmobiliaria.com.py", machineDomain());
  check("root domain strips one label", rootDomain() === "inmobiliaria.com.py", rootDomain());

  console.log("signature");
  const body = JSON.stringify({ v: 1, subject: "Hola ñandú" });
  const now = 1_790_000_000;
  const ts = String(now);
  const sig = signInbound(secret, ts, body);
  check("WebCrypto (Worker) and node:crypto (app) agree", sig === (await webcryptoSign(secret, ts, body)));
  check("valid signature accepted", verifyInbound({ secret, timestamp: ts, signature: sig, body, nowS: now + 30 }) === "ok");
  check("upper-case hex accepted", verifyInbound({ secret, timestamp: ts, signature: sig.toUpperCase(), body, nowS: now }) === "ok");
  check("tampered body refused", verifyInbound({ secret, timestamp: ts, signature: sig, body: body + " ", nowS: now }) === "bad");
  check("wrong secret refused", verifyInbound({ secret: `${secret}x`, timestamp: ts, signature: sig, body, nowS: now }) === "bad");
  check("> 5 min old refused", verifyInbound({ secret, timestamp: ts, signature: sig, body, nowS: now + 301 }) === "stale");
  check("> 5 min in the future refused", verifyInbound({ secret, timestamp: ts, signature: sig, body, nowS: now - 301 }) === "stale");
  check("re-timestamped replay refused", verifyInbound({ secret, timestamp: String(now + 60), signature: sig, body, nowS: now + 60 }) === "bad");
  check("missing headers refused", verifyInbound({ secret, timestamp: null, signature: sig, body }) === "missing");
  check("malformed signature refused", verifyInbound({ secret, timestamp: ts, signature: "zz", body, nowS: now }) === "bad");

  console.log("lead addresses");
  const a = leadReplyAddress(123);
  check("address shape", !!a && /^lead-123-[0-9a-f]{10}@mail\.inmobiliaria\.com\.py$/.test(a), String(a));
  check("round-trip", parseLeadAddress(a!) === 123);
  check("any case", parseLeadAddress(a!.toUpperCase()) === 123);
  check("+tag ignored", parseLeadAddress(a!.replace("@", "+x@")) === 123);
  check("guessed id refused", parseLeadAddress(a!.replace("lead-123-", "lead-124-")) === null);
  check("unsigned refused", parseLeadAddress("lead-123@mail.inmobiliaria.com.py") === null);
  check("other domain refused", parseLeadAddress(a!.replace("mail.inmobiliaria.com.py", "evil.example")) === null);
  check("other secret refused", parseLeadAddress(a!, "another-secret-0123456789") === null);
  delete process.env.INBOUND_EMAIL_SECRET;
  check("no Reply-To without inbound configured", leadReplyAddress(123) === null);
  process.env.INBOUND_EMAIL_SECRET = secret;

  console.log("threading helpers");
  check("message ids", messageIdsIn("<a@x> junk <b@y>\r\n <c@z>").join(",") === "<a@x>,<b@y>,<c@z>");
  check("subject normalized", normalizeSubject("RE: Fwd: re:  Casa en Luque") === "casa en luque");
  check("whatsapp guessed", guessWhatsapp("Llamame al 0981 123 456 gracias") === "0981123456");
  check("whatsapp +595 guessed", guessWhatsapp("wa +595 981 123456") === "+595981123456");

  console.log("sanitizer");
  const evil = [
    `<p onclick="x()">Hola<script>alert(1)</script></p>`,
    `<a href="javascript:alert(1)">x</a><a href="https://ok.example/a">ok</a>`,
    `<img src="https://tracker.example/p.gif" onerror="alert(1)">`,
    `<img src="data:image/png;base64,iVBORw0KGgo=">`,
    `<img src="data:text/html;base64,PHNjcmlwdD4=">`,
    `<iframe src="https://x"></iframe><form action="https://x"><input name=a></form>`,
    `<style>body{background:url(https://x)}</style><svg><script>1</script></svg>`,
    `<div style="position:fixed;color:red;background-image:url(https://x)">t</div>`,
  ].join("");
  const stored = sanitizeEmailHtml(evil) ?? "";
  for (const bad of ["<script", "onclick", "onerror", "javascript:", "<iframe", "<form", "<input", "<style", "<svg", "position", "url(", "data:text/html"]) {
    check(`storage pass drops ${bad}`, !stored.toLowerCase().includes(bad), stored);
  }
  check("links open in a new tab, no referrer", /<a href="https:\/\/ok\.example\/a" target="_blank" rel="noopener noreferrer nofollow">/.test(stored), stored);
  check("remote image kept at storage", hasRemoteImages(stored));
  const view = emailHtmlForView(stored, { remoteImages: false });
  check("remote image blocked at render", !view.includes("tracker.example"), view);
  check("data: image kept at render", view.includes("data:image/png;base64"), view);
  check("remote image shown when asked", emailHtmlForView(stored, { remoteImages: true }).includes("tracker.example"));
  const doc = emailFrameDocument(view, { remoteImages: false });
  check("frame CSP forbids scripts and remote images", /default-src 'none'; img-src data:;/.test(doc));
  check("empty html is null", sanitizeEmailHtml("   ") === null);

  console.log("sender");
  const base = { to: "buyer@example.com", subject: "Re: hola", html: "<p>x</p>", text: "x" };
  const off = emailRequestBody({ ...base, fromMailbox: "hola@inmobiliaria.com.py", fromName: "Inmobiliaria Paraguay" })!;
  check("root sending off → from EMAIL_FROM", (off.from as { address: string }).address === "avisos@mail.inmobiliaria.com.py", JSON.stringify(off.from));
  check("root sending off → Reply-To the mailbox", (off.reply_to as { address: string })?.address === "hola@inmobiliaria.com.py", JSON.stringify(off.reply_to));
  process.env.EMAIL_ROOT_SENDING = "true";
  const on = emailRequestBody({ ...base, fromMailbox: "hola@inmobiliaria.com.py", fromName: "Inmobiliaria Paraguay" })!;
  check("root sending on → from the mailbox", (on.from as { address: string }).address === "hola@inmobiliaria.com.py", JSON.stringify(on.from));
  check("root sending on → no Reply-To", on.reply_to === undefined);
  const foreign = emailRequestBody({ ...base, fromMailbox: "ceo@other.example" })!;
  check("a non-root mailbox never becomes the sender", (foreign.from as { address: string }).address === "avisos@mail.inmobiliaria.com.py");
  delete process.env.EMAIL_ROOT_SENDING;
  const threaded = emailRequestBody({
    ...base,
    inReplyTo: "<abc@x>\r\nBcc: victim@example.com",
    references: ["<r1@x>", "not-an-id", "<r2@x>"],
    cc: ["ok@example.com", "bad address", "x@y\r\nBcc: z@w"],
  })!;
  const headers = threaded.headers as Record<string, string>;
  check("In-Reply-To is the Message-ID only", headers["In-Reply-To"] === "<abc@x>", JSON.stringify(headers));
  check("References keeps only Message-IDs", headers.References === "<r1@x> <r2@x>", JSON.stringify(headers));
  check("cc keeps only plausible addresses", JSON.stringify(threaded.cc) === JSON.stringify(["ok@example.com"]), JSON.stringify(threaded.cc));
  check("no headers object when not threading", emailRequestBody(base)!.headers === undefined);

  // Cloudflare's sending limits: per-message guards and the daily counter.
  console.log("\nEmail sending limits");
  check("daily quota defaults to Cloudflare's 200", dailyQuota(undefined) === DEFAULT_DAILY_QUOTA && DEFAULT_DAILY_QUOTA === 200);
  check("EMAIL_DAILY_QUOTA overrides it", dailyQuota("1000") === 1000);
  check("a junk EMAIL_DAILY_QUOTA falls back", ["", "0", "-5", "abc", "12abc", "1.5"].every((v) => dailyQuota(v) === 200));
  check("a normal message passes the limits", emailLimitError(emailRequestBody(base)!) === null);
  const fifty = { to: "a@example.com", cc: Array.from({ length: 49 }, (_, i) => `c${i}@example.com`) };
  check(`${CLOUDFLARE_MAX_RECIPIENTS} recipients (To + CC) is allowed`, emailLimitError(fifty) === null);
  check(
    `${CLOUDFLARE_MAX_RECIPIENTS + 1} recipients is refused, naming the limit`,
    /too many recipients \(51, limit 50\)/.test(emailLimitError({ ...fifty, cc: [...fifty.cc, "x@example.com"] }) ?? ""),
  );
  check(
    "a body over 5 MiB is refused",
    /message too large/.test(emailLimitError({ to: "a@example.com", html: "x".repeat(CLOUDFLARE_MAX_MESSAGE_BYTES + 1) }) ?? ""),
  );
  check(
    "size counts bytes, not characters",
    emailLimitError({ to: "a@example.com", html: "ñ".repeat(CLOUDFLARE_MAX_MESSAGE_BYTES / 2 + 10) }) !== null,
  );
  check("HTTP 429 is a quota refusal", isQuotaRefusal(429, undefined));
  check("an error naming the daily limit is one", isQuotaRefusal(400, [{ message: "Daily sending limit exceeded" }]));
  check("an error naming a quota is one", isQuotaRefusal(403, [{ message: "quota reached" }]));
  check("a bad-address 400 is not", !isQuotaRefusal(400, [{ message: "invalid recipient" }]));
  check("a size-limit error is not a quota refusal", !isQuotaRefusal(413, [{ message: "message size limit exceeded" }]));
  check("a 500 is not", !isQuotaRefusal(500, undefined));

  const t0 = new Date("2026-09-29T10:00:00Z");
  let st: QuotaState = freshQuotaState(t0);
  const alerts: string[] = [];
  for (let i = 1; i <= 200; i++) {
    const r = recordSent(st, t0, 200);
    st = r.state;
    if (r.alert) alerts.push(`${r.alert.level}@${i}`);
  }
  check("alerts once at 80% and once at 100%, never twice", JSON.stringify(alerts) === JSON.stringify(["warn@160", "full@200"]), alerts.join(","));
  check("past the quota nothing more is raised", recordSent(st, t0, 200).alert === null && recordSent(st, t0, 200).state.sent === 201);
  const next = recordSent(st, new Date("2026-09-30T00:00:01Z"), 200);
  check("a new UTC day starts the count over", next.state.sent === 1 && next.state.day === "2026-09-30" && !next.state.full);
  check("a small quota warns before it is full", (() => {
    let q = freshQuotaState(t0);
    const out: string[] = [];
    for (let i = 1; i <= 5; i++) { const r = recordSent(q, t0, 5); q = r.state; if (r.alert) out.push(`${r.alert.level}@${i}`); }
    return JSON.stringify(out) === JSON.stringify(["warn@4", "full@5"]);
  })());
  const ref1 = recordRefusal(freshQuotaState(t0), t0, 200);
  check("a Cloudflare refusal alerts at once, whatever the counter says", ref1.alert?.level === "refused" && ref1.alert.sent === 0);
  check("and only once per day", recordRefusal(ref1.state, t0, 200).alert === null);
  check("and again the next day", recordRefusal(ref1.state, new Date("2026-09-30T05:00:00Z"), 200).alert?.level === "refused");
  check(
    "alert text is Spanish, names the numbers, and never a recipient",
    quotaAlertText({ level: "warn", sent: 160, quota: 200 }).detail.includes("160 de 200") &&
      quotaAlertText({ level: "full", sent: 200, quota: 200 }).title.includes("límite diario") &&
      !/@/.test(JSON.stringify(quotaAlertText({ level: "refused", sent: 0, quota: 200 }))),
  );
  {
    // sendEmail refuses an oversize message before any network call: with no
    // credentials it would say "email not configured", so set fake ones and
    // watch that the limit error, not a fetch, is what comes back.
    process.env.CLOUDFLARE_ACCOUNT_ID = "test-account";
    process.env.CLOUDFLARE_EMAIL_TOKEN = "test-token";
    const realFetch = globalThis.fetch;
    let fetched = false;
    globalThis.fetch = (async () => { fetched = true; throw new Error("no network in verify"); }) as typeof fetch;
    const big = await sendEmail({ to: "a@example.com", subject: "s", html: "x".repeat(CLOUDFLARE_MAX_MESSAGE_BYTES + 1), text: "t" });
    globalThis.fetch = realFetch;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_EMAIL_TOKEN;
    check("sendEmail refuses an oversize message without calling the API", !big.sent && /message too large/.test(big.error ?? "") && !fetched, JSON.stringify(big));
  }

  if (failures) {
    console.log(`\n${failures} inbox check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll inbox checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
