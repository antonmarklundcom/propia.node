/**
 * The lead writer's shared half: which lane a lead lands in, the one INSERT,
 * and everything that happens after the row exists (operator alert, owner
 * alert, owner email, the CRM copy).
 *
 * Two callers, on purpose one path:
 *   - `app/api/leads/route.ts` — the public form (and everything built on it);
 *   - `logWhatsappLeadAction` on /admin/leads — an enquiry that arrived on the
 *     operator's WhatsApp, typed in by hand.
 *
 * A lead logged from WhatsApp must route, reach VenderCRM and alert exactly
 * like one the form captured; a second copy of this logic would be the first
 * thing to drift. What stays in the route is what only a public endpoint has:
 * origin check, rate limit, body parsing, profile slugs, reports, the seeker's
 * confirmation email.
 *
 * Server-only: it writes the database and reads request headers (origins).
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, listings, users } from "@/db/schema";
import { alertOperator, alertOwner, deliverLead, type LeadPayload } from "@/lib/crm";
import { listingUrl } from "@/lib/urls";
import { listingCanonicalOrigin } from "@/lib/origin";
import { esPanel, esOwner } from "@/i18n/es";
import { emailOwnerNewLead } from "@/lib/lead-emails";

export type LeadListing = typeof listings.$inferSelect;
export type LeadLane = LeadPayload["routedTo"];
export type LeadType = LeadPayload["leadType"];

/** The listing a lead is about, by its public_id, or null. */
export async function findLeadListing(publicId: string): Promise<LeadListing | null> {
  const [row] = await db
    .select()
    .from(listings)
    .where(eq(listings.publicId, publicId))
    .limit(1);
  return row ?? null;
}

/**
 * Same precedence as the detail page's seller card: agent, then agency, then
 * the private owner. `owner` exists so an FSBO lead is addressed to the
 * person actually waiting for it instead of landing in `internal` with the
 * valuation leads, invisible to them (PLAN.md D8).
 *
 * `internal` wins over everything: a report is the operator's to review, and
 * in agency mode (docs/plan-agency-2026-09-26.md batch 3) every enquiry comes
 * to the operator, who shares it with a partner through lead_assignments.
 * An agent or agency named explicitly (a profile lead, D1) outranks the
 * listing's own chain. A lead with no listing at all stays `internal` — there
 * is nobody else it could belong to.
 */
export function leadLaneFor(p: {
  internal: boolean;
  explicitAgent?: boolean;
  explicitAgency?: boolean;
  listing: Pick<LeadListing, "agentId" | "agencyId" | "ownerUserId"> | null;
}): LeadLane {
  if (p.internal) return "internal";
  if (p.explicitAgent) return "agent";
  if (p.explicitAgency) return "agency";
  if (p.listing?.agentId) return "agent";
  if (p.listing?.agencyId) return "agency";
  if (p.listing?.ownerUserId) return "owner";
  return "internal";
}

export interface NewLead {
  leadType: LeadType;
  vertical: string;
  listing: LeadListing | null;
  name?: string;
  whatsapp: string;
  email?: string;
  message?: string;
  utm?: Record<string, string>;
  routedTo: LeadLane;
}

/**
 * 1. Record in MySQL first — the source of truth for the money report — and
 *    return the payload the deferred push will carry. The listing URL is read
 *    here, inside the request, because `listingCanonicalOrigin()` reads the
 *    Host header and `after()` runs once the headers are gone.
 */
export async function recordLead(
  lead: NewLead,
): Promise<{ leadId: number; payload: LeadPayload & { leadId: number } }> {
  const [res] = await db.insert(leads).values({
    leadType: lead.leadType,
    vertical: lead.vertical,
    listingId: lead.listing?.id,
    projectId: lead.listing?.projectId,
    name: lead.name,
    whatsapp: lead.whatsapp,
    email: lead.email,
    message: lead.message,
    utm: lead.utm,
    routedTo: lead.routedTo,
  });
  const leadId = Number((res as unknown as { insertId: number }).insertId);

  const listing = lead.listing;
  const payload: LeadPayload & { leadId: number } = {
    leadId,
    leadType: lead.leadType,
    vertical: lead.vertical,
    name: lead.name,
    whatsapp: lead.whatsapp,
    email: lead.email,
    message: lead.message,
    utm: lead.utm,
    routedTo: lead.routedTo,
    listing: listing
      ? {
          publicId: listing.publicId,
          title: listing.title,
          url: `${await listingCanonicalOrigin()}${listingUrl(listing)}`,
          priceUsd: Number(listing.priceUsd),
          operation: listing.operation,
        }
      : undefined,
  };
  return { leadId, payload };
}

