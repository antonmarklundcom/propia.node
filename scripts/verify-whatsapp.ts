/**
 * Verify the WhatsApp Cloud API integration's pure half — no database, no
 * network, no Meta account, never a call to graph.facebook.com.
 *
 * - `X-Hub-Signature-256`: a correct signature passes; a wrong secret, a
 *   tampered body, a missing or malformed header fail.
 * - The GET handshake: token compared, mode required, challenge echoed.
 * - Payload parsing: text, media, location, interactive, statuses; another
 *   number's messages ignored; profile names attached.
 * - Phones: local and international forms normalise to E.164 digits.
 * - The 24-hour window and status ordering.
 * - Config: all four required variables or the feature is off.
 *
 * Run: npm run verify:whatsapp   (also part of npm run verify:local)
 */
import {
  normalizeWaPhone,
  parseWebhook,
  signWebhook,
  statusAdvances,
  verifyHandshake,
  verifyWebhookSignature,
  waPhoneKey,
  withinWindow,
  WHATSAPP_WINDOW_MS,
} from "../src/lib/whatsapp-webhook";
import { missingWhatsAppEnv, whatsappConfig } from "../src/lib/whatsapp";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`  ok    ${name}`);
  }
}

const SECRET = "verify-whatsapp-app-secret";
const PID = "109876543210";

console.log("signature");
const body = JSON.stringify({ object: "whatsapp_business_account", entry: [] });
const sig = signWebhook(SECRET, body);
check("format sha256=<64 hex>", /^sha256=[0-9a-f]{64}$/.test(sig));
check("correct signature passes", verifyWebhookSignature(SECRET, body, sig));
check("buffer body passes", verifyWebhookSignature(SECRET, Buffer.from(body), sig));
check("uppercase hex accepted", verifyWebhookSignature(SECRET, body, `sha256=${sig.slice(7).toUpperCase()}`));
check("wrong secret fails", !verifyWebhookSignature("other", body, sig));
check("tampered body fails", !verifyWebhookSignature(SECRET, body.replace("[]", "[{}]"), sig));
check("missing header fails", !verifyWebhookSignature(SECRET, body, null));
check("malformed header fails", !verifyWebhookSignature(SECRET, body, "sha1=abc"));
check("empty secret fails", !verifyWebhookSignature("", body, signWebhook("", body)));

console.log("handshake");
check("echoes challenge", verifyHandshake({ mode: "subscribe", token: "tok", challenge: "1158201444" }, "tok") === "1158201444");
check("wrong token refused", verifyHandshake({ mode: "subscribe", token: "nope", challenge: "1" }, "tok") === null);
check("wrong mode refused", verifyHandshake({ mode: "unsubscribe", token: "tok", challenge: "1" }, "tok") === null);
check("odd challenge refused", verifyHandshake({ mode: "subscribe", token: "tok", challenge: "<script>" }, "tok") === null);
check("unset verify token refused", verifyHandshake({ mode: "subscribe", token: "", challenge: "1" }, "") === null);

console.log("phones");
const phoneCases: Array<[string, string | null]> = [
  ["595981123456", "595981123456"],
  ["+595 981 123-456", "595981123456"],
  ["0981 123 456", "595981123456"],
  ["981123456", "595981123456"],
  ["00595981123456", "595981123456"],
  ["5950981123456", "595981123456"],
  ["+1 555 123 4567", "15551234567"],
  ["123", null],
  ["", null],
];
for (const [input, want] of phoneCases) {
  check(`normalize ${JSON.stringify(input)}`, normalizeWaPhone(input) === want, String(normalizeWaPhone(input)));
}
check("phone key = last nine", waPhoneKey("595981123456") === "981123456");

