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

export interface LeadPayload {
  leadType:
    | "buyer"
    | "renter"
    | "seller"
    | "valuation"
    | "developer"
    | "agent_signup";
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
  routedTo: "agency" | "agent" | "internal" | "developer";
}

export interface CrmResult {
  ok: boolean;
  /** Provider-side contact id (stored as leads.ghl_contact_id). */
  contactId?: string;
  error?: string;
}

export interface CrmProvider {
  pushLead(lead: LeadPayload): Promise<CrmResult>;
  sendOtp(whatsapp: string, code: string): Promise<CrmResult>;
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

  private async post(body: unknown): Promise<CrmResult> {
    try {
      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return { ok: false, error: `webhook ${res.status}` };
      const data = (await res.json().catch(() => ({}))) as {
        contact_id?: string;
      };
      return { ok: true, contactId: data.contact_id };
    } catch (e) {
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
