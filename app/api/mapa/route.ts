/**
 * Bounding-box pin feed for the map view (ARCHITECTURE.md M4).
 *
 * GET /api/mapa?bbox=minLng,minLat,maxLng,maxLat&operacion=venta&tipo=casas…
 *
 * Read-only and public — it serves exactly what the category grid already
 * shows, so there is nothing here a visitor could not scroll to. Two things
 * keep it from being a bulk export: the coordinates are rounded in the query
 * layer (map-queries.ts owns that rule), and a box larger than MAX_SPAN_DEG is
 * refused rather than answered with the whole country.
 *
 * bbox order is lng,lat — the GeoJSON/MapLibre convention, so the client can
 * pass `map.getBounds().toArray().flat()` unchanged.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  boundsAreSane,
  listingsInBounds,
  MAP_LIMITS,
  type MapFilters,
} from "@/lib/map-queries";
import { parseOperation, parseTypePlural } from "@/lib/urls";

// Depends on live listing data; never statically cached.
export const dynamic = "force-dynamic";

const querySchema = z.object({
  bbox: z.string(),
  operacion: z.string().optional(),
  tipo: z.string().optional(),
  precio_min: z.string().optional(),
  precio_max: z.string().optional(),
  dormitorios: z.string().optional(),
});

/** Positive finite number, or undefined — a bad value is dropped, not an error. */
function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad query" }, { status: 400 });
  }

  const parts = parsed.data.bbox.split(",").map(Number);
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

  // Same query-string vocabulary as the category pages, so the map and the
  // grid can never disagree about what the visitor filtered.
  const filters: MapFilters = {
    operation: parsed.data.operacion
      ? parseOperation(parsed.data.operacion) ?? undefined
      : undefined,
    type: parsed.data.tipo
      ? parseTypePlural(parsed.data.tipo) ?? undefined
      : undefined,
    priceMin: num(parsed.data.precio_min),
    priceMax: num(parsed.data.precio_max),
    minBedrooms: num(parsed.data.dormitorios),
  };

  const pins = await listingsInBounds(bounds, filters);

  return NextResponse.json(
    { ok: true, pins, capped: pins.length >= MAP_LIMITS.MAX_PINS },
    {
      // Short shared cache: panning back and forth over the same area is the
      // normal interaction, and listings do not move.
      headers: { "cache-control": "public, max-age=0, s-maxage=60" },
    },
  );
}
