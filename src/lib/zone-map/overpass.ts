/**
 * OpenStreetMap through the Overpass API: the queries `maps:fetch` sends and
 * the parsing of what comes back. Pure — the script owns the network and the
 * file system, this module owns every decision, so `verify:maps` can test the
 * decisions against hand-written fixtures without a network.
 *
 * Nothing here assumes Paraguay's `admin_level` numbering. A city is matched
 * by name inside its departamento's area (or the country's, for Asunción);
 * its barrios are whatever administrative boundaries sit one or more levels
 * deeper inside it. The level that matched is recorded on the feature.
 */
import { slugify } from "../slug";
import {
  METRES_PER_DEGREE,
  assembleRings,
  bboxOf,
  buildPolygons,
  clipLine,
  clipPolygons,
  pointInPolygons,
  polygonArea,
  polygonPoints,
  polygonsCentroid,
  roundLine,
  simplifyLine,
  simplifyPolygons,
  type BBox,
  type LngLat,
  type Polygon,
} from "./geometry";
import {
  GEO_FILE_VERSION,
  OSM_LICENCE,
  type GeoFile,
  type PlaceArea,
  type PlaceCircle,
  type PlaceGeo,
  type RoadFeature,
  type WaterFeature,
} from "./types";

export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
export const OSM_SOURCE = "OpenStreetMap contributors, via the Overpass API";

/** Douglas–Peucker tolerances, metres. A 1280 px map of a city is ~10–20 m/px. */
export const TOLERANCE_M = { boundary: 4, neighbour: 10, water: 8, road: 8 } as const;
/** Per-city geo file budget, enforced by `verify:maps` and warned about by `maps:fetch`. */
export const GEO_FILE_BUDGET_BYTES = 150 * 1024;
/** Ponds smaller than this are noise at map scale and only grow the file. */
export const MIN_WATER_M2 = 20_000;

// ---------------------------------------------------------------------------
// Overpass response shape (the subset `out geom` / `out tags bb` produce)
// ---------------------------------------------------------------------------

