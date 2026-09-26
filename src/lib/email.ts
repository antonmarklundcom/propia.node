/**
 * Outbound email (plan-build-2026-09-26 §6, wave E1) — the ONLY file that
 * knows how an email leaves this app: Cloudflare Email Sending's REST API,
 * `POST /accounts/{account_id}/email/sending/send`, over plain `fetch`. No
 * SMTP, no SDK.
 *
 * Same contract as `src/lib/crm.ts`, and for the same reasons:
 *
 * - **Optional by construction.** Without `CLOUDFLARE_ACCOUNT_ID` and
 *   `CLOUDFLARE_EMAIL_TOKEN` every call is a silent no-op that returns
 *   `{ sent: false }`. Nothing may assume an email can be sent, and nothing
 *   logs a line that pretends one was (the `alertOperator()` / `sendOtp` rule).
 * - **Never throws.** Every caller is a lead, a share or an alert whose row is
 *   already in MySQL; an email is a copy of a "go look", and a provider that is
 *   down, slow or refusing must not turn a saved lead into an error page.
 * - **Bounded.** One round-trip is cut off at 5 s, like every other outbound
 *   call here (the 503 post-mortem in PLAN.md: a stalled provider keeps a Node
 *   process alive on a host with a shared process cap). Callers also run it in
 *   `after()`, so no visitor waits on it at all.
 *
 * All machine mail is sent from the `mail.` subdomain, never the root domain
 * (founder decision 2026-09-26): the root is Email Routing's (hola@, anton@),
 * and its DMARC must not depend on this app. The sender is `EMAIL_FROM`; a
 * caller may swap the *display name* (a door's brand) but never the address.
 * The one exception is a person's reply from /admin/inbox (wave E3), sent as
 * hola@/anton@ — and only once the founder has onboarded the root domain and
 * set `EMAIL_ROOT_SENDING=true` (`senderFor()`).
 *
 * Pure: no `next/*`, no database — `npm run email:test` imports it unchanged.
 */

import { messageIdsIn, normalizeAddress, rootMailboxLocal } from "./inbox-address";

/** Same ceiling as crm.ts's webhook: strictly faster than the DB's 8 s connect timeout. */
const EMAIL_TIMEOUT_MS = 5_000;

const DEFAULT_FROM = "Inmobiliaria Paraguay <avisos@mail.inmobiliaria.com.py>";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /**
   * Display name to send under instead of `EMAIL_FROM`'s — a door's brand, so
   * a message about an English-door enquiry reads "Real Estate in Paraguay".
   * The address stays `EMAIL_FROM`'s: only the verified subdomain may send.
   */
  fromName?: string;
  /**
   * A root-domain mailbox (hola@inmobiliaria.com.py) to send *as*, for
   * /admin/inbox replies (wave E3). Honoured only when `EMAIL_ROOT_SENDING`
   * is `true` — the founder has onboarded the root domain in Email Sending —
   * and only for an address on that root domain; otherwise the message goes
   * from `EMAIL_FROM` and this mailbox becomes its Reply-To (unless the
   * caller set one). See `senderFor()`.
   */
  fromMailbox?: string;
  cc?: string[];
  /** Threading (wave E2/E3): the Message-ID being answered, and the chain before it. */
  inReplyTo?: string;
  references?: string[];
}

export interface EmailResult {
  /** True only when Cloudflare accepted the message for this recipient. */
  sent: boolean;
  /** Why not — never the address, never the body. */
  error?: string;
  messageId?: string;
}

interface Address {
  address: string;
  name?: string;
}

function config(): { accountId: string; token: string } | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_EMAIL_TOKEN?.trim();
  return accountId && token ? { accountId, token } : null;
}

/** Whether email can actually be sent. Nothing else in the app should guess. */
export function isEmailConfigured(): boolean {
  return config() !== null;
}

/**
 * The operator's inbox for `alertOperator()`. Deliberately its own variable:
 * there is no portal mailbox (CLAUDE.md, "There is no portal email"), so an
 * operator email goes exactly where the founder says, or nowhere.
 */
