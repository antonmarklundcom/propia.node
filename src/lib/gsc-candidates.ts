/**
 * Which category pages have earned an evergreen content file — the pure half
 * of /admin/google's "Candidatas a página evergreen" (checked by
 * `npm run verify:admin-insights`). No fs, no network, no `next/*`.
 *
 * A candidate is a category URL (`/<operación>/<ciudad>[/<barrio>]/<tipo>` or
 * `/<operación>/<ciudad>`, the shapes `parseOperation()` +
 * `parseCategorySegments()` in `src/lib/urls.ts` accept — never a regex of our
 * own) that Google showed in the window and that the evergreen registry does
 * not list for the door. Search Console reports a URL with a query string
 * (`?orden=…`) as its own row, so rows are summed per path: impressions and
 * clicks add up, position is the impression-weighted mean, which is what
 * Search Console's own aggregate would report.
 */
import { OPERATIONS } from "./import/types";
import { operationSlug, parseCategorySegments, parseOperation } from "./urls";

/** One Search Console row with its dimension values. */
export interface PageRow {
  /** The page URL as Search Console reports it (absolute). */
  page: string;
  clicks: number;
  impressions: number;
  position: number;
}

/** A row of the `["page", "query"]` request. */
export interface PageQueryRow extends PageRow {
  query: string;
}

export interface QueryShare {
  query: string;
  clicks: number;
  impressions: number;
}

export interface Candidate {
  path: string;
  clicks: number;
  impressions: number;
  /** Impression-weighted average position; 0 when there were no impressions. */
  position: number;
  /** Up to `queriesPerPage` searches, most impressions first. Empty when unknown. */
  topQueries: QueryShare[];
}

export interface CandidateOptions {
  /** Only URLs on this host count; null accepts any host (a URL-prefix property). */
  host: string | null;
  /** The registry, for this door: `(path) => isEvergreenPath(path, door.key)`. */
  isEvergreen: (path: string) => boolean;
  limit?: number;
  queriesPerPage?: number;
}

export const CANDIDATE_LIMIT = 20;
export const QUERIES_PER_CANDIDATE = 3;

/**
 * The category path of a reported URL on `host`, normalised (one trailing
 * slash dropped, query and fragment ignored), or null when it is not a
 * category page there. A national hub (`/venta`) is not a category page.
 */
export function categoryPathOf(url: string, host: string | null): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (host !== null && u.host !== host) return null;
  let path = u.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  const segments = path.split("/").slice(1);
  if (segments.length < 2 || segments.some((s) => s.length === 0)) return null;
  if (!parseOperation(segments[0])) return null;
  if (!parseCategorySegments(segments.slice(1))) return null;
  return path;
}

/**
 * An RE2 `includingRegex` for the Search Console `page` filter, so the
 * page × query request spends its rows on URLs under an operation prefix.
 * Only a pre-filter for the API: every row it returns still goes through
 * `categoryPathOf()`, which is the shape check.
 */
export function categoryPageFilterRegex(): string {
  const ops = OPERATIONS.map((op) => operationSlug(op).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return `^https?://[^/]+/(${ops.join("|")})/[^/?#]+`;
}

interface Acc {
  clicks: number;
  impressions: number;
  weightedPosition: number;
}

function add(map: Map<string, Acc>, key: string, r: PageRow) {
  const a = map.get(key) ?? { clicks: 0, impressions: 0, weightedPosition: 0 };
  a.clicks += r.clicks;
  a.impressions += r.impressions;
  a.weightedPosition += r.position * r.impressions;
  map.set(key, a);
}

/**
 * Category pages with impressions that are not evergreen on the door, most
 * impressions first (clicks, then path, break ties so the order is stable),
 * capped at `limit`. `pageQueries` null = the per-query read failed or was not
 * made; candidates still come back, with no queries.
 */
export function evergreenCandidates(
  pages: PageRow[],
  pageQueries: PageQueryRow[] | null,
  opts: CandidateOptions,
): Candidate[] {
  const limit = opts.limit ?? CANDIDATE_LIMIT;
  const perPage = opts.queriesPerPage ?? QUERIES_PER_CANDIDATE;

  const byPath = new Map<string, Acc>();
  for (const r of pages) {
    if (!(r.impressions > 0)) continue;
    const path = categoryPathOf(r.page, opts.host);
    if (path === null || opts.isEvergreen(path)) continue;
    add(byPath, path, r);
  }

  const ranked = [...byPath.entries()]
    .sort(
      ([pa, a], [pb, b]) =>
        b.impressions - a.impressions || b.clicks - a.clicks || (pa < pb ? -1 : pa > pb ? 1 : 0),
    )
    .slice(0, limit);
  const wanted = new Set(ranked.map(([p]) => p));

  const queries = new Map<string, Map<string, Acc>>();
  for (const r of pageQueries ?? []) {
    if (!(r.impressions > 0) || !r.query) continue;
    const path = categoryPathOf(r.page, opts.host);
    if (path === null || !wanted.has(path)) continue;
    const m = queries.get(path) ?? new Map<string, Acc>();
    add(m, r.query, r);
    queries.set(path, m);
  }

  return ranked.map(([path, a]) => ({
    path,
    clicks: a.clicks,
    impressions: a.impressions,
    position: a.impressions > 0 ? a.weightedPosition / a.impressions : 0,
    topQueries: [...(queries.get(path) ?? new Map<string, Acc>()).entries()]
      .sort(([qa, a1], [qb, b1]) => b1.impressions - a1.impressions || b1.clicks - a1.clicks || (qa < qb ? -1 : qa > qb ? 1 : 0))
      .slice(0, perPage)
      .map(([query, q]) => ({ query, clicks: q.clicks, impressions: q.impressions })),
  }));
}
