/**
 * Which zone-map images exist, and which one a page shows (plan phase 7,
 * decision P-4's recommended hybrid). Pure: `maps:render` writes the
 * manifest, `<ZoneMap>` reads it, `verify:maps` checks it — none of them
 * touch the image files through this module.
 *
 * The hybrid rule:
 * - every place with geo gets a **base** map (its zone highlighted, no badge);
 * - every evergreen path whose place has geo gets a **per-URL** map (zone +
 *   type badge in the door's language) plus an og:image variant;
 * - every other page shows its place's base map, with the type badge as an
 *   HTML overlay (`overlay: true` below), so file count stays bounded as stock
 *   changes.
 */
import type { Locale } from "../../i18n";
import type { Operation, PropertyType } from "../import/types";
import { operationSlug, parseCategorySegments, parseOperation, typePlural } from "../urls";

export const MAPS_PUBLIC_DIR = "/img/maps";
export const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";
export const MANIFEST_VERSION = 1 as const;

/** 4:3 image sizes and the og card. */
export const MAP_SIZES = {
  w640: { width: 640, height: 480 },
  w1280: { width: 1280, height: 960 },
  og: { width: 1200, height: 630 },
} as const;

export interface ZoneMapEntry {
  citySlug: string;
  barrioSlug: string | null;
  /** null on a base map. */
  operation: Operation | null;
  type: PropertyType | null;
  /** The badge's language; null on a base map (no words in it). */
  locale: Locale | null;
  /** The zone's display name and its city's, for alt text. */
  name: string;
  cityName: string;
  src640: string;
  src1280: string;
  og: string | null;
  /** The type badge is drawn into the image. */
  badge: boolean;
}

export interface ZoneMapManifest {
  version: typeof MANIFEST_VERSION;
  entries: ZoneMapEntry[];
}

export interface ZoneMapLookup {
  citySlug: string;
  barrioSlug?: string | null;
  operation?: Operation | null;
  type?: PropertyType | null;
  locale: Locale;
}

export interface ZoneMapHit {
  entry: ZoneMapEntry;
  /** The page asked for a type the image does not carry: show the badge in HTML. */
  overlay: boolean;
}

export const EMPTY_MANIFEST: ZoneMapManifest = { version: MANIFEST_VERSION, entries: [] };

/** Folder of a place's images, relative to the site root. */
export function placeDir(citySlug: string, barrioSlug?: string | null): string {
  return `${MAPS_PUBLIC_DIR}/${citySlug}${barrioSlug ? `/${barrioSlug}` : ""}`;
}

export function basePaths(citySlug: string, barrioSlug?: string | null) {
  const dir = placeDir(citySlug, barrioSlug);
  return { src640: `${dir}/base-640.webp`, src1280: `${dir}/base-1280.webp` };
}

/**
 * A per-URL image's file stem: the URL's own operation and type segments
 * (`venta-casas`), with the locale appended when it is not Spanish
 * (`venta-casas-en`), since the badge carries words.
 */
export function perUrlStem(operation: Operation, type: PropertyType | null, locale: Locale): string {
  const parts = [operationSlug(operation)];
  if (type) parts.push(typePlural(type));
  if (locale !== "es") parts.push(locale);
  return parts.join("-");
}

export function perUrlPaths(
  citySlug: string,
  barrioSlug: string | null,
  operation: Operation,
  type: PropertyType | null,
  locale: Locale,
) {
  const dir = placeDir(citySlug, barrioSlug);
  const stem = perUrlStem(operation, type, locale);
  // A typeless page has no badge, so its 4:3 images would be the base map
  // byte for byte: it reuses those and only gets its own og card.
  const sizes = type ? { src640: `${dir}/${stem}-640.webp`, src1280: `${dir}/${stem}-1280.webp` } : basePaths(citySlug, barrioSlug);
  return { ...sizes, og: `${dir}/${stem}-og.webp` };
}

/** A category path's parts (`/venta/asuncion/villa-morra/casas`), or null. */
export function parseCategoryPath(
  path: string,
): { operation: Operation; citySlug: string; barrioSlug: string | null; type: PropertyType | null } | null {
  const [opSeg, ...rest] = path.replace(/^\/+|\/+$/g, "").split("/");
  const operation = parseOperation(opSeg ?? "");
  if (!operation) return null;
  const shape = parseCategorySegments(rest);
  if (!shape) return null;
  if (shape.kind === "city") return { operation, citySlug: shape.citySlug, barrioSlug: null, type: null };
  if (shape.kind === "city-type") return { operation, citySlug: shape.citySlug, barrioSlug: null, type: shape.type };
  return { operation, citySlug: shape.citySlug, barrioSlug: shape.barrioSlug, type: shape.type };
}

/** The image a page shows, or null when its place has no map. */
export function lookupZoneMap(manifest: ZoneMapManifest, ref: ZoneMapLookup): ZoneMapHit | null {
  const barrio = ref.barrioSlug ?? null;
  const op = ref.operation ?? null;
  const type = ref.type ?? null;
  const samePlace = (e: ZoneMapEntry) => e.citySlug === ref.citySlug && e.barrioSlug === barrio;
  if (op) {
    const exact = manifest.entries.find(
      (e) => samePlace(e) && e.operation === op && e.type === type && e.locale === ref.locale,
    );
    if (exact) return { entry: exact, overlay: false };
  }
  const base = manifest.entries.find((e) => samePlace(e) && e.operation === null);
  if (!base) return null;
  return { entry: base, overlay: type !== null };
}

/** Narrow an imported JSON value to a manifest; anything else is an empty one. */
export function parseManifest(json: unknown): ZoneMapManifest {
  const m = json as Partial<ZoneMapManifest> | null;
  if (!m || m.version !== MANIFEST_VERSION || !Array.isArray(m.entries)) return EMPTY_MANIFEST;
  return { version: MANIFEST_VERSION, entries: m.entries as ZoneMapEntry[] };
}

/** Every file an entry points at, for the "it exists on disk" check. */
export function entryFiles(e: ZoneMapEntry): string[] {
  return [e.src640, e.src1280, ...(e.og ? [e.og] : [])];
}
