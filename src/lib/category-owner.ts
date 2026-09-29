/**
 * Category-page ownership — the pure half (decision S8,
 * docs/plan-seo-doors-2026-09-27.md §7).
 *
 * `ownsCategories` on a door says whether its `/{operacion}/{ciudad}[/{barrio}]
 * [/{tipo}]` pages are canonical there. A door that does not own them
 * canonicalises each one to the EQUIVALENT page on the door that does, and
 * "equivalent" means "lists the same rows" — which is a function of the door's
 * filters and the path, and nothing else. That function lives here, with no
 * `next/*` and no drizzle, so `npm run verify:seo` can drive it against
 * synthetic door tables. The request-scoped half (`hostOwnsCategories()`,
 * `categoryCanonicalOrigin()`) is in `origin.ts`, the same split as
 * `brand.ts` / `brand-server.ts`.
 *
 * Nothing here changes any door while the flag is unset everywhere: unset
 * means `true`.
 */
import type { VerticalConfig, VerticalKey } from "@/config/verticals";
import type { Operation, PropertyType } from "./import/types";
import { categoryUrl, parseCategorySegments, parseOperation, type CategoryShape } from "./urls";

/** Unset = true. The one place the default is spelled. */
export function ownsCategoryPages(config: VerticalConfig): boolean {
  return config.ownsCategories !== false;
}

function doorTypes(config: VerticalConfig): PropertyType[] {
  return (config.filters?.property_type ?? []) as PropertyType[];
}

/** Whether the door's `operation` filter admits this operation at all. */
function servesOperation(config: VerticalConfig, operation: Operation): boolean {
  const ops = config.filters?.operation;
  return !ops || ops.includes(operation);
}

/**
 * The page on the owning door that lists the same rows as `shape` does on
 * `feeder`, or `null` when there is none: the page is empty on the feeder
 * (its operation filter excludes it, or the path's type is outside its type
 * filter), or the feeder's untyped page spans several types and no single
 * owner page is that set — such a page is noindex, not canonicalised to a
 * page that shows different rows.
 *
 * `foreign_exposure` is deliberately not part of the path: an owner that
 * shows more rows than the feeder (or fewer, by opted-out listings) is a
 * near-duplicate, which is what a canonical is for.
 */
export function equivalentCategoryPath(
  feeder: VerticalConfig,
  shape: CategoryShape,
  operation: Operation,
): string | null {
  const types = doorTypes(feeder);
  if (!servesOperation(feeder, operation)) return null;
  if (shape.kind !== "city" && types.length > 0 && !types.includes(shape.type)) {
    return null;
  }
  let type: PropertyType | undefined;
  if (shape.kind === "city") {
    if (types.length > 1) return null;
    // A single-type door's untyped page IS that type's page.
    type = types.length === 1 ? types[0] : undefined;
  } else {
    type = shape.type;
  }
  return categoryUrl({
    operation,
    citySlug: shape.citySlug,
    barrioSlug: shape.kind === "barrio-type" ? shape.barrioSlug : undefined,
    type,
  });
}

/**
 * Identifies the SET OF ROWS a category page lists on a door: operation ×
 * place × property types, `foreign_exposure` ignored (see above). Two pages —
 * on one door or two — with the same signature in the same language are the
 * same content, so at most one of them may own it. `null` = the page lists
 * nothing on this door (the operation or type is filtered out), so it cannot
 * duplicate anything.
 */
export function listingSetSignature(
  config: VerticalConfig,
  shape: CategoryShape,
  operation: Operation,
): string | null {
  if (!servesOperation(config, operation)) return null;
  const types = doorTypes(config);
  let typeKey: string;
  if (shape.kind === "city") {
    typeKey = types.length ? [...types].sort().join(",") : "*";
  } else {
    if (types.length > 0 && !types.includes(shape.type)) return null;
    typeKey = shape.type;
  }
  const place =
    shape.kind === "barrio-type"
      ? `${shape.citySlug}/${shape.barrioSlug}`
      : shape.citySlug;
  return `${operation}|${place}|${typeKey}`;
}

/**
 * The host that owns category pages in `locale`, over an explicit table so
 * `verify:seo` can drive synthetic ones. Only marketplace-family doors that
 * are served (enabled, or a `preferred` host — the primary is served whatever
 * its row says) and have not opted out are candidates; among them the first
 * `preferred` host wins (the marketplace primary, then the canonical host),
 * then declaration order. Falls back to `fallback` — the primary — when no
 * candidate exists, as `detailOwnerForLocale()` does.
 */
export function categoryOwnerHost(
  table: Record<string, VerticalConfig>,
  locale: VerticalConfig["locale"],
  preferred: string[],
  fallback: string,
): string {
  const candidates = Object.entries(table)
    .filter(
      ([host, v]) =>
        (v.enabled || preferred.includes(host)) &&
        v.family === "marketplace" &&
        v.locale === locale &&
        ownsCategoryPages(v),
    )
    .map(([host]) => host);
  return preferred.find((h) => candidates.includes(h)) ?? candidates[0] ?? fallback;
}

