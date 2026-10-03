/**
 * What robots.txt keeps out of the crawl — pure, so `npm run verify:seo` can
 * check it without a request (app/robots.ts serves it).
 *
 * Two kinds of rule:
 * - **Paths** that are never a landing page (the API, panels, account pages).
 *   They carry noindex too; crawling them is wasted budget (audit F24).
 * - **Query parameters** that only ever make a variant of a canonical page:
 *   every facet (`?precio_max=`, `?barrio=`, …), the map view (`?vista=`) and
 *   the old empty-type notice (`?tipo_vacio=`). Each combination is a new URL
 *   to a crawler, so six doors × every filter was an unbounded crawl space
 *   that kept the app's processes and their DB connections busy (report
 *   2026-10-03 §C, plan decision P-3). None of these URLs is canonical: the
 *   category, hub and directory pages all canonicalise to the bare path.
 *
 * `?page=` is deliberately NOT blocked: page 2+ is noindex,follow and is how
 * a crawler reaches the older listings. A blocked URL's noindex is never read,
 * so only parameters that are never canonical belong here.
 *
 * The facet names come from `FACET_PARAM`, so a new facet is blocked without
 * anyone remembering to.
 */
import { FACET_PARAM } from "./facets";

export const CRAWL_BLOCKED_PATHS: readonly string[] = [
  "/api/",
  "/admin",
  "/agencia",
  "/publicar",
  "/login",
  "/registro",
  "/recuperar",
  "/alertas",
];

export const CRAWL_BLOCKED_PARAMS: readonly string[] = [
  ...Object.values(FACET_PARAM),
  "vista",
  "tipo_vacio",
];

/** Google and Bing match `*` in robots.txt; `?name=` and `&name=` cover first and later positions. */
export function robotsDisallow(): string[] {
  return [
    ...CRAWL_BLOCKED_PATHS,
    ...CRAWL_BLOCKED_PARAMS.flatMap((p) => [`/*?${p}=`, `/*&${p}=`]),
  ];
}

/**
 * Whether a URL path (with query) is blocked by `rules` — Google's matching,
 * for the cases these rules use: a prefix with `*` wildcards, no `$`.
 */
export function isDisallowed(pathAndQuery: string, rules: readonly string[] = robotsDisallow()): boolean {
  return rules.some((rule) => {
    const re = new RegExp("^" + rule.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*"));
    return re.test(pathAndQuery);
  });
}