console.log("payload");
const now = Math.floor(Date.now() / 1000);
const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WABA",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "595 21 000 0000", phone_number_id: PID },
            contacts: [{ wa_id: "595981000111", profile: { name: "Ana" } }],
            messages: [
              { from: "595981000111", id: "wamid.T1", timestamp: String(now), type: "text", text: { body: "Hola" } },
              { from: "595981000111", id: "wamid.I1", timestamp: String(now), type: "image", image: { id: "MEDIA1", mime_type: "image/jpeg", caption: "Mi casa" } },
              { from: "595981000111", id: "wamid.D1", timestamp: String(now), type: "document", document: { id: "MEDIA2", mime_type: "application/pdf", filename: "titulo.pdf" } },
              { from: "595981000111", id: "wamid.L1", timestamp: String(now), type: "location", location: { latitude: -25.28, longitude: -57.63, name: "Casa" } },
              { from: "595981000111", id: "wamid.B1", timestamp: String(now), type: "interactive", interactive: { button_reply: { title: "Sí" } } },
              { from: "595981000111", id: "wamid.U1", timestamp: String(now), type: "unsupported" },
            ],
            statuses: [
              { id: "wamid.OUT1", status: "delivered", timestamp: String(now), recipient_id: "595981000111" },
              { id: "wamid.OUT2", status: "failed", timestamp: String(now), errors: [{ code: 131047, title: "Re-engagement message", error_data: { details: "More than 24 hours" } }] },
              { id: "wamid.OUT3", status: "deleted" },
            ],
          },
        },
        {
          field: "messages",
          value: {
            metadata: { phone_number_id: "OTHER_NUMBER" },
            messages: [{ from: "595981999999", id: "wamid.X", type: "text", text: { body: "not ours" } }],
          },
        },
      ],
    },
  ],
};
const parsed = parseWebhook(payload, PID);
check("six messages for our number", parsed.messages.length === 6, String(parsed.messages.length));
check("other number ignored", !parsed.messages.some((m) => m.waMessageId === "wamid.X"));
const [text, image, doc, loc, btn, unsupported] = parsed.messages;
check("text body", text.body === "Hola" && text.type === "text");
check("profile name attached", text.profileName === "Ana");
check("display phone digits", text.displayPhone === "595210000000");
check("sent time", text.sentAt?.getTime() === now * 1000);
check("image caption + media id", image.body === "Mi casa" && image.mediaId === "MEDIA1" && image.mediaMime === "image/jpeg");
check("document filename", doc.mediaFilename === "titulo.pdf" && doc.body === null);
check("location as text", loc.body?.includes("Casa") === true && loc.body.includes("-25.28"));
check("button reply as text", btn.body === "Sí");
check("unsupported kept, no body", unsupported.type === "unsupported" && unsupported.body === null);
check("two known statuses", parsed.statuses.length === 2);
check("failed status error text", parsed.statuses[1]?.error?.includes("131047") === true && parsed.statuses[1].error.includes("24 hours"));
check("non-WABA object ignored", parseWebhook({ object: "page", entry: [] }, PID).messages.length === 0);
let threw = false;
try {
  parseWebhook({ entry: "nope" }, PID);
} catch {
  threw = true;
}
check("malformed payload throws", threw);

console.log("window and status order");
const t0 = Date.UTC(2026, 8, 28, 12, 0, 0);
check("inside the window", withinWindow(new Date(t0 - 60_000), t0));
check("just outside", !withinWindow(new Date(t0 - WHATSAPP_WINDOW_MS - 1), t0));
check("never wrote → closed", !withinWindow(null, t0));
check("ISO string accepted", withinWindow(new Date(t0 - 1000).toISOString(), t0));
check("delivered after sent", statusAdvances("sent", "delivered"));
check("delivered after read ignored", !statusAdvances("read", "delivered"));
check("failed wins", statusAdvances("read", "failed"));
check("first status applies", statusAdvances(null, "sent"));

console.log("config");
const full = {
  WHATSAPP_ACCESS_TOKEN: "t",
  WHATSAPP_PHONE_NUMBER_ID: PID,
  WHATSAPP_APP_SECRET: "s",
  WHATSAPP_VERIFY_TOKEN: "v",
};
check("all unset → off", whatsappConfig({}) === null);
check("all four → on", whatsappConfig(full) !== null);
check("one missing → off", whatsappConfig({ ...full, WHATSAPP_APP_SECRET: "" }) === null);
check("non-numeric phone id → off", whatsappConfig({ ...full, WHATSAPP_PHONE_NUMBER_ID: "abc" }) === null);
check("default graph version", whatsappConfig(full)?.graphVersion === "v23.0");
check("graph version override", whatsappConfig({ ...full, WHATSAPP_GRAPH_VERSION: "v25.0" })?.graphVersion === "v25.0");
check("bad version ignored", whatsappConfig({ ...full, WHATSAPP_GRAPH_VERSION: "latest" })?.graphVersion === "v23.0");
check("missing list", missingWhatsAppEnv({ WHATSAPP_ACCESS_TOKEN: "t" }).length === 3);

if (failures > 0) {
  console.log(`\nverify:whatsapp — ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nverify:whatsapp — all checks passed");
