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
}

const DEFAULT_INBOUND_URL = "https://inmobiliaria.com.py/api/inbound-email";

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
      filename: a.filename ?? null,
      contentType: a.mimeType ?? null,
      size,
      content: inline ? content : null,
    };
  });

  const from = flatten(email.from)[0] ?? null;
  return {
    v: 1,
    envelope,
    messageId: email.messageId ?? null,
    inReplyTo: email.inReplyTo ?? null,
    references: email.references ?? null,
    autoSubmitted: header(email, "auto-submitted"),
    subject: email.subject ?? null,
    from,
    replyTo: flatten(email.replyTo),
    to: flatten(email.to),
    cc: flatten(email.cc),
    text: email.text ? email.text.slice(0, TEXT_MAX_CHARS) : null,
    // Truncated HTML would be broken HTML: past the cap, the text part is what the reader gets.
    html: email.html && email.html.length <= HTML_MAX_CHARS ? email.html : null,
    attachments,
    rawSha256: await sha256Hex(raw),
    rawSize: raw.byteLength,
  };
}

/** POST the payload; true only when the app answered 2xx. Never throws. */
export async function deliver(env: Env, payload: InboundPayload): Promise<boolean> {
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
    if (!res.ok) console.log(`inbound-email: app answered ${res.status}`);
    return res.ok;
  } catch (e) {
    console.log(`inbound-email: POST failed (${e instanceof Error ? e.name : "error"})`);
    return false;
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
        trimmed = trimmedAttachments(payload);
        stored = await deliver(env, payload);
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
};
