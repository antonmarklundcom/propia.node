/**
 * The shape of `src/content/places/geo/<city-slug>.json` — what `maps:fetch`
 * writes and `maps:render` reads. Pure types plus one guard.
 *
 * Licence: every feature is OpenStreetMap data under ODbL 1.0. The files are
 * a Derivative Database used only to render images; they are never served
 * (see src/content/places/geo/README.md).
 */
import type { LngLat, Polygon } from "./geometry";

export const OSM_LICENCE = "ODbL-1.0" as const;
export const GEO_FILE_VERSION = 1 as const;

export interface OsmRef {
  osmId: number;
  osmType: "relation" | "way";
  name: string;
  /** ISO timestamp of the Overpass response this came from. */
  fetchedAt: string;
  licence: typeof OSM_LICENCE;
}

/** A place with a real outline from OSM. */
export interface PlaceArea extends OsmRef {
  slug: string;
  /** The OSM `admin_level` the boundary matched at (recorded, never assumed). */
  adminLevel: string | null;
  /** True for a place in `location-tree.ts`; false for a neighbour drawn for context. */
  inTree: boolean;
  polygons: Polygon[];
}

/** A tree place OSM had no polygon for: drawn as a soft circle at its centroid. */
export interface PlaceCircle {
  slug: string;
  name: string;
  inTree: true;
  fallback: "circle";
  /** The tree centroid (`location-tree.ts`), not an OSM coordinate. */
  lat: number;
  lng: number;
}

export type PlaceGeo = PlaceArea | PlaceCircle;

export interface WaterFeature extends OsmRef {
  polygons: Polygon[];
}

export interface RoadFeature extends OsmRef {
  highway: "trunk" | "primary";
  lines: LngLat[][];
}

export interface GeoFile {
  version: typeof GEO_FILE_VERSION;
  citySlug: string;
  source: string;
  licence: typeof OSM_LICENCE;
  fetchedAt: string;
  city: PlaceGeo;
  /** Tree barrios first (matched or circle), then OSM neighbours, each by name. */
  barrios: PlaceGeo[];
  water: WaterFeature[];
  roads: RoadFeature[];
}

export function isCircle(p: PlaceGeo): p is PlaceCircle {
  return (p as PlaceCircle).fallback === "circle";
}
