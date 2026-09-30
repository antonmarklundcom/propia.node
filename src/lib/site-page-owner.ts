/**
 * Site-page ownership — the pure half (decision S4(a),
 * docs/plan-seo-doors-2026-09-27.md §4.5 and §7).
 *
 * A "site page" is one of the marketplace's own content pages that does not
 * depend on which door serves it: guides, price pages, project and developer
 * pages, and the hand-authored explainers (financing, FAQ, how it works, …).
 * Every door that runs the marketplace routes renders them, so without one
 * owner per language the land doors publish the same article at a second
 * self-canonical URL.
 *
 * `ownsSitePages` on a door says whether those pages are canonical there
 * (unset = true, the sibling of `ownsCategories` / `ownsDirectory`). A door set
 * to `false` canonicalises each one to the SAME PATH on the marketplace door
 * that owns site pages in its own language, and leaves it out of its sitemap.
 * Same path, because these pages list the same content on every door — the
 * one "equivalence" there is.
 *
 * What is NOT a site page, and stays self-canonical on every door: the home,
 * the operation hubs (`/venta`, `/alquiler`, `/alquiler-temporal` — filtered
 * to the door's own rows), category pages (`ownsCategories`), the directory
 * pages (`ownsDirectory`), listing detail (`ownsListingDetail`), and the pages
 * that name the door itself: `/nosotros`, `/contacto`, `/terminos`,
 * `/privacidad`. `/vender` is not listed either: it renders only on the
 * Spanish primary and redirects everywhere else.
 *
 * No `next/*` and no drizzle, so `npm run verify:seo` can drive it against
 * synthetic tables. The request-scoped half is in `origin.ts`.
 */
import type { VerticalConfig } from "@/config/verticals";

/** Unset = true. The one place the default is spelled. */
export function ownsSitePageSet(config: VerticalConfig): boolean {
  return config.ownsSitePages !== false;
}

/** Exact paths — each is also in `MARKETPLACE_SITEMAP_PATHS` (verify:seo checks). */
export const SITE_PAGE_PATHS: readonly string[] = [
  "/guias",
  "/precios",
  "/proyectos",
  "/desarrolladoras",
  "/datos",
  "/tasacion",
  "/financiamiento",
  "/como-funciona",
  "/preguntas-frecuentes",
  "/para-inmobiliarias",
  "/planes",
];

/** Dynamic families: `/guias/<slug>`, `/precios/<ciudad>`, `/proyecto/<slug>`, `/desarrolladora/<slug>`. */
export const SITE_PAGE_PREFIXES: readonly string[] = [
  "/guias/",
  "/precios/",
  "/proyecto/",
  "/desarrolladora/",
];

/** Whether `path` (no query string) is one of the site pages above. */
export function isSitePagePath(path: string): boolean {
  return (
    SITE_PAGE_PATHS.includes(path) ||
    SITE_PAGE_PREFIXES.some((prefix) => path.startsWith(prefix) && path.length > prefix.length)
  );
}

/**
 * The host that owns site pages in `locale`, over an explicit table so
 * `verify:seo` can drive synthetic ones. Only marketplace-family doors that
 * are served (enabled, or a `preferred` host) and have not opted out are
 * candidates; the first `preferred` host wins (the marketplace primary, then
 * the canonical host), then declaration order. Falls back to `fallback` — the
 * primary — when there is none, as `categoryOwnerHost()` does.
 */
export function sitePageOwnerHost(
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
        ownsSitePageSet(v),
    )
    .map(([host]) => host);
  return preferred.find((h) => candidates.includes(h)) ?? candidates[0] ?? fallback;
}

export type SitePageTarget =
  /** This page is canonical here. */
  | { kind: "self" }
  /** The page's canonical is `host` + the same path. */
  | { kind: "other"; host: string };

export interface SitePageTargetInput {
  table: Record<string, VerticalConfig>;
  servingHost: string;
  /** Path as served, no query string. */
  path: string;
  /** Host that owns site pages in a locale — `sitePageOwnerForLocale()`. */
  siteOwner: (locale: VerticalConfig["locale"]) => string;
}

/**
 * Where a site page's canonical points. An unknown serving host (preview
 * deploy) is `self`: it speaks through `siteOrigin()`, not through this table.
 */
export function sitePageTarget(input: SitePageTargetInput): SitePageTarget {
  const serving = input.table[input.servingHost];
  if (!serving || ownsSitePageSet(serving) || !isSitePagePath(input.path)) {
    return { kind: "self" };
  }
  const host = input.siteOwner(serving.locale);
  return host === input.servingHost ? { kind: "self" } : { kind: "other", host };
}