export interface OverpassPoint {
  lat: number;
  lon: number;
}
export interface OverpassMember {
  type: "node" | "way" | "relation";
  ref: number;
  role: string;
  geometry?: (OverpassPoint | null)[];
}
export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  tags?: Record<string, string>;
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number };
  geometry?: (OverpassPoint | null)[];
  members?: OverpassMember[];
}
export interface OverpassResponse {
  elements: OverpassElement[];
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

/** Words OSM sometimes puts in front of a place's name. */
const NAME_PREFIX = /^(distrito|ciudad|municipio|municipalidad|barrio|departamento|compania|compañia|compañía)( de(l)?)? +/i;

/** "Distrito de Luque" and "Luque" compare equal; accents and case do not matter. */
export function normalizeName(name: string): string {
  let n = name.trim();
  // Strip a prefix only when something is left ("Barrio Jara" stays "barrio-jara"
  // when compared against itself, see namesMatch).
  const stripped = n.replace(NAME_PREFIX, "");
  if (stripped.length > 0) n = stripped;
  return slugify(n);
}

export function namesMatch(osmName: string, treeName: string): boolean {
  return (
    normalizeName(osmName) === normalizeName(treeName) ||
    slugify(osmName) === slugify(treeName)
  );
}

const ACCENTS: Record<string, string> = {
  // Guaraní nasal vowels (ã ẽ ĩ õ ũ ỹ) included: "Loma Pytã".
  a: "aáàäâãAÁÀÄÂÃ",
  e: "eéèëêẽEÉÈËÊẼ",
  i: "iíìïîĩIÍÌÏÎĨ",
  o: "oóòöôõOÓÒÖÔÕ",
  u: "uúùüûũUÚÙÜÛŨ",
  n: "nñNÑ",
  y: "yýỹYÝỸ",
};

/**
 * An Overpass (POSIX ERE) regex matching a name with or without its accents
 * and with an optional "Distrito de " style prefix, anchored both ends. The
 * caller adds `,i`. Escaped for use inside a double-quoted QL string.
 */
export function nameRegex(name: string): string {
  let base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  // "Barrio Jara" in the tree may be plain "Jara" in OSM: the prefix becomes
  // the optional one below rather than a required part of the name.
  const stripped = base.replace(NAME_PREFIX, "");
  if (stripped.length > 0) base = stripped;
  let body = "";
  for (const ch of base) {
    const lower = ch.toLowerCase();
    if (ACCENTS[lower]) body += `[${ACCENTS[lower]}]`;
    else if (/[.*+?^${}()|[\]\\]/.test(ch)) body += `\\${ch}`;
    else if (ch === "-" || ch === " ") body += "[- ]";
    else if (ch === '"') continue; // never in a place name; never let one end the QL string
    else body += ch;
  }
  const prefix =
    "((Distrito|Ciudad|Municipio|Municipalidad|Barrio|Departamento|Compa[nñ][ií]a)( de| del)? )?";
  // Escape for a double-quoted QL string: backslashes double.
  return `^${prefix}${body}$`.replace(/\\/g, "\\\\");
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const HEADER = "[out:json][timeout:180];";
const COUNTRY = 'area["ISO3166-1"="PY"]["boundary"="administrative"]->.country;';

/** Overpass derives an area id from a relation id this way. */
export function areaIdForRelation(relId: number): number {
  return 3_600_000_000 + relId;
}

/** Departamento candidates by name: tags and bounds only, no geometry. */
export function parentQuery(parentName: string): string {
  return [
    HEADER,
    COUNTRY,
    `rel(area.country)["boundary"="administrative"]["name"~"${nameRegex(parentName)}",i];`,
    "out tags bb;",
  ].join("\n");
}

/** City candidates by name inside an area (departamento), or inside Paraguay. */
export function cityQuery(cityName: string, parentRelId: number | null): string {
  const area =
    parentRelId === null ? COUNTRY.replace("->.country", "->.parent") : `area(id:${areaIdForRelation(parentRelId)})->.parent;`;
  return [
    HEADER,
    area,
    `rel(area.parent)["boundary"="administrative"]["name"~"${nameRegex(cityName)}",i];`,
    "out geom;",
  ].join("\n");
}

/**
 * Administrative boundaries deeper than the city, inside it. With a known
 * city level only deeper levels are asked for, so the response does not carry
 * the country's and the departamento's full outlines.
 */
export function subdivisionsQuery(cityRelId: number, cityAdminLevel: string | null): string {
  const level = cityAdminLevel === null ? NaN : Number(cityAdminLevel);
  const levels = Number.isInteger(level)
    ? Array.from({ length: Math.max(0, 12 - level) }, (_, i) => level + 1 + i)
    : [];
  const levelFilter = levels.length ? `["admin_level"~"^(${levels.join("|")})$"]` : "";
  return [
    HEADER,
    `area(id:${areaIdForRelation(cityRelId)})->.city;`,
    `rel(area.city)["boundary"="administrative"]${levelFilter};`,
    "out geom;",
  ].join("\n");
}

/** A city with no outline: its tree barrios by name, around the centroid. */
export function subdivisionsByNameQuery(names: string[], b: BBox): string {
  const alternatives = names.map((n) => nameRegex(n).slice(1, -1)).join("|");
  return [
    HEADER,
    `rel["boundary"="administrative"]["name"~"^(${alternatives})$",i](${bboxQl(b)});`,
    "out geom;",
  ].join("\n");
}

function bboxQl(b: BBox): string {
  return [b.minLat, b.minLng, b.maxLat, b.maxLng].map((n) => n.toFixed(5)).join(",");
}

/** Water and main roads in the city's frame. */
export function contextQuery(b: BBox): string {
  const bb = bboxQl(b);
  return [
    HEADER,
    "(",
    `  way["natural"="water"](${bb});`,
    `  rel["natural"="water"](${bb});`,
    `  way["waterway"="riverbank"](${bb});`,
    `  rel["waterway"="riverbank"](${bb});`,
    `  way["highway"~"^(trunk|primary)$"](${bb});`,
    ");",
    "out geom;",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function toLine(geometry: (OverpassPoint | null)[] | undefined): LngLat[] {
  return (geometry ?? []).filter((p): p is OverpassPoint => p !== null).map((p) => [p.lon, p.lat]);
}

export interface AreaCandidate {
  osmId: number;
  osmType: "relation" | "way";
  name: string;
  adminLevel: string | null;
  polygons: Polygon[];
  /** Member chains that could not be closed into a ring (broken or partial data). */
  openChains: number;
  tags: Record<string, string>;
}

/** A relation's outer/inner members assembled into polygons. */
export function relationToPolygons(el: OverpassElement): { polygons: Polygon[]; open: number } {
  const outer: LngLat[][] = [];
  const inner: LngLat[][] = [];
  for (const m of el.members ?? []) {
    if (m.type !== "way") continue;
    const line = toLine(m.geometry);
    if (line.length < 2) continue;
    if (m.role === "inner") inner.push(line);
    else if (m.role === "outer" || m.role === "") outer.push(line);
  }
  const o = assembleRings(outer);
  const i = assembleRings(inner);
  return { polygons: buildPolygons(o.rings, i.rings), open: o.open + i.open };
}

/** Every relation and closed way in a response, as an area. */
export function parseAreas(res: OverpassResponse): AreaCandidate[] {
  const out: AreaCandidate[] = [];
  for (const el of res.elements) {
    const tags = el.tags ?? {};
    if (el.type === "relation") {
      const { polygons, open } = relationToPolygons(el);
      out.push({
        osmId: el.id,
        osmType: "relation",
        name: tags.name ?? "",
        adminLevel: tags.admin_level ?? null,
        polygons,
        openChains: open,
        tags,
      });
    } else if (el.type === "way" && !tags.highway) {
      const { rings, open } = assembleRings([toLine(el.geometry)]);
      out.push({
        osmId: el.id,
        osmType: "way",
        name: tags.name ?? "",
        adminLevel: tags.admin_level ?? null,
        polygons: buildPolygons(rings, []),
        openChains: open,
        tags,
      });
    }
  }
  return out;
}

export interface ParsedRoad {
  osmId: number;
  name: string;
  highway: "trunk" | "primary";
  line: LngLat[];
}

export function parseRoads(res: OverpassResponse): ParsedRoad[] {
  const out: ParsedRoad[] = [];
  for (const el of res.elements) {
    const h = el.tags?.highway;
    if (el.type !== "way" || (h !== "trunk" && h !== "primary")) continue;
    const line = toLine(el.geometry);
    if (line.length < 2) continue;
    out.push({ osmId: el.id, name: el.tags?.name ?? el.tags?.ref ?? "", highway: h, line });
  }
  return out;
}

/** Departamento candidates from `out tags bb` (no geometry), largest first. */
export function pickParentRelation(
  res: OverpassResponse,
  parentName: string,
  childCentroid: LngLat | null,
): { osmId: number; name: string; adminLevel: string | null } | null {
  const cands = res.elements.filter(
    (el) => el.type === "relation" && el.bounds && namesMatch(el.tags?.name ?? "", parentName),
  );
  const contains = (el: OverpassElement) =>
    !childCentroid ||
    (el.bounds!.minlon <= childCentroid[0] &&
      childCentroid[0] <= el.bounds!.maxlon &&
      el.bounds!.minlat <= childCentroid[1] &&
      childCentroid[1] <= el.bounds!.maxlat);
  const size = (el: OverpassElement) =>
    (el.bounds!.maxlon - el.bounds!.minlon) * (el.bounds!.maxlat - el.bounds!.minlat);
  const best = cands
    .filter(contains)
    .sort((a, b) => size(b) - size(a) || a.id - b.id)[0];
  return best ? { osmId: best.id, name: best.tags?.name ?? parentName, adminLevel: best.tags?.admin_level ?? null } : null;
}

/**
 * The boundary for a tree place among same-name candidates: one with a
 * polygon, not an excluded id (the parent itself, when a departamento and its
 * capital share a name), preferring one that contains the tree centroid, then
 * the largest (a same-name sub-unit is never the place itself), then the
 * lowest id, so the choice is stable across runs.
 */
export function pickBoundary(
  candidates: AreaCandidate[],
  treeName: string,
  centroid: LngLat | null,
  exclude: ReadonlySet<number> = new Set(),
): { pick: AreaCandidate; containsCentroid: boolean } | null {
  const named = candidates.filter(
    (c) => c.polygons.length > 0 && !exclude.has(c.osmId) && namesMatch(c.name, treeName),
  );
  if (named.length === 0) return null;
  const scored = named.map((c) => ({
    c,
    inside: centroid ? pointInPolygons(centroid, c.polygons) : false,
    area: c.polygons.reduce((s, p) => s + polygonArea(p), 0),
  }));
  scored.sort(
    (a, b) => Number(b.inside) - Number(a.inside) || b.area - a.area || a.c.osmId - b.c.osmId,
  );
  return { pick: scored[0].c, containsCentroid: scored[0].inside };
}

// ---------------------------------------------------------------------------
// Assembly into a geo file
// ---------------------------------------------------------------------------

export interface TreePlace {
  name: string;
  slug: string;
  lat?: number;
  lng?: number;
}

export interface BuildInput {
  city: TreePlace;
  /** The city's chosen boundary, or null (→ circle). */
  cityArea: AreaCandidate | null;
  barrios: TreePlace[];
  /** Every subdivision candidate the subdivisions query returned. */
  subdivisions: AreaCandidate[];
  context: OverpassResponse | null;
  fetchedAt: string;
}

export interface BuildReport {
  /** Tree places (city or barrio) drawn as circles, by full name. */
  circles: string[];
  /** Tree places with neither a polygon nor a tree centroid: not drawable. */
  undrawable: string[];
  /** Tree places whose matched outline does not contain the tree centroid. */
  centroidOutside: string[];
  adminLevels: Record<string, string | null>;
}

function toPlaceArea(c: AreaCandidate, slug: string, inTree: boolean, fetchedAt: string, toleranceM: number): PlaceArea | null {
  const polygons = simplifyPolygons(c.polygons, toleranceM);
  if (polygons.length === 0) return null;
  return {
    slug,
    osmId: c.osmId,
    osmType: c.osmType,
    name: c.name,
    adminLevel: c.adminLevel,
    inTree,
    fetchedAt,
    licence: OSM_LICENCE,
    polygons,
  };
}

function circleFor(p: TreePlace): PlaceCircle | null {
  if (p.lat === undefined || p.lng === undefined) return null;
  return { slug: p.slug, name: p.name, inTree: true, fallback: "circle", lat: p.lat, lng: p.lng };
}

function areaM2(ps: Polygon[]): number {
  if (ps.length === 0) return 0;
  return ps.reduce((s, p) => s + polygonArea(p), 0) * METRES_PER_DEGREE * METRES_PER_DEGREE;
}

/** The frame the context (water, roads) is fetched and clipped to. */
export function contextFrame(cityArea: AreaCandidate | null, city: TreePlace): BBox | null {
  if (cityArea && cityArea.polygons.length) {
    const b = bboxOf(polygonPoints(cityArea.polygons))!;
    const dx = (b.maxLng - b.minLng) * 0.25 + 0.01;
    const dy = (b.maxLat - b.minLat) * 0.25 + 0.01;
    return { minLng: b.minLng - dx, minLat: b.minLat - dy, maxLng: b.maxLng + dx, maxLat: b.maxLat + dy };
  }
  if (city.lat === undefined || city.lng === undefined) return null;
  const d = 0.06;
  return { minLng: city.lng - d, minLat: city.lat - d, maxLng: city.lng + d, maxLat: city.lat + d };
}

/**
 * Everything a city's geo file holds, from the parsed responses. Returns null
 * when the city itself is not drawable (no outline and no tree centroid).
 */
export function buildGeoFile(input: BuildInput): { file: GeoFile | null; report: BuildReport } {
  const { city, cityArea, fetchedAt } = input;
  const report: BuildReport = { circles: [], undrawable: [], centroidOutside: [], adminLevels: {} };
  const cityCentroid: LngLat | null = city.lat !== undefined && city.lng !== undefined ? [city.lng, city.lat] : null;

  let cityGeo: PlaceGeo | null = cityArea ? toPlaceArea(cityArea, city.slug, true, fetchedAt, TOLERANCE_M.boundary) : null;
  if (cityGeo && !("fallback" in cityGeo)) {
    report.adminLevels[city.name] = cityGeo.adminLevel;
    if (cityCentroid && !pointInPolygons(cityCentroid, cityGeo.polygons)) report.centroidOutside.push(city.name);
  }
  if (!cityGeo) {
    cityGeo = circleFor(city);
    if (cityGeo) report.circles.push(city.name);
    else {
      report.undrawable.push(city.name);
      return { file: null, report };
    }
  }

  // Subdivisions that really are inside this city and deeper than it.
  const cityPolys = cityArea?.polygons ?? [];
  const cityLevel = cityArea?.adminLevel ? Number(cityArea.adminLevel) : NaN;
  const inside = input.subdivisions.filter((s) => {
    if (cityArea && s.osmId === cityArea.osmId && s.osmType === cityArea.osmType) return false;
    if (s.polygons.length === 0 || !s.name) return false;
    const lvl = s.adminLevel ? Number(s.adminLevel) : NaN;
    if (Number.isFinite(cityLevel) && Number.isFinite(lvl) && lvl <= cityLevel) return false;
    if (cityPolys.length === 0) return true; // a circle city: the query was by name already
    const c = polygonsCentroid(s.polygons);
    return c !== null && pointInPolygons(c, cityPolys);
  });

  const barrios: PlaceGeo[] = [];
  const used = new Set<number>();
  for (const b of input.barrios) {
    const centroid: LngLat | null = b.lat !== undefined && b.lng !== undefined ? [b.lng, b.lat] : null;
    const picked = pickBoundary(inside, b.name, centroid, used);
    const area = picked ? toPlaceArea(picked.pick, b.slug, true, fetchedAt, TOLERANCE_M.boundary) : null;
    const label = `${city.name} / ${b.name}`;
    if (picked && area) {
      used.add(picked.pick.osmId);
      barrios.push(area);
      report.adminLevels[label] = area.adminLevel;
      if (centroid && !picked.containsCentroid) report.centroidOutside.push(label);
    } else {
      const circle = circleFor(b);
      if (circle) {
        barrios.push(circle);
        report.circles.push(label);
      } else report.undrawable.push(label);
    }
  }
  // Neighbours: every other subdivision, drawn for context, sorted by name.
  const neighbours = inside
    .filter((s) => !used.has(s.osmId))
    .sort((a, b) => a.name.localeCompare(b.name, "es") || a.osmId - b.osmId);
  const seenSlugs = new Set(barrios.map((b) => b.slug));
  for (const n of neighbours) {
    let slug = slugify(n.name);
    if (seenSlugs.has(slug)) slug = `${slug}-${n.osmId}`;
    // Context outlines only: coarser than the tree's own places, to keep the file small.
    const area = toPlaceArea(n, slug, false, fetchedAt, TOLERANCE_M.neighbour);
    if (!area) continue;
    seenSlugs.add(slug);
    barrios.push(area);
  }

  // Context: water and roads, clipped to the frame.
  const frame = contextFrame(cityArea, city);
  const water: WaterFeature[] = [];
  const roads: RoadFeature[] = [];
  if (input.context && frame) {
    for (const a of parseAreas(input.context)) {
      const isWater = a.tags.natural === "water" || a.tags.waterway === "riverbank";
      if (!isWater) continue;
      const clipped = clipPolygons(a.polygons, frame);
      if (areaM2(clipped) < MIN_WATER_M2) continue;
      const polygons = simplifyPolygons(clipped, TOLERANCE_M.water);
      if (polygons.length === 0) continue;
      water.push({ osmId: a.osmId, osmType: a.osmType, name: a.name, fetchedAt, licence: OSM_LICENCE, polygons });
    }
    for (const r of parseRoads(input.context)) {
      const lines = clipLine(r.line, frame)
        .map((l) => roundLine(simplifyLine(l, TOLERANCE_M.road)))
        .filter((l): l is LngLat[] => l !== null);
      if (lines.length === 0) continue;
      roads.push({ osmId: r.osmId, osmType: "way", name: r.name, highway: r.highway, fetchedAt, licence: OSM_LICENCE, lines });
    }
    water.sort((a, b) => a.osmId - b.osmId);
    roads.sort((a, b) => a.osmId - b.osmId);
  }

  return {
    file: {
      version: GEO_FILE_VERSION,
      citySlug: city.slug,
      source: OSM_SOURCE,
      licence: OSM_LICENCE,
      fetchedAt,
      city: cityGeo,
      barrios,
      water,
      roads,
    },
    report,
  };
}
