/**
 * Inbound email (plan-build-2026-09-26 §6, waves E2 + E3). The only caller is
 * the Cloudflare Email Worker in `workers/inbound-email/`, which parses each
 * message Email Routing hands it and POSTs it here as JSON.
 *
 * The contract with the Worker is "2xx = stored, anything else = not
 * stored": on any non-2xx (and on a timeout) the Worker forwards the
 * original message to `FALLBACK_FORWARD`, so an email is never lost because
 * this app was down, deploying, or refused it. Hence:
 *
 * - **Authenticated by signature only** — HMAC-SHA256 of `<timestamp>.<body>`
 *   under `INBOUND_EMAIL_SECRET`, compared in constant time, timestamp within
 *   5 minutes. Unset secret → 503 (the feature is off; the Worker forwards).
 * - **Bounded** — `INBOUND_BODY_MAX_BYTES`, read incrementally so a lying or
 *   missing Content-Length cannot make us buffer more.
 * - **Idempotent** — the same mailbox + Message-ID is one row; a retry
 *   answers 200 `duplicate`.
 * - **Alert after the response** — `alertOperator()` in `after()`, never on
 *   a duplicate, never on our own machine mail or an auto-reply (mail loops).
 */
import { NextRequest, NextResponse, after } from "next/server";
import { alertOperator } from "@/lib/crm";
import { esInbox } from "@/i18n/es-e2";
import { inboundSecret, verifyInbound } from "@/lib/inbox-address";
import { INBOUND_BODY_MAX_BYTES, inboundPayloadSchema, storeInbound } from "@/lib/inbox";
import { siteOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

/** The body as text, or null past the cap — without trusting Content-Length. */
async function readCapped(req: NextRequest, max: number): Promise<string | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > max) return null;
  if (!req.body) return "";
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
  return Buffer.concat(chunks).toString("utf8");
}

export async function POST(req: NextRequest) {
  const secret = inboundSecret();
  if (!secret) return json(503, { ok: false, error: "inbound email not configured" });

  const body = await readCapped(req, INBOUND_BODY_MAX_BYTES);
  if (body === null) return json(413, { ok: false, error: "too large" });

  const check = verifyInbound({
    secret,
    timestamp: req.headers.get("x-inbound-timestamp"),
    signature: req.headers.get("x-inbound-signature"),
    body,
  });
  if (check !== "ok") {
    // No detail beyond the category: a caller without the secret learns nothing.
    return json(401, { ok: false, error: check === "stale" ? "stale" : "unauthorized" });
  }

  let payload;
  try {
    payload = inboundPayloadSchema.parse(JSON.parse(body));
  } catch {
    return json(400, { ok: false, error: "invalid payload" });
  }

  let stored;
  try {
    stored = await storeInbound(payload);
  } catch (e) {
    // The Worker forwards the original on this answer; say why in the log
    // (never the sender, subject or body).
    console.error(`[inbound-email] not stored: ${e instanceof Error ? e.name : "error"}`);
    return json(500, { ok: false, error: "not stored" });
  }

  if (stored.status === "stored" && stored.alert) {
    const origin = await siteOrigin();
    after(async () => {
      const t = esInbox.alert;
      await alertOperator({
        kind: "new_email",
        title: stored.leadId ? t.leadReplyTitle : t.inboxTitle(stored.mailbox),
        detail: t.detail(stored.fromName ?? stored.fromAddress, stored.subject),
        url: stored.leadId
          ? `${origin}/admin/inbox?vista=consultas`
          : `${origin}/admin/inbox/${stored.threadKey}`,
        site: new URL(origin).host,
      });
    });
  }

  return json(200, { ok: true, status: stored.status, id: stored.id });
}
