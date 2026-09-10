/**
 * Repair every listing's display coordinate (audit F38).
 *
 * `listings.display_lat/display_lng` are "the listing's own coordinate, else its
 * location's centroid", materialised at write time so the map's bounding box can
 * use `idx_geo` (`src/lib/geo.ts` explains why the old per-query `coalesce`
 * could not). Every writer that touches `lat`, `lng` or `location_id` keeps its
 * own row current, so this job exists for the one staleness no row-level hook can
 * see: **a centroid moved**, and every listing borrowing it is now plotted at the
 * old spot.
 *
 * Run it after `seed:locations`, after any manual edit of `locations.lat/lng`,
 * and harmlessly whenever you are unsure — it recomputes from the same
 * expression the migration and the app use, so a table that is already correct
 * is left byte-identical.
 *
 * The recompute runs raw SQL rather than `db.update()` on purpose: `updatedAt`
 * carries a JS-side `$onUpdate`, and a recomputation a visitor cannot see must
 * not move a listing's sitemap `lastmod` (`src/lib/geo.ts`).
 */
import "server-only";
import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings, locations } from "@/db/schema";
import {
  countListingsWithoutPosition,
  syncAllDisplayCoords,
} from "@/lib/geo";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

export async function runGeo(opts: OpsOptions): Promise<OpsResult> {
  return opsRun("cron:geo", opts.dry, async (out) => {
    /**
     * Rows whose stored display coordinate disagrees with what the rule says it
     * should be. `<=>` is MySQL's NULL-safe equality — plain `!=` would call
     * every NULL-to-NULL pair a difference and report the whole table as stale.
     */
    const [drift] = await db
      .select({ n: sql<number>`count(*)` })
      .from(listings)
      .innerJoin(locations, eq(locations.id, listings.locationId))
      .where(
        or(
          sql`not (${listings.displayLat} <=> coalesce(${listings.lat}, ${locations.lat}))`,
          sql`not (${listings.displayLng} <=> coalesce(${listings.lng}, ${locations.lng}))`,
        ),
      );

    const stale = Number(drift?.n ?? 0);
    out.count("posicion_desactualizada", stale);
    out.note(`${stale} listing(s) plotted at a stale position.`);

    if (opts.dry) {
      out.note("--dry: nothing written.");
    } else {
      await syncAllDisplayCoords(db);
      out.note("display coordinates recomputed.");
    }

    /**
     * Not an error, but worth saying out loud: these listings render everywhere
     * except the map, and nothing else in the app will ever mention it.
     */
    const orphans = await countListingsWithoutPosition(db);
    out.count("sin_posicion", orphans);
    if (orphans > 0) {
      out.note(
        `${orphans} published listing(s) have no position at all — no coordinate of ` +
          "their own and a location with no centroid. They are invisible on the map. " +
          "Fix by giving the location a lat/lng (seed:locations) or the listing its own.",
      );
    }
  });
}
