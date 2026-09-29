/**
 * WhatsApp Cloud API (Meta) for the founder's own business number — **the
 * only module that calls the Graph API**. Sends a text message and downloads
 * inbound media; nothing else.
 *
 * - All of `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
 *   `WHATSAPP_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` set = on. Anything less
 *   = off: the panels hide the WhatsApp inbox and `/api/whatsapp` answers 503.
 *   `WHATSAPP_WABA_ID` is informational (the setup screen shows it).
 * - **Free-form text only inside the 24-hour window** after the customer's
 *   last message (`withinWindow()`); the caller refuses outside it with a clear
 *   message. Outside the window the only thing Meta accepts is an approved
 *   **template** (`sendWhatsAppTemplate()`, `src/lib/whatsapp-templates.ts`).
 * - Never throws into a request: every call returns a result, bounded by a
 *   timeout. The access token is never logged.
 */
import "server-only";
import { WHATSAPP_TEXT_MAX } from "@/lib/whatsapp-webhook";
import { templateLanguage, templatePayload, type WaTemplate } from "@/lib/whatsapp-templates";

/** A Graph API version Meta still serves; set `WHATSAPP_GRAPH_VERSION` to the current one. */
const DEFAULT_GRAPH_VERSION = "v23.0";
const SEND_TIMEOUT_MS = 15_000;
const MEDIA_TIMEOUT_MS = 30_000;
/** Same cap as an email attachment; a bigger file keeps its metadata only. */
export const WHATSAPP_MEDIA_MAX_BYTES = 16 * 1024 * 1024;

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  appSecret: string;
  verifyToken: string;
  wabaId: string | null;
  graphVersion: string;
}

export function whatsappConfig(env: Record<string, string | undefined> = process.env): WhatsAppConfig | null {
  const accessToken = env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const appSecret = env.WHATSAPP_APP_SECRET?.trim();
  const verifyToken = env.WHATSAPP_VERIFY_TOKEN?.trim();
  if (!accessToken || !phoneNumberId || !appSecret || !verifyToken) return null;
  if (!/^\d{5,40}$/.test(phoneNumberId)) return null;
  const v = env.WHATSAPP_GRAPH_VERSION?.trim();
  return {
    accessToken,
    phoneNumberId,
    appSecret,
    verifyToken,
    wabaId: env.WHATSAPP_WABA_ID?.trim() || null,
    graphVersion: v && /^v\d{1,3}\.\d$/.test(v) ? v : DEFAULT_GRAPH_VERSION,
  };
}

export function isWhatsAppConfigured(): boolean {
  return whatsappConfig() !== null;
}

/** Which of the required variables are missing — for the setup note in /admin/inbox. */
export function missingWhatsAppEnv(env: Record<string, string | undefined> = process.env): string[] {
  return ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_APP_SECRET", "WHATSAPP_VERIFY_TOKEN"].filter(
    (k) => !env[k]?.trim(),
  );
}

function graphUrl(c: WhatsAppConfig, path: string): string {
  return `https://graph.facebook.com/${c.graphVersion}/${path}`;
}

interface GraphError {
  error?: { message?: string; code?: number; error_data?: { details?: string } };
}

function graphErrorText(status: number, data: GraphError | null): string {
  const e = data?.error;
  const parts = [e?.code != null ? `#${e.code}` : `HTTP ${status}`, e?.message ?? "", e?.error_data?.details ?? ""];
  return parts.filter(Boolean).join(" ").slice(0, 500);
}

export type SendResult = { ok: true; waMessageId: string } | { ok: false; error: string };

/**
 * Send one text message to `to` (E.164 digits). The caller has already
 * checked the 24-hour window and the viewer's right to write here.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<SendResult> {
  const c = whatsappConfig();
  if (!c) return { ok: false, error: "not configured" };
  const text = body.trim().slice(0, WHATSAPP_TEXT_MAX);
  if (!text) return { ok: false, error: "empty" };
  return postMessage(c, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: text },
  });
}

/**
 * Send an approved template. Allowed at any time, which is the point: it is
 * how a conversation is opened, or reopened after the 24-hour window. The
 * template must already exist in WhatsApp Manager under this name and
 * language, or Meta refuses it (its error text is stored on the message row).
 * The caller has validated the variables (`validateTemplateInput()`).
 */
export async function sendWhatsAppTemplate(to: string, template: WaTemplate, params: readonly string[]): Promise<SendResult> {
  const c = whatsappConfig();
  if (!c) return { ok: false, error: "not configured" };
  return postMessage(c, templatePayload(to, template, params, templateLanguage()));
}

/** The one Graph `/messages` POST every outbound message goes through. */
async function postMessage(c: WhatsAppConfig, payload: Record<string, unknown>): Promise<SendResult> {
  try {
    const res = await fetch(graphUrl(c, `${c.phoneNumberId}/messages`), {
      method: "POST",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      headers: { Authorization: `Bearer ${c.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as (GraphError & { messages?: Array<{ id?: string }> }) | null;
    const id = data?.messages?.[0]?.id;
    if (!res.ok || !id) return { ok: false, error: graphErrorText(res.status, data) };
    return { ok: true, waMessageId: id };
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.name === "TimeoutError" ? "timeout" : "network error" };
  }
}

/**
 * Inbound media: resolve the media id to its short-lived URL, then download it
 * with the same token. Null on any failure or above the size cap — the message
 * row is stored either way, with its type and caption.
 */
export async function fetchWhatsAppMedia(mediaId: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const c = whatsappConfig();
  if (!c || !/^[A-Za-z0-9._-]{1,128}$/.test(mediaId)) return null;
  const auth = { Authorization: `Bearer ${c.accessToken}` };
  try {
    const metaRes = await fetch(graphUrl(c, encodeURIComponent(mediaId)), {
      headers: auth,
      signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS),
    });
    if (!metaRes.ok) return null;
    const meta = (await metaRes.json()) as { url?: string; mime_type?: string; file_size?: number };
    if (!meta.url || (meta.file_size ?? 0) > WHATSAPP_MEDIA_MAX_BYTES) return null;
    // Meta's media host only; never follow a URL somewhere else with our token.
    const host = new URL(meta.url).hostname;
    if (!/(^|\.)(fbsbx\.com|facebook\.com|whatsapp\.net|fbcdn\.net)$/.test(host)) return null;
    const fileRes = await fetch(meta.url, { headers: auth, signal: AbortSignal.timeout(MEDIA_TIMEOUT_MS), redirect: "error" });
    if (!fileRes.ok || !fileRes.body) return null;
    const reader = fileRes.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > WHATSAPP_MEDIA_MAX_BYTES) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
    return { bytes: Buffer.concat(chunks), mime: meta.mime_type || fileRes.headers.get("content-type") || "application/octet-stream" };
  } catch {
    return null;
  }
}
