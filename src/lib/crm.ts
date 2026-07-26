/**
 * CRM boundary (ARCHITECTURE.md §2.5) — the ONLY file that knows which CRM
 * we use. Today that's GoHighLevel; the portal never sends WhatsApp messages
 * itself. GHL owns messaging, the leads table owns the record.
 *
 * Deliberately provider-agnostic so the future options stay open:
 *  a) GHL sub-accounts per agency (resell GHL as the agency CRM), or
 *  b) a purpose-built real-estate CRM in a SEPARATE repo, consuming the same
 *     webhook payloads this module emits.
 * Either way, nothing outside this file changes.
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

/** GoHighLevel via inbound webhook — reuses the existing $497 plan. */
class GhlProvider implements CrmProvider {
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
      if (!res.ok) return { ok: false, error: `GHL ${res.status}` };
      const data = (await res.json().catch(() => ({}))) as {
        contact_id?: string;
      };
      return { ok: true, contactId: data.contact_id };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
}

/** Dev fallback: logs instead of sending, so local dev needs no GHL access. */
class ConsoleCrm implements CrmProvider {
  async pushLead(lead: LeadPayload): Promise<CrmResult> {
    console.info("[crm:dev] lead", JSON.stringify(lead));
    return { ok: true };
  }
  async sendOtp(whatsapp: string, code: string): Promise<CrmResult> {
    console.info(`[crm:dev] OTP ${code} → ${whatsapp}`);
    return { ok: true };
  }
}

export function getCrm(): CrmProvider {
  const url = process.env.GHL_WEBHOOK_URL;
  return url ? new GhlProvider(url) : new ConsoleCrm();
}
