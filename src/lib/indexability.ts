/**
 * The thin-page rule (ARCHITECTURE.md §4.3) — single source of truth.
 *
 * BOTH the page templates and the sitemap generator call this function.
 * Never duplicate this logic anywhere else: this rule is what separates
 * programmatic SEO from a doorway-page penalty.
 *
 * One curated exception (founder decision 2026-09-27, ARCHITECTURE.md §4.3):
 * a path in the evergreen registry (`src/content/evergreen/index.ts`) is
 * indexable at any count on its owner door. Callers pass `evergreen` from
 * `isEvergreenPath(path, door)`; every other page keeps the rule below.
 */

export type Indexability =
  | { state: "index" } // in sitemap, indexable
  | { state: "noindex" } // renders (facet landings), noindex,follow, NOT in sitemap
  | { state: "gone"; redirectTo?: string }; // 404 (via notFound()), or redirect to parent — never for a page with `emptyRenders`

export interface PageSignals {
  /** Published listings matching this page's (location × type × operation). */
  listingCount: number;
  /** Barrio pages also require the parent city page to be indexable. */
  parentIndexable?: boolean;
  /** Parent page URL for the 0-count redirect (e.g. barrio/tipo → barrio). */
  parentUrl?: string;
  /**
   * The page is on the evergreen registry for the door serving it. It then
   * carries its own content (500–900 words) and a lead block, so it is not
   * thin at 0 listings — that is the whole condition for the exception.
   */
  evergreen?: boolean;
  /**
   * The page renders at 0 listings (founder decision E-1, 2026-10-03): every
   * valid category combination is a 200 empty state with CTAs and nearest
   * stock, kept `noindex,follow` and out of the sitemap (E-2) — so a stable
   * URL never flips between 200 and 404 as stock comes and goes. Profile
   * pages leave it unset and keep the 404 at 0.
   */
  emptyRenders?: boolean;
}

const MIN_INDEXABLE = 3;

export function getIndexability(page: PageSignals): Indexability {
  if (page.evergreen) return { state: "index" };
  if (page.listingCount === 0) {
    if (page.emptyRenders) return { state: "noindex" };
    return { state: "gone", redirectTo: page.parentUrl };
  }
  if (page.listingCount < MIN_INDEXABLE) {
    return { state: "noindex" };
  }
  if (page.parentIndexable === false) {
    return { state: "noindex" };
  }
  return { state: "index" };
}

/** Robots meta value for a resolved indexability state. */
export function robotsFor(ix: Indexability): string {
  return ix.state === "index" ? "index,follow" : "noindex,follow";
}
