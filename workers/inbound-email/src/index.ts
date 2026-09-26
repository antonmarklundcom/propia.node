/**
 * Cloudflare Email Worker — the portal's inbound mail (plan-build-2026-09-26
 * §6, waves E2 + E3).
 *
 * Email Routing hands every message for hola@ / anton@ on the root domain and
 * for `lead-…@` on the machine subdomain to this Worker. It parses the
 * message with postal-mime and POSTs it as JSON to the portal's
 * `/api/inbound-email`, signed with HMAC-SHA256 over `<timestamp>.<body>`
 * under `INBOUND_EMAIL_SECRET` (the app checks it in constant time and
 * refuses a timestamp more than 5 minutes off).
 *
 * **Nothing is ever lost.** Unless the app answers 2xx — it stored the
 * message, or already had it — the original message is forwarded, untouched,
 * to `FALLBACK_FORWARD` (the founder's Gmail). A network error, a timeout, a
 * deploy in progress, a 413 or a 5xx all end there. If even that forward
 * fails, the message is rejected, so the sender gets a bounce rather than
 * silence.
 *
 * Attachments ride inline as base64 up to a per-file and a per-message cap;
 * above either, only their metadata is sent — the panel shows the file as
 * "name only" — and the original is *also* forwarded to `FALLBACK_FORWARD`,
 * so the file itself still reaches a human.
 */
import PostalMime, { type Address, type Email } from "postal-mime";

export interface Env {
  INBOUND_EMAIL_SECRET: string;
  INBOUND_URL?: string;
  FALLBACK_FORWARD?: string;
  COPY_TO?: string;
  /** Bearer for the app's `/api/cron/tick` — the same value as CRON_SECRET in hPanel. */
  CRON_SECRET?: string;
  CRON_URL?: string;
}

const DEFAULT_INBOUND_URL = "https://inmobiliaria.com.py/api/inbound-email";
const DEFAULT_CRON_URL = "https://inmobiliaria.com.py/api/cron/tick";
/** The tick runs the app's hourly jobs; they are small, but give them room. */
const CRON_TIMEOUT_MS = 60_000;

/** Decoded bytes per attachment sent inline; bigger files go as metadata only. */
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
/** Decoded bytes of all inline attachments together (the app reads at most 16 MB of JSON). */
export const MAX_INLINE_TOTAL_BYTES = 9 * 1024 * 1024;
const TEXT_MAX_CHARS = 1_000_000;
const HTML_MAX_CHARS = 2_000_000;
const POST_TIMEOUT_MS = 25_000;

interface PayloadAddress {
  address: string;
  name: string | null;
}

export interface InboundPayload {
  v: 1;
  envelope: { from: string; to: string };
  messageId: string | null;
  inReplyTo: string | null;
  references: string | null;
  autoSubmitted: string | null;
  subject: string | null;
  from: PayloadAddress | null;
  replyTo: PayloadAddress[];
  to: PayloadAddress[];
  cc: PayloadAddress[];
  text: string | null;
  html: string | null;
  attachments: Array<{ filename: string | null; contentType: string | null; size: number; content: string | null }>;
  rawSha256: string;
  rawSize: number;
}

/** True when at least one attachment went as metadata only. */
export function trimmedAttachments(p: InboundPayload): boolean {
  return p.attachments.some((a) => a.content === null);
}

