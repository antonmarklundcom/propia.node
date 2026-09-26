import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { listingScopeWhere, type EditScope } from "@/lib/listing-edit";
import type { MapPosition } from "@/lib/listing-quality";

/**
 * Where a listing's map pin sits, inside the caller's scope (the same guard
 * `getEditableListing` uses). Own `lat` = exact; only a materialized
 * `display_lat` = the barrio/city centroid (src/lib/geo.ts); neither = none.
 * Null when the row is out of reach.
 */
export async function getListingMapPosition(
  id: number,
  scope: EditScope,
): Promise<MapPosition | null> {
  const guard = listingScopeWhere(scope);
  const [row] = await db
    .select({ lat: listings.lat, displayLat: listings.displayLat })
    .from(listings)
    .where(guard ? and(eq(listings.id, id), guard) : eq(listings.id, id))
    .limit(1);
  if (!row) return null;
  if (row.lat != null) return "exact";
  return row.displayLat != null ? "approx" : "none";
}
