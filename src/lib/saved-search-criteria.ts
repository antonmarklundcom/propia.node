/**
 * Saved-search criteria: validation and the URL of the results page. Pure — no
 * `next/*`, no drizzle, no `node:crypto` — so the client form, the API route,
 * the alert job and `npm run verify:facets` share one definition. The
 * vocabulary is `facets.ts`'s; this only adds the slugs that a stored search
 * keeps instead of resolved location ids.
 */
import { OPERATIONS, PROPERTY_TYPES } from "./import/types";
import type { Operation, PropertyType } from "./import/types";
import { FACET_PARAM } from "./facets";
import { categoryUrl, operationSlug, typePlural } from "./urls";

export interface SavedSearchCriteria {
  operation: Operation;
  propertyType?: PropertyType;
  citySlug?: string;
  barrioSlug?: string;
  /** USD, like `listings.price_usd` (the column every price facet filters on). */
  priceMin?: number;
  priceMax?: number;
  minBedrooms?: number;
}

const SLUG = /^[a-z0-9-]{1,140}$/;
const NUMBER_MAX = 1_000_000_000;

function slug(v: unknown): string | undefined {
  return typeof v === "string" && SLUG.test(v) ? v : undefined;
}

function whole(v: unknown): number | undefined {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isInteger(n) && n > 0 && n <= NUMBER_MAX ? n : undefined;
}

/**
 * The client is never trusted: anything malformed is dropped like a bad
 * `?precio_min=abc`, except a missing/unknown operation, which rejects the
 * search (an alert needs at least that). A barrio without a city is dropped.
 */
export function normalizeCriteria(raw: unknown): SavedSearchCriteria | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const operation = OPERATIONS.find((o) => o === r.operation);
  if (!operation) return null;
  const citySlug = slug(r.citySlug);
  const out: SavedSearchCriteria = { operation };
  const type = PROPERTY_TYPES.find((t) => t === r.propertyType);
  if (type) out.propertyType = type;
  if (citySlug) {
    out.citySlug = citySlug;
    const barrio = slug(r.barrioSlug);
    if (barrio) out.barrioSlug = barrio;
  }
  const min = whole(r.priceMin);
  const max = whole(r.priceMax);
  if (min) out.priceMin = min;
  if (max && (!min || max >= min)) out.priceMax = max;
  const beds = whole(r.minBedrooms);
  if (beds && beds <= 20) out.minBedrooms = beds;
  return out;
}

/** A stable string for the same search, whatever order the fields arrived in. */
export function criteriaKey(c: SavedSearchCriteria): string {
  return [
    c.operation,
    c.propertyType ?? "",
    c.citySlug ?? "",
    c.barrioSlug ?? "",
    c.priceMin ?? "",
    c.priceMax ?? "",
    c.minBedrooms ?? "",
  ].join("|");
}

/**
 * Where the visitor sees this search: the category path when a city is set
 * (type in the path, as the category pages spell it), otherwise the operation
 * hub with `?tipo=`; price and bedrooms as the facet query names.
 */
export function criteriaPath(c: SavedSearchCriteria): string {
  const sp = new URLSearchParams();
  let path: string;
  if (c.citySlug) {
    path = categoryUrl({
      operation: c.operation,
      citySlug: c.citySlug,
      barrioSlug: c.barrioSlug,
      type: c.propertyType,
    });
  } else {
    path = `/${operationSlug(c.operation)}`;
    if (c.propertyType) sp.set(FACET_PARAM.propertyType, typePlural(c.propertyType));
  }
  if (c.priceMin) sp.set(FACET_PARAM.priceMin, String(c.priceMin));
  if (c.priceMax) sp.set(FACET_PARAM.priceMax, String(c.priceMax));
  if (c.minBedrooms) sp.set(FACET_PARAM.minBedrooms, String(c.minBedrooms));
  const q = sp.toString();
  return q ? `${path}?${q}` : path;
}
