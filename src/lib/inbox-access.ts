/**
 * "May this user see lead N's email thread?" — asked by the attachment route
 * and the reply actions of the three panels (wave E2).
 *
 * Not a new rule: each branch is the predicate the corresponding lead page
 * already applies, asked for one id —
 * - super-admin: every lead (/admin/leads, unscoped);
 * - staff: the internal lane only (/admin/leads' `internalOnly`);
 * - agency / agent: `panelCanSeeLead()` — own inbox (`getPanelLeads()` under
 *   `panelScope()`) or shared with them (`sharedWithPanel()`);
 * - anyone else: their own listings' leads (`getPanelLeads()` under the owner
 *   scope, as /mis-avisos/consultas).
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agents, leads, listings } from "@/db/schema";
import { VERTICALS, DEFAULT_VERTICAL_KEY } from "@/config/verticals";
import type { SessionUser } from "@/lib/auth/session";
import { isAgencyRole, isStaff, isSuperAdmin } from "@/lib/auth/roles";
import { panelCanSeeLead } from "@/lib/lead-export";
import { getPanelLeads } from "@/lib/panel-queries";
import { isEmailConfigured } from "@/lib/email";
import { isInboundConfigured } from "@/lib/inbox-address";
import { formatEmailWhen, markLeadThreadRead, sendLeadReply } from "@/lib/inbox";
import { esInbox } from "@/i18n/es-e2";

export async function userMaySeeLead(user: SessionUser, leadId: number): Promise<boolean> {
  if (!Number.isInteger(leadId) || leadId <= 0) return false;
  if (isSuperAdmin(user.role)) return true;
  if (isStaff(user.role)) {
    const [row] = await db
      .select({ routedTo: leads.routedTo })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);
    return row?.routedTo === "internal";
  }
  if (isAgencyRole(user.role)) {
    // requireAgencyContext()'s lookup, without its redirects.
    const [row] = await db
      .select({ agencyId: agents.agencyId })
      .from(agents)
      .where(eq(agents.userId, user.id))
      .limit(1);
    const agencyId = row?.agencyId ?? null;
    const scope = agencyId != null
      ? { kind: "agency" as const, agencyId }
      : { kind: "owner" as const, userId: user.id };
    return panelCanSeeLead({ agencyId, user }, scope, leadId);
  }
  return (await getPanelLeads({ kind: "owner", userId: user.id }, leadId)).length > 0;
}

/** A lead's door brand (`leads.vertical` holds the door key) — the display name of mail about it. */
export async function leadBrand(leadId: number): Promise<string> {
  const [row] = await db
    .select({ vertical: leads.vertical })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  const key = row?.vertical ?? DEFAULT_VERTICAL_KEY;
  const door =
    Object.values(VERTICALS).find((v) => v.key === key) ??
    Object.values(VERTICALS).find((v) => v.key === DEFAULT_VERTICAL_KEY);
  return door?.brand ?? "";
}

/**
 * The lead-thread form every panel posts (reply, or mark read), after the
 * panel's own guard has run. Returns the flash key the page shows. The lead
 * id comes from the form, so visibility is re-checked here, never trusted.
 */
export async function handleLeadEmailForm(
  user: SessionUser,
  formData: FormData,
): Promise<"email_sent" | "email_not_sent" | "email_empty" | "email_no_recipient" | "email_not_found" | "email_marked"> {
  const leadId = Number(formData.get("leadId"));
  if (!(await userMaySeeLead(user, leadId))) return "email_not_found";
  if (formData.get("mode") === "read") {
    await markLeadThreadRead(leadId);
    return "email_marked";
  }
  if (!isEmailConfigured() || !isInboundConfigured()) return "email_not_sent";
  const [lead] = await db
    .select({ title: listings.title })
    .from(leads)
    .leftJoin(listings, eq(listings.id, leads.listingId))
    .where(eq(leads.id, leadId))
    .limit(1);
  const out = await sendLeadReply({
    leadId,
    body: String(formData.get("body") ?? ""),
    userId: user.id,
    signature: user.name?.trim() || null,
    brand: await leadBrand(leadId),
    subjectFallback: esInbox.thread.subjectFallback(lead?.title ?? null),
    quoteHeader: (name, at) => esInbox.thread.quoteHeader(name, formatEmailWhen(at)),
  });
  if (!out.ok) {
    return out.error === "empty" ? "email_empty" : out.error === "no_recipient" ? "email_no_recipient" : "email_not_found";
  }
  return out.sent ? "email_sent" : "email_not_sent";
}

/** Flash text for `handleLeadEmailForm()`'s answers, for the pages' flash maps. */
export const LEAD_EMAIL_FLASH: Record<string, { text: string; error?: boolean }> = {
  email_sent: { text: esInbox.flash.sent },
  email_not_sent: { text: esInbox.flash.notSent, error: true },
  email_empty: { text: esInbox.flash.empty, error: true },
  email_no_recipient: { text: esInbox.flash.noRecipient, error: true },
  email_not_found: { text: esInbox.flash.notFound, error: true },
  email_marked: { text: esInbox.flash.marked },
};

/** Whether a lead reply box can work at all: sending configured, and inbound wired for the answer. */
export function leadEmailReplyAvailable(): boolean {
  return isEmailConfigured() && isInboundConfigured();
}
