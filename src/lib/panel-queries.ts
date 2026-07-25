/**
 * Panel data access (admin review queue + agency dashboard). Same rules as
 * src/lib/queries.ts: typed selects, filtering only on indexed scalar columns,
 * no MySQL-only cleverness. Writes are scoped in the WHERE clause so an agency
 * can never mutate a row it doesn't own — the agencyId comes from the session
 * (guards.ts), never from the request.
 */
import { and, desc, eq, inArray, like, ne, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  agencies,
  agents,
  leads,
  listings,
  locations,
  sessions,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/slug";
import { listingScopeWhere, type EditScope } from "@/lib/listing-edit";

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
/* Super-admin: user management                                        */
/* ------------------------------------------------------------------ */

export type UserRoleValue = (typeof users.$inferSelect)["role"];

export interface PanelUserRow {
  id: number;
  name: string | null;
  email: string | null;
  role: UserRoleValue;
  locale: "es" | "en";
  whatsapp: string | null;
  hasPassword: boolean;
  createdAt: Date;
  /** Agency the user belongs to via agents.user_id — NULL when unlinked. */
  agencyId: number | null;
  agencyName: string | null;
}

/** Every panel user, newest first, with the agency their agents row points at. */
export async function listUsers(): Promise<PanelUserRow[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      locale: users.locale,
      whatsapp: users.whatsapp,
      passwordHash: users.passwordHash,
      createdAt: users.createdAt,
      agencyId: agents.agencyId,
      agencyName: agencies.name,
    })
    .from(users)
    .leftJoin(agents, eq(agents.userId, users.id))
    .leftJoin(agencies, eq(agents.agencyId, agencies.id))
    .orderBy(desc(users.createdAt));

  return rows.map(({ passwordHash, ...r }) => ({
    ...r,
    hasPassword: Boolean(passwordHash),
  }));
}

/** How many super-admins exist — used to refuse removing the last one. */
export async function countSuperAdmins(): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));
  return rows.length;
}

export interface UpsertUserInput {
  name: string | null;
  email: string;
  role: UserRoleValue;
  locale: "es" | "en";
  /** Omitted/empty on edit = keep the existing password. */
  password?: string;
}

/** True when another user already owns this email (unique column). */
async function emailTaken(email: string, exceptId?: number): Promise<boolean> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      exceptId
        ? and(eq(users.email, email), ne(users.id, exceptId))
        : eq(users.email, email),
    )
    .limit(1);
  return rows.length > 0;
}

/** Create a panel user. Returns the new id, or null when the email is taken. */
export async function createPanelUser(
  input: UpsertUserInput & { password: string },
): Promise<number | null> {
  const email = input.email.trim().toLowerCase();
  if (await emailTaken(email)) return null;

  await db.insert(users).values({
    name: input.name,
    email,
    role: input.role,
    locale: input.locale,
    passwordHash: await hashPassword(input.password),
  });

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row?.id ?? null;
}

/**
 * Update a user's profile fields, and optionally their password. Returns false
 * when the email collides with another account (the caller surfaces the error).
 */
export async function updatePanelUser(
  id: number,
  input: UpsertUserInput,
): Promise<boolean> {
  const email = input.email.trim().toLowerCase();
  if (await emailTaken(email, id)) return false;

  const patch: Partial<typeof users.$inferInsert> = {
    name: input.name,
    email,
    role: input.role,
    locale: input.locale,
  };
  if (input.password) patch.passwordHash = await hashPassword(input.password);

  await db.update(users).set(patch).where(eq(users.id, id));
  return true;
}

/**
 * Delete a user and every session they hold, so an open cookie cannot outlive
 * the account. Their `agents` row is kept but unlinked — the public profile and
 * its listings survive the login being removed.
 */
export async function deletePanelUser(id: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, id));
  await db.update(agents).set({ userId: null }).where(eq(agents.userId, id));
  await db.delete(users).where(eq(users.id, id));
}

