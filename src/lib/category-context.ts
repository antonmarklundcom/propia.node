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
 *   redirect. An evergreen page (`src/content/evergreen/`) is indexable on its
 *   owner door at any count, so the caller hands in that door's evergreen
 *   paths and they are linked even at 0 — with no count shown.
 */
import { getIndexability } from "./indexability";
import { categoryUrl, parseCategorySegments, parseOperation } from "./urls";
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
  /** Paths evergreen on this door (`evergreenPathsFor(door)`): indexable at any count. */
  evergreen: ReadonlySet<string> = new Set(),
): RelatedGroups {
  const t = tally(rows, byId);
  const linkable = (href: string, count: number, parentIndexable?: boolean) =>
    evergreen.has(href) || indexable(count, parentIndexable);
  // Evergreen city/type (or city) pages for this operation, by city id — the
  // ones the tally cannot see when they have no stock.
  const cityIdBySlug = new Map<string, number>();
  for (const l of byId.values()) if (l.level === "ciudad") cityIdBySlug.set(l.slug, l.id);
  const evergreenCells: { cityId: number; type: PropertyType | null; href: string }[] = [];
  for (const href of evergreen) {
    const [opSeg, ...rest] = href.split("/").filter(Boolean);
    if (parseOperation(opSeg ?? "") !== page.operation) continue;
    const shape = parseCategorySegments(rest);
    if (!shape || shape.kind === "barrio-type") continue;
    const cityId = cityIdBySlug.get(shape.citySlug);
    if (cityId == null) continue;
    evergreenCells.push({ cityId, type: shape.kind === "city-type" ? shape.type : null, href });
  }
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
      const href = categoryUrl({ operation: op, citySlug, type });
      if (!linkable(href, n)) continue;
      if (page.type == null && page.barrioId == null && narrowsNothing(n)) continue;
      types.push({ href, count: n, type, place: city!.name });
    }
    for (const cell of evergreenCells) {
      if (cell.cityId !== page.cityId || cell.type == null || cell.type === page.type) continue;
      if (types.some((l) => l.href === cell.href)) continue;
      types.push({ href: cell.href, count: 0, type: cell.type, place: city!.name });
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
      const parentIndexable = linkable(
        categoryUrl({ operation: op, citySlug, type }),
        t.cityType.get(`${page.cityId}|${type}`) ?? 0,
      );
      const href = categoryUrl({ operation: op, citySlug, barrioSlug: barrio.slug, type });
      if (!linkable(href, n, parentIndexable)) continue;
      barrios.push({
        href,
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
      const slug = byId.get(Number(cityId))?.slug;
      const href = slug ? categoryUrl({ operation: op, citySlug: slug, type: page.type }) : "";
      if (linkable(href, n)) candidates.push({ id: Number(cityId), count: n });
    }
  } else {
    for (const [cityId, n] of t.city) {
      if (cityId === page.cityId) continue;
      const slug = byId.get(cityId)?.slug;
      const href = slug ? categoryUrl({ operation: op, citySlug: slug }) : "";
      if (linkable(href, n)) candidates.push({ id: cityId, count: n });
    }
  }
  for (const cell of evergreenCells) {
    if (cell.cityId === page.cityId || cell.type !== page.type) continue;
    if (candidates.some((c) => c.id === cell.cityId)) continue;
    candidates.push({ id: cell.cityId, count: 0 });
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

/**
 * Cities with stock of the page's type (every type on an untyped page) for
 * the operation, nearest first — what an evergreen page at 0 stock shows
 * instead of an empty grid, clearly labelled as nearby. Any count counts
 * here: these are listings to look at, not links into thin pages.
 */
export function nearbyStockedCities(
  rows: InventoryRow[],
  byId: Map<number, InventoryLocation>,
  page: CategoryPageRef,
  limit = 3,
): { id: number; count: number }[] {
  const t = tally(rows, byId);
  const out: { id: number; count: number }[] = [];
  if (page.type != null) {
    for (const [key, n] of t.cityType) {
      const [cityId, type] = key.split("|");
      if (type === page.type && Number(cityId) !== page.cityId && n > 0)
        out.push({ id: Number(cityId), count: n });
    }
  } else {
    for (const [cityId, n] of t.city) if (cityId !== page.cityId && n > 0) out.push({ id: cityId, count: n });
  }
  return out.sort(byProximity(byId.get(page.cityId), byId)).slice(0, limit);
}

/** The link groups an empty category page offers (E-1), each with real stock. */
export interface EmptyStateLinks {
  /** The same type nearby: other barrios of this city, then the city/type page. */
  sameTypeHere: RelatedLink[];
  /** The same place and type in another operation (alquiler ↔ venta). */
  otherOperation: (RelatedLink & { operation: Operation })[];
  /** Other types in this city (or barrio) for this operation. */
  otherTypes: RelatedLink[];
}

const MAX_EMPTY_LINKS = 6;

/**
 * Where an empty category page (0 listings, E-1) sends the visitor next.
 * Unlike `relatedCategoryLinks()`, a link here only needs **at least one
 * listing**, not indexability: the page itself is noindex, and a visitor who
 * found nothing wants the nearest real stock, not the nearest indexable URL.
 * Every target is a valid category page, so none of them 404s or redirects.
 *
 * `otherOps` carries the door's inventory for the other operation(s) the
 * page offers — the caller reads it from the same cached aggregate.
 */
export function emptyStateLinks(
  rows: InventoryRow[],
  otherOps: { operation: Operation; rows: InventoryRow[] }[],
  byId: Map<number, InventoryLocation>,
  page: CategoryPageRef,
): EmptyStateLinks {
  const city = byId.get(page.cityId);
  const barrio = page.barrioId != null ? byId.get(page.barrioId) : undefined;
  const out: EmptyStateLinks = { sameTypeHere: [], otherOperation: [], otherTypes: [] };
  if (!city) return out;
  const t = tally(rows, byId);
  const op = page.operation;

  // 1. The same type here: sibling barrios (nearest first), then the city page.
  if (page.type != null) {
    const siblings: { id: number; count: number }[] = [];
    for (const [key, n] of t.barrioType) {
      const [idStr, type] = key.split("|");
      const id = Number(idStr);
      if (type !== page.type || id === page.barrioId || n < 1) continue;
      if (byId.get(id)?.parentId !== page.cityId) continue;
      siblings.push({ id, count: n });
    }
    siblings.sort(byProximity(barrio ?? city, byId));
    for (const s of siblings.slice(0, MAX_EMPTY_LINKS - 1)) {
      const b = byId.get(s.id)!;
      out.sameTypeHere.push({
        href: categoryUrl({ operation: op, citySlug: city.slug, barrioSlug: b.slug, type: page.type }),
        count: s.count,
        type: page.type,
        place: b.name,
      });
    }
    const cityTypeCount = t.cityType.get(`${page.cityId}|${page.type}`) ?? 0;
    if (page.barrioId != null && cityTypeCount > 0) {
      out.sameTypeHere.push({
        href: categoryUrl({ operation: op, citySlug: city.slug, type: page.type }),
        count: cityTypeCount,
        type: page.type,
        place: city.name,
      });
    }
  }

  // 2. The same place and type in the other operation(s).
  for (const other of otherOps) {
    if (other.operation === op) continue;
    const o = tally(other.rows, byId);
    const here =
      barrio && page.type != null
        ? { n: o.barrioType.get(`${barrio.id}|${page.type}`) ?? 0, barrioSlug: barrio.slug, place: barrio.name }
        : null;
    const cityN =
      page.type != null ? (o.cityType.get(`${page.cityId}|${page.type}`) ?? 0) : (o.city.get(page.cityId) ?? 0);
    if (here && here.n > 0) {
      out.otherOperation.push({
        operation: other.operation,
        href: categoryUrl({ operation: other.operation, citySlug: city.slug, barrioSlug: here.barrioSlug, type: page.type! }),
        count: here.n,
        type: page.type,
        place: here.place,
      });
    } else if (cityN > 0) {
      out.otherOperation.push({
        operation: other.operation,
        href: categoryUrl({ operation: other.operation, citySlug: city.slug, type: page.type ?? undefined }),
        count: cityN,
        type: page.type,
        place: city.name,
      });
    }
  }

  // 3. Other types here, most stock first.
  const typeCounts: { type: PropertyType; count: number }[] = [];
  if (barrio) {
    for (const [key, n] of t.barrioType) {
      const [idStr, type] = key.split("|") as [string, PropertyType];
      if (Number(idStr) === barrio.id && type !== page.type && n > 0) typeCounts.push({ type, count: n });
    }
  } else {
    for (const [key, n] of t.cityType) {
      const [idStr, type] = key.split("|") as [string, PropertyType];
      if (Number(idStr) === page.cityId && type !== page.type && n > 0) typeCounts.push({ type, count: n });
    }
  }
  typeCounts.sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
  for (const { type, count } of typeCounts.slice(0, MAX_EMPTY_LINKS)) {
    out.otherTypes.push({
      href: categoryUrl({ operation: op, citySlug: city.slug, barrioSlug: barrio?.slug, type }),
      count,
      type,
      place: barrio?.name ?? city.name,
    });
  }
  return out;
}
