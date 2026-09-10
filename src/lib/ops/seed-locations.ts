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
import { slugify, joinSlug } from "@/lib/slug";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

type Level = "pais" | "departamento" | "ciudad" | "barrio";

interface Node {
  name: string;
  level: Level;
  lat?: number;
  lng?: number;
  children?: Node[];
}

/**
 * Asunción is both the capital district and its own "ciudad" for URL purposes
 * (full_slug 'asuncion/recoleta'), so it sits at ciudad level, not under a
 * departamento. Central is the surrounding metro departamento.
 */
const TREE: Node[] = [
  {
    name: "Asunción",
    level: "ciudad",
    lat: -25.2637,
    lng: -57.5759,
    children: [
      { name: "Recoleta", level: "barrio", lat: -25.2865, lng: -57.5759 },
      { name: "Villa Morra", level: "barrio", lat: -25.2937, lng: -57.5679 },
      { name: "Las Mercedes", level: "barrio", lat: -25.2828, lng: -57.6003 },
      { name: "Carmelitas", level: "barrio", lat: -25.2986, lng: -57.5546 },
      { name: "Mburicaó", level: "barrio", lat: -25.2789, lng: -57.6108 },
      { name: "Ycuá Satí", level: "barrio", lat: -25.2999, lng: -57.5471 },
      { name: "Manorá", level: "barrio", lat: -25.3055, lng: -57.5624 },
      { name: "Los Laureles", level: "barrio", lat: -25.3097, lng: -57.5732 },
      { name: "Sajonia", level: "barrio", lat: -25.3009, lng: -57.6247 },
      { name: "Trinidad", level: "barrio", lat: -25.2569, lng: -57.5478 },
      { name: "San Vicente", level: "barrio", lat: -25.2705, lng: -57.6218 },
      { name: "Barrio Jara", level: "barrio", lat: -25.2761, lng: -57.5877 },
    ],
  },
  {
    name: "Central",
    level: "departamento",
    lat: -25.35,
    lng: -57.52,
    children: [
      { name: "Luque", level: "ciudad", lat: -25.267, lng: -57.4872 },
      { name: "San Lorenzo", level: "ciudad", lat: -25.34, lng: -57.5087 },
      {
        name: "Fernando de la Mora",
        level: "ciudad",
        lat: -25.3319,
        lng: -57.5427,
      },
      { name: "Lambaré", level: "ciudad", lat: -25.3419, lng: -57.6083 },
      { name: "Capiatá", level: "ciudad", lat: -25.3556, lng: -57.4453 },
      { name: "Ñemby", level: "ciudad", lat: -25.3944, lng: -57.5358 },
      {
        name: "Mariano Roque Alonso",
        level: "ciudad",
        lat: -25.2058,
        lng: -57.5325,
      },
      { name: "Villa Elisa", level: "ciudad", lat: -25.3639, lng: -57.5906 },
      { name: "Limpio", level: "ciudad", lat: -25.1683, lng: -57.4869 },
      { name: "Itauguá", level: "ciudad", lat: -25.3928, lng: -57.3536 },
      { name: "Areguá", level: "ciudad", lat: -25.3078, lng: -57.4239 },
      { name: "Villa Hayes", level: "ciudad", lat: -25.0928, lng: -57.5242 },
      { name: "San Antonio", level: "ciudad", lat: -25.4128, lng: -57.5461 },
      { name: "Guarambaré", level: "ciudad", lat: -25.4886, lng: -57.4544 },
      { name: "Itá", level: "ciudad", lat: -25.5083, lng: -57.3617 },
    ],
  },
  {
    name: "Alto Paraná",
    level: "departamento",
    lat: -25.5,
    lng: -54.75,
    children: [
      {
        name: "Ciudad del Este",
        level: "ciudad",
        lat: -25.5097,
        lng: -54.6111,
      },
      {
        name: "Presidente Franco",
        level: "ciudad",
        lat: -25.5636,
        lng: -54.6114,
      },
      { name: "Hernandarias", level: "ciudad", lat: -25.3947, lng: -54.6383 },
      { name: "Minga Guazú", level: "ciudad", lat: -25.4761, lng: -54.8214 },
    ],
  },
  {
    name: "Itapúa",
    level: "departamento",
    lat: -27.0,
    lng: -55.75,
    children: [
      { name: "Encarnación", level: "ciudad", lat: -27.3306, lng: -55.8667 },
      { name: "Cambyretá", level: "ciudad", lat: -27.2831, lng: -55.8258 },
    ],
  },
  {
    name: "Amambay",
    level: "departamento",
    lat: -22.55,
    lng: -55.75,
    children: [
      {
        name: "Pedro Juan Caballero",
        level: "ciudad",
        lat: -22.5472,
        lng: -55.7333,
      },
    ],
  },
  {
    name: "Cordillera",
    level: "departamento",
    lat: -25.3,
    lng: -57.0,
    children: [
      { name: "Caacupé", level: "ciudad", lat: -25.3858, lng: -57.1414 },
      { name: "Tobatí", level: "ciudad", lat: -25.2586, lng: -57.0742 },
    ],
  },
  {
    name: "Paraguarí",
    level: "departamento",
    lat: -25.63,
    lng: -57.15,
    children: [
      { name: "Paraguarí", level: "ciudad", lat: -25.6314, lng: -57.1461 },
      { name: "Ypacaraí", level: "ciudad", lat: -25.4058, lng: -57.2839 },
    ],
  },
];

interface FlatNode {
  name: string;
  level: Level;
  lat?: number;
  lng?: number;
  slug: string;
  fullSlug: string;
  parentFullSlug: string | null;
}

/**
 * The tree, parents before children. Flattening first is what lets the dry run
 * exist: the recursive writer had to insert a parent to learn its id before it
 * could touch a child, so there was no way to describe the whole change without
 * making part of it.
 */
function flatten(
  nodes: Node[],
  parentFullSlug: string,
  into: FlatNode[] = [],
): FlatNode[] {
  for (const node of nodes) {
    const slug = slugify(node.name);
    const fullSlug = joinSlug(parentFullSlug, slug);
    into.push({
      name: node.name,
      level: node.level,
      lat: node.lat,
      lng: node.lng,
      slug,
      fullSlug,
      parentFullSlug: parentFullSlug === "" ? null : parentFullSlug,
    });
    if (node.children) flatten(node.children, fullSlug, into);
  }
  return into;
}

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
