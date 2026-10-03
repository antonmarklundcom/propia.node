/**
 * Bounding-box pin feed for the map view (ARCHITECTURE.md M4).
 *
 * GET /api/mapa?bbox=minLng,minLat,maxLng,maxLat&operacion=venta&tipo=casas
 *              &ciudad=asuncion[&barrio=recoleta]&precio_min=…
 *
 * Read-only and public — it serves exactly what the category grid already
 * shows, so there is nothing here a visitor could not scroll to. Two things
 * keep it from being a bulk export: the coordinates are rounded in the query
 * layer (map-queries.ts owns that rule), and a box larger than MAX_SPAN_DEG is
 * refused rather than answered with the whole country.
 *
 * The filter vocabulary is not spelled out here — it is parsed by
 * `parseFacetParams` (src/lib/facets.ts), the same function the category page
 * uses, so the grid and its map cannot read the same query string differently.
 *
 * bbox order is lng,lat — the GeoJSON/MapLibre convention, so the client can
 * pass `map.getBounds().toArray().flat()` unchanged.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  boundsAreSane,
  listingsInBounds,
  MAP_LIMITS,
  type MapFilters,
} from "@/lib/map-queries";
import { parseFacetParams, parseLocationSlugs } from "@/lib/facets";
import { citySubtreeIds, resolveBarrio, resolveCity } from "@/lib/queries";
import { currentVertical } from "@/lib/vertical-context";
import { clientIpFrom } from "@/lib/client-ip";
import { allowRequest } from "@/lib/rate-limit";
import { isPoolPressureError, logDegraded } from "@/lib/degrade";

// Depends on live listing data; never statically cached.
export const dynamic = "force-dynamic";

/**
 * `?ciudad=` (optionally `&barrio=`) → the location ids the grid is scoped to.
 *
 * Without this the map answered the viewport alone, so panning a
 * "Casas en venta en Asunción" page surfaced pins from Luque that its grid
 * would never list — the exact grid/map divergence the shared facet layer
 * exists to prevent. An unknown slug scopes to nothing rather than silently
 * widening back to the whole country.
 */
async function locationIdsFor(
  citySlug: string | undefined,
  barrioSlug: string | undefined,
): Promise<number[] | undefined> {
  if (!citySlug) return undefined;
  const city = await resolveCity(citySlug);
  if (!city) return [];
  if (!barrioSlug) return citySubtreeIds(city.id);
  const barrio = await resolveBarrio(city.id, barrioSlug);
  return barrio ? [barrio.id] : [];
}

/**
 * Each answer is a database query (nothing is cached server-side), so an
 * unthrottled loop of random boxes is pool pressure for every page. A person
 * panning sends a request per pan end; 120 a minute per IP is far above that.
 */
const MAP_MAX = 120;
const MAP_WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
  if (!allowRequest(`map|${clientIpFrom(req.headers)}`, MAP_MAX, MAP_WINDOW_MS)) {
    return NextResponse.json(
      { ok: false, error: "too many requests" },
      { status: 429, headers: { "retry-after": "60", "cache-control": "no-store" } },
    );
  }
  const sp = Object.fromEntries(req.nextUrl.searchParams);

  const bboxRaw = typeof sp.bbox === "string" ? sp.bbox : "";
  const parts = bboxRaw.split(",").map(Number);
  if (parts.length !== 4) {
    return NextResponse.json(
      { ok: false, error: "bbox must be minLng,minLat,maxLng,maxLat" },
      { status: 400 },
    );
  }
  const [minLng, minLat, maxLng, maxLat] = parts;
  const bounds = { minLat, maxLat, minLng, maxLng };

  if (!boundsAreSane(bounds)) {
    return NextResponse.json(
      { ok: false, error: `bbox invalid or wider than ${MAP_LIMITS.MAX_SPAN_DEG}°` },
      { status: 422 },
    );
  }

  const { citySlug, barrioSlug } = parseLocationSlugs(sp);
  const { sort: _sort, ...facets } = parseFacetParams(sp);

  let pins: Awaited<ReturnType<typeof listingsInBounds>>;
  try {
    const [locationIds, vertical] = await Promise.all([
      locationIdsFor(citySlug, barrioSlug),
      currentVertical(),
    ]);
    const filters: MapFilters = { ...facets, locationIds };
    pins = await listingsInBounds(bounds, filters, vertical);
  } catch (err) {
    // A full pool is a "try again shortly", not a server error: the map shows
    // its "couldn't load" state and the next pan retries, and the operator is
    // not paged for every pin request in a burst (report 2026-10-03 §C-3).
    if (!isPoolPressureError(err)) throw err;
    logDegraded("api-mapa", err);
    return NextResponse.json(
      { ok: false, degraded: true },
      { status: 503, headers: { "retry-after": "10", "cache-control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, pins, capped: pins.length >= MAP_LIMITS.MAX_PINS },
    {
      // Short shared cache: panning back and forth over the same area is the
      // normal interaction, and listings do not move. Keyed per host by Vary,
      // because a door with hard filters serves a different pin set.
      headers: {
        "cache-control": "public, max-age=0, s-maxage=60",
        vary: "Host",
      },
    },
  );
}
