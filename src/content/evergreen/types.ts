/**
 * The shape of one evergreen category page's content (ARCHITECTURE.md §4.3,
 * the evergreen exception). Pure data: no `next/*`, no drizzle — the page,
 * the sitemap, the nav filters and `npm run verify:seo` all read it.
 *
 * **No number in a content file.** Counts, the lowest and highest asking
 * price and the price-band chips are counted from the door's own rows at
 * request time. A content file carries prose, headings, the band *edges*
 * (a filter, not a fact) and the FAQ — and every factual claim in its prose
 * is listed in `claimsToVerify` so the PR that adds it can be checked.
 */
import type { VerticalKey } from "../../config/verticals";

/** One price-band chip, in USD — the `price_usd` column the grid filters on. */
export interface EvergreenPriceBand {
  /** Inclusive, like `?precio_min=` (`facetConds()`). */
  min?: number;
  /** Inclusive, like `?precio_max=`. */
  max?: number;
}

export interface EvergreenSection {
  /** The section's H2 — worded per page, never a shared template. */
  title: string;
  paragraphs: readonly string[];
}

export interface EvergreenPage {
  /** A category URL, exactly as `categoryUrl()` builds it. The registry key. */
  path: string;
  /**
   * The door this page is evergreen on — indexable at any stock, in its
   * sitemap, never dropped from its menus. Everywhere else the same path
   * follows the ordinary count rule.
   */
  door: VerticalKey;
  /** The search this page is written for (docs/seo-evergreen-keywords.md). */
  keyword: string;
  /** Merged near-duplicates and small searches this page also answers. */
  secondaryKeywords: readonly string[];
  /** H1 and `<title>` segment. Matches the main keyword. */
  h1: string;
  /** One line under the H1. */
  lede: string;
  /** Meta description used when the page has no stock to count (≤ 155 chars). */
  metaDescription: string;
  /** 3–4 bands, cheapest first. */
  priceBands: readonly EvergreenPriceBand[];
  /** Areas of the city and what each is like. */
  barrios: {
    title: string;
    intro: string;
    items: readonly { name: string; text: string }[];
  };
  /** Read under the live price facts the page states itself. */
  prices: EvergreenSection;
  /** What to check before buying / renting here. */
  checklist: { title: string; intro: string; items: readonly string[] };
  /**
   * On a venta page: how the purchase gets paid for, and the page links
   * /financiamiento. On a rental page: what it costs to move in (garantía,
   * depósito, contrato) — no /financiamiento link, the programmes are for
   * buyers.
   */
  financing: EvergreenSection;
  /** 4–6 questions; also emitted as FAQPage JSON-LD. */
  faq: readonly { q: string; a: string }[];
  /** Every factual claim in the prose above, for the founder to verify. */
  claimsToVerify: readonly string[];
}
