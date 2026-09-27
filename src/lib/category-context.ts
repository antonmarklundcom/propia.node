/**
 * What a category page can truthfully say about itself, and where it can
 * honestly link — derived from one grouped inventory read
 * (`getCategoryInventory()` in `category-inventory.ts`).
 *
 * Pure: no `next/*`, no drizzle, no request. The page hands in the door's
 * inventory for one operation and the location table it already loaded, and
 * gets back facts (for the intro paragraph) and related links. That split is
 * what lets `npm run verify:seo` drive the link rule without a database.
 *
 * Two rules this module exists to keep:
 *
 * - **Every number is a count of real rows on this door.** The inventory is
 *   read through the door's `filters` (`verticalConds()`), so a terreno-only
 *   door never learns that casas exist and cannot state or link them.
 * - **A related link only ever points at a page that is indexable on this
 *   door** — the same `getIndexability()` rule the target page and the sitemap
 *   apply (`src/lib/indexability.ts`), including the barrio page's
 *   parent-indexable requirement. A link into a noindex page spends a crawl on
 *   a URL we asked Google to ignore; a link into a `gone` page is a 404 or a
 *   redirect.
 */
import { getIndexability } from "./indexability";
import { categoryUrl } from "./urls";
import type { Operation, PropertyType } from "./import/types";

/** One `(location, type)` cell of the door's published inventory. */
export interface InventoryRow {
  locationId: number;
  propertyType: PropertyType;
  count: number;
  /** `price_usd` bounds over the cell — the normalised column filters use. */
  minUsd: number;
  maxUsd: number;
}

/** The slice of a `locations` row this module reads. */
export interface InventoryLocation {
  id: number;
  name: string;
  slug: string;
  level: string;
  parentId: number | null;
  lat: string | number | null;
  lng: string | number | null;
}

export interface CategoryPageRef {
  operation: Operation;
  cityId: number;
  barrioId: number | null;
  type: PropertyType | null;
}

export interface CategoryFacts {
  count: number;
  minUsd: number | null;
  maxUsd: number | null;
  /** Distinct barrios with at least one listing — city pages only, else 0. */
  barrioCount: number;
  /** Listing count per type, most common first — pages without a type only. */
  types: { type: PropertyType; count: number }[];
}

export interface RelatedLink {
  href: string;
  count: number;
  type: PropertyType | null;
  /** City or barrio name the link is about. */
  place: string;
}

export interface RelatedGroups {
  /** Other types in the same city (city/type pages). */
  types: RelatedLink[];
  /** Barrio/type pages under this city. */
  barrios: RelatedLink[];
  /** The same type (or all types) in other cities. */
  cities: RelatedLink[];
}

const MAX_CITY_LINKS = 8;
const MAX_BARRIO_LINKS = 12;

const indexable = (count: number, parentIndexable?: boolean) =>
  getIndexability({ listingCount: count, parentIndexable }).state === "index";

/**
 * The city a location counts toward: itself when it is a ciudad, its parent
 * when that parent is one. The same walk `getOperationHubData()` and the
 * sitemap use, so the three never disagree about which city a row is in.
 */
export function cityIdOf(
  locationId: number,
  byId: Map<number, InventoryLocation>,
): number | null {
  const loc = byId.get(locationId);
  if (!loc) return null;
  if (loc.level === "ciudad") return loc.id;
  if (loc.parentId != null && byId.get(loc.parentId)?.level === "ciudad")
    return loc.parentId;
  return null;
}

/** Aggregated counts, keyed the way the three category shapes are addressed. */
interface Tally {
  city: Map<number, number>;
  cityType: Map<string, number>;
  barrioType: Map<string, number>;
}

function bump<K>(m: Map<K, number>, k: K, n: number): void {
  m.set(k, (m.get(k) ?? 0) + n);
}

function tally(
  rows: InventoryRow[],
  byId: Map<number, InventoryLocation>,
): Tally {
  const t: Tally = { city: new Map(), cityType: new Map(), barrioType: new Map() };
  for (const r of rows) {
    const cityId = cityIdOf(r.locationId, byId);
    if (cityId == null) continue;
    bump(t.city, cityId, r.count);
    bump(t.cityType, `${cityId}|${r.propertyType}`, r.count);
    if (byId.get(r.locationId)?.level === "barrio") {
      bump(t.barrioType, `${r.locationId}|${r.propertyType}`, r.count);
    }
  }
  return t;
}

/** Rows that belong to the page's own listing set. */
function pageRows(
  rows: InventoryRow[],
  byId: Map<number, InventoryLocation>,
  page: CategoryPageRef,
): InventoryRow[] {
  return rows.filter(
    (r) =>
      (page.type == null || r.propertyType === page.type) &&
      (page.barrioId != null
        ? r.locationId === page.barrioId
        : cityIdOf(r.locationId, byId) === page.cityId),
  );
}

export function categoryFacts(
  rows: InventoryRow[],
  byId: Map<number, InventoryLocation>,
  page: CategoryPageRef,
): CategoryFacts {
  const mine = pageRows(rows, byId, page);
  let count = 0;
  let minUsd: number | null = null;
  let maxUsd: number | null = null;
  const barrios = new Set<number>();
  const types = new Map<PropertyType, number>();
  for (const r of mine) {
    if (r.count <= 0) continue;
    count += r.count;
    // A zero price is "a consultar" or a data-entry gap, not a price: it would
    // turn "from US$ 0" into a claim nobody listed.
    if (r.minUsd > 0) minUsd = minUsd == null ? r.minUsd : Math.min(minUsd, r.minUsd);
    if (r.maxUsd > 0) maxUsd = maxUsd == null ? r.maxUsd : Math.max(maxUsd, r.maxUsd);
    if (byId.get(r.locationId)?.level === "barrio") barrios.add(r.locationId);
    types.set(r.propertyType, (types.get(r.propertyType) ?? 0) + r.count);
  }
  return {
    count,
    minUsd,
    maxUsd,
    barrioCount: page.barrioId == null ? barrios.size : 0,
    types:
      page.type == null
        ? [...types.entries()]
            .map(([type, n]) => ({ type, count: n }))
            .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type))
        : [],
  };
}