/* ------------------------------------------------------------------------ *
 * Evergreen ownership precedence (decision S1(a), 2026-09-29).
 *
 * An evergreen page (src/content/evergreen/) names its OWNER door. That
 * ownership beats `ownsCategories`, in both directions:
 *
 *  1. A door that opted out of categories still owns its own evergreen paths:
 *     they stay self-canonical, indexable and in its sitemap
 *     (terreno.com.py's land pages, founder decision S9).
 *  2. Every OTHER same-locale marketplace door that serves the same path with
 *     the same listing set canonicalises to the evergreen owner's URL and
 *     leaves its sitemap — otherwise the owner's page and the marketplace's
 *     `/venta/<ciudad>/terrenos` would be one set of rows on two
 *     self-canonical URLs.
 *  3. An equivalent-page canonical never lands on a page that itself
 *     canonicalises elsewhere: if the equivalent path is evergreen-owned by
 *     another door, the canonical goes straight to that owner.
 *
 * This is the one place the rule is spelled; the page (`origin.ts`), the
 * sitemap and `verify:seo` all read it.
 * ------------------------------------------------------------------------ */

/** The minimal shape of a registry entry — `EvergreenPage` satisfies it. */
export interface EvergreenRef {
  path: string;
  door: VerticalKey;
}

function isServed(host: string, v: VerticalConfig, preferred: string[]): boolean {
  return v.enabled || preferred.includes(host);
}

/**
 * The host that owns the evergreen page at `path` in `locale`, or `null`.
 * Only marketplace-family doors that are served and speak `locale` qualify,
 * so a rental or directory door never becomes an evergreen owner by accident.
 */
export function evergreenOwnerHost(
  table: Record<string, VerticalConfig>,
  path: string,
  locale: VerticalConfig["locale"],
  pages: readonly EvergreenRef[],
  preferred: string[] = [],
): string | null {
  for (const page of pages) {
    if (page.path !== path) continue;
    for (const [host, v] of Object.entries(table)) {
      if (
        v.key === page.door &&
        v.family === "marketplace" &&
        v.locale === locale &&
        isServed(host, v, preferred)
      ) {
        return host;
      }
    }
  }
  return null;
}

/** `evergreenOwnerHost` for every locale that has one — hreflang's override. */
export function evergreenOwnersByLocale(
  table: Record<string, VerticalConfig>,
  path: string,
  pages: readonly EvergreenRef[],
  preferred: string[] = [],
): Partial<Record<VerticalConfig["locale"], string>> {
  const out: Partial<Record<VerticalConfig["locale"], string>> = {};
  for (const locale of ["es", "en"] as const) {
    const host = evergreenOwnerHost(table, path, locale, pages, preferred);
    if (host) out[locale] = host;
  }
  return out;
}

export type CategoryTarget =
  /** This page is canonical here. */
  | { kind: "self" }
  /** The page's canonical is `host` + `path` (the two may equal this page's own host). */
  | { kind: "other"; host: string; path: string }
  /** Delegating door, and no single equivalent page: self-canonical, noindex. */
  | { kind: "none" };

export interface CategoryTargetInput {
  table: Record<string, VerticalConfig>;
  servingHost: string;
  shape: CategoryShape | null;
  operation: Operation;
  pages: readonly EvergreenRef[];
  /** Host that owns categories in a locale — `categoryOwnerForLocale()`. */
  categoryOwner: (locale: VerticalConfig["locale"]) => string;
  preferred?: string[];
}

function pathOfShape(shape: CategoryShape, operation: Operation): string {
  return categoryUrl({
    operation,
    citySlug: shape.citySlug,
    barrioSlug: shape.kind === "barrio-type" ? shape.barrioSlug : undefined,
    type: shape.kind === "city" ? undefined : shape.type,
  });
}

function shapeOfPath(path: string): { shape: CategoryShape; operation: Operation } | null {
  const seg = path.split("/").filter(Boolean);
  const operation = parseOperation(seg[0]);
  const shape = parseCategorySegments(seg.slice(1));
  return operation && shape ? { shape, operation } : null;
}

/**
 * Where a category page's canonical points — the ownership rule above plus
 * `ownsCategories`, in one pure function. An unknown serving host (preview
 * deploy) is `self`: it speaks through `siteOrigin()`, not through this table.
 */
export function categoryTarget(input: CategoryTargetInput): CategoryTarget {
  const { table, servingHost, shape, operation, pages } = input;
  const preferred = input.preferred ?? [];
  const serving = table[servingHost];
  if (!serving) return { kind: "self" };
  if (!shape) return ownsCategoryPages(serving) ? { kind: "self" } : { kind: "none" };

  const path = pathOfShape(shape, operation);
  const owner = evergreenOwnerHost(table, path, serving.locale, pages, preferred);
  if (owner === servingHost) return { kind: "self" };
  if (owner && serving.family === "marketplace") {
    const a = listingSetSignature(serving, shape, operation);
    const b = listingSetSignature(table[owner], shape, operation);
    if (a !== null && a === b) return { kind: "other", host: owner, path };
  }

  if (ownsCategoryPages(serving)) return { kind: "self" };

  const equivalent = equivalentCategoryPath(serving, shape, operation);
  if (equivalent === null) return { kind: "none" };
  const catOwner = input.categoryOwner(serving.locale);
  // The equivalent page may itself be evergreen-owned by another door: point
  // at that page, not at a URL that would canonicalise onward.
  const eq = shapeOfPath(equivalent);
  const ownerCfg = table[catOwner];
  if (eq && ownerCfg) {
    const eg = evergreenOwnerHost(table, equivalent, ownerCfg.locale, pages, preferred);
    if (eg && eg !== catOwner) {
      const a = listingSetSignature(ownerCfg, eq.shape, eq.operation);
      const b = listingSetSignature(table[eg], eq.shape, eq.operation);
      if (a !== null && a === b) return { kind: "other", host: eg, path: equivalent };
    }
  }
  return { kind: "other", host: catOwner, path: equivalent };
}
