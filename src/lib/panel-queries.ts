/**
 * Panel data access (admin review queue + agency dashboard). Same rules as
 * src/lib/queries.ts: typed selects, filtering only on indexed scalar columns,
 * no MySQL-only cleverness. Writes are scoped in the WHERE clause so an agency
 * can never mutate a row it doesn't own — the agencyId comes from the session
 * (guards.ts), never from the request.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, leads, listings, locations } from "@/db/schema";

export type ListingStatus = (typeof listings.$inferSelect)["status"];

/* ------------------------------------------------------------------ */
/* Super-admin: review queue                                           */
/* ------------------------------------------------------------------ */

export interface ReviewRow {
  id: number;
  publicId: string;
  slug: string;
  title: string;
  operation: (typeof listings.$inferSelect)["operation"];
  propertyType: (typeof listings.$inferSelect)["propertyType"];
  priceAmount: string;
  priceCurrency: "USD" | "PYG";
  priceUsd: string;
  createdAt: Date;
  agencyName: string | null;
  locationName: string | null;
}

/** Listings awaiting review, oldest first. Hits idx_search on the status prefix. */
export async function getReviewQueue(): Promise<ReviewRow[]> {
  return db
    .select({
      id: listings.id,
      publicId: listings.publicId,
      slug: listings.slug,
      title: listings.title,
      operation: listings.operation,
      propertyType: listings.propertyType,
      priceAmount: listings.priceAmount,
      priceCurrency: listings.priceCurrency,
      priceUsd: listings.priceUsd,
      createdAt: listings.createdAt,
      agencyName: agencies.name,
      locationName: locations.name,
    })
    .from(listings)
    .leftJoin(agencies, eq(listings.agencyId, agencies.id))
    .leftJoin(locations, eq(listings.locationId, locations.id))
    .where(eq(listings.status, "pending_review"))
    .orderBy(listings.createdAt);
}

/** How many listings are waiting — the /admin nav badge. */
export async function countReviewQueue(): Promise<number> {
  const rows = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.status, "pending_review"));
  return rows.length;
}

/** Approve a pending listing → published. Scoped to pending_review so it can't
 * resurrect a removed/sold row. Returns rows affected (0 = nothing to do). */
export async function approveListing(id: number): Promise<number> {
  const [res] = await db
    .update(listings)
    .set({ status: "published", publishedAt: new Date(), reviewNotes: null })
    .where(and(eq(listings.id, id), eq(listings.status, "pending_review")));
  return res.affectedRows;
}

/** Reject a pending listing → removed, recording the reason on the row. */
export async function rejectListing(id: number, reason: string): Promise<number> {
  const [res] = await db
    .update(listings)
    .set({ status: "removed", reviewNotes: reason.slice(0, 280) })
    .where(and(eq(listings.id, id), eq(listings.status, "pending_review")));
  return res.affectedRows;
}

/* ------------------------------------------------------------------ */
/* Super-admin: agency / agent management                              */
/* ------------------------------------------------------------------ */

export interface AgencyRow {
  id: number;
  name: string;
  slug: string;
  whatsapp: string | null;
  email: string | null;
  isVerified: boolean;
  plan: (typeof agencies.$inferSelect)["plan"];
}

export async function listAgencies(): Promise<AgencyRow[]> {
  return db
    .select({
      id: agencies.id,
      name: agencies.name,
      slug: agencies.slug,
      whatsapp: agencies.whatsapp,
      email: agencies.email,
      isVerified: agencies.isVerified,
      plan: agencies.plan,
    })
    .from(agencies)
    .orderBy(agencies.name);
}

export interface AgentRow {
  id: number;
  name: string;
  slug: string;
  whatsapp: string | null;
  isVerified: boolean;
  agencyName: string | null;
}

export async function listAgents(): Promise<AgentRow[]> {
  return db
    .select({
      id: agents.id,
      name: agents.name,
      slug: agents.slug,
      whatsapp: agents.whatsapp,
      isVerified: agents.isVerified,
      agencyName: agencies.name,
    })
    .from(agents)
    .leftJoin(agencies, eq(agents.agencyId, agencies.id))
    .orderBy(agents.name);
}

