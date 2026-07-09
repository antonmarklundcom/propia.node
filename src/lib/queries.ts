/**
 * Read queries for the public site (ARCHITECTURE.md §4). All filtering runs
 * on indexed scalar columns (idx_search, idx_location) and normalized
 * price_usd — no MySQL-only cleverness, so the Postgres escape hatch stays
 * open. JSON columns are display-only and never filtered here.
 */
import { and, asc, desc, eq, gte, inArray, lte, ne } from "drizzle-orm";
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

/** All ciudad-level locations, alphabetical — populates the search bar's city select. */
export async function listCities(): Promise<Pick<LocationRow, "id" | "name" | "slug">[]> {
  return db
    .select({ id: locations.id, name: locations.name, slug: locations.slug })
    .from(locations)
    .where(eq(locations.level, "ciudad"))
    .orderBy(asc(locations.name));
}

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

export type SortOption = "recientes" | "precio_asc" | "precio_desc";

/**
 * User-chosen narrowing on a category page (price/bedrooms/sort). These are
 * NEVER folded into countCategory()/getIndexability() — that SEO signal is
 * about the canonical (operation × location × type) page, not a visitor's
 * transient filter choice (ARCHITECTURE.md §4.3).
 */
export interface CategoryFilters {
  priceMin?: number;
  priceMax?: number;
  minBedrooms?: number;
  sort?: SortOption;
}

/** categoryConds() narrowed by optional price/bedroom filters. Price filters run on price_usd (the one normalized, indexed column — see schema). */
function filterConds(q: CategoryQuery, f: CategoryFilters) {
  const conds = [categoryConds(q)];
  if (f.priceMin != null) conds.push(gte(listings.priceUsd, String(f.priceMin)));
  if (f.priceMax != null) conds.push(lte(listings.priceUsd, String(f.priceMax)));
  if (f.minBedrooms != null) conds.push(gte(listings.bedrooms, f.minBedrooms));
  return and(...conds);
}

function sortOrder(sort: SortOption | undefined) {
  if (sort === "precio_asc") return asc(listings.priceUsd);
  if (sort === "precio_desc") return desc(listings.priceUsd);
  return desc(listings.publishedAt);
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

/**
 * Listings for a category page's grid, narrowed by user-chosen filters.
 * filteredCount is ONLY for the page's own "no matches for these filters"
 * empty state — it must never be passed to getIndexability().
 */
export async function getFilteredCategoryListings(
  q: CategoryQuery,
  filters: CategoryFilters = {},
): Promise<{ listings: ListingCard[]; filteredCount: number }> {
  const where = filterConds(q, filters);
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
    .where(where)
    .orderBy(sortOrder(filters.sort))
    .limit(q.limit ?? 48)
    .offset(q.offset ?? 0);

  const filteredCountRows = await db.select({ id: listings.id }).from(listings).where(where);
  const cards = await attachCovers(rows);
  return { listings: cards, filteredCount: filteredCountRows.length };
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

/** Total published listings — the homepage "propiedades activas" stat. */
export async function countPublished(): Promise<number> {
  const rows = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.status, "published"));
  return rows.length;
}

/**
 * Recent published listings, optionally narrowed by operation/type — powers
 * the homepage category rows ("Departamentos en venta", "Alquileres", …).
 */
export async function getRecentListingsBy(
  by: { operation?: Operation; type?: PropertyType },
  limit = 8,
): Promise<ListingCard[]> {
  const conds = [eq(listings.status, "published")];
  if (by.operation) conds.push(eq(listings.operation, by.operation));
  if (by.type) conds.push(eq(listings.propertyType, by.type));
  const rows = await db
    .select(cardColumns())
    .from(listings)
    .where(and(...conds))
    .orderBy(desc(listings.publishedAt))
    .limit(limit);
  return attachCovers(rows);
}

/** Other published listings from the same agency — "Más de esta inmobiliaria". */
export async function getAgencyListings(params: {
  agencyId: number;
  excludeId: number;
  limit?: number;
}): Promise<ListingCard[]> {
  const rows = await db
    .select(cardColumns())
    .from(listings)
    .where(
      and(
        eq(listings.status, "published"),
        eq(listings.agencyId, params.agencyId),
        ne(listings.id, params.excludeId),
      ),
    )
    .orderBy(desc(listings.publishedAt))
    .limit(params.limit ?? 4);
  return attachCovers(rows);
}

/** The card-shaped column set — shared by every query that feeds <ListingCard>. */
function cardColumns() {
  return {
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
  };
}

/** Most recent published listings for the homepage grid. */
export async function getRecentListings(limit = 12): Promise<ListingCard[]> {
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
    .where(eq(listings.status, "published"))
    .orderBy(desc(listings.publishedAt))
    .limit(limit);
  return attachCovers(rows);
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

/** Same operación + tipo, same city subtree, excluding the listing itself. */
export async function getSimilarListings(params: {
  excludeId: number;
  operation: Operation;
  type: PropertyType;
  locationIds: number[];
  limit?: number;
}): Promise<ListingCard[]> {
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
    .where(
      and(
        eq(listings.status, "published"),
        eq(listings.operation, params.operation),
        eq(listings.propertyType, params.type),
        inArray(listings.locationId, params.locationIds),
        ne(listings.id, params.excludeId),
      ),
    )
    .orderBy(desc(listings.publishedAt))
    .limit(params.limit ?? 4);
  return attachCovers(rows);
}

export { citySubtreeIds };
