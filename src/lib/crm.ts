/**
 * Outbound messaging boundary (ARCHITECTURE.md §2.5) — the ONLY file that knows
 * which provider, if any, delivers messages for us.
 *
 * **The portal does not depend on one.** `leads` is the record: every lead is
 * written to MySQL before this module is ever called, the panel reads it from
 * there, and a failed or absent push loses nothing. What a provider adds is
 * *outbound* delivery — a WhatsApp OTP, a "you have a new lead" ping — not
 * storage.
 *
 * So the provider is optional by construction, and `isMessagingConfigured()`
 * is how the rest of the app asks. Nothing may assume a message can be sent:
 * the publish flow checks first and skips phone verification when it cannot
 * deliver, rather than issuing a code nobody receives.
 *
 * Provider-agnostic so the options stay open — WhatsApp Cloud API direct from
 * Meta, GoHighLevel, or a purpose-built CRM in a separate repo consuming these
 * same payloads. Either way, nothing outside this file changes.
 */

import { operatorEmail, renderEmail, sendEmail } from "@/lib/email";
import { esEmail } from "@/i18n/es";

export interface LeadPayload {
  /**
   * The saved `leads.id`. VenderCRM's idempotency key is built from it, so a
   * retry or a backfill of the same row can never create a second deal.
   */
  leadId?: number;
  leadType:
    | "buyer"
    | "renter"
    | "seller"
    | "valuation"
    | "developer"
    | "agent_signup"
    | "landlord"
    | "question";
  vertical: string;
  name?: string;
  whatsapp: string;
  email?: string;
  message?: string;
  utm?: Record<string, string>;
  listing?: {
    publicId: string;
    title: string;
    url: string;
    priceUsd: number;
    operation: string;
  };
  project?: { slug: string; name: string };
  routedTo: "agency" | "agent" | "owner" | "internal" | "developer";
}

/**
 * A ping to the person running the portal — not a CRM record.
 *
 * The founder is a solo operator with no inbox on this domain (there is no
 * portal email, on purpose), so a new lead or a listing waiting for review is
 * discovered by opening /admin and looking. This is the outbound half of that:
 * when a webhook is configured, the same channel that carries leads carries a
 * "go look" alert, distinguishable by its `event` so a downstream flow can
 * route it to WhatsApp instead of into a pipeline.
 *
 * Optional by construction, exactly like every other outbound message here: no
 * provider means no alert, never a logged line pretending to be one.
 */
export interface OperatorAlert {
  kind: "new_lead" | "review_submitted" | "new_email";
  /** One line, already in the operator's language. */
  title: string;
  detail?: string;
  /** Absolute URL of the screen that acts on it. */
  url?: string;
  /** The domain it happened on, e.g. `rentparaguay.com`. */
  site?: string;
}

/**
 * The FSBO seller's ping (PLAN.md D8) — a "go look" at their owner inbox.
 * When a webhook is configured, the seller's WhatsApp lets a downstream flow
 * deliver it to the person waiting for the enquiry.
 *
 * Optional by construction, exactly like every other outbound message here: no
 * provider means no alert, never a logged line pretending to be one.
 */
export interface OwnerAlert {
  kind: "new_lead";
  /** The owner's WhatsApp, in the canonical form stored in users.whatsapp. */
  to: string;
  ownerName: string | null;
  /** One line, in Spanish. */
  title: string;
  detail?: string;
  /** Absolute URL of the screen that acts on it. */
  url?: string;
}

export interface CrmResult {
  ok: boolean;
  /** Provider-side contact id (stored as leads.ghl_contact_id). */
  contactId?: string;
  error?: string;
}

/**
 * Hard ceiling on one webhook round-trip.
 *
 * Node's fetch will otherwise wait up to 300 s for a provider that accepted
 * the connection and went quiet, and on this host a request that does not
 * resolve keeps its Node process alive — processes count against an
 * account-wide cap shared with every other site (the 503 post-mortem in
 * PLAN.md, and the pool limits in src/db/index.ts, which exist for the same
 * reason). Work deferred with `after()` holds the process too, so the bound
 * matters whether the caller awaits the push or not.
 *
 * 5 s, not longer: the one caller that still awaits this inside a request is
 * the publish wizard's OTP step, where a person is watching a spinner, and
 * that keeps the webhook strictly faster than the database's own 8 s connect
 * timeout — a stalled provider can never be the slowest hop in a request.
 * A webhook that normally answers in well under a second loses nothing.
 */
