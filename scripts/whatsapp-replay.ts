/**
 * Replay a signed WhatsApp webhook against a running app — the local test for
 * `app/api/whatsapp/route.ts` without a Meta account. Signs the body with
 * `WHATSAPP_APP_SECRET` exactly as Meta does (`X-Hub-Signature-256`), using the
 * same `signWebhook()` the route verifies with.
 *
 *   WHATSAPP_APP_SECRET=… WHATSAPP_PHONE_NUMBER_ID=123 \
 *     npx tsx --tsconfig scripts/tsconfig.json scripts/whatsapp-replay.ts \
 *     [--url http://localhost:3000/api/whatsapp] [--from 595981000111] \
 *     [--text "Hola"] [--status delivered --id wamid.…] [--bad-signature] [--handshake]
 *
 * `--dry` prints the signed request instead of sending it. Never point this at
 * production: it writes a message row there like a real customer would.
 */
import { readFileSync } from "node:fs";
import { signWebhook } from "../src/lib/whatsapp-webhook";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const url = arg("url") ?? "http://localhost:3000/api/whatsapp";
const secret = process.env.WHATSAPP_APP_SECRET;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
if (!secret || !phoneNumberId) {
  console.error("Set WHATSAPP_APP_SECRET and WHATSAPP_PHONE_NUMBER_ID (the same values the app runs with).");
  process.exit(1);
}
if (/inmobiliaria\.com\.py|realestateinparaguay\.com|hostingersite\.com/.test(url)) {
  console.error("Refusing to replay against a production host.");
  process.exit(1);
}

async function main() {
  if (flag("handshake")) {
    const token = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
    const u = `${url}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(token)}&hub.challenge=1158201444`;
    const res = await fetch(u);
    console.log(`GET handshake → ${res.status} ${await res.text()}`);
    return;
  }

  let body: string;
  if (arg("status")) {
    body = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{ id: "WABA_ID", changes: [{ field: "messages", value: {
        messaging_product: "whatsapp",
        metadata: { display_phone_number: "595210000000", phone_number_id: phoneNumberId },
        statuses: [{ id: arg("id") ?? "wamid.unknown", status: arg("status"), timestamp: String(Math.floor(Date.now() / 1000)), recipient_id: arg("from") ?? "595981000111" }],
      } }] }],
    });
  } else {
    const template = readFileSync(new URL("./fixtures/whatsapp-webhook-sample.json", import.meta.url), "utf8");
    const json = JSON.parse(template.replace("PHONE_NUMBER_ID", phoneNumberId!).replace("TIMESTAMP", String(Math.floor(Date.now() / 1000))));
    const value = json.entry[0].changes[0].value;
    const from = arg("from") ?? "595981000111";
    value.contacts[0].wa_id = from;
    value.messages[0].from = from;
    value.messages[0].id = arg("id") ?? `wamid.REPLAY_${Date.now()}`;
    if (arg("text")) value.messages[0].text.body = arg("text");
    body = JSON.stringify(json);
  }

  const signature = flag("bad-signature") ? signWebhook("wrong-secret", body) : signWebhook(secret!, body);
  if (flag("dry")) {
    console.log(`POST ${url}\nX-Hub-Signature-256: ${signature}\n\n${body}`);
    return;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Hub-Signature-256": signature },
    body,
  });
  console.log(`POST → ${res.status} ${await res.text()}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
