/**
 * Read queries for the public site (ARCHITECTURE.md §4). All filtering runs
 * on indexed scalar columns (idx_search, idx_location) and normalized
 * price_usd — no MySQL-only cleverness, so the Postgres escape hatch stays
 * open. JSON columns are display-only and never filtered here.
 */
import { and, asc, between, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
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
import { snapToGrid } from "./geo";

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
export function categoryConds(q: CategoryQuery) {
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
export function filterConds(q: CategoryQuery, f: CategoryFilters) {
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

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(listings)
    .where(where);
  const cards = await attachCovers(rows);
  return { listings: cards, filteredCount: Number(count) };
}

/** COUNT for indexability — the single number getIndexability() consumes. */
export async function countCategory(q: CategoryQuery): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(listings)
    .where(categoryConds(q));
  return Number(count);
}

export interface MapBBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface MapPoint {
  id: number;
  publicId: string;
  slug: string;
  title: string;
  operation: Operation;
  propertyType: PropertyType;
  priceUsd: string;
  priceAmount: string;
  priceCurrency: "USD" | "PYG";
  bedrooms: number | null;
  coverKey: string | null;
  lat: number;
  lng: number;
}

const MAP_RESULT_CAP = 500;

/**
 * Published listings inside a viewport bbox, for the map view. Leads with
 * idx_geo (status, lat, lng) — the same CategoryQuery narrowing (operation,
 * type, locationIds) applies on top so the map shows exactly what the list
 * view shows. Coordinates are snapped to a coarse grid (src/lib/geo.ts)
 * before leaving the server; the DB's precise lat/lng never reaches the
 * client.
 */
/** Conditions for the map bbox query — leads with idx_geo (status, lat, lng). */
export function bboxConds(
  bbox: MapBBox,
  q: Omit<CategoryQuery, "limit" | "offset">,
  filters: Pick<CategoryFilters, "priceMin" | "priceMax" | "minBedrooms"> = {},
) {
  const conds = [
    eq(listings.status, "published"),
    between(listings.lat, String(bbox.minLat), String(bbox.maxLat)),
    between(listings.lng, String(bbox.minLng), String(bbox.maxLng)),
    eq(listings.operation, q.operation),
    inArray(listings.locationId, q.locationIds),
  ];
  if (q.type) conds.push(eq(listings.propertyType, q.type));
  if (filters.priceMin != null) conds.push(gte(listings.priceUsd, String(filters.priceMin)));
  if (filters.priceMax != null) conds.push(lte(listings.priceUsd, String(filters.priceMax)));
  if (filters.minBedrooms != null) conds.push(gte(listings.bedrooms, filters.minBedrooms));
  return and(...conds);
}

export async function mapListingsInBBox(
  bbox: MapBBox,
  q: Omit<CategoryQuery, "limit" | "offset">,
  filters: Pick<CategoryFilters, "priceMin" | "priceMax" | "minBedrooms"> = {},
): Promise<MapPoint[]> {
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
      bedrooms: listings.bedrooms,
      lat: listings.lat,
      lng: listings.lng,
    })
    .from(listings)
    .where(bboxConds(bbox, q, filters))
    .limit(MAP_RESULT_CAP);

  const coverByListing = await coverKeysFor(rows.map((r) => r.id));

  return rows
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => {
      const snapped = snapToGrid(Number(r.lat), Number(r.lng));
      return {
        id: r.id,
        publicId: r.publicId,
        slug: r.slug,
        title: r.title,
        operation: r.operation,
        propertyType: r.propertyType,
        priceUsd: r.priceUsd,
        priceAmount: r.priceAmount,
        priceCurrency: r.priceCurrency,
        bedrooms: r.bedrooms,
        coverKey: coverByListing.get(r.id) ?? null,
        lat: snapped.lat,
        lng: snapped.lng,
      };
    });
}

/** Cover image r2Key (position 0) per listing id, for a batch of ids in one query. */
async function coverKeysFor(ids: number[]): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();
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
  return coverByListing;
}

/** Attach cover image (position 0) to a set of listing cards in one query. */
async function attachCovers(
  rows: Omit<ListingCard, "coverKey">[],
): Promise<ListingCard[]> {
  if (rows.length === 0) return [];
  const coverByListing = await coverKeysFor(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, coverKey: coverByListing.get(r.id) ?? null }));
}

/** Total published listings — the homepage "propiedades activas" stat. */
export async function countPublished(): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(listings)
    .where(eq(listings.status, "published"));
  return Number(count);
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

export { citySubtreeIds };
