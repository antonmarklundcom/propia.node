/**
 * npm run verify:maps — pure checks for the zone maps
 * (docs/plan-category-pages-build.md phases 6–7). No database, no network: the
 * Overpass half is checked against hand-written fixtures below. In
 * verify:local and the pre-push hook.
 *
 * Covers: ring assembly, Douglas–Peucker bounds, Overpass JSON → features and
 * the geo file built from them, SVG determinism (hash), the circle fallback,
 * the badge present iff a type is set, the OpenStreetMap credit (in the image,
 * the dictionaries and the component), manifest lookup, and — for whatever is
 * committed — every geo file's licence/ids/size and every manifest entry's
 * files on disk.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { EVERGREEN_PAGES } from "../src/content/evergreen";
import { getDictionary } from "../src/i18n";
import { PROPERTY_TYPES } from "../src/lib/import/types";
import {
  assembleRings,
  clipRing,
  pointInPolygons,
  polygonsCentroid,
  segmentDistanceM,
  simplifyLine,
  simplifyRing,
  type LngLat,
  type Ring,
} from "../src/lib/zone-map/geometry";
import {
  EMPTY_MANIFEST,
  basePaths,
  entryFiles,
  lookupZoneMap,
  parseCategoryPath,
  parseManifest,
  perUrlPaths,
  type ZoneMapEntry,
  type ZoneMapManifest,
} from "../src/lib/zone-map/manifest";
import {
  GEO_FILE_BUDGET_BYTES,
  areaIdForRelation,
  buildGeoFile,
  cityQuery,
  nameRegex,
  namesMatch,
  parseAreas,
  parseRoads,
  pickBoundary,
  pickParentRelation,
  subdivisionsQuery,
  type OverpassElement,
  type OverpassResponse,
} from "../src/lib/zone-map/overpass";
import { zoneMapCities } from "../src/lib/zone-map/places";
import { IMAGE_CREDIT, TYPE_ICONS, renderZoneMapSvg } from "../src/lib/zone-map/svg";
import { isCircle, type GeoFile, type PlaceGeo } from "../src/lib/zone-map/types";
import { MANIFEST_PATH, PUBLIC_DIR, ROOT, publicFile, readGeoFiles } from "./maps-common";

let failed = 0;
let passed = 0;
function ok(name: string, cond: boolean, detail = ""): void {
  if (cond) passed++;
  else {
    failed++;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}
function eq(name: string, got: unknown, want: unknown): void {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  ok(name, g === w, `\n  got  ${g}\n  want ${w}`);
}
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

// ---------------------------------------------------------------------------
// 1. Ring assembly
// ---------------------------------------------------------------------------
{
  const A: LngLat = [0, 0];
  const B: LngLat = [1, 0];
  const C: LngLat = [1, 1];
  const D: LngLat = [0, 1];
  // A square split over three ways, out of order, one of them reversed.
  const { rings, open } = assembleRings([[C, D], [A, B], [A, D], [B, C]]);
  eq("assemble: one ring", rings.length, 1);
  eq("assemble: nothing open", open, 0);
  const r = rings[0] ?? [];
  ok("assemble: ring is closed", r.length > 0 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]);
  eq("assemble: 4 corners + closure", r.length, 5);
  const corners = new Set(r.slice(0, -1).map((p) => p.join(",")));
  eq("assemble: every corner once", [...corners].sort(), ["0,0", "0,1", "1,0", "1,1"]);

  const reversed = assembleRings([[A, B], [C, B], [C, D, A]]);
  eq("assemble: reversed member joins", [reversed.rings.length, reversed.open], [1, 0]);

  const broken = assembleRings([[A, B], [B, C], [[5, 5], [6, 6]]]);
  eq("assemble: unclosable chains are reported, not closed", [broken.rings.length, broken.open], [0, 2]);

  const closedWay = assembleRings([[A, B, C, D, A]]);
  eq("assemble: a closed way is a ring on its own", [closedWay.rings.length, closedWay.open], [1, 0]);

  const two = assembleRings([[A, B, C], [C, D, A], [[10, 10], [11, 10], [11, 11]], [[11, 11], [10, 10]]]);
  eq("assemble: two separate rings", [two.rings.length, two.open], [2, 0]);
}

// ---------------------------------------------------------------------------
// 2. Douglas–Peucker bounds
// ---------------------------------------------------------------------------
{
  // A wiggly line along latitude -25.3, deterministic "noise".
  const line: LngLat[] = [];
  for (let i = 0; i <= 400; i++) {
    const lng = -57.6 + i * 0.0005;
    const lat = -25.3 + Math.sin(i * 0.7) * 0.00002 + (i % 50 === 0 ? 0.002 : 0) + Math.sin(i / 40) * 0.003;
    line.push([lng, lat]);
  }
  const tol = 5;
  const simple = simplifyLine(line, tol);
  ok("simplify: fewer points", simple.length < line.length, `${simple.length} of ${line.length}`);
  ok("simplify: keeps both ends", simple[0] === line[0] && simple[simple.length - 1] === line[line.length - 1]);
  const originals = new Set(line);
  ok("simplify: every kept point is an original point", simple.every((p) => originals.has(p)));
  const k = Math.cos((-25.3 * Math.PI) / 180);
  let worst = 0;
  for (const p of line) {
    let best = Infinity;
    for (let i = 0; i < simple.length - 1; i++) best = Math.min(best, segmentDistanceM(p, simple[i], simple[i + 1], k));
    worst = Math.max(worst, best);
  }
  ok("simplify: no original point further than the tolerance", worst <= tol + 0.01, `worst ${worst.toFixed(2)} m`);
  ok("simplify: spikes above tolerance survive", simple.some((p) => p === line[100]));
  const straight: LngLat[] = [[-57.6, -25.3], [-57.59, -25.30001], [-57.58, -25.3]];
  eq("simplify: sub-tolerance bend collapses", simplifyLine(straight, 5).length, 2);
  eq("simplify: zero tolerance keeps everything", simplifyLine(line, 0).length, line.length);

  const ring: Ring = [];
  for (let i = 0; i < 200; i++) {
    const t = (i / 200) * Math.PI * 2;
    ring.push([-57.55 + Math.cos(t) * 0.02, -25.35 + Math.sin(t) * 0.02]);
  }
  ring.push(ring[0]);
  const sr = simplifyRing(ring, 10);
  ok("simplify ring: closed", sr[0] === sr[sr.length - 1]);
  ok("simplify ring: at least a triangle", sr.length >= 4);
  ok("simplify ring: fewer points", sr.length < ring.length);
  const tiny: Ring = [[0, 0], [0.00001, 0], [0.00001, 0.00001], [0, 0.00001], [0, 0]];
  eq("simplify ring: smaller than tolerance → original kept", simplifyRing(tiny, 50).length, tiny.length);

  const clipped = clipRing([[-1, -1], [3, -1], [3, 3], [-1, 3], [-1, -1]], { minLng: 0, minLat: 0, maxLng: 2, maxLat: 2 });
  ok("clip ring: inside the box", clipped !== null && clipped.every((p) => p[0] >= 0 && p[0] <= 2 && p[1] >= 0 && p[1] <= 2));
  eq("clip ring: disjoint → null", clipRing([[5, 5], [6, 5], [6, 6], [5, 5]], { minLng: 0, minLat: 0, maxLng: 2, maxLat: 2 }), null);
}

// ---------------------------------------------------------------------------
// 3. Overpass JSON → features → geo file (hand-written fixture)
// ---------------------------------------------------------------------------
const g = (pts: LngLat[]) => pts.map(([lon, lat]) => ({ lat, lon }));
const square = (w: number, s: number, e: number, n: number): LngLat[] => [[w, s], [e, s], [e, n], [w, n], [w, s]];
const rel = (id: number, tags: Record<string, string>, outer: LngLat[][], inner: LngLat[][] = []): OverpassElement => ({
  type: "relation",
  id,
  tags,
  members: [
    ...outer.map((pts, i) => ({ type: "way" as const, ref: id * 10 + i, role: "outer", geometry: g(pts) })),
    ...inner.map((pts, i) => ({ type: "way" as const, ref: id * 10 + 5 + i, role: "inner", geometry: g(pts) })),
    { type: "node" as const, ref: 1, role: "admin_centre" },
  ],
});
const way = (id: number, tags: Record<string, string>, pts: LngLat[]): OverpassElement => ({ type: "way", id, tags, geometry: g(pts) });

// Testville: a 0.1° square split over three member ways, with a hole.
const cityRes: OverpassResponse = {
  elements: [
    rel(
      100,
      { boundary: "administrative", admin_level: "8", name: "Distrito de Testville" },
      [
        [[-57.6, -25.4], [-57.5, -25.4], [-57.5, -25.3]],
        [[-57.6, -25.3], [-57.5, -25.3]],
        [[-57.6, -25.3], [-57.6, -25.4]],
      ],
      [square(-57.52, -25.32, -57.51, -25.31)],
    ),
    // A same-name, smaller unit inside it: never the city itself.
    rel(101, { boundary: "administrative", admin_level: "10", name: "Testville" }, [square(-57.56, -25.36, -57.54, -25.34)]),
    // The departamento, same name (the Paraguarí case): excluded as the parent.
    rel(50, { boundary: "administrative", admin_level: "4", name: "Testville" }, [square(-58, -26, -57, -25)]),
  ],
};
const subsRes: OverpassResponse = {
  elements: [
    rel(100, { boundary: "administrative", admin_level: "8", name: "Distrito de Testville" }, [square(-57.6, -25.4, -57.5, -25.3)]),
    rel(200, { boundary: "administrative", admin_level: "10", name: "Barrio Centro" }, [square(-57.58, -25.38, -57.56, -25.36)]),
    rel(201, { boundary: "administrative", admin_level: "10", name: "Norte" }, [square(-57.58, -25.33, -57.56, -25.31)]),
    rel(202, { boundary: "administrative", admin_level: "8", name: "Otra" }, [square(-57.7, -25.4, -57.6, -25.3)]),
    rel(203, { boundary: "administrative", admin_level: "10", name: "Afuera" }, [square(-57.68, -25.38, -57.66, -25.36)]),
  ],
};
const contextRes: OverpassResponse = {
  elements: [
    way(300, { natural: "water", name: "Laguna" }, square(-57.545, -25.345, -57.535, -25.335)),
    way(301, { natural: "water" }, square(-57.53, -25.33, -57.5299, -25.3299)),
    // A long river far wider than the frame: must be clipped.
    rel(302, { natural: "water", type: "multipolygon", name: "Río" }, [square(-58.5, -25.42, -56.5, -25.405)]),
    way(400, { highway: "primary", name: "Ruta Test" }, [[-58, -25.35], [-57.65, -25.35], [-57.55, -25.351], [-57.45, -25.35], [-57, -25.35]]),
    way(401, { highway: "residential", name: "Calle" }, [[-57.58, -25.37], [-57.57, -25.37]]),
  ],
};
{
  eq("name: prefix and accents ignored", namesMatch("Distrito de Asunción", "Asuncion"), true);
  eq("name: 'Barrio Jara' ↔ 'Jara'", namesMatch("Jara", "Barrio Jara"), true);
  eq("name: different places differ", namesMatch("Luque", "Limpio"), false);
  const re = nameRegex("Ñemby");
  ok("regex: anchored, accent class", re.startsWith("^") && re.endsWith("$") && re.includes("[nñNÑ]"), re);
  ok("regex: QL-escaped (no bare quote)", !nameRegex('Bad"Name').includes('"'));
  ok("regex: Guaraní nasal vowel matches", new RegExp(nameRegex("Loma Pytã").replace(/\\\\/g, "\\"), "i").test("Loma Pytã"));
  ok("regex: tree prefix is optional", new RegExp(nameRegex("Barrio Jara").replace(/\\\\/g, "\\"), "i").test("Jara"));
  ok("regex: OSM prefix accepted", new RegExp(nameRegex("Luque").replace(/\\\\/g, "\\"), "i").test("Distrito de Luque"));
  ok("regex: no partial match", !new RegExp(nameRegex("Luque").replace(/\\\\/g, "\\"), "i").test("Luque Norte"));
  ok("query: area id from relation id", cityQuery("Luque", 123).includes(`area(id:${areaIdForRelation(123)})`));
  ok("query: subdivisions only deeper levels", subdivisionsQuery(9, "8").includes('["admin_level"~"^(9|10|11|12)$"]'));
  ok("query: subdivisions unfiltered when level unknown", !subdivisionsQuery(9, null).includes("admin_level"));

  const areas = parseAreas(cityRes);
  eq("parse: three relations", areas.map((a) => a.osmId), [100, 101, 50]);
  const city = areas[0];
  eq("parse: outer assembled with its hole", [city.polygons.length, city.polygons[0].holes.length, city.openChains], [1, 1, 0]);
  eq("parse: admin_level recorded", city.adminLevel, "8");

  const pick = pickBoundary(areas, "Testville", [-57.55, -25.35], new Set([50]));
  eq("pick: the district, not the same-name sub-unit or the parent", pick?.pick.osmId, 100);
  eq("pick: centroid inside", pick?.containsCentroid, true);
  eq("pick: nothing by a wrong name", pickBoundary(areas, "Elsewhere", null), null);

  const parentRes: OverpassResponse = {
    elements: [
      { type: "relation", id: 50, tags: { name: "Departamento Central" }, bounds: { minlat: -26, minlon: -58, maxlat: -25, maxlon: -57 } },
      { type: "relation", id: 51, tags: { name: "Central" }, bounds: { minlat: -25.4, minlon: -57.6, maxlat: -25.3, maxlon: -57.5 } },
      { type: "relation", id: 52, tags: { name: "Central" }, bounds: { minlat: -30, minlon: -60, maxlat: -29, maxlon: -59 } },
    ],
  };
  eq("parent: largest same-name area holding the child", pickParentRelation(parentRes, "Central", [-57.55, -25.35])?.osmId, 50);

  eq("roads: only trunk/primary", parseRoads(contextRes).map((r) => r.osmId), [400]);

  const { file, report } = buildGeoFile({
    city: { name: "Testville", slug: "testville", lat: -25.35, lng: -57.55 },
    cityArea: city,
    barrios: [
      { name: "Centro", slug: "centro", lat: -25.37, lng: -57.57 },
      { name: "Sur", slug: "sur", lat: -25.39, lng: -57.55 },
      { name: "Sin Coordenadas", slug: "sin-coordenadas" },
    ],
    subdivisions: parseAreas(subsRes),
    context: contextRes,
    fetchedAt: "2026-10-03T00:00:00.000Z",
  });
  ok("build: a file", file !== null);
  if (file) {
    eq("build: city is the OSM area", [isCircle(file.city), (file.city as { osmId?: number }).osmId], [false, 100]);
    eq(
      "build: barrios = tree (matched, circle) then neighbours; outsiders and the city itself dropped",
      file.barrios.map((b) => [b.slug, b.inTree, isCircle(b)]),
      [["centro", true, false], ["sur", true, true], ["norte", false, false]],
    );
    eq("build: report circles", report.circles, ["Testville / Sur"]);
    eq("build: report undrawable", report.undrawable, ["Testville / Sin Coordenadas"]);
    eq("build: admin levels recorded", report.adminLevels, { Testville: "8", "Testville / Centro": "10" });
    eq("build: pond dropped, lake and clipped river kept", file.water.map((w) => w.osmId), [300, 302]);
    const river = file.water.find((w) => w.osmId === 302)!;
    ok("build: river clipped to the frame", river.polygons.every((p) => p.outer.every(([lng]) => lng > -57.8 && lng < -57.3)));
    eq("build: one road", file.roads.map((r) => r.osmId), [400]);
    ok("build: road clipped", file.roads[0].lines.every((l) => l.length >= 2 && l.length < 5));
    checkGeoFile("fixture", file);
  }
  const noCity = buildGeoFile({
    city: { name: "Nada", slug: "nada" },
    cityArea: null,
    barrios: [],
    subdivisions: [],
    context: null,
    fetchedAt: "2026-10-03T00:00:00.000Z",
  });
  eq("build: no polygon, no centroid → no file", [noCity.file, noCity.report.undrawable], [null, ["Nada"]]);
  const circleCity = buildGeoFile({
    city: { name: "Redonda", slug: "redonda", lat: -25.3, lng: -57.3 },
    cityArea: null,
    barrios: [],
    subdivisions: [],
    context: null,
    fetchedAt: "2026-10-03T00:00:00.000Z",
  });
  eq("build: no polygon → circle at the tree centroid", circleCity.file?.city, {
    slug: "redonda",
    name: "Redonda",
    inTree: true,
    fallback: "circle",
    lat: -25.3,
    lng: -57.3,
  });

  // -------------------------------------------------------------------------
  // 4. SVG
  // -------------------------------------------------------------------------
  if (file) {
    const a = renderZoneMapSvg(file, { citySlug: "testville", barrioSlug: "centro", type: "casa", operation: "Casas en venta" });
    const b = renderZoneMapSvg(JSON.parse(JSON.stringify(file)) as GeoFile, {
      citySlug: "testville",
      barrioSlug: "centro",
      type: "casa",
      operation: "Casas en venta",
    });
    eq("svg: deterministic (same input → same hash)", sha(a), sha(b));
    ok("svg: 4:3 viewBox", a.includes('viewBox="0 0 1200 900"'));
    ok("svg: og viewBox", renderZoneMapSvg(file, { citySlug: "testville" }, { variant: "og" }).includes('viewBox="0 0 1200 630"'));
    ok("svg: pixel width attribute", renderZoneMapSvg(file, { citySlug: "testville" }, { pixelWidth: 640 }).includes('width="640" height="480"'));
    ok("svg: badge present with a type", a.includes('data-badge="casa"') && a.includes("Casas en venta"));
    const noType = renderZoneMapSvg(file, { citySlug: "testville", barrioSlug: "centro", operation: "Casas en venta" });
    ok("svg: no badge without a type", !noType.includes("data-badge") && !noType.includes("Casas en venta"));
    ok("svg: credit in the image", a.includes(IMAGE_CREDIT) && noType.includes(IMAGE_CREDIT));
    ok("svg: zone label drawn", a.includes(">Barrio Centro</text>"));
    ok("svg: no NaN", !a.includes("NaN") && !noType.includes("NaN"));
    for (const t of PROPERTY_TYPES) {
      ok(`svg: icon for ${t}`, typeof TYPE_ICONS[t] === "string" && renderZoneMapSvg(file, { citySlug: "testville", type: t }).includes(`data-badge="${t}"`));
    }
    const circleZone = renderZoneMapSvg(file, { citySlug: "testville", barrioSlug: "sur" });
    ok("svg: circle fallback for a barrio without polygon", circleZone.includes("stroke-dasharray"));
    const tricky = JSON.parse(JSON.stringify(file)) as GeoFile;
    (tricky.barrios[0] as PlaceGeo).name = "A & B <x>";
    const escaped = renderZoneMapSvg(tricky, { citySlug: "testville", barrioSlug: "centro" });
    ok("svg: label text escaped", escaped.includes("A &amp; B &lt;x&gt;") && !escaped.includes("<x>"));
    let threw = false;
    try {
      renderZoneMapSvg(file, { citySlug: "other" });
    } catch {
      threw = true;
    }
    ok("svg: a ref for another city throws", threw);
  }
  if (circleCity.file) {
    const s = renderZoneMapSvg(circleCity.file, { citySlug: "redonda", type: "terreno", operation: "Terrenos en venta" });
    ok("svg: circle fallback for a city without polygon", s.includes("<circle") && s.includes("stroke-dasharray"));
    ok("svg: circle city still badged", s.includes('data-badge="terreno"'));
  }
}

// ---------------------------------------------------------------------------
// 5. Credit in the dictionaries and the component
// ---------------------------------------------------------------------------
{
  for (const locale of ["es", "en"] as const) {
    const d = getDictionary(locale);
    ok(`i18n ${locale}: credit names OpenStreetMap`, d.zoneMap.credit.includes("OpenStreetMap"));
    ok(`i18n ${locale}: alt names the zone and city`, d.zoneMap.alt("Villa Morra", "Asunción", "Casas", "venta").includes("Villa Morra"));
    ok(`i18n ${locale}: alt never empty`, d.zoneMap.alt("Luque", null, null, null).length > 0);
  }
  const src = readFileSync(path.join(ROOT, "src/components/ZoneMap.tsx"), "utf8");
  ok("component: renders the credit", src.includes("d.zoneMap.credit") && src.includes("OSM_COPYRIGHT_URL"));
  ok("component: alt from i18n", /alt=\{alt\}/.test(src) && src.includes("d.zoneMap.alt("));
  ok("component: srcset + lazy", src.includes("640w") && src.includes("1280w") && src.includes('loading="lazy"'));
}

// ---------------------------------------------------------------------------
// 6. Manifest lookup
// ---------------------------------------------------------------------------
{
  const base: ZoneMapEntry = {
    citySlug: "asuncion",
    barrioSlug: "villa-morra",
    operation: null,
    type: null,
    locale: null,
    name: "Villa Morra",
    cityName: "Asunción",
    ...basePaths("asuncion", "villa-morra"),
    og: null,
    badge: false,
  };
  const perUrl: ZoneMapEntry = {
    ...base,
    operation: "venta",
    type: "casa",
    locale: "es",
    ...perUrlPaths("asuncion", "villa-morra", "venta", "casa", "es"),
    badge: true,
  };
  const m: ZoneMapManifest = { version: 1, entries: [base, perUrl] };
  const at = (o: Partial<Parameters<typeof lookupZoneMap>[1]>) =>
    lookupZoneMap(m, { citySlug: "asuncion", barrioSlug: "villa-morra", locale: "es", ...o });
  eq("manifest: exact per-URL hit, no overlay", [at({ operation: "venta", type: "casa" })?.entry.src640, at({ operation: "venta", type: "casa" })?.overlay], [perUrl.src640, false]);
  eq("manifest: other type → base + overlay", [at({ operation: "venta", type: "terreno" })?.entry.src640, at({ operation: "venta", type: "terreno" })?.overlay], [base.src640, true]);
  eq("manifest: other locale → base + overlay", at({ operation: "venta", type: "casa", locale: "en" })?.overlay, true);
  eq("manifest: place page (no type) → base, no overlay", at({})?.overlay, false);
  eq("manifest: unknown barrio → nothing", at({ barrioSlug: "recoleta" }), null);
  eq("manifest: empty → nothing", lookupZoneMap(EMPTY_MANIFEST, { citySlug: "asuncion", locale: "es" }), null);
  eq("manifest: per-URL file names", perUrl.src640, "/img/maps/asuncion/villa-morra/venta-casas-640.webp");
  eq("manifest: English badge gets its own files", perUrlPaths("luque", null, "venta", "casa", "en").og, "/img/maps/luque/venta-casas-en-og.webp");
  eq("manifest: typeless page reuses the base images", perUrlPaths("asuncion", null, "alquiler", null, "es").src640, basePaths("asuncion").src640);
  eq("manifest: a broken file reads as empty", parseManifest({ version: 9 }), EMPTY_MANIFEST);
  for (const p of EVERGREEN_PAGES) ok(`evergreen path parses: ${p.path}`, parseCategoryPath(p.path) !== null);
}

// ---------------------------------------------------------------------------
// 7. What is committed: tree, geo files, manifest, images
// ---------------------------------------------------------------------------
const GEO_BUDGET_BYTES = GEO_FILE_BUDGET_BYTES;
const IMAGES_BUDGET_BYTES = 25 * 1024 * 1024;

function checkGeoFile(label: string, geo: GeoFile): void {
  const features = [
    ...(isCircle(geo.city) ? [] : [geo.city]),
    ...geo.barrios.filter((b) => !isCircle(b)),
    ...geo.water,
    ...geo.roads,
  ] as { osmId: number; osmType: string; licence: string; fetchedAt: string; name: string }[];
  ok(`${label}: file licence`, geo.licence === "ODbL-1.0");
  ok(
    `${label}: every feature has licence, OSM id, type, name, fetchedAt`,
    features.every(
      (f) => f.licence === "ODbL-1.0" && Number.isInteger(f.osmId) && (f.osmType === "relation" || f.osmType === "way") && typeof f.name === "string" && !!f.fetchedAt,
    ),
  );
  const coords = JSON.stringify(geo).match(/-?\d+\.\d+/g) ?? [];
  ok(`${label}: coordinates at most 5 decimals`, coords.every((c) => c.split(".")[1].length <= 5));
  ok(`${label}: circles carry a centroid`, [geo.city, ...geo.barrios].every((p) => !isCircle(p) || (Number.isFinite(p.lat) && Number.isFinite(p.lng))));
  if (!isCircle(geo.city)) {
    for (const b of geo.barrios) {
      if (isCircle(b) || !b.inTree) continue;
      const c = polygonsCentroid(b.polygons);
      ok(`${label}: barrio ${b.slug} lies inside its city`, c !== null && pointInPolygons(c, geo.city.polygons));
    }
  }
}

{
  const slugs = zoneMapCities().map((c) => c.slug);
  eq("tree: city slugs are unique", slugs.length, new Set(slugs).size);

  const geos = readGeoFiles();
  for (const geo of geos) {
    const file = path.join(ROOT, "src/content/places/geo", `${geo.citySlug}.json`);
    const size = statSync(file).size;
    ok(`geo ${geo.citySlug}: under ${GEO_BUDGET_BYTES / 1024} KB`, size <= GEO_BUDGET_BYTES, `${(size / 1024).toFixed(1)} KB`);
    ok(`geo ${geo.citySlug}: a tree city`, slugs.includes(geo.citySlug));
    checkGeoFile(`geo ${geo.citySlug}`, geo);
  }

  ok("manifest: committed file exists", existsSync(MANIFEST_PATH));
  const raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const manifest = parseManifest(raw);
  ok("manifest: committed file is a valid manifest", (raw as { version?: number }).version === 1 && Array.isArray((raw as { entries?: unknown }).entries));
  const geoSlugs = new Set(geos.map((g) => g.citySlug));
  for (const e of manifest.entries) {
    ok(`manifest: ${e.citySlug} has a geo file`, geoSlugs.has(e.citySlug));
    for (const f of entryFiles(e)) ok(`manifest: ${f} exists`, existsSync(publicFile(f)));
  }
  // The GeoJSON is never served: app code may import the manifest and nothing else from the geo folder.
  const offenders: string[] = [];
  const scan = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) scan(p);
      else if (/\.(ts|tsx|js|mjs)$/.test(name)) {
        const text = readFileSync(p, "utf8");
        for (const m of text.matchAll(/places\/geo\/([\w.-]+)/g)) {
          if (m[1] !== "maps-manifest.json" && m[1] !== "README.md") offenders.push(`${path.relative(ROOT, p)} → ${m[0]}`);
        }
      }
    }
  };
  scan(path.join(ROOT, "app"));
  scan(path.join(ROOT, "src"));
  eq("geo files are never imported by app code", offenders, []);
  ok("no geo data under public/", !existsSync(path.join(PUBLIC_DIR, "img/maps")) || !JSON.stringify(readdirSync(path.join(PUBLIC_DIR, "img/maps"), { recursive: true })).includes(".json"));

  const mapsDir = path.join(PUBLIC_DIR, "img/maps");
  let total = 0;
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else total += st.size;
    }
  };
  walk(mapsDir);
  ok(`public/img/maps under ${IMAGES_BUDGET_BYTES / 1024 / 1024} MB`, total <= IMAGES_BUDGET_BYTES, `${(total / 1024 / 1024).toFixed(1)} MB`);
}

if (failed) {
  console.error(`verify:maps — ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`verify:maps — OK (${passed} checks)`);
