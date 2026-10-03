/**
 * File-system half shared by `maps:fetch`, `maps:render`,
 * `maps-contact-sheet.ts` and `verify:maps`: where the geo files, the
 * manifest and the images live, and how a geo file is read back. Every
 * decision about their content is in `src/lib/zone-map/` (pure).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { GEO_FILE_VERSION, type GeoFile } from "../src/lib/zone-map/types";

export const ROOT = path.resolve(__dirname, "..");
export const GEO_DIR = path.join(ROOT, "src/content/places/geo");
export const MANIFEST_PATH = path.join(GEO_DIR, "maps-manifest.json");
export const PUBLIC_DIR = path.join(ROOT, "public");

export function geoPath(citySlug: string): string {
  return path.join(GEO_DIR, `${citySlug}.json`);
}

/** Every committed geo file, by city slug, in slug order. */
export function readGeoFiles(): GeoFile[] {
  if (!existsSync(GEO_DIR)) return [];
  return readdirSync(GEO_DIR)
    .filter((f) => f.endsWith(".json") && f !== path.basename(MANIFEST_PATH))
    .sort()
    .map((f) => {
      const geo = JSON.parse(readFileSync(path.join(GEO_DIR, f), "utf8")) as GeoFile;
      if (geo.version !== GEO_FILE_VERSION) {
        throw new Error(`${f}: geo file version ${String(geo.version)}, expected ${GEO_FILE_VERSION}`);
      }
      if (`${geo.citySlug}.json` !== f) throw new Error(`${f}: citySlug is ${geo.citySlug}`);
      return geo;
    });
}

/** A public URL path (`/img/maps/…`) → its file under `public/`. */
export function publicFile(urlPath: string): string {
  return path.join(PUBLIC_DIR, ...urlPath.replace(/^\/+/, "").split("/"));
}

/** `--only <city-slug>` / `--only=<city-slug>`. */
export function onlyFlag(argv: string[] = process.argv.slice(2)): string | undefined {
  const eq = argv.find((a) => a.startsWith("--only="));
  if (eq) return eq.slice("--only=".length) || undefined;
  const i = argv.indexOf("--only");
  const v = i === -1 ? undefined : argv[i + 1];
  return v && !v.startsWith("--") ? v : undefined;
}

export function dryFlag(argv: string[] = process.argv.slice(2)): boolean {
  return argv.includes("--dry") || argv.includes("--dry-run");
}
