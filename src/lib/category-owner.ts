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
import type { VerticalConfig } from "@/config/verticals";
import type { Operation, PropertyType } from "./import/types";
import { categoryUrl, type CategoryShape } from "./urls";

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