export function operatorEmail(): string | null {
  const to = process.env.OPERATOR_EMAIL?.trim();
  return to && isPlausibleEmail(to) ? to : null;
}

/** Deliberately loose: the provider is the validator; this only refuses what could inject a header. */
export function isPlausibleEmail(s: string): boolean {
  return s.length <= 254 && /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(s);
}

/** `Name <addr@host>` or a bare `addr@host` → the API's address object. */
export function parseAddress(raw: string): Address | null {
  const s = raw.trim();
  const m = /^(.*?)\s*<([^<>]+)>$/.exec(s);
  const address = (m ? m[2] : s).trim();
  if (!isPlausibleEmail(address)) return null;
  const name = m?.[1].trim().replace(/^"(.*)"$/, "$1");
  return name ? { address, name } : { address };
}

/** The sender, from `EMAIL_FROM` (or the default), with an optional display-name override. */
export function senderAddress(fromName?: string): Address | null {
  const from = parseAddress(process.env.EMAIL_FROM?.trim() || DEFAULT_FROM);
  if (!from) return null;
  const name = oneLine(fromName ?? "") || from.name;
  return name ? { address: from.address, name } : { address: from.address };
}

/** `EMAIL_ROOT_SENDING=true`: the root domain is onboarded in Email Sending too. */
export function isRootSendingEnabled(): boolean {
  return process.env.EMAIL_ROOT_SENDING?.trim().toLowerCase() === "true";
}

/**
 * Who a message is really sent from, and the Reply-To that goes with it.
 * The only place the root-mailbox rule lives: `fromMailbox` is used as the
 * sender when root sending is on and the address is on the root domain;
 * otherwise the sender is `EMAIL_FROM` and the mailbox is where replies go.
 */
export function senderFor(msg: Pick<EmailMessage, "fromName" | "fromMailbox" | "replyTo">): {
  from: Address | null;
  replyTo: string | undefined;
} {
  const mailbox = msg.fromMailbox ? rootMailboxLocal(msg.fromMailbox) : null;
  if (msg.fromMailbox && mailbox && isRootSendingEnabled()) {
    const name = oneLine(msg.fromName ?? "");
    const address = normalizeAddress(msg.fromMailbox);
    return { from: name ? { address, name } : { address }, replyTo: msg.replyTo };
  }
  return {
    from: senderAddress(msg.fromName),
    replyTo: msg.replyTo ?? (mailbox && msg.fromMailbox ? normalizeAddress(msg.fromMailbox) : undefined),
  };
}