const WEBHOOK_TIMEOUT_MS = 5_000;

function isTimeout(e: unknown): boolean {
  return e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
}

export interface CrmProvider {
  pushLead(lead: LeadPayload): Promise<CrmResult>;
  sendOtp(whatsapp: string, code: string): Promise<CrmResult>;
  notifyOperator(alert: OperatorAlert): Promise<CrmResult>;
  notifyOwner(alert: OwnerAlert): Promise<CrmResult>;
}

/**
 * Generic outbound webhook (the shape GoHighLevel's inbound webhooks accept,
 * and a trivial target for anything else that speaks JSON over HTTPS).
 */
class WebhookProvider implements CrmProvider {
  constructor(private webhookUrl: string) {}

  async pushLead(lead: LeadPayload): Promise<CrmResult> {
    return this.post({ event: "lead", ...lead });
  }

  async sendOtp(whatsapp: string, code: string): Promise<CrmResult> {
    return this.post({ event: "otp", whatsapp, code });
  }

  async notifyOperator(alert: OperatorAlert): Promise<CrmResult> {
    return this.post({ event: "operator_alert", ...alert });
  }

  async notifyOwner(alert: OwnerAlert): Promise<CrmResult> {
    return this.post({ event: "owner_alert", ...alert });
  }

  private async post(body: unknown): Promise<CrmResult> {
    try {
      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        // The signal covers the whole exchange — connect, headers and body —
        // so a webhook that accepts the socket and then stalls is cut off too.
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });
      if (!res.ok) return { ok: false, error: `webhook ${res.status}` };
      const data = (await res.json().catch(() => ({}))) as {
        contact_id?: string;
      };
      return { ok: true, contactId: data.contact_id };
    } catch (e) {
      if (isTimeout(e)) {
        return { ok: false, error: `webhook timeout after ${WEBHOOK_TIMEOUT_MS}ms` };
      }
      return { ok: false, error: String(e) };
    }
  }
}

/**
 * No provider configured. Lead pushes are a no-op success — the lead is
 * already stored, and there is nothing to deliver it to.
 *
 * `sendOtp` deliberately reports **failure**, not success. The old dev-console
 * fallback claimed the code was sent and logged it server-side, which in
 * production meant the wizard told the publisher "we sent you a code" that
 * nobody could ever receive — a dead end that looked like success. Callers use
 * `isMessagingConfigured()` to skip verification entirely instead.
 */
class NoProvider implements CrmProvider {
  async pushLead(lead: LeadPayload): Promise<CrmResult> {
    if (process.env.NODE_ENV !== "production") {
      console.info("[messaging:dev] lead", JSON.stringify(lead));
    }
    return { ok: true };
  }
  async sendOtp(whatsapp: string, code: string): Promise<CrmResult> {
    if (process.env.NODE_ENV !== "production") {
      // Local dev only: lets the OTP flow be exercised without a provider.
      console.info(`[messaging:dev] OTP ${code} → ${whatsapp}`);
      return { ok: true };
    }
    return { ok: false, error: "no messaging provider configured" };
  }
  /**
   * Reports failure, like sendOtp and unlike pushLead: a lead push has nothing
   * left to deliver once the row is stored, but an alert that was never sent
   * is simply an alert that was never sent. The /admin badges are what the
   * operator has without a provider, and they are always there.
   */
  async notifyOperator(alert: OperatorAlert): Promise<CrmResult> {
    if (process.env.NODE_ENV !== "production") {
      console.info("[messaging:dev] operator alert", JSON.stringify(alert));
    }
    return { ok: false, error: "no messaging provider configured" };
  }

  async notifyOwner(alert: OwnerAlert): Promise<CrmResult> {
    if (process.env.NODE_ENV !== "production") {
      console.info("[messaging:dev] owner alert", JSON.stringify(alert));
    }
    return { ok: false, error: "no messaging provider configured" };
  }
}

