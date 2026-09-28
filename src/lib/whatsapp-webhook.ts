/**
 * The pure half of the WhatsApp Cloud API integration: the webhook signature,
 * the payload parser, phone normalisation and the 24-hour window. No
 * database, no network, no `next/*` — `npm run verify:whatsapp` drives every
 * function here with fixtures, and `scripts/whatsapp-replay.ts` signs sample
 * payloads with the same code the route checks them with.
 *
 * Server-side callers: `app/api/whatsapp/route.ts` (verify + parse),
 * `src/lib/whatsapp-inbox.ts` (store), `src/lib/whatsapp.ts` (send).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** Meta's customer-service window: free-form replies only within 24 h of the last inbound message. */
export const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;
/** A webhook body is a few KB; anything near this is not Meta. */
export const WHATSAPP_WEBHOOK_MAX_BYTES = 1024 * 1024;
/** WhatsApp's own limit on a text message body. */
export const WHATSAPP_TEXT_MAX = 4096;

/* -------------------------------------------------------------------------- */
/* Signature                                                                   */
/* -------------------------------------------------------------------------- */

/** `sha256=<hex>` — what Meta sends in `X-Hub-Signature-256`, over the raw body. */
export function signWebhook(appSecret: string, rawBody: string | Buffer): string {
  return `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
}

/**
 * Constant-time check of `X-Hub-Signature-256` against the raw body. Checked
 * **before** the body is parsed: an unsigned POST is never interpreted.
 */
export function verifyWebhookSignature(appSecret: string, rawBody: string | Buffer, header: string | null): boolean {
  if (!appSecret || !header || !/^sha256=[0-9a-f]{64}$/i.test(header.trim())) return false;
  const expected = Buffer.from(signWebhook(appSecret, rawBody));
  const given = Buffer.from(header.trim().toLowerCase());
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Meta's GET handshake: echo `hub.challenge` when mode and token match, else null. */
export function verifyHandshake(
  params: { mode: string | null; token: string | null; challenge: string | null },
  verifyToken: string,
): string | null {
  if (!verifyToken || params.mode !== "subscribe" || !params.token || !params.challenge) return null;
  const a = Buffer.from(params.token);
  const b = Buffer.from(verifyToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  // The challenge is echoed as text/plain; keep it to what Meta sends (digits).
  return /^[A-Za-z0-9_-]{1,128}$/.test(params.challenge) ? params.challenge : null;
}

/* -------------------------------------------------------------------------- */
/* Phones                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A phone as WhatsApp addresses it: E.164 digits without the plus
 * (`595981123456`). Paraguayan local forms (`0981 123 456`, `981123456`) get
 * 595, the same rule as `toInternationalPhone()` in crm.ts. Null when there
 * are too few digits to be a number.
 */
export function normalizeWaPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("595")) {
    // 5950981… — the local trunk 0 typed after the country code.
    if (d[3] === "0") d = `595${d.slice(4)}`;
  } else if (d.startsWith("0")) {
    d = `595${d.slice(1)}`;
  } else if (d.length <= 9) {
    d = `595${d}`;
  }
  return d.length >= 8 && d.length <= 15 ? d : null;
}

/** The last nine digits — the same key `leadPhoneKey()` matches leads by. */
export function waPhoneKey(phone: string): string {
  return phone.replace(/\D/g, "").slice(-9);
}

/** Whether a free-form message may be sent now, given the contact's last inbound time. */
export function withinWindow(lastInboundAt: Date | string | null | undefined, now = Date.now()): boolean {
  if (!lastInboundAt) return false;
  const t = typeof lastInboundAt === "string" ? Date.parse(lastInboundAt) : lastInboundAt.getTime();
  return Number.isFinite(t) && now - t < WHATSAPP_WINDOW_MS && t <= now + 5 * 60 * 1000;
}

/* -------------------------------------------------------------------------- */
/* Payload                                                                     */
/* -------------------------------------------------------------------------- */

const media = z
  .object({
    id: z.string().max(128),
    mime_type: z.string().max(127).optional(),
    caption: z.string().max(10_000).optional(),
    filename: z.string().max(255).optional(),
  })
  .passthrough();

const messageSchema = z
  .object({
    from: z.string().max(20),
    id: z.string().max(128),
    timestamp: z.string().max(20).optional(),
    type: z.string().max(20),
    text: z.object({ body: z.string().max(10_000) }).partial().optional(),
    image: media.optional(),
    audio: media.optional(),
    video: media.optional(),
    document: media.optional(),
    sticker: media.optional(),
    location: z
      .object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        name: z.string().max(500).optional(),
        address: z.string().max(1000).optional(),
      })
      .optional(),
    button: z.object({ text: z.string().max(1000).optional() }).optional(),
    interactive: z
      .object({
        button_reply: z.object({ title: z.string().max(1000).optional() }).optional(),
        list_reply: z.object({ title: z.string().max(1000).optional() }).optional(),
      })
      .optional(),
    reaction: z.object({ emoji: z.string().max(40).optional() }).optional(),
    contacts: z.array(z.unknown()).optional(),
  })
  .passthrough();

const statusSchema = z
  .object({
    id: z.string().max(128),
    status: z.string().max(20),
    timestamp: z.string().max(20).optional(),
    recipient_id: z.string().max(20).optional(),
    errors: z
      .array(
        z
          .object({
            code: z.number().optional(),
            title: z.string().max(500).optional(),
            message: z.string().max(500).optional(),
            error_data: z.object({ details: z.string().max(1000).optional() }).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

const webhookSchema = z.object({
  object: z.string(),
  entry: z
    .array(
      z.object({
        id: z.string().optional(),
        changes: z
          .array(
            z.object({
              field: z.string(),
              value: z
                .object({
                  metadata: z.object({ phone_number_id: z.string().max(40), display_phone_number: z.string().max(30).optional() }).optional(),
                  contacts: z
                    .array(z.object({ wa_id: z.string().max(20).optional(), profile: z.object({ name: z.string().max(200).optional() }).optional() }))
                    .optional(),
                  messages: z.array(messageSchema).optional(),
                  statuses: z.array(statusSchema).optional(),
                })
                .passthrough(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});

export interface WaInbound {
  waMessageId: string;
  /** Customer, E.164 digits. */
  from: string;
  phoneNumberId: string;
  /** Our own number as Meta displays it (digits), for `to_phone`. */
  displayPhone: string | null;
  profileName: string | null;
  type: string;
  body: string | null;
  mediaId: string | null;
  mediaMime: string | null;
  mediaFilename: string | null;
  sentAt: Date | null;
}

export interface WaStatus {
  waMessageId: string;
  phoneNumberId: string;
  status: "sent" | "delivered" | "read" | "failed";
  error: string | null;
}

export interface ParsedWebhook {
  messages: WaInbound[];
  statuses: WaStatus[];
}

const STATUS_VALUES = new Set(["sent", "delivered", "read", "failed"]);

/** What a message says, as one line of text a person (or the AI) can read. */
function messageText(m: z.infer<typeof messageSchema>): string | null {
  switch (m.type) {
    case "text":
      return m.text?.body ?? null;
    case "image":
    case "video":
    case "document":
    case "audio":
    case "sticker": {
      const part = m[m.type as "image"];
      return part?.caption ?? null;
    }
    case "location": {
      const l = m.location;
      if (!l) return null;
      const where = [l.name, l.address].filter(Boolean).join(" — ");
      const coords = l.latitude != null && l.longitude != null ? `${l.latitude}, ${l.longitude}` : "";
      return [where, coords].filter(Boolean).join(" · ") || null;
    }
    case "button":
      return m.button?.text ?? null;
    case "interactive":
      return m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? null;
    case "reaction":
      return m.reaction?.emoji ?? null;
    default:
      return null;
  }
}

/**
 * The messages and status callbacks in one webhook POST, for our number only.
 * Anything addressed to another `phone_number_id` (a second number on the same
 * app) is ignored, not stored. Throws on a body that is not Meta's shape.
 */
export function parseWebhook(json: unknown, ourPhoneNumberId: string): ParsedWebhook {
  const body = webhookSchema.parse(json);
  const out: ParsedWebhook = { messages: [], statuses: [] };
  if (body.object !== "whatsapp_business_account") return out;
  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") continue;
      const v = change.value;
      const pid = v.metadata?.phone_number_id;
      if (!pid || pid !== ourPhoneNumberId) continue;
      const display = v.metadata?.display_phone_number ? v.metadata.display_phone_number.replace(/\D/g, "") || null : null;
      const names = new Map((v.contacts ?? []).map((c) => [c.wa_id ?? "", c.profile?.name ?? null]));
      for (const m of v.messages ?? []) {
        const from = normalizeWaPhone(m.from);
        if (!from) continue;
        const part = ["image", "video", "document", "audio", "sticker"].includes(m.type)
          ? m[m.type as "image"]
          : undefined;
        const ts = m.timestamp ? Number(m.timestamp) : NaN;
        out.messages.push({
          waMessageId: m.id,
          from,
          phoneNumberId: pid,
          displayPhone: display,
          profileName: (names.get(m.from) ?? null)?.slice(0, 140) ?? null,
          type: m.type.slice(0, 20),
          body: messageText(m),
          mediaId: part?.id ?? null,
          mediaMime: part?.mime_type ?? null,
          mediaFilename: part?.filename ?? null,
          sentAt: Number.isFinite(ts) ? new Date(ts * 1000) : null,
        });
      }
      for (const s of v.statuses ?? []) {
        if (!STATUS_VALUES.has(s.status)) continue;
        const e = s.errors?.[0];
        const error = e ? [e.code != null ? `#${e.code}` : "", e.title ?? e.message ?? "", e.error_data?.details ?? ""].filter(Boolean).join(" ").slice(0, 500) : null;
        out.statuses.push({ waMessageId: s.id, phoneNumberId: pid, status: s.status as WaStatus["status"], error });
      }
    }
  }
  return out;
}

/**
 * Status callbacks can arrive out of order (a late "delivered" after "read").
 * A status only moves forward; "failed" wins over anything.
 */
const STATUS_RANK: Record<WaStatus["status"], number> = { sent: 1, delivered: 2, read: 3, failed: 4 };
export function statusAdvances(current: WaStatus["status"] | null, next: WaStatus["status"]): boolean {
  return !current || STATUS_RANK[next] > STATUS_RANK[current];
}
