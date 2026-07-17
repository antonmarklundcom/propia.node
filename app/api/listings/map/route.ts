/**
 * Bounding-box endpoint for the map view (ARCHITECTURE.md §6 M4). Client
 * supercluster (src/components/MapView.tsx) calls this on every pan/zoom
 * with the current viewport + the same operation/type/location/price/
 * bedroom narrowing as the list view, so map and list always agree.
 *
 * Query hits idx_geo (status, lat, lng) for the bbox range scan; the
 * operation/type/locationId/price/bedrooms conditions narrow on top (same
 * shape as src/lib/queries.ts categoryConds/filterConds — see EXPLAIN audit
 * in scripts/explain-audit.ts).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mapListingsInBBox } from "@/lib/queries";
import { formatPrice, imageUrl } from "@/lib/format";
import { isPlaceholderPhoto } from "@/lib/photos";
import { listingUrl } from "@/lib/urls";
import type { Operation, PropertyType } from "@/lib/import/types";

const OPERATIONS: Operation[] = ["venta", "alquiler", "alquiler_temporal"];
const TYPES: PropertyType[] = [
  "casa",
  "departamento",
  "terreno",
  "duplex",
  "comercial",
  "oficina",
  "deposito",
  "quinta",
];

const querySchema = z.object({
  minLat: z.coerce.number().min(-90).max(90),
  maxLat: z.coerce.number().min(-90).max(90),
  minLng: z.coerce.number().min(-180).max(180),
  maxLng: z.coerce.number().min(-180).max(180),
  operation: z.enum(OPERATIONS as [Operation, ...Operation[]]),
  locationIds: z
    .string()
    .transform((s) => s.split(",").map(Number))
    .refine((ids) => ids.length > 0 && ids.every((n) => Number.isInteger(n) && n > 0)),
  type: z.enum(TYPES as [PropertyType, ...PropertyType[]]).optional(),
  precioMin: z.coerce.number().positive().optional(),
  precioMax: z.coerce.number().positive().optional(),
  dormitorios: z.coerce.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid query" }, { status: 400 });
  }
  const p = parsed.data;
  if (p.minLat > p.maxLat || p.minLng > p.maxLng) {
    return NextResponse.json({ error: "invalid bbox" }, { status: 400 });
  }

  const points = await mapListingsInBBox(
    { minLat: p.minLat, maxLat: p.maxLat, minLng: p.minLng, maxLng: p.maxLng },
    { operation: p.operation, locationIds: p.locationIds, type: p.type },
    { priceMin: p.precioMin, priceMax: p.precioMax, minBedrooms: p.dormitorios },
  );

  const features = points.map((pt) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [pt.lng, pt.lat] },
    properties: {
      id: pt.id,
      url: listingUrl(pt),
      title: pt.title,
      priceLabel: formatPrice(pt),
      bedrooms: pt.bedrooms,
      coverUrl: isPlaceholderPhoto(pt.coverKey) ? null : imageUrl(pt.coverKey),
    },
  }));

  return NextResponse.json(
    { type: "FeatureCollection" as const, features },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
