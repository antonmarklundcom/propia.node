/**
 * Seed the locations hierarchy (ARCHITECTURE.md §2.2, §4) — the tree that drives
 * every programmatic SEO page (`/comprar/casa/{ciudad}`, barrio guides).
 *
 * Scope v1: the Gran Asunción metro (Central + capital), where inventory is
 * densest, plus the other cities with real listing volume. Not the full 250+
 * distrito census tree — pages only exist where listings will. New locations are
 * added by editing `TREE` and re-running; the job is idempotent (upsert by
 * `full_slug`), so re-runs never duplicate and safely backfill lat/lng.
 *
 * Coordinates are approximate centroids (OSM), good enough for map default
 * centering; per-listing lat/lng comes from the importer.
 *
 * **Follow a real run with `cron:geo`.** A moved centroid is the one staleness no
 * write hook can see: every listing borrowing it is still plotted at the old spot
 * until `display_lat/display_lng` are recomputed (`src/lib/geo.ts`).
 */
import "server-only";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

import { TREE, flatten } from "./location-tree";

/** Centroids are decimals in the DB; compare as numbers, not as strings. */
function sameCoord(live: string | null, seed: number | undefined): boolean {
  if (seed === undefined) return true; // the seed does not claim one
  if (live === null) return false;
  return Number(live) === seed;
}

export async function runSeedLocations(opts: OpsOptions): Promise<OpsResult> {
  return opsRun("seed:locations", opts.dry, async (out) => {
    const flat = flatten(TREE, "");
    const live = await db
      .select({
        id: locations.id,
        fullSlug: locations.fullSlug,
        name: locations.name,
        level: locations.level,
        lat: locations.lat,
        lng: locations.lng,
      })
      .from(locations);
    const byFullSlug = new Map(live.map((r) => [r.fullSlug, r]));

    out.count("en_el_arbol", flat.length);
    out.track("nuevos", "actualizados", "sin_cambio", "centroides_movidos");

    for (const node of flat) {
      const existing = byFullSlug.get(node.fullSlug);
      if (!existing) {
        out.count("nuevos");
        out.note(`  + ${node.fullSlug} (${node.level})`);
      } else {
        const moved =
          !sameCoord(existing.lat, node.lat) || !sameCoord(existing.lng, node.lng);
        const renamed = existing.name !== node.name || existing.level !== node.level;
        if (moved) out.count("centroides_movidos");
        if (moved || renamed) {
          out.count("actualizados");
          out.note(`  ~ ${node.fullSlug}${moved ? " (centroid moves)" : ""}`);
        } else {
          out.count("sin_cambio");
        }
      }

      if (opts.dry) continue;

      const parentId = node.parentFullSlug
        ? byFullSlug.get(node.parentFullSlug)?.id
        : undefined;

      await db
        .insert(locations)
        .values({
          parentId,
          level: node.level,
          name: node.name,
          slug: node.slug,
          fullSlug: node.fullSlug,
          lat: node.lat != null ? node.lat.toString() : undefined,
          lng: node.lng != null ? node.lng.toString() : undefined,
        })
        .onDuplicateKeyUpdate({
          set: {
            name: node.name,
            level: node.level,
            lat: node.lat != null ? node.lat.toString() : undefined,
            lng: node.lng != null ? node.lng.toString() : undefined,
          },
        });

      /**
       * Read back to learn the id, and put it in the same map the children read
       * their `parentId` from. `insert … onDuplicateKeyUpdate` does not return
       * the id portably across MySQL configs, and `full_slug` is UNIQUE, so this
       * is exact.
       */
      const [row] = await db.query.locations.findMany({
        where: (l, { eq }) => eq(l.fullSlug, node.fullSlug),
        columns: { id: true, fullSlug: true, name: true, level: true, lat: true, lng: true },
        limit: 1,
      });
      if (!row) throw new Error(`failed to read back location ${node.fullSlug}`);
      byFullSlug.set(node.fullSlug, row);
    }

    if (opts.dry) {
      out.note("--dry: nothing written.");
    } else {
      out.note(
        "Run cron:geo next — every listing borrowing a centroid that moved is still " +
          "plotted at the old spot until display_lat/display_lng are recomputed.",
      );
    }
  });
}
