/**
 * Read queries for the public site (ARCHITECTURE.md §4). All filtering runs
 * on indexed scalar columns (idx_search, idx_location) and normalized
 * price_usd — no MySQL-only cleverness, so the Postgres escape hatch stays
 * open. JSON columns are display-only and never filtered here.
 */
import { cache } from "react";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  ne,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../db";
import {
  agencies,
  agents,
  developers,
  financingPrograms,
  listingImages,
  listings,
  locations,
  projects,
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

/**
 * City + its barrio children — the location set a city page covers. Served from
 * the same one-read map as locationChain(), so a category page no longer pays a
 * query per subtree lookup.
 */
export async function citySubtreeIds(cityId: number): Promise<number[]> {
  const byId = await locationsById();
  const children: number[] = [];
  for (const row of byId.values()) {
    if (row.parentId === cityId) children.push(row.id);
  }
  return [cityId, ...children];
}

/**
 * The whole `locations` table, keyed by id, loaded once per request.
 *
 * It is a small, slow-changing table (país → departamento → ciudad → barrio;
 * tens of rows, not thousands), and walking a parent chain used to cost one
 * round-trip per level. One read serves every chain on the page instead —
 * cache() dedupes it across generateMetadata and the page body.
 */
const locationsById = cache(async (): Promise<Map<number, LocationRow>> => {
  const rows: LocationRow[] = await db.select().from(locations);
  return new Map(rows.map((row) => [row.id, row]));
});

export async function locationChain(locationId: number): Promise<LocationRow[]> {
  const byId = await locationsById();
  const chain: LocationRow[] = [];
  let currentId: number | null = locationId;
  // The depth guard also stops a cycle from hanging the request, which a
  // hand-edited parent_id could otherwise cause.
  for (let guard = 0; guard < 6 && currentId != null; guard++) {
    const row = byId.get(currentId);
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
  | "isVerified"
  | "featuredUntil"
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

  // The grid page and its "no matches" counter do not depend on each other,
  // so they go out together rather than one after the other.
  const [rows, filteredCount] = await Promise.all([
    db
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
        isVerified: listings.isVerified,
        featuredUntil: listings.featuredUntil,
      })
      .from(listings)
      .where(where)
      .orderBy(sortOrder(filters.sort))
      .limit(q.limit ?? 48)
      .offset(q.offset ?? 0),
    countRows(where),
  ]);

  const cards = await attachCovers(rows);
  return { listings: cards, filteredCount };
}

/**
 * One COUNT(*) on `listings`. Every counter in this file goes through here:
 * the previous shape selected every matching id and took `rows.length`, which
 * means MySQL streamed the whole result set to Node so we could throw it away —
 * fine at 200 listings, a real cost at 20 000, and it never used the index-only
 * path a COUNT can.
 */
async function countRows(where: SQL | undefined): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(listings)
    .where(where);
  return Number(row?.n ?? 0);
}

