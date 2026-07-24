/**
 * Listing editing, shared by the super-admin panel and the agency dashboard.
 *
 * The only difference between the two is *scope*, expressed as an EditScope and
 * enforced in the WHERE clause of every read and write — never by the caller
 * remembering to filter. An agency scope can only ever reach its own rows, so a
 * forged id in the URL or the form body matches nothing instead of editing
 * someone else's listing.
 *
 * Identity columns (`slug`, `public_id`) are never rewritten: slugs are part of
 * the SEO contract and are not recomputed for an existing row.
 */
import "server-only";
import { and, desc, eq, like, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { agencies, listings, locations } from "@/db/schema";
import { toPriceUsd } from "@/lib/import/normalize";
import { USD_TO_PYG } from "@/lib/publish-queries";
import type { Operation, PropertyType } from "@/lib/import/types";

export type ListingStatusValue = (typeof listings.$inferSelect)["status"];

/** Who is editing, and therefore which rows they may touch. */
export type EditScope =
  | { kind: "admin" }
  | { kind: "agency"; agencyId: number };

/** Statuses each scope may set. Admin owns the full lifecycle. */
export const ADMIN_STATUSES: readonly ListingStatusValue[] = [
  "draft",
  "pending_review",
  "published",
  "paused",
  "sold",
  "rented",
  "removed",
];

export const AGENCY_STATUSES: readonly ListingStatusValue[] = [
  "draft",
  "published",
  "paused",
  "sold",
  "rented",
];

export function statusesFor(scope: EditScope): readonly ListingStatusValue[] {
  return scope.kind === "admin" ? ADMIN_STATUSES : AGENCY_STATUSES;
}

/** Ownership predicate for a scope — the guard every query is built on. */
function scopeWhere(scope: EditScope): SQL | undefined {
  return scope.kind === "admin"
    ? undefined
    : eq(listings.agencyId, scope.agencyId);
}

/* ------------------------------------------------------------------ */
/* Admin: browse every listing, any status                             */
/* ------------------------------------------------------------------ */

export interface AdminListingRow {
  id: number;
  publicId: string;
  slug: string;
  title: string;
  status: ListingStatusValue;
  operation: Operation;
  propertyType: PropertyType;
  priceAmount: string;
  priceCurrency: "USD" | "PYG";
  updatedAt: Date;
  agencyName: string | null;
  locationName: string | null;
}

/**
 * Every listing, newest-touched first, optionally narrowed by status and a
 * title/public-id search. Capped because the panel is a working surface, not a
 * report — the review queue and filters are how you find a specific row.
 */
export async function listAllListings(params: {
  status?: ListingStatusValue | "all";
  q?: string;
  limit?: number;
}): Promise<AdminListingRow[]> {
  const filters: SQL[] = [];

  if (params.status && params.status !== "all") {
    filters.push(eq(listings.status, params.status));
  }

  const q = params.q?.trim();
  if (q) {
    const term = `%${q}%`;
    const match = or(like(listings.title, term), like(listings.publicId, term));
    if (match) filters.push(match);
  }

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
      agencyName: agencies.name,
      locationName: locations.name,
    })
    .from(listings)
    .leftJoin(agencies, eq(listings.agencyId, agencies.id))
    .leftJoin(locations, eq(listings.locationId, locations.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(listings.updatedAt))
    .limit(params.limit ?? 200);
}

/** Status counts for the filter chips — one grouped pass, not one query each. */
export async function countListingsByStatus(): Promise<
  Record<string, number>
> {
  const rows = await db
    .select({ status: listings.status, id: listings.id })
    .from(listings);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = (out[r.status] ?? 0) + 1;
  out.all = rows.length;
  return out;
}

/* ------------------------------------------------------------------ */
/* Shared edit form: hydrate + save                                    */
/* ------------------------------------------------------------------ */

