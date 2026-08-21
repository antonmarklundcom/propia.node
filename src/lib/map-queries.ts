/**
 * Map queries (ARCHITECTURE.md §1: "plain lat/lng bounding boxes (idx_geo), no
 * spatial extensions" — the Postgres escape hatch stays open).
 *
 * **Coordinate privacy is the load-bearing rule here.** `addressText` and the
 * listing's own lat/lng are "never shown publicly at full precision"
 * (schema.ts §2.1): a pin on the exact building tells a stranger which house is
 * empty and for sale. So every coordinate that leaves this module is rounded to
 * COORD_DECIMALS, and a listing with no coordinates of its own borrows its
 * barrio/city centroid rather than being invented into a position or dropped.
 *
 * Rounding happens here, in the query layer, not in the route handler — a
 * future caller cannot forget it.
 */
import "server-only";
import { and, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings, locations } from "@/db/schema";
import { facetConds, verticalConds } from "@/lib/facet-sql";
import type { ListingFacets } from "@/lib/facets";
import type { VerticalConfig } from "@/config/verticals";

/**
 * 3 decimals ≈ 110 m at this latitude. Enough for "this block", not enough to
 * pick a house out of it. Bump with care: every extra decimal is ~10x more
 * precise about someone's home.
 */
const COORD_DECIMALS = 3;

/** Pins per response. A denser view is what clustering is for. */
const MAX_PINS = 400;

/** Refuse absurd boxes — a whole-planet bbox is a scrape, not a map pan. */
const MAX_SPAN_DEG = 12;

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * The map narrows by exactly the same vocabulary as the grid — it *is*
 * `ListingFacets` (src/lib/facets.ts), not a parallel type. That is the whole
 * point of the shared layer: a facet the grid understands and the map does not
 * is how the two start showing different sets of the same city.
 *
 * `sort` is the one field the map ignores: pins have no order a visitor sees,
 * and the response is capped by price for determinism (below).
 */
export type MapFilters = Omit<ListingFacets, "sort">;

export interface MapPin {
  publicId: string;
  slug: string;
  title: string;
  /** Rounded — see COORD_DECIMALS. Never the stored value. */
  lat: number;
  lng: number;
  priceUsd: number;
  priceAmount: number;
  priceCurrency: "USD" | "PYG";
  cuotaGs: number | null;
  bedrooms: number | null;
  areaM2: number | null;
  /** True when the position is the barrio/city centroid, not the listing's own. */
  approximate: boolean;
}

export function boundsAreSane(b: MapBounds): boolean {
  const finite = [b.minLat, b.maxLat, b.minLng, b.maxLng].every(Number.isFinite);
  if (!finite) return false;
  if (b.minLat > b.maxLat || b.minLng > b.maxLng) return false;
  if (Math.abs(b.maxLat - b.minLat) > MAX_SPAN_DEG) return false;
  if (Math.abs(b.maxLng - b.minLng) > MAX_SPAN_DEG) return false;
  return true;
}

function round(value: number): number {
  const f = 10 ** COORD_DECIMALS;
  return Math.round(value * f) / f;
}

/**
 * Published listings whose position falls inside the box.
 *
 * `coalesce(listing, barrio/city centroid)` is done in SQL so the bounding-box
 * test applies to the position we will actually show — filtering on the private
 * coordinate and then displaying a different one would put pins outside the box
 * the client asked for.
 */
export async function listingsInBounds(
  bounds: MapBounds,
  filters: MapFilters = {},
  vertical?: VerticalConfig | null,
): Promise<MapPin[]> {
  if (!boundsAreSane(bounds)) return [];

  // The position actually used: the listing's own, else its location's.
  const posLat = sql<string>`coalesce(${listings.lat}, ${locations.lat})`;
  const posLng = sql<string>`coalesce(${listings.lng}, ${locations.lng})`;

  const rows = await db
    .select({
      publicId: listings.publicId,
      slug: listings.slug,
      title: listings.title,
      lat: posLat,
      lng: posLng,
      ownLat: listings.lat,
      priceUsd: listings.priceUsd,
      priceAmount: listings.priceAmount,
      priceCurrency: listings.priceCurrency,
      cuotaGs: listings.cuotaGs,
      bedrooms: listings.bedrooms,
      areaM2: listings.areaM2,
    })
    .from(listings)
    .innerJoin(locations, eq(listings.locationId, locations.id))
    .where(
      and(
        eq(listings.status, "published"),
        isNotNull(posLat),
        isNotNull(posLng),
        gte(posLat, String(bounds.minLat)),
        lte(posLat, String(bounds.maxLat)),
        gte(posLng, String(bounds.minLng)),
        lte(posLng, String(bounds.maxLng)),
        ...facetConds(filters),
        ...(vertical ? verticalConds(vertical) : []),
      ),
    )
    // Cheapest first is arbitrary but stable, so a capped response is at least
    // deterministic rather than whatever order the storage engine returns.
    .orderBy(listings.priceUsd)
    .limit(MAX_PINS);

  return rows.map((r) => ({
    publicId: r.publicId,
    slug: r.slug,
    title: r.title,
    lat: round(Number(r.lat)),
    lng: round(Number(r.lng)),
    priceUsd: Number(r.priceUsd),
    priceAmount: Number(r.priceAmount),
    priceCurrency: r.priceCurrency,
    cuotaGs: r.cuotaGs != null ? Number(r.cuotaGs) : null,
    bedrooms: r.bedrooms,
    areaM2: r.areaM2 != null ? Number(r.areaM2) : null,
    approximate: r.ownLat == null,
  }));
}

export const MAP_LIMITS = { MAX_PINS, MAX_SPAN_DEG, COORD_DECIMALS };