/** URL of the outbound webhook, if one is configured. */
function webhookUrl(): string | undefined {
  // GHL_WEBHOOK_URL is the historical name; either works.
  return process.env.LEAD_WEBHOOK_URL || process.env.GHL_WEBHOOK_URL;
}

/**
 * Whether outbound messages can actually be delivered. Drives the publish
 * flow: without this, phone verification is skipped rather than faked.
 * In development the console provider counts, so the flow stays testable.
 */
export function isMessagingConfigured(): boolean {
  return Boolean(webhookUrl()) || process.env.NODE_ENV !== "production";
}

export function getCrm(): CrmProvider {
  const url = webhookUrl();
  return url ? new WebhookProvider(url) : new NoProvider();
}

/**
 * The operator's own phone, through a Telegram bot. Deliberately separate from
 * `LEAD_WEBHOOK_URL`: setting that webhook also turns on OTP verification in
 * /publicar (`isMessagingConfigured()`), which must stay off until something
 * can actually deliver the codes. These two variables only ever carry alerts.
 */
function telegramConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  return token && chatId ? { token, chatId } : null;
}

async function sendTelegram(text: string): Promise<CrmResult> {
  const cfg = telegramConfig();
  if (!cfg) return { ok: false, error: "telegram not configured" };
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${cfg.token}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      },
    );
    return res.ok ? { ok: true } : { ok: false, error: `telegram ${res.status}` };
  } catch (e) {
    return { ok: false, error: isTimeout(e) ? "telegram timeout" : String(e) };
  }
}

function operatorAlertText(alert: OperatorAlert): string {
  return [alert.title, alert.detail, alert.site, alert.url]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

/**
 * The operator alert as an email to `OPERATOR_EMAIL`. Spanish, like the rest
 * of the operator's copy; no display-name override, since it is the portal
 * talking to its own operator rather than a door talking to a visitor.
 */
function sendOperatorEmail(to: string, alert: OperatorAlert) {
  const { html, text } = renderEmail({
    heading: alert.title,
    paragraphs: [alert.detail, alert.site].filter((l): l is string => Boolean(l)),
    cta: alert.url ? { label: esEmail.operatorCta, url: alert.url } : undefined,
    footer: esEmail.operatorFooter,
  });
  const subject = alert.site ? `${alert.title} · ${alert.site}` : alert.title;
  return sendEmail({ to, subject, html, text });
}

/**
 * Fire-and-forget operator alert. Never throws and never reports back: no
 * caller may fail, retry or slow a request because a ping did not land — the
 * lead or the pending listing is already in MySQL, which is the record.
 *
 * Goes to every configured channel: the webhook (when set), Telegram (when
 * set) and email (when Cloudflare Email Sending and `OPERATOR_EMAIL` are
 * set). With none, nothing is sent and nothing pretends it was.
 */
export async function alertOperator(alert: OperatorAlert): Promise<void> {
  const to = operatorEmail();
  await Promise.allSettled([
    getCrm().notifyOperator(alert),
    telegramConfig() ? sendTelegram(operatorAlertText(alert)) : null,
    to ? sendOperatorEmail(to, alert) : null,
  ]);
}

/** Fire-and-forget owner alert. The lead is already in MySQL; never throws. */
export async function alertOwner(alert: OwnerAlert): Promise<void> {
  try {
    await getCrm().notifyOwner(alert);
  } catch {
    /* an undelivered ping is not worth an error page */
  }
}


/* -------------------------------------------------------------------------- */
/* VenderCRM — the leads copy (docs/plan-lead-access-2026-09-25.md §8)         */
/* -------------------------------------------------------------------------- */

/**
 * VenderCRM takes one API key per *site*, and a site is one of our doors: the
 * key is what tells the CRM which business (and pipeline) a lead belongs to.
 * So the key is looked up by the lead's saved `vertical`, from a server-only
 * env var, `VENDERCRM_KEY_<KEY>` (`inmobiliaria` → `VENDERCRM_KEY_INMOBILIARIA`).
 *
 * A door without a key is not a door that borrows another's: its leads stay
 * local-only (and keep going to the generic webhook if one is set). Reusing a
 * key across doors would file one door's leads under another business.
 *
 * Deliberately NOT part of `isMessagingConfigured()`: a leads key cannot
 * deliver a WhatsApp code, so it must never switch OTP on in /publicar.
 */
export function venderCrmKeyFor(vertical: string): string | null {
  const base = process.env.VENDERCRM_BASE_URL?.trim();
  if (!base || !/^[a-z0-9_]+$/i.test(vertical)) return null;
  return process.env[`VENDERCRM_KEY_${vertical.toUpperCase()}`]?.trim() || null;
}

/** `+595…` for Paraguayan numbers in any of the forms people type. */
export function toInternationalPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("595")) return `+${d}`;
  if (d.startsWith("0")) return `+595${d.slice(1)}`;
  // A bare local mobile (981 123 456) has at most 9 digits; anything longer
  // already carries a foreign country code (the English door's buyers).
  if (d.length <= 9) return `+595${d}`;
  return `+${d}`;
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