/** Drop every session for a user — used after a password reset. */
export async function revokeUserSessions(id: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, id));
}

/**
 * Point a user's `agents` row at an agency (or NULL for independent), creating
 * the row on first link. This is the join `requireAgencyContext()` reads, and
 * it previously had to be made by hand in Drizzle Studio.
 */
export async function linkUserToAgency(params: {
  userId: number;
  agencyId: number | null;
  fallbackName: string;
}): Promise<void> {
  const [existing] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.userId, params.userId))
    .limit(1);

  if (existing) {
    await db
      .update(agents)
      .set({ agencyId: params.agencyId })
      .where(eq(agents.id, existing.id));
    return;
  }

  // Slugs are unique and never recomputed later — disambiguate with the user id.
  const base = slugify(params.fallbackName) || "agente";
  await db.insert(agents).values({
    agencyId: params.agencyId,
    userId: params.userId,
    name: params.fallbackName,
    slug: `${base}-${params.userId}`,
  });
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
/**
 * The dashboard's own listings. Takes a scope rather than an agencyId because
 * an independent agent has no agencies row — see listingScopeWhere().
 */
export async function getPanelListings(
  scope: EditScope,
): Promise<AgencyListingRow[]> {
  const guard = listingScopeWhere(scope);
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
    .where(guard)
    .orderBy(desc(listings.updatedAt));
}

/** Status change scoped to the caller — the WHERE clause is the guard.
 * Returns rows affected (0 = not a listing this scope may touch). */
export async function setPanelListingStatus(params: {
  listingId: number;
  scope: EditScope;
  status: ListingStatus;
}): Promise<number> {
  const patch: Partial<typeof listings.$inferInsert> = { status: params.status };
  // First publish stamps publishedAt so category ordering (idx_fresh) is sane.
  if (params.status === "published") patch.publishedAt = new Date();
  const guard = listingScopeWhere(params.scope);
  const [res] = await db
    .update(listings)
    .set(patch)
    .where(
      guard
        ? and(eq(listings.id, params.listingId), guard)
        : eq(listings.id, params.listingId),
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
export interface AdminLeadRow extends LeadRow {
  vertical: string;
  routedTo: (typeof leads.$inferSelect)["routedTo"];
  agencyName: string | null;
}

/**
 * Every lead the site captured, newest first — the super-admin view.
 *
 * Unscoped by design: this is the founder's own inbox, and it is the only
 * place a lead with `routed_to = 'internal'` (valuation and seller leads,
 * which belong to no agency) is visible at all. Optional filters narrow by
 * type and search name / WhatsApp / email.
 */
export async function listAllLeads(params: {
  type?: LeadRow["leadType"] | "all";
  q?: string;
  limit?: number;
}): Promise<AdminLeadRow[]> {
  const filters: SQL[] = [];
  if (params.type && params.type !== "all") {
    filters.push(eq(leads.leadType, params.type));
  }
  const q = params.q?.trim();
  if (q) {
    const term = `%${q}%`;
    const match = or(
      like(leads.name, term),
      like(leads.whatsapp, term),
      like(leads.email, term),
    );
    if (match) filters.push(match);
  }

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
      vertical: leads.vertical,
      routedTo: leads.routedTo,
      agencyName: agencies.name,
    })
    .from(leads)
    .leftJoin(listings, eq(leads.listingId, listings.id))
    .leftJoin(agencies, eq(listings.agencyId, agencies.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(leads.createdAt))
    .limit(params.limit ?? 300);
}

/** Lead counts per type for the admin filter chips — one pass, not one query each. */
export async function countLeadsByType(): Promise<Record<string, number>> {
  const rows = await db.select({ leadType: leads.leadType }).from(leads);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.leadType] = (out[r.leadType] ?? 0) + 1;
  out.all = rows.length;
  return out;
}

export async function getPanelLeads(scope: EditScope): Promise<LeadRow[]> {
  const owned = await db
    .select({ id: listings.id })
    .from(listings)
    .where(listingScopeWhere(scope));
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