export interface LeadOwnerContact {
  whatsapp: string | null;
  name: string | null;
  email: string | null;
  locale: "es" | "en";
}

/**
 * The owner lane is the FSBO seller (D8): who to ping. Null for every other
 * lane. Read before `after()` like everything else a deferred step needs.
 */
export async function leadOwnerContact(
  routedTo: LeadLane,
  listing: LeadListing | null,
): Promise<LeadOwnerContact | null> {
  if (routedTo !== "owner" || !listing?.ownerUserId) return null;
  const [row] = await db
    .select({
      whatsapp: users.whatsapp,
      name: users.name,
      email: users.email,
      locale: users.locale,
    })
    .from(users)
    .where(eq(users.id, listing.ownerUserId))
    .limit(1);
  return row ?? null;
}

/**
 * Everything outbound for a saved lead. Call it inside `after()`: the row is
 * the record, these are copies and "go look" pings, and none of them is worth
 * a visitor's wait (the 2026-07-26 503 spiral, PLAN.md). Never throws.
 *
 * The operator alert, owner alert and CRM copy stay separate: the alert is
 * "a lead arrived, go look", the CRM push carries the record, and a
 * downstream flow routes them differently. Each is silent when unconfigured.
 */
export async function sendLeadCopies(p: {
  payload: LeadPayload & { leadId: number };
  owner: LeadOwnerContact | null;
  /** Absolute /admin/leads URL (read inside the request). */
  adminUrl: string;
  /** Absolute /mis-avisos/consultas URL (read inside the request). */
  ownerUrl: string;
  brand: string;
  /** False when the operator typed the lead in themselves. */
  alertOperator: boolean;
  /** Other emails to send alongside the owner's (the seeker confirmation). */
  alsoEmail?: () => Promise<unknown> | null;
}): Promise<void> {
  const { payload, owner } = p;
  const listingTitle = payload.listing?.title ?? null;
  try {
    if (p.alertOperator) {
      await alertOperator({
        kind: "new_lead",
        title: esPanel.alertNewLeadTitle,
        detail: esPanel.alertNewLeadDetail({
          leadType: payload.leadType,
          name: payload.name ?? null,
          whatsapp: payload.whatsapp,
          listingTitle,
        }),
        url: p.adminUrl,
        site: new URL(p.adminUrl).host,
      });
    }

    if (owner?.whatsapp) {
      await alertOwner({
        kind: "new_lead",
        to: owner.whatsapp,
        ownerName: owner.name ?? null,
        title: esOwner.alertNewLeadTitle,
        detail: esOwner.alertNewLeadDetail({
          name: payload.name ?? null,
          whatsapp: payload.whatsapp,
          listingTitle,
        }),
        url: p.ownerUrl,
      });
    }

    // Email copies, each only when the person left an address and email is
    // configured (`sendEmail` is a silent no-op otherwise, and never throws).
    await Promise.allSettled([
      owner?.email
        ? emailOwnerNewLead({
            to: owner.email,
            locale: owner.locale,
            brand: p.brand,
            listingTitle,
            name: payload.name ?? null,
            whatsapp: payload.whatsapp,
            url: p.ownerUrl,
          })
        : null,
      p.alsoEmail?.() ?? null,
    ]);
  } catch {
    /* a ping that failed is not an incident; the CRM copy below still runs */
  }

  // The provider's contact id is worth storing when it comes back, but a
  // push that fails or times out leaves the lead exactly as complete as it
  // already was. Nothing here may throw into the runtime's after() handler.
  try {
    // VenderCRM when this door has a key, the generic webhook otherwise.
    const crmResult = await deliverLead(payload);
    if (crmResult.ok && crmResult.contactId) {
      await db
        .update(leads)
        .set({ ghlContactId: crmResult.contactId })
        .where(eq(leads.id, payload.leadId));
    }
  } catch {
    /* the lead row is the record; a failed copy is not an incident */
  }
}