export interface EditableListing {
  id: number;
  publicId: string;
  slug: string;
  status: ListingStatusValue;
  operation: Operation;
  propertyType: PropertyType;
  title: string;
  descriptionEs: string | null;
  priceAmount: number;
  priceCurrency: "USD" | "PYG";
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  areaM2: number | null;
  landM2: number | null;
  locationId: number;
  videoUrl: string | null;
  foreignExposure: boolean;
  isVerified: boolean;
  reviewNotes: string | null;
}

/** Load one listing inside the caller's scope, or null when out of reach. */
export async function getEditableListing(
  id: number,
  scope: EditScope,
): Promise<EditableListing | null> {
  const guard = scopeWhere(scope);
  const [row] = await db
    .select({
      id: listings.id,
      publicId: listings.publicId,
      slug: listings.slug,
      status: listings.status,
      operation: listings.operation,
      propertyType: listings.propertyType,
      title: listings.title,
      descriptionEs: listings.descriptionEs,
      priceAmount: listings.priceAmount,
      priceCurrency: listings.priceCurrency,
      bedrooms: listings.bedrooms,
      bathrooms: listings.bathrooms,
      parking: listings.parking,
      areaM2: listings.areaM2,
      landM2: listings.landM2,
      locationId: listings.locationId,
      videoUrl: listings.videoUrl,
      foreignExposure: listings.foreignExposure,
      isVerified: listings.isVerified,
      reviewNotes: listings.reviewNotes,
    })
    .from(listings)
    .where(guard ? and(eq(listings.id, id), guard) : eq(listings.id, id))
    .limit(1);

  if (!row) return null;
  return {
    ...row,
    priceAmount: Number(row.priceAmount),
    areaM2: row.areaM2 != null ? Number(row.areaM2) : null,
    landM2: row.landM2 != null ? Number(row.landM2) : null,
  };
}

export interface ListingEditInput {
  title: string;
  descriptionEs: string | null;
  operation: Operation;
  propertyType: PropertyType;
  priceAmount: number;
  priceCurrency: "USD" | "PYG";
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  areaM2: number | null;
  landM2: number | null;
  locationId: number;
  videoUrl: string | null;
  foreignExposure: boolean;
  status: ListingStatusValue;
}

/**
 * Save an edit inside the caller's scope. `price_usd` is re-normalised here
 * because ALL filtering reads that column — leaving it stale would silently
 * drop the listing out of price facets. `cuota_gs` is left to the nightly cron.
 *
 * Returns rows affected: 0 means the id was outside the scope (or the status
 * was one this scope may not set), which the caller surfaces as "not found"
 * rather than leaking whether the row exists.
 */
export async function updateListing(params: {
  id: number;
  scope: EditScope;
  input: ListingEditInput;
}): Promise<number> {
  const { id, scope, input } = params;

  if (!statusesFor(scope).includes(input.status)) return 0;

  const patch: Partial<typeof listings.$inferInsert> = {
    title: input.title.slice(0, 180),
    descriptionEs: input.descriptionEs,
    operation: input.operation,
    propertyType: input.propertyType,
    priceAmount: input.priceAmount.toFixed(2),
    priceCurrency: input.priceCurrency,
    priceUsd: toPriceUsd(
      input.priceAmount,
      input.priceCurrency,
      USD_TO_PYG,
    ).toFixed(2),
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    parking: input.parking,
    areaM2: input.areaM2 != null ? input.areaM2.toString() : null,
    landM2: input.landM2 != null ? input.landM2.toString() : null,
    locationId: input.locationId,
    videoUrl: input.videoUrl,
    foreignExposure: input.foreignExposure,
    status: input.status,
  };

  // First publish stamps publishedAt so category ordering (idx_fresh) is sane.
  if (input.status === "published") patch.publishedAt = new Date();

  const guard = scopeWhere(scope);
  const [res] = await db
    .update(listings)
    .set(patch)
    .where(guard ? and(eq(listings.id, id), guard) : eq(listings.id, id));
  return res.affectedRows;
}

/** Delete a listing. Super-admin only — the agency scope uses status='removed'. */
export async function deleteListing(id: number): Promise<number> {
  const [res] = await db.delete(listings).where(eq(listings.id, id));
  return res.affectedRows;
}