/** Header values are one line: a CR/LF in a subject or name is refused, not passed on. */
function oneLine(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

/**
 * The exact JSON body `sendEmail()` posts — built in one place so
 * `email:test --dry` prints what a real send would send. `null` when the
 * message cannot be sent at all (bad recipient, bad `EMAIL_FROM`).
 */
export function emailRequestBody(msg: EmailMessage): Record<string, unknown> | null {
  const sender = senderFor(msg);
  const from = sender.from;
  const to = msg.to.trim();
  if (!from || !isPlausibleEmail(to)) return null;
  const replyTo = sender.replyTo ? parseAddress(sender.replyTo) : null;
  const cc = (msg.cc ?? []).map((a) => a.trim()).filter(isPlausibleEmail).slice(0, 20);
  // Threading headers are on Cloudflare's allowlist; values are Message-IDs
  // only (`<…>`), which is also what keeps a CR/LF out of them.
  const inReplyTo = messageIdsIn(msg.inReplyTo)[0];
  const references = messageIdsIn((msg.references ?? []).join(" ")).slice(-20).join(" ");
  const headers = {
    ...(inReplyTo ? { "In-Reply-To": inReplyTo } : {}),
    ...(references ? { References: references } : {}),
  };
  return {
    from,
    to,
    ...(cc.length ? { cc } : {}),
    subject: oneLine(msg.subject).slice(0, 250),
    html: msg.html,
    text: msg.text,
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...(Object.keys(headers).length ? { headers } : {}),
  };
}

interface CloudflareEnvelope {
  success?: boolean;
  errors?: { code?: number; message?: string }[];
  result?: {
    message_id?: string;
    delivered?: string[];
    queued?: string[];
    permanent_bounces?: string[];
    suppressed_recipients?: string[];
  };
}

/**
 * Send one email. Resolves `{ sent: false }` when email is not configured,
 * when the message is malformed, and on any provider failure — it never
 * throws, and on failure it logs the reason only (HTTP status, Cloudflare's
 * error code), never the recipient, the subject or the body.
 */
export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const cfg = config();
  if (!cfg) {
    if (process.env.NODE_ENV !== "production") {
      // Local dev only, and worded so it cannot be mistaken for a delivery.
      console.info(`[email:dev] NOT sent (email not configured): ${oneLine(msg.subject)}`);
    }
    return { sent: false, error: "email not configured" };
  }

  const body = emailRequestBody(msg);
  if (!body) return { sent: false, error: "invalid recipient or EMAIL_FROM" };

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cfg.accountId)}/email/sending/send`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${cfg.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      },
    );
    const data = (await res.json().catch(() => ({}))) as CloudflareEnvelope;
    if (!res.ok || data.success === false) {
      const code = data.errors?.[0]?.code;
      const error = `cloudflare ${res.status}${code ? ` (code ${code})` : ""}`;
      console.warn(`[email] not sent: ${error}`);
      return { sent: false, error };
    }
    const r = data.result ?? {};
    // A 200 can still carry a hard bounce or a suppressed recipient: that is
    // not a sent email, and the caller must not be told it was.
    const accepted = (r.delivered?.length ?? 0) + (r.queued?.length ?? 0) > 0;
    if (!accepted) {
      const error = r.permanent_bounces?.length
        ? "permanent bounce"
        : r.suppressed_recipients?.length
          ? "recipient suppressed"
          : "not accepted";
      console.warn(`[email] not sent: ${error}`);
      return { sent: false, error, messageId: r.message_id };
    }
    return { sent: true, messageId: r.message_id };
  } catch (e) {
    const timeout =
      e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    const error = timeout ? `timeout after ${EMAIL_TIMEOUT_MS}ms` : "network error";
    console.warn(`[email] not sent: ${error}`);
    return { sent: false, error };
  }
}

/* -------------------------------------------------------------------------- */
/* Rendering — one plain layout, HTML and text from the same parts             */
/* -------------------------------------------------------------------------- */

export interface EmailParts {
  /** First line of the body, bold in HTML. */
  heading: string;
  /** Plain-text paragraphs; escaped here, so callers pass raw copy and data. */
  paragraphs: string[];
  /** A single call to action. The URL must be absolute and ours. */
  cta?: { label: string; url: string };
  /** Small print under a rule: who sent this and why. */
  footer: string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * HTML + text for one message. Inline styles only (mail clients drop
 * `<style>`), no images (nothing to host them on until R2), system fonts.
 */
export function renderEmail(parts: EmailParts): { html: string; text: string } {
  const p = (s: string) =>
    `<p style="margin:0 0 14px;line-height:1.5">${escapeHtml(s).replace(/\n/g, "<br>")}</p>`;
  const cta = parts.cta
    ? `<p style="margin:20px 0"><a href="${escapeHtml(parts.cta.url)}" style="display:inline-block;background:#1f4d3a;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">${escapeHtml(parts.cta.label)}</a></p>`
    : "";
  const html = [
    `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f5f1;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1c1c;font-size:15px">`,
    `<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px">`,
    `<p style="margin:0 0 16px;font-size:17px;font-weight:700;line-height:1.4">${escapeHtml(parts.heading)}</p>`,
    ...parts.paragraphs.map(p),
    cta,
    `<hr style="border:none;border-top:1px solid #e4e2dc;margin:20px 0 12px">`,
    `<p style="margin:0;font-size:12px;color:#5c5c5c;line-height:1.5">${escapeHtml(parts.footer)}</p>`,
    `</div></body></html>`,
  ].join("");

  const text = [
    parts.heading,
    "",
    ...parts.paragraphs.flatMap((s) => [s, ""]),
    ...(parts.cta ? [`${parts.cta.label}: ${parts.cta.url}`, ""] : []),
    "--",
    parts.footer,
  ].join("\n");

  return { html, text };
}