/** The request body, built in one place so the backfill sends exactly what a live lead sends. */
export function venderCrmBody(lead: LeadPayload & { leadId: number }) {
  const utm = lead.utm ?? {};
  const fields: Record<string, string> = {
    lead_id: String(lead.leadId),
    vertical: lead.vertical,
    lead_type: lead.leadType,
    routed_to: lead.routedTo,
  };
  // The forms store their own marker in utm.source (`vender`, `directory:home`);
  // it is form provenance, not a campaign, so it travels as a field.
  if (utm.source) fields.form = utm.source;
  if (lead.listing) {
    fields.listing_public_id = lead.listing.publicId;
    fields.listing_title = lead.listing.title;
    fields.listing_url = lead.listing.url;
    fields.listing_operation = lead.listing.operation;
    fields.listing_price_usd = String(lead.listing.priceUsd);
  }

  // Campaign parameters travel under their own names (`utm_source`, …); only
  // the five known keys, never the whole JSON.
  const campaign: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = utm[key];
    if (value) campaign[key] = value.slice(0, 190);
  }

  const message = [
    lead.message?.trim(),
    lead.listing ? `Aviso: ${lead.listing.title} — ${lead.listing.url}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    phone: toInternationalPhone(lead.whatsapp),
    ...(lead.name ? { name: lead.name } : {}),
    ...(lead.email ? { email: lead.email } : {}),
    ...(message ? { message } : {}),
    source: `site:${lead.vertical}`,
    idempotency_key: `portal-lead-${lead.leadId}`,
    ...campaign,
    fields,
  };
}

/**
 * POST one saved lead to VenderCRM. `null` = this door has no key (nothing was
 * attempted); otherwise the outcome. 200 (idempotent replay) and 201 are both
 * delivered. Never throws, and on failure logs the status and lead id only —
 * never the body, the phone or the key.
 */
export async function pushLeadToVenderCrm(
  lead: LeadPayload & { leadId: number },
): Promise<CrmResult | null> {
  const key = venderCrmKeyFor(lead.vertical);
  if (!key) return null;
  const url = `${process.env.VENDERCRM_BASE_URL!.trim().replace(/\/+$/, "")}/api/v1/leads`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key },
      body: JSON.stringify(venderCrmBody(lead)),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    if (res.ok) return { ok: true };
    console.warn(`[vendercrm] lead ${lead.leadId} not accepted: HTTP ${res.status}`);
    return { ok: false, error: `vendercrm ${res.status}` };
  } catch (e) {
    const error = isTimeout(e) ? "vendercrm timeout" : "vendercrm network error";
    console.warn(`[vendercrm] lead ${lead.leadId}: ${error}`);
    return { ok: false, error };
  }
}

/**
 * The one call both lead writers make after the row is saved: VenderCRM when
 * the lead's door has a key, the generic webhook (or nothing) otherwise. One
 * destination per lead, never both, so a lead is not filed twice. Never throws.
 */
export async function deliverLead(
  lead: LeadPayload & { leadId: number },
): Promise<CrmResult> {
  try {
    const vender = await pushLeadToVenderCrm(lead);
    if (vender) return vender;
    return await getCrm().pushLead(lead);
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
