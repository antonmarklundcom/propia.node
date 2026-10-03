/**
 * npm run maps:fetch [-- --dry] [-- --only <city-slug>]
 *
 * Fetches OpenStreetMap boundaries for every ciudad in
 * `src/lib/ops/location-tree.ts` and its barrios, plus water and main roads
 * around it, from the Overpass API, and writes one simplified geo file per
 * city to `src/content/places/geo/<city-slug>.json`
 * (docs/plan-category-pages-build.md phase 6). The data is ODbL — read
 * `src/content/places/geo/README.md` before doing anything with it but
 * rendering images.
 *
 * Polite by construction: one request at a time, a pause between requests, a
 * User-Agent that names the site, and exponential backoff on 429/5xx. Needs no
 * credential and no database. Every decision (which relation is the place,
 * what is simplified, what is dropped) lives in `src/lib/zone-map/overpass.ts`
 * and is tested by `npm run verify:maps`; this file is only the network and
 * the disk.
 *
 * `--dry` fetches and reports what it would write — sizes, the admin_level
 * each place matched at, and every place it could not match — and writes
 * nothing.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { bboxAround, type LngLat } from "../src/lib/zone-map/geometry";
import {
  GEO_FILE_BUDGET_BYTES,
  OVERPASS_URL,
  buildGeoFile,
  cityQuery,
  contextFrame,
  contextQuery,
  parseAreas,
  pickBoundary,
  pickParentRelation,
  parentQuery,
  subdivisionsByNameQuery,
  subdivisionsQuery,
  type AreaCandidate,
  type OverpassResponse,
} from "../src/lib/zone-map/overpass";
import { zoneMapCities } from "../src/lib/zone-map/places";
import { GEO_DIR, dryFlag, geoPath, onlyFlag } from "./maps-common";

const USER_AGENT =
  "inmobiliaria.com.py zone-maps/1 (maps:fetch; one request at a time; https://inmobiliaria.com.py)";
const PAUSE_MS = 2_000;
const BACKOFF_MS = [5_000, 15_000, 45_000, 90_000];
const REQUEST_TIMEOUT_MS = 200_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let lastRequestAt = 0;

async function overpass(query: string): Promise<OverpassResponse> {
  for (let attempt = 0; ; attempt++) {
    const wait = lastRequestAt + PAUSE_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    let retryable = true;
    let reason = "";
    try {
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({ data: query }).toString(),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (res.ok) return (await res.json()) as OverpassResponse;
      reason = `HTTP ${res.status}`;
      retryable = res.status === 429 || res.status >= 500;
    } catch (err) {
      reason = (err as Error).message;
    }
    if (!retryable || attempt >= BACKOFF_MS.length) {
      throw new Error(`Overpass request failed (${reason}) after ${attempt + 1} attempt(s)`);
    }
    console.log(`    … ${reason}, retrying in ${BACKOFF_MS[attempt] / 1000}s`);
    await sleep(BACKOFF_MS[attempt]);
  }
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main(): Promise<void> {
  const dry = dryFlag();
  const only = onlyFlag();
  const all = zoneMapCities();
  const cities = only ? all.filter((c) => c.slug === only) : all;
  if (only && cities.length === 0) {
    console.error(`--only ${only}: no ciudad with that slug in location-tree.ts`);
    process.exit(1);
  }
  const fetchedAt = new Date().toISOString();
  console.log(`maps:fetch${dry ? "  [DRY RUN — nothing written]" : ""} — ${cities.length} cities, ${fetchedAt}`);

  const unmatched: string[] = [];
  const outside: string[] = [];
  const levels = new Map<string, string[]>();
  let written = 0;
  let failed = 0;

  for (const city of cities) {
    console.log(`\n${city.name} (${city.slug})`);
    const centroid: LngLat | null = city.lat !== undefined && city.lng !== undefined ? [city.lng, city.lat] : null;
    try {
      // 1. The departamento whose area the city is searched in.
      let parentRelId: number | null = null;
      if (city.parentName) {
        const parent = pickParentRelation(await overpass(parentQuery(city.parentName)), city.parentName, centroid);
        if (parent) {
          parentRelId = parent.osmId;
          console.log(`  parent: ${parent.name} (relation ${parent.osmId}, admin_level ${parent.adminLevel ?? "?"})`);
        } else {
          console.log(`  parent: "${city.parentName}" not found — searching all of Paraguay`);
        }
      }

      // 2. The city's own boundary.
      const cityCands = parseAreas(await overpass(cityQuery(city.name, parentRelId)));
      const picked = pickBoundary(cityCands, city.name, centroid, new Set(parentRelId === null ? [] : [parentRelId]));
      const cityArea: AreaCandidate | null = picked?.pick ?? null;
      console.log(
        cityArea
          ? `  boundary: ${cityArea.name} (relation ${cityArea.osmId}, admin_level ${cityArea.adminLevel ?? "?"}, ${cityCands.length} candidate(s)${cityArea.openChains ? `, ${cityArea.openChains} open chain(s) dropped` : ""})`
          : `  boundary: none among ${cityCands.length} candidate(s)`,
      );

      // 3. Subdivisions (barrios) inside it.
      let subdivisions: AreaCandidate[] = [];
      if (cityArea) {
        subdivisions = parseAreas(await overpass(subdivisionsQuery(cityArea.osmId, cityArea.adminLevel)));
      } else if (centroid && city.barrios.length > 0) {
        subdivisions = parseAreas(
          await overpass(subdivisionsByNameQuery(city.barrios.map((b) => b.name), bboxAround(centroid, 8_000))),
        );
      }
      if (subdivisions.length) console.log(`  subdivisions: ${subdivisions.length} candidate(s)`);

      // 4. Water and main roads in the frame.
      const frame = contextFrame(cityArea, city);
      const context = frame ? await overpass(contextQuery(frame)) : null;

      const { file, report } = buildGeoFile({ city, cityArea, barrios: city.barrios, subdivisions, context, fetchedAt });
      for (const [place, level] of Object.entries(report.adminLevels)) {
        const key = level ?? "(none)";
        levels.set(key, [...(levels.get(key) ?? []), place]);
      }
      unmatched.push(...report.circles.map((p) => `${p} — circle fallback`), ...report.undrawable.map((p) => `${p} — no polygon and no tree centroid: not drawable`));
      outside.push(...report.centroidOutside);

      if (!file) {
        console.log("  → nothing to write");
        continue;
      }
      const json = JSON.stringify(file) + "\n";
      const target = geoPath(city.slug);
      console.log(
        `  → ${dry ? "would write" : "writing"} ${target.replace(`${GEO_DIR}/`, "src/content/places/geo/")}: ${kb(Buffer.byteLength(json))}, ` +
          `${file.barrios.filter((b) => b.inTree).length} tree barrio(s), ${file.barrios.filter((b) => !b.inTree).length} neighbour(s), ` +
          `${file.water.length} water, ${file.roads.length} road(s)`,
      );
      if (Buffer.byteLength(json) > GEO_FILE_BUDGET_BYTES) {
        console.log(`  ! over the ${GEO_FILE_BUDGET_BYTES / 1024} KB budget verify:maps enforces — raise TOLERANCE_M or drop neighbours`);
      }
      if (!dry) {
        mkdirSync(GEO_DIR, { recursive: true });
        writeFileSync(target, json);
        written++;
      }
    } catch (err) {
      failed++;
      console.error(`  FAILED: ${(err as Error).message}`);
    }
  }

  console.log("\nadmin_level each place matched at:");
  for (const [level, places] of [...levels.entries()].sort()) console.log(`  ${level}: ${places.length} — ${places.join(", ")}`);
  console.log(`\nplaces not matched to an OSM polygon (${unmatched.length}):`);
  for (const u of unmatched) console.log(`  ${u}`);
  if (outside.length) {
    console.log(`\nmatched outlines that do NOT contain the tree centroid — check the place or the centroid (${outside.length}):`);
    for (const o of outside) console.log(`  ${o}`);
  }
  console.log(`\n${dry ? "dry run: nothing written" : `${written} file(s) written`}${failed ? `, ${failed} city(ies) failed` : ""}`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});
