/**
 * Read queries for the public site (ARCHITECTURE.md §4). All filtering runs
 * on indexed scalar columns (idx_search, idx_location) and normalized
 * price_usd — no MySQL-only cleverness, so the Postgres escape hatch stays
 * open. JSON columns are display-only and never filtered here.
 */
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  agencies,
  agents,
  listingImages,
  listings,
  locations,
} from "../db/schema";
import type { Operation, PropertyType } from "./import/types";

export type LocationRow = typeof locations.$inferSelect;

/** A ciudad by slug (slugs are unique per level in our seed). */
export async function resolveCity(citySlug: string): Promise<LocationRow | null> {
  const [row] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.slug, citySlug), eq(locations.level, "ciudad")))
    .limit(1);
  return row ?? null;
}

/** A barrio by slug, scoped to its parent ciudad. */
export async function resolveBarrio(
  cityId: number,
  barrioSlug: string,
): Promise<LocationRow | null> {
  const [row] = await db
    .select()
    .from(locations)
    .where(
      and(
        eq(locations.slug, barrioSlug),
        eq(locations.level, "barrio"),
        eq(locations.parentId, cityId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** City + its barrio children — the location set a city page covers. */
async function citySubtreeIds(cityId: number): Promise<number[]> {
  const children = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.parentId, cityId));
  return [cityId, ...children.map((c) => c.id)];
}

/** Walk parentId up to the root — for breadcrumbs. Locations table is small. */
export async function locationChain(locationId: number): Promise<LocationRow[]> {
  const chain: LocationRow[] = [];
  let currentId: number | null = locationId;
  for (let guard = 0; guard < 6 && currentId != null; guard++) {
    const [row]: LocationRow[] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, currentId))
      .limit(1);
    if (!row) break;
    chain.unshift(row);
    currentId = row.parentId;
  }
  return chain;
}

export interface CategoryQuery {
  operation: Operation;
  locationIds: number[];
  type?: PropertyType;
  limit?: number;
  offset?: number;
}

/** Conditions shared by the list query and the count query. */
function categoryConds(q: CategoryQuery) {
  const conds = [
    eq(listings.status, "published"),
    eq(listings.operation, q.operation),
    inArray(listings.locationId, q.locationIds),
  ];
  if (q.type) conds.push(eq(listings.propertyType, q.type));
  return and(...conds);
}

export type ListingCard = Pick<
  typeof listings.$inferSelect,
  | "id"
  | "publicId"
  | "slug"
  | "title"
  | "operation"
  | "propertyType"
  | "priceUsd"
  | "priceAmount"
  | "priceCurrency"
  | "cuotaGs"
  | "bedrooms"
  | "bathrooms"
  | "areaM2"
  | "landM2"
  | "locationId"
> & { coverKey: string | null };

/** Listings for a category page (newest first), plus the total match count. */
export async function getCategoryListings(
  q: CategoryQuery,
): Promise<{ listings: ListingCard[]; count: number }> {
  const rows = await db
    .select({
      id: listings.id,
      publicId: listings.publicId,
      slug: listings.slug,
      title: listings.title,
      operation: listings.operation,
      propertyType: listings.propertyType,
      priceUsd: listings.priceUsd,
      priceAmount: listings.priceAmount,
      priceCurrency: listings.priceCurrency,
      cuotaGs: listings.cuotaGs,
      bedrooms: listings.bedrooms,
      bathrooms: listings.bathrooms,
      areaM2: listings.areaM2,
      landM2: listings.landM2,
      locationId: listings.locationId,
    })
    .from(listings)
    .where(categoryConds(q))
    .orderBy(desc(listings.publishedAt))
    .limit(q.limit ?? 48)
    .offset(q.offset ?? 0);

  const count = await countCategory(q);
  const cards = await attachCovers(rows);
  return { listings: cards, count };
}

/** COUNT for indexability — the single number getIndexability() consumes. */
export async function countCategory(q: CategoryQuery): Promise<number> {
  const rows = await db
    .select({ id: listings.id })
    .from(listings)
    .where(categoryConds(q));
  return rows.length;
}

/** Attach cover image (position 0) to a set of listing cards in one query. */
async function attachCovers(
  rows: Omit<ListingCard, "coverKey">[],
): Promise<ListingCard[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const imgs = await db
    .select({
      listingId: listingImages.listingId,
      r2Key: listingImages.r2Key,
      position: listingImages.position,
    })
    .from(listingImages)
    .where(inArray(listingImages.listingId, ids))
    .orderBy(asc(listingImages.position));
  const coverByListing = new Map<number, string>();
  for (const img of imgs) {
    if (!coverByListing.has(img.listingId))
      coverByListing.set(img.listingId, img.r2Key);
  }
  return rows.map((r) => ({ ...r, coverKey: coverByListing.get(r.id) ?? null }));
}

export interface ListingDetail {
  listing: typeof listings.$inferSelect;
  images: (typeof listingImages.$inferSelect)[];
  chain: LocationRow[];
  agency: typeof agencies.$inferSelect | null;
  agent: typeof agents.$inferSelect | null;
}

/** Full listing for the detail page, by public_id. Null if not published. */
export async function getListingByPublicId(
  publicId: string,
): Promise<ListingDetail | null> {
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.publicId, publicId))
    .limit(1);
  if (!listing || listing.status !== "published") return null;

  const images = await db
    .select()
    .from(listingImages)
    .where(eq(listingImages.listingId, listing.id))
    .orderBy(asc(listingImages.position));

  const chain = await locationChain(listing.locationId);

  let agency: typeof agencies.$inferSelect | null = null;
  if (listing.agencyId) {
    const [a] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, listing.agencyId))
      .limit(1);
    agency = a ?? null;
  }
  let agent: typeof agents.$inferSelect | null = null;
  if (listing.agentId) {
    const [a] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, listing.agentId))
      .limit(1);
    agent = a ?? null;
  }

  return { listing, images, chain, agency, agent };
}

export { citySubtreeIds };
