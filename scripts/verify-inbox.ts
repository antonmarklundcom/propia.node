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
import { emailRequestBody, senderFor } from "../src/lib/email";
import {
  cleanDisplayName,
  displayNameFor,
  mailboxAddress,
  mayBeSentAsMailbox,
  normalizeDomain,
  normalizeLocalPart,
  splitMailbox,
  type SiteSending,
} from "../src/lib/mail-address";

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

  // Mail sites and mailboxes (multi-domain inbox): addresses, and who sends as whom.
  console.log("\nMail sites and mailboxes");
  check("a domain is lower-cased and trimmed", normalizeDomain("  Hospital.COM.py ") === "hospital.com.py");
  check("a pasted URL or @domain is reduced to the domain", normalizeDomain("https://Hospital.com.py/contacto") === "hospital.com.py" && normalizeDomain("@hospital.com.py") === "hospital.com.py");
  check("a trailing dot is dropped", normalizeDomain("hospital.com.py.") === "hospital.com.py");
  check("no dot, an IP, a space or junk is not a domain", ["hospital", "127.0.0.1", "a b.com", "-x.com", "x..com", "", "ex ample.com", "x.c"].every((d) => normalizeDomain(d) === null));
  check("a non-string is not a domain", normalizeDomain(undefined) === null && normalizeDomain(5) === null);
  check("a local part is lower-cased", normalizeLocalPart(" Ventas.Norte ") === "ventas.norte");
  check("a local part may carry . _ + -", ["a.b", "a_b", "a+b", "a-b", "a1"].every((l) => normalizeLocalPart(l) === l));
  check("an @ and what follows it is dropped from a pasted address", normalizeLocalPart("hola@hospital.com.py") === "hola");
  check("a bad local part is refused", ["", ".a", "a.", "a..b", "a b", "a/b", "ñandú", "x".repeat(65)].every((l) => normalizeLocalPart(l) === null));
  check("lead-… is reserved for the signed lead reply addresses", normalizeLocalPart("lead-123-abc") === null && normalizeLocalPart("leader") === "leader");
  check("a mailbox address joins its halves", mailboxAddress("hola", "hospital.com.py") === "hola@hospital.com.py");
  check("a mailbox address splits back, any case", JSON.stringify(splitMailbox("Hola@Hospital.com.py")) === JSON.stringify({ localPart: "hola", domain: "hospital.com.py" }));
  check("a malformed mailbox does not split", splitMailbox("nope") === null && splitMailbox("@x.com") === null && splitMailbox("a@b") === null && splitMailbox(3) === null);
  check("a display name is one clean line", cleanDisplayName("  Hospital\nSan  José <x> ") === "Hospital San José x");
  check("a display name needs two characters", cleanDisplayName("A") === null && cleanDisplayName("  ") === null && cleanDisplayName(undefined) === null);

  const sites: SiteSending[] = [
    { domain: "hospital.com.py", displayName: "Hospital San José", sendingEnabled: true, active: true },
    { domain: "clinica.com.py", displayName: "Clínica Sur", sendingEnabled: false, active: true },
    { domain: "viejo.com.py", displayName: "Viejo", sendingEnabled: true, active: false },
  ];
  check("a site with sending confirmed sends as its own mailbox", mayBeSentAsMailbox(sites, "ventas@hospital.com.py"));
  check("a site not yet onboarded for sending does not", !mayBeSentAsMailbox(sites, "hola@clinica.com.py"));
  check("a paused site does not, even with sending on", !mayBeSentAsMailbox(sites, "hola@viejo.com.py"));
  check("an unregistered domain never does", !mayBeSentAsMailbox(sites, "hola@otro.com.py") && !mayBeSentAsMailbox(sites, "not an address"));
  check("the site's display name is used for a registered, active domain", displayNameFor(sites, "x@hospital.com.py") === "Hospital San José" && displayNameFor(sites, "x@clinica.com.py") === "Clínica Sur");
  check("no display name for a paused or unknown site", displayNameFor(sites, "x@viejo.com.py") === null && displayNameFor(sites, "x@otro.com.py") === null);

  const verified = senderFor({ fromName: "Hospital San José", fromMailbox: "Ventas@Hospital.com.py", fromMailboxVerified: true });
  check("a verified mailbox is the sender, lower-cased, under the site name", verified.from?.address === "ventas@hospital.com.py" && verified.from?.name === "Hospital San José" && verified.replyTo === undefined);
  check("a verified mailbox keeps a Reply-To the caller set", senderFor({ fromMailbox: "a@hospital.com.py", fromMailboxVerified: true, replyTo: "b@x.com" }).replyTo === "b@x.com");
  const unverified = senderFor({ fromName: "Clínica Sur", fromMailbox: "hola@clinica.com.py" });
  check("an unverified mailbox is NOT the sender: the portal address sends, the mailbox is the Reply-To", unverified.from?.address === "avisos@mail.inmobiliaria.com.py" && unverified.replyTo === undefined);
  check("verified without a mailbox changes nothing", senderFor({ fromMailboxVerified: true, fromName: "X" }).from?.address === "avisos@mail.inmobiliaria.com.py");
  check("a verified mailbox that is not an address falls back to the portal sender", senderFor({ fromMailbox: "not an address", fromMailboxVerified: true }).from?.address === "avisos@mail.inmobiliaria.com.py");
  const siteBody = emailRequestBody({ ...base, fromName: "Hospital San José", fromMailbox: "ventas@hospital.com.py", fromMailboxVerified: true });
  check("the API body carries the verified sender", (siteBody?.from as { address: string })?.address === "ventas@hospital.com.py");

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
