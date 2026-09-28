/**
 * WhatsApp Cloud API webhook (Meta) for the business number.
 *
 * - **GET** — Meta's subscription handshake: `hub.mode=subscribe`,
 *   `hub.verify_token` compared in constant time with `WHATSAPP_VERIFY_TOKEN`,
 *   `hub.challenge` echoed as text.
 * - **POST** — messages and status callbacks (and, in `after()`, the
 *   auto-responder — `src/lib/whatsapp-auto.ts`, off by default). `X-Hub-Signature-256` (HMAC-SHA256
 *   of the raw body under `WHATSAPP_APP_SECRET`) is checked, timing-safe,
 *   **before** the body is parsed. The rows are written before answering (a
 *   few milliseconds; a database failure answers 500 so Meta retries, and
 *   `wa_message_id` makes the retry a no-op). Everything slow — media
 *   download, operator alerts — runs in `after()`, so Meta gets its 200 fast.
 *
 * Not configured (`isWhatsAppConfigured()` false) → 503 on both verbs.
 */
import { NextRequest, NextResponse, after } from "next/server";
import { alertOperator } from "@/lib/crm";
import { siteOrigin } from "@/lib/origin";
import { whatsappConfig } from "@/lib/whatsapp";
import { applyWhatsAppStatus, storeInboundWhatsApp, storeWhatsAppMedia, type StoredWhatsApp } from "@/lib/whatsapp-inbox";
import { parseWebhook, verifyHandshake, verifyWebhookSignature, WHATSAPP_WEBHOOK_MAX_BYTES } from "@/lib/whatsapp-webhook";
import { esWhatsApp } from "@/i18n/es-whatsapp";
import { runWhatsAppAutoResponder } from "@/lib/whatsapp-auto";

export const dynamic = "force-dynamic";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function GET(req: NextRequest) {
  const c = whatsappConfig();
  if (!c) return json(503, { ok: false, error: "whatsapp not configured" });
  const q = req.nextUrl.searchParams;
  const challenge = verifyHandshake(
    { mode: q.get("hub.mode"), token: q.get("hub.verify_token"), challenge: q.get("hub.challenge") },
    c.verifyToken,
  );
  if (!challenge) return new NextResponse("Forbidden", { status: 403, headers: { "cache-control": "no-store" } });
  return new NextResponse(challenge, { status: 200, headers: { "content-type": "text/plain", "cache-control": "no-store" } });
}

/** The raw bytes, or null past the cap — without trusting Content-Length. */
async function readCapped(req: NextRequest, max: number): Promise<Buffer | null> {
  if (Number(req.headers.get("content-length") ?? "0") > max) return null;
  if (!req.body) return Buffer.alloc(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const c = whatsappConfig();
  if (!c) return json(503, { ok: false, error: "whatsapp not configured" });

  const raw = await readCapped(req, WHATSAPP_WEBHOOK_MAX_BYTES);
  if (raw === null) return json(413, { ok: false, error: "too large" });
  // Signature over the exact bytes Meta sent, before anything reads them.
  if (!verifyWebhookSignature(c.appSecret, raw, req.headers.get("x-hub-signature-256"))) {
    return json(401, { ok: false, error: "unauthorized" });
  }

  let parsed;
  try {
    parsed = parseWebhook(JSON.parse(raw.toString("utf8")), c.phoneNumberId);
  } catch {
    // Signed by Meta but not a shape we store (a new field type). A 4xx would
    // make Meta retry it for days; acknowledge and move on.
    console.warn("[whatsapp] signed webhook with an unexpected shape — ignored");
    return json(200, { ok: true, ignored: true });
  }

  const stored: StoredWhatsApp[] = [];
  try {
    for (const m of parsed.messages) stored.push(await storeInboundWhatsApp(m));
    for (const s of parsed.statuses) await applyWhatsAppStatus(s);
  } catch (e) {
    console.error(`[whatsapp] not stored: ${e instanceof Error ? e.name : "error"}`);
    return json(500, { ok: false, error: "not stored" });
  }

  const fresh = stored.filter((s) => s.status === "stored");
  if (fresh.length) {
    const origin = await siteOrigin();
    after(async () => {
      await Promise.allSettled(fresh.filter((s) => s.mediaId).map((s) => storeWhatsAppMedia(s.id, s.mediaId!)));
      // One alert per contact per webhook, never for a duplicate. Text only
      // says who and a short preview; the thread is the record.
      const byContact = new Map(fresh.map((s) => [s.contactPhone, s]));
      // The auto-responder (off unless switched on in /admin/ajustes) answers
      // the newest message of each contact at most once.
      await Promise.allSettled([...byContact.values()].map((s) => runWhatsAppAutoResponder(s)));
      await Promise.allSettled(
        [...byContact.values()].map((s) =>
          alertOperator({
            kind: "new_whatsapp",
            title: s.leadId ? esWhatsApp.alert.leadTitle : esWhatsApp.alert.chatTitle,
            detail: esWhatsApp.alert.detail(s.profileName ?? `+${s.contactPhone}`, s.body ?? `[${s.type}]`),
            url: s.leadId
              ? `${origin}/admin/leads?tel=${s.contactPhone.slice(-9)}`
              : `${origin}/admin/inbox/whatsapp/${s.contactPhone}`,
            site: new URL(origin).host,
          }),
        ),
      );
    });
  }

  return json(200, { ok: true, stored: fresh.length, duplicates: stored.length - fresh.length, statuses: parsed.statuses.length });
}