/** COUNT for indexability — the single number getIndexability() consumes. */
export async function countCategory(q: CategoryQuery): Promise<number> {
  return countRows(categoryConds(q));
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
  return countRows(eq(listings.status, "published"));
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
    isVerified: listings.isVerified,
    featuredUntil: listings.featuredUntil,
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
      isVerified: listings.isVerified,
      featuredUntil: listings.featuredUntil,
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

  // Images, location chain, agency and agent depend only on the listing row,
  // never on each other — awaiting them in sequence made one detail page up
  // to four serial round-trips where one suffices.
  const [images, chain, agency, agent] = await Promise.all([
    db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, listing.id))
      .orderBy(asc(listingImages.position)),
    locationChain(listing.locationId),
    listing.agencyId
      ? db
          .select()
          .from(agencies)
          .where(eq(agencies.id, listing.agencyId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    listing.agentId
      ? db
          .select()
          .from(agents)
          .where(eq(agents.id, listing.agentId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
  ]);

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
      isVerified: listings.isVerified,
      featuredUntil: listings.featuredUntil,
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

/* ------------------------------------------------------------------ */
/* Projects (preventas / edificios) — homepage carousel + /proyecto    */
/* ------------------------------------------------------------------ */

export interface ProjectCard {
  id: number;
  name: string;
  slug: string;
  projectType: string;
  stage: string | null;
  deliveryDate: string | Date | null;
  heroImageUrl: string | null;
  developerName: string | null;
  cityName: string | null;
  minPriceUsd: number | null;
  availableUnits: number;
}

/** Aggregate unit facts (min price / count) for a set of project ids. */
async function projectUnitStats(projectIds: number[]) {
  if (projectIds.length === 0)
    return new Map<number, { minPriceUsd: number; units: number }>();
  const rows = await db
    .select({
      projectId: listings.projectId,
      minPriceUsd: sql<string>`MIN(${listings.priceUsd})`,
      units: sql<number>`COUNT(*)`,
    })
    .from(listings)
    .where(
      and(
        eq(listings.status, "published"),
        inArray(listings.projectId, projectIds),
      ),
    )
    .groupBy(listings.projectId);
  return new Map(
    rows
      .filter((r) => r.projectId != null)
      .map((r) => [
        r.projectId as number,
        { minPriceUsd: Number(r.minPriceUsd), units: Number(r.units) },
      ]),
  );
}

/** Newest projects with developer + city + unit stats — homepage carousel. */
export async function getFeaturedProjects(limit = 6): Promise<ProjectCard[]> {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      projectType: projects.projectType,
      stage: projects.stage,
      deliveryDate: projects.deliveryDate,
      heroImageUrl: projects.heroImageUrl,
      developerName: developers.name,
      cityName: locations.name,
    })
    .from(projects)
    .leftJoin(developers, eq(projects.developerId, developers.id))
    .leftJoin(locations, eq(projects.locationId, locations.id))
    .orderBy(desc(projects.id))
    .limit(limit);
  const stats = await projectUnitStats(rows.map((r) => r.id));
  return rows.map((r) => ({
    ...r,
    minPriceUsd: stats.get(r.id)?.minPriceUsd ?? null,
    availableUnits: stats.get(r.id)?.units ?? 0,
  }));
}

export interface DeveloperCard {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  projectCount: number;
}

/** Developers with at least one project — "Desarrolladoras destacadas". */
export async function getFeaturedDevelopers(limit = 8): Promise<DeveloperCard[]> {
  const rows = await db
    .select({
      id: developers.id,
      name: developers.name,
      slug: developers.slug,
      logoUrl: developers.logoUrl,
      projectCount: sql<number>`COUNT(${projects.id})`,
    })
    .from(developers)
    .innerJoin(projects, eq(projects.developerId, developers.id))
    .groupBy(developers.id, developers.name, developers.slug, developers.logoUrl)
    .orderBy(desc(sql`COUNT(${projects.id})`))
    .limit(limit);
  return rows.map((r) => ({ ...r, projectCount: Number(r.projectCount) }));
}

export interface ProjectUnit {
  id: number;
  publicId: string;
  slug: string;
  title: string;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: string | null;
  priceUsd: string;
  priceAmount: string;
  priceCurrency: "USD" | "PYG";
  propertyState: string | null;
}

/** Full project detail: project + developer + location chain + its units. */
export async function getProjectBySlug(slug: string) {
  const [row] = await db
    .select({
      project: projects,
      developer: developers,
      location: locations,
    })
    .from(projects)
    .leftJoin(developers, eq(projects.developerId, developers.id))
    .leftJoin(locations, eq(projects.locationId, locations.id))
    .where(eq(projects.slug, slug))
    .limit(1);
  if (!row) return null;

  const units: ProjectUnit[] = await db
    .select({
      id: listings.id,
      publicId: listings.publicId,
      slug: listings.slug,
      title: listings.title,
      bedrooms: listings.bedrooms,
      bathrooms: listings.bathrooms,
      areaM2: listings.areaM2,
      priceUsd: listings.priceUsd,
      priceAmount: listings.priceAmount,
      priceCurrency: listings.priceCurrency,
      propertyState: listings.propertyState,
    })
    .from(listings)
    .where(
      and(eq(listings.status, "published"), eq(listings.projectId, row.project.id)),
    )
    .orderBy(asc(listings.priceUsd));

  // Other projects by the same developer (for the "Otros proyectos" row).
  const siblings = row.project.developerId
    ? await db
        .select({
          id: projects.id,
          name: projects.name,
          slug: projects.slug,
          projectType: projects.projectType,
          stage: projects.stage,
          deliveryDate: projects.deliveryDate,
          heroImageUrl: projects.heroImageUrl,
          developerName: developers.name,
          cityName: locations.name,
        })
        .from(projects)
        .leftJoin(developers, eq(projects.developerId, developers.id))
        .leftJoin(locations, eq(projects.locationId, locations.id))
        .where(
          and(
            eq(projects.developerId, row.project.developerId),
            ne(projects.id, row.project.id),
          ),
        )
        .limit(6)
    : [];
  const sibStats = await projectUnitStats(siblings.map((s) => s.id));
  const otherProjects: ProjectCard[] = siblings.map((s) => ({
    ...s,
    minPriceUsd: sibStats.get(s.id)?.minPriceUsd ?? null,
    availableUnits: sibStats.get(s.id)?.units ?? 0,
  }));

  return { ...row, units, otherProjects };
}

/** Best active financing program (lowest rate) — listing cuota module. */
export async function getBestFinancingProgram() {
  const [row] = await db
    .select()
    .from(financingPrograms)
    .where(eq(financingPrograms.active, true))
    .orderBy(asc(financingPrograms.annualRate))
    .limit(1);
  return row ?? null;
}