/** Groups (`undisclosed-recipients:;`, lists) flattened to their members. */
function flatten(list: Address[] | Address | undefined): PayloadAddress[] {
  const items = Array.isArray(list) ? list : list ? [list] : [];
  const out: PayloadAddress[] = [];
  for (const a of items) {
    if ("group" in a && Array.isArray(a.group)) {
      for (const m of a.group) if (m.address) out.push({ address: m.address, name: m.name || null });
    } else if ("address" in a && a.address) {
      out.push({ address: a.address, name: a.name || null });
    }
  }
  return out.slice(0, 200);
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

/** hex(HMAC-SHA256(secret, `${timestamp}.${body}`)) — the app's `signInbound()`. */
export async function signPayload(secret: string, timestamp: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${body}`)));
}

/** Decoded size of a base64 string, without decoding it. */
function base64Bytes(b64: string): number {
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

/**
 * The app's `inboundPayloadSchema` bounds, applied here so a legal but
 * oversized header (a References chain from a very long thread, a mail with
 * dozens of Reply-To addresses) is trimmed instead of failing the app's
 * validation — which would send the message only to the fallback inbox.
 */
function cap(value: string | null | undefined, max: number): string | null {
  return value == null ? null : value.slice(0, max);
}

function capAddresses(list: PayloadAddress[], max: number): PayloadAddress[] {
  return list.slice(0, max).map((a) => ({
    address: a.address.slice(0, 320),
    name: a.name == null ? null : a.name.slice(0, 400),
  }));
}

/** Keep the newest Message-IDs of a References header (the tail is what threads). */
function capReferences(value: string | null | undefined): string | null {
  if (value == null || value.length <= 20_000) return value ?? null;
  const tail = value.slice(-20_000);
  const firstId = tail.indexOf("<");
  return firstId >= 0 ? tail.slice(firstId) : tail;
}

function header(email: Email, name: string): string | null {
  const h = email.headers.find((x) => x.key === name);
  return h ? h.value : null;
}

export async function buildPayload(
  envelope: { from: string; to: string },
  raw: ArrayBuffer,
): Promise<InboundPayload> {
  const email = await PostalMime.parse(raw, { attachmentEncoding: "base64" });

  let inlineBudget = MAX_INLINE_TOTAL_BYTES;
  const attachments = email.attachments.slice(0, 100).map((a) => {
    const content = typeof a.content === "string" ? a.content : null;
    const size = content ? base64Bytes(content) : 0;
    const inline = content !== null && size <= MAX_ATTACHMENT_BYTES && size <= inlineBudget;
    if (inline) inlineBudget -= size;
    return {
      filename: cap(a.filename, 1000),
      contentType: cap(a.mimeType, 255),
      size,
      content: inline ? content : null,
    };
  });

  const from = capAddresses(flatten(email.from), 1)[0] ?? null;
  return {
    v: 1,
    envelope: { from: envelope.from.slice(0, 320), to: envelope.to.slice(0, 320) },
    messageId: cap(email.messageId, 2000),
    inReplyTo: cap(email.inReplyTo, 2000),
    references: capReferences(email.references),
    autoSubmitted: cap(header(email, "auto-submitted"), 100),
    subject: cap(email.subject, 4000),
    from,
    replyTo: capAddresses(flatten(email.replyTo), 20),
    to: capAddresses(flatten(email.to), 200),
    cc: capAddresses(flatten(email.cc), 200),
    text: email.text ? email.text.slice(0, TEXT_MAX_CHARS) : null,
    // Truncated HTML would be broken HTML: past the cap, the text part is what the reader gets.
    html: email.html && email.html.length <= HTML_MAX_CHARS ? email.html : null,
    attachments,
    rawSha256: await sha256Hex(raw),
    rawSize: raw.byteLength,
  };
}

/**
 * POST the payload. `stored` only when the app answered 2xx; `dropped` when
 * the app kept an attachment as metadata only (no private bucket configured),
 * which means the original must still be forwarded. Never throws.
 */
export async function deliver(
  env: Env,
  payload: InboundPayload,
): Promise<{ stored: boolean; dropped: boolean }> {
  try {
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = await signPayload(env.INBOUND_EMAIL_SECRET, timestamp, body);
    const res = await fetch(env.INBOUND_URL || DEFAULT_INBOUND_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "inbound-email-worker/1",
        "x-inbound-timestamp": timestamp,
        "x-inbound-signature": signature,
      },
      body,
      signal: AbortSignal.timeout(POST_TIMEOUT_MS),
    });
    // Status only in the log — never an address, a subject or a body.
    if (!res.ok) {
      console.log(`inbound-email: app answered ${res.status}`);
      return { stored: false, dropped: false };
    }
    const answer = (await res.json().catch(() => ({}))) as { attachmentsDropped?: unknown };
    return { stored: true, dropped: answer.attachmentsDropped === true };
  } catch (e) {
    console.log(`inbound-email: POST failed (${e instanceof Error ? e.name : "error"})`);
    return { stored: false, dropped: false };
  }
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, _ctx: ExecutionContext): Promise<void> {
    const raw = await new Response(message.raw).arrayBuffer();

    let stored = false;
    let trimmed = false;
    if (env.INBOUND_EMAIL_SECRET) {
      try {
        const payload = await buildPayload({ from: message.from, to: message.to }, raw);
        const result = await deliver(env, payload);
        stored = result.stored;
        // Attachment bytes the Worker cut for size, or the app could not keep:
        // either way the original goes to the fallback inbox too.
        trimmed = trimmedAttachments(payload) || result.dropped;
      } catch (e) {
        console.log(`inbound-email: parse failed (${e instanceof Error ? e.name : "error"})`);
      }
    } else {
      console.log("inbound-email: INBOUND_EMAIL_SECRET is not set");
    }

    const fallback = env.FALLBACK_FORWARD?.trim();
    const copy = env.COPY_TO?.trim();
    // The optional safety-net copy, sent whatever the app answered — but not
    // twice to the same inbox when the fallback is about to go there too.
    const fallbackNeeded = !stored || trimmed;
    if (copy && (!fallbackNeeded || copy !== fallback)) {
      await message.forward(copy).catch(() => console.log("inbound-email: copy forward failed"));
    }
    if (!fallbackNeeded) return;

    if (fallback) {
      try {
        await message.forward(fallback);
        return;
      } catch {
        console.log("inbound-email: fallback forward failed");
      }
    }
    // Stored, only an oversized attachment's bytes missed the fallback: the
    // message itself is safe, so no bounce.
    if (stored) return;
    // Neither the app nor the fallback took it: bounce, so the sender knows.
    message.setReject("Temporary problem receiving mail for this address. Please try again later.");
  },

  /**
   * The hourly cron trigger (`[triggers]` in wrangler.toml; plan-agency batch
   * 4): one authenticated POST to the app's `/api/cron/tick`, which runs the
   * scheduled jobs (partner reminders, …). The Worker is just the clock —
   * Hostinger has no scheduler that does not keep a process alive. Logs the
   * status only; a failed tick is simply retried by the next hour's.
   */
  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const secret = env.CRON_SECRET?.trim();
    if (!secret) {
      console.log("cron: CRON_SECRET is not set");
      return;
    }
    try {
      const res = await fetch(env.CRON_URL || DEFAULT_CRON_URL, {
        method: "POST",
        headers: { authorization: `Bearer ${secret}`, "user-agent": "inbound-email-worker/1 cron" },
        signal: AbortSignal.timeout(CRON_TIMEOUT_MS),
      });
      console.log(`cron: app answered ${res.status}`);
    } catch (e) {
      console.log(`cron: POST failed (${e instanceof Error ? e.name : "error"})`);
    }
  },
};