export async function setAgencyVerified(id: number, verified: boolean): Promise<void> {
  await db
    .update(agencies)
    .set({ isVerified: verified })
    .where(eq(agencies.id, id));
}

export async function setAgentVerified(id: number, verified: boolean): Promise<void> {
  await db.update(agents).set({ isVerified: verified }).where(eq(agents.id, id));
}

/* ------------------------------------------------------------------ */
/* Agency dashboard: own listings + leads inbox                        */
/* ------------------------------------------------------------------ */

export interface AgencyListingRow {
  id: number;
  publicId: string;
  slug: string;
  title: string;
  status: ListingStatus;
  operation: (typeof listings.$inferSelect)["operation"];
  propertyType: (typeof listings.$inferSelect)["propertyType"];
  priceAmount: string;
  priceCurrency: "USD" | "PYG";
  updatedAt: Date;
}

/** All of an agency's listings (every status), newest-touched first. Uses
 * idx_agency (agency_id, status) on the agency_id prefix. */
export async function getAgencyListings(agencyId: number): Promise<AgencyListingRow[]> {
  return db
    .select({
      id: listings.id,
      publicId: listings.publicId,
      slug: listings.slug,
      title: listings.title,
      status: listings.status,
      operation: listings.operation,
      propertyType: listings.propertyType,
      priceAmount: listings.priceAmount,
      priceCurrency: listings.priceCurrency,
      updatedAt: listings.updatedAt,
    })
    .from(listings)
    .where(eq(listings.agencyId, agencyId))
    .orderBy(desc(listings.updatedAt));
}

/** Status change scoped to the owning agency — the WHERE clause is the guard.
 * Returns rows affected (0 = not this agency's listing). */
export async function setAgencyListingStatus(params: {
  listingId: number;
  agencyId: number;
  status: ListingStatus;
}): Promise<number> {
  const patch: Partial<typeof listings.$inferInsert> = { status: params.status };
  // First publish stamps publishedAt so category ordering (idx_fresh) is sane.
  if (params.status === "published") patch.publishedAt = new Date();
  const [res] = await db
    .update(listings)
    .set(patch)
    .where(
      and(
        eq(listings.id, params.listingId),
        eq(listings.agencyId, params.agencyId),
      ),
    );
  return res.affectedRows;
}

export interface LeadRow {
  id: number;
  leadType: (typeof leads.$inferSelect)["leadType"];
  name: string | null;
  whatsapp: string;
  email: string | null;
  message: string | null;
  createdAt: Date;
  listingId: number | null;
  listingTitle: string | null;
  listingPublicId: string | null;
  listingSlug: string | null;
}

/**
 * Leads inbox for an agency: leads whose listing belongs to the agency (task
 * brief: "filtered by routedTo + their listing ids"). We resolve the agency's
 * listing ids first, then read leads on idx_listing. routedTo is constrained to
 * the agency/agent lanes so internal/developer leads never leak in.
 */
export async function getAgencyLeads(agencyId: number): Promise<LeadRow[]> {
  const owned = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.agencyId, agencyId));
  const listingIds = owned.map((r) => r.id);
  if (listingIds.length === 0) return [];

  return db
    .select({
      id: leads.id,
      leadType: leads.leadType,
      name: leads.name,
      whatsapp: leads.whatsapp,
      email: leads.email,
      message: leads.message,
      createdAt: leads.createdAt,
      listingId: leads.listingId,
      listingTitle: listings.title,
      listingPublicId: listings.publicId,
      listingSlug: listings.slug,
    })
    .from(leads)
    .leftJoin(listings, eq(leads.listingId, listings.id))
    .where(
      and(
        inArray(leads.listingId, listingIds),
        inArray(leads.routedTo, ["agency", "agent"]),
      ),
    )
    .orderBy(desc(leads.createdAt));
}