function coord(v: string | number | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Nearest first when both cities have a centroid, then by stock. Squared
 * degree distance is enough to *order* cities inside one country; nothing
 * here prints a distance.
 */
function byProximity(
  from: InventoryLocation | undefined,
  byId: Map<number, InventoryLocation>,
) {
  const fLat = coord(from?.lat ?? null);
  const fLng = coord(from?.lng ?? null);
  const dist = (id: number) => {
    const l = byId.get(id);
    const lat = coord(l?.lat ?? null);
    const lng = coord(l?.lng ?? null);
    if (fLat == null || fLng == null || lat == null || lng == null) return Infinity;
    return (lat - fLat) ** 2 + (lng - fLng) ** 2;
  };
  return (a: { id: number; count: number }, b: { id: number; count: number }) =>
    dist(a.id) - dist(b.id) || b.count - a.count;
}

/**
 * Related category links for a page, every one of them indexable on this
 * door. The current page never links to itself, and a "narrower" link that
 * would show exactly the same listings (a terreno-only door's
 * `/venta/luque` → `/venta/luque/terrenos`) is dropped: it is the same page
 * under a second URL, not a related one.
 */
export function relatedCategoryLinks(
  rows: InventoryRow[],
  byId: Map<number, InventoryLocation>,
  page: CategoryPageRef,
): RelatedGroups {
  const t = tally(rows, byId);
  const op = page.operation;
  const city = byId.get(page.cityId);
  const citySlug = city?.slug;
  // A link to a page *under* this one (a type under an untyped city page, a
  // barrio under a city page) that holds every listing this page holds is
  // this page under a second URL. Barrio pages have nothing under them.
  const ownCount =
    page.barrioId != null
      ? null
      : page.type == null
        ? (t.city.get(page.cityId) ?? 0)
        : (t.cityType.get(`${page.cityId}|${page.type}`) ?? 0);
  const narrowsNothing = (n: number) => ownCount != null && n === ownCount;

  // 1. Other types in this city — /{op}/{city}/{type}.
  const types: RelatedLink[] = [];
  if (citySlug) {
    for (const [key, n] of t.cityType) {
      const [cityId, type] = key.split("|") as [string, PropertyType];
      if (Number(cityId) !== page.cityId) continue;
      if (type === page.type) continue;
      if (!indexable(n)) continue;
      if (page.type == null && page.barrioId == null && narrowsNothing(n)) continue;
      types.push({
        href: categoryUrl({ operation: op, citySlug, type }),
        count: n,
        type,
        place: city!.name,
      });
    }
    types.sort((a, b) => b.count - a.count || a.href.localeCompare(b.href));
  }

  // 2. Barrio pages under this city — /{op}/{city}/{barrio}/{type}. A barrio
  //    page is indexable only while its city/type parent is (the rule the
  //    page itself and the sitemap apply), and only the page's own type when
  //    it has one.
  const barrios: RelatedLink[] = [];
  if (citySlug) {
    for (const [key, n] of t.barrioType) {
      const [barrioIdStr, type] = key.split("|") as [string, PropertyType];
      const barrioId = Number(barrioIdStr);
      const barrio = byId.get(barrioId);
      if (!barrio || barrio.parentId !== page.cityId) continue;
      if (page.type != null && type !== page.type) continue;
      if (barrioId === page.barrioId) continue;
      if (narrowsNothing(n)) continue;
      const parentIndexable = indexable(t.cityType.get(`${page.cityId}|${type}`) ?? 0);
      if (!indexable(n, parentIndexable)) continue;
      barrios.push({
        href: categoryUrl({ operation: op, citySlug, barrioSlug: barrio.slug, type }),
        count: n,
        type,
        place: barrio.name,
      });
    }
    barrios.sort((a, b) => b.count - a.count || a.href.localeCompare(b.href));
    barrios.splice(MAX_BARRIO_LINKS);
  }

  // 3. The same type — or every type, on an untyped page — in other cities.
  const candidates: { id: number; count: number }[] = [];
  if (page.type != null) {
    for (const [key, n] of t.cityType) {
      const [cityId, type] = key.split("|");
      if (type !== page.type || Number(cityId) === page.cityId) continue;
      if (indexable(n)) candidates.push({ id: Number(cityId), count: n });
    }
  } else {
    for (const [cityId, n] of t.city) {
      if (cityId === page.cityId) continue;
      if (indexable(n)) candidates.push({ id: cityId, count: n });
    }
  }
  candidates.sort(byProximity(city, byId));
  const cities: RelatedLink[] = [];
  for (const c of candidates.slice(0, MAX_CITY_LINKS)) {
    const other = byId.get(c.id);
    if (!other) continue;
    cities.push({
      href: categoryUrl({ operation: op, citySlug: other.slug, type: page.type ?? undefined }),
      count: c.count,
      type: page.type,
      place: other.name,
    });
  }

  return { types, barrios, cities };
}
