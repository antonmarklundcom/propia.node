/**
 * npm run maps:render [-- --dry] [-- --only <city-slug>]
 *
 * Renders the zone-map WebP images from the committed geo files
 * (`src/content/places/geo/<city>.json`, written by `maps:fetch`) and writes
 * `src/content/places/geo/maps-manifest.json`, the list `<ZoneMap>` reads
 * (docs/plan-category-pages-build.md phase 7, hybrid rule in
 * `src/lib/zone-map/manifest.ts`):
 *
 *   public/img/maps/<city>[/<barrio>]/base-{640,1280}.webp           every place with geo
 *   public/img/maps/<city>[/<barrio>]/<op>-<type>[-en]-{640,1280,og}.webp
 *                                                                     every evergreen path
 *
 * Rendering happens here, on a dev or session machine, and the WebP files are
 * committed: no sharp or font work at request time or on Hostinger's build.
 * A place with no geo file is skipped. With no geo files at all this renders
 * nothing and writes an empty manifest.
 *
 * `--only` re-renders one city and keeps every other city's manifest entries.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { EVERGREEN_PAGES } from "../src/content/evergreen";
import { localeOf } from "../src/config/verticals";
import { getDictionary } from "../src/i18n";
import {
  EMPTY_MANIFEST,
  MANIFEST_VERSION,
  MAP_SIZES,
  basePaths,
  parseCategoryPath,
  parseManifest,
  perUrlPaths,
  type ZoneMapEntry,
  type ZoneMapManifest,
} from "../src/lib/zone-map/manifest";
import { zoneMapCities } from "../src/lib/zone-map/places";
import { renderZoneMapSvg, type ZoneMapRef, type ZoneMapVariant } from "../src/lib/zone-map/svg";
import type { GeoFile } from "../src/lib/zone-map/types";
import { MANIFEST_PATH, dryFlag, onlyFlag, publicFile, readGeoFiles } from "./maps-common";

sharp.concurrency(1);

interface Job {
  file: string;
  geo: GeoFile;
  ref: ZoneMapRef;
  variant: ZoneMapVariant;
  width: number;
}

function entrySortKey(e: ZoneMapEntry): string {
  return [e.citySlug, e.barrioSlug ?? "", e.operation ?? "", e.type ?? "", e.locale ?? ""].join("|");
}

async function main(): Promise<void> {
  const dry = dryFlag();
  const only = onlyFlag();
  const geos = readGeoFiles().filter((g) => !only || g.citySlug === only);
  if (only && geos.length === 0) {
    console.error(`--only ${only}: no geo file src/content/places/geo/${only}.json (run maps:fetch first)`);
    process.exit(1);
  }
  const bySlug = new Map(geos.map((g) => [g.citySlug, g] as const));
  const tree = new Map(zoneMapCities().map((c) => [c.slug, c] as const));

  const jobs: Job[] = [];
  const entries: ZoneMapEntry[] = [];

  // Base maps: the city and each tree barrio the geo file can draw.
  for (const geo of geos) {
    const city = tree.get(geo.citySlug);
    const cityName = city?.name ?? geo.city.name;
    const places: { barrioSlug: string | null; name: string }[] = [{ barrioSlug: null, name: cityName }];
    for (const b of geo.barrios) {
      if (!b.inTree) continue;
      places.push({ barrioSlug: b.slug, name: city?.barrios.find((t) => t.slug === b.slug)?.name ?? b.name });
    }
    for (const p of places) {
      const paths = basePaths(geo.citySlug, p.barrioSlug);
      const ref: ZoneMapRef = { citySlug: geo.citySlug, barrioSlug: p.barrioSlug ?? undefined };
      jobs.push({ file: paths.src640, geo, ref, variant: "4:3", width: MAP_SIZES.w640.width });
      jobs.push({ file: paths.src1280, geo, ref, variant: "4:3", width: MAP_SIZES.w1280.width });
      entries.push({
        citySlug: geo.citySlug,
        barrioSlug: p.barrioSlug,
        operation: null,
        type: null,
        locale: null,
        name: p.name,
        cityName,
        ...paths,
        og: null,
        badge: false,
      });
    }
  }

  // Per-URL maps: every evergreen path whose place has geo.
  const seen = new Set<string>();
  const skipped: string[] = [];
  for (const page of EVERGREEN_PAGES) {
    const locale = localeOf(page.door);
    const key = `${page.path}|${locale}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const parsed = parseCategoryPath(page.path);
    if (!parsed) {
      skipped.push(`${page.path} [${locale}] (not a category path)`);
      continue;
    }
    const geo = bySlug.get(parsed.citySlug);
    if (!geo) {
      if (!only) skipped.push(`${page.path} [${locale}] (no geo for ${parsed.citySlug})`);
      continue;
    }
    if (parsed.barrioSlug && !geo.barrios.some((b) => b.inTree && b.slug === parsed.barrioSlug)) {
      skipped.push(`${page.path} [${locale}] (no geo for barrio ${parsed.barrioSlug})`);
      continue;
    }

    const d = getDictionary(locale);
    const words = parsed.type
      ? d.zoneMap.badge(d.category.typeLabel[parsed.type] ?? parsed.type, d.category.operationLabel[parsed.operation] ?? parsed.operation)
      : undefined;
    const ref: ZoneMapRef = {
      citySlug: parsed.citySlug,
      barrioSlug: parsed.barrioSlug ?? undefined,
      type: parsed.type ?? undefined,
      operation: words,
    };
    const paths = perUrlPaths(parsed.citySlug, parsed.barrioSlug, parsed.operation, parsed.type, locale);
    if (parsed.type) {
      jobs.push({ file: paths.src640, geo, ref, variant: "4:3", width: MAP_SIZES.w640.width });
      jobs.push({ file: paths.src1280, geo, ref, variant: "4:3", width: MAP_SIZES.w1280.width });
    }
    jobs.push({ file: paths.og, geo, ref, variant: "og", width: MAP_SIZES.og.width });
    const city = tree.get(parsed.citySlug);
    const cityName = city?.name ?? geo.city.name;
    const name = parsed.barrioSlug
      ? (city?.barrios.find((b) => b.slug === parsed.barrioSlug)?.name ?? parsed.barrioSlug)
      : cityName;
    entries.push({
      citySlug: parsed.citySlug,
      barrioSlug: parsed.barrioSlug,
      operation: parsed.operation,
      type: parsed.type,
      locale,
      name,
      cityName,
      src640: paths.src640,
      src1280: paths.src1280,
      og: paths.og,
      badge: parsed.type !== null,
    });
  }

  // With --only, every other city's entries stay as they were.
  const previous: ZoneMapManifest = existsSync(MANIFEST_PATH)
    ? parseManifest(JSON.parse(readFileSync(MANIFEST_PATH, "utf8")))
    : EMPTY_MANIFEST;
  const kept = only ? previous.entries.filter((e) => e.citySlug !== only) : [];
  const manifest: ZoneMapManifest = {
    version: MANIFEST_VERSION,
    entries: [...kept, ...entries].sort((a, b) => entrySortKey(a).localeCompare(entrySortKey(b))),
  };

  console.log(`maps:render${dry ? "  [DRY RUN — nothing written]" : ""} — ${geos.length} geo file(s), ${jobs.length} image(s)`);
  let bytes = 0;
  for (const job of jobs) {
    const svg = renderZoneMapSvg(job.geo, job.ref, { variant: job.variant, pixelWidth: job.width });
    if (dry) {
      console.log(`  would render ${job.file}`);
      continue;
    }
    const out = publicFile(job.file);
    mkdirSync(path.dirname(out), { recursive: true });
    const info = await sharp(Buffer.from(svg)).webp({ quality: 80, effort: 6 }).toFile(out);
    bytes += info.size;
    console.log(`  ${job.file} (${(info.size / 1024).toFixed(1)} KB)`);
  }
  if (skipped.length) {
    console.log(`\nevergreen paths without a map (${skipped.length}):`);
    for (const s of skipped) console.log(`  ${s}`);
  }
  const json = JSON.stringify(manifest, null, 2) + "\n";
  if (dry) {
    console.log(`\nwould write src/content/places/geo/maps-manifest.json: ${manifest.entries.length} entr(ies)`);
  } else {
    writeFileSync(MANIFEST_PATH, json);
    console.log(
      `\n${jobs.length} image(s), ${(bytes / 1024 / 1024).toFixed(2)} MB; manifest: ${manifest.entries.length} entr(ies)`,
    );
  }
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});
