/**
 * One place page's content (plan `docs/plan-category-pages-build.md` §3,
 * founder decisions E-2/E-3). Pure data: no `next/*`, no drizzle — the page,
 * the sitemap, the category pages' excerpt and `npm run verify:seo` (block q)
 * all read it.
 *
 * Written **per place, not per combination**: a city or barrio gets one guide
 * (500–1000 words of its own), and every `/venta|alquiler/<place>/<tipo>` page
 * borrows its `excerpt` and links to it.
 *
 * **No number in a content file.** Counts, medians and prices come from the
 * door's rows at request time. Every factual claim in the prose is listed in
 * `claimsToVerify` for the founder (E-3). A file merges as `status: "draft"`
 * (live, `noindex`, not in the sitemap) and becomes indexable only when the
 * founder has checked the claims and it is flipped to `"verified"`.
 */
import type { VerticalKey } from "../../config/verticals";
import type { PropertyType } from "../../lib/import/types";

export interface PlaceSection {
  /** The section's H2 — worded per place, never a shared template. */
  title: string;
  paragraphs: readonly string[];
}

export interface PlacePhoto {
  /** Basename under `public/img/places/<slug>/`, without size or extension. */
  file: string;
  /** What it shows and where. No digits. */
  alt: string;
  caption: string;
  /** "Foto: …" — the photographer or the licensor. */
  credit: string;
  licence: "own" | "licensed" | "cc-by" | "cc-by-sa";
  /** Required for a Creative Commons photo. */
  sourceUrl?: string;
}

export interface PlacePage {
  /** City slug in `src/lib/ops/location-tree.ts`. */
  city: string;
  /** Barrio slug under that city, for a barrio page. */
  barrio?: string;
  /** The door this file is written for; its locale is the door's. */
  door: VerticalKey;
  status: "draft" | "verified";
  /** ISO date the founder checked the claims — required when verified. */
  verifiedAt?: string;
  /** The search this page is written for (docs/kwp/…). */
  keyword: string;
  secondaryKeywords: readonly string[];
  /** H1 and `<title>` segment; contains the place name. */
  h1: string;
  /** ≤ 155 characters. */
  metaDescription: string;
  lede: string;
  /** 40–80 words, shown on every combination page of this place. Not a body paragraph. */
  excerpt: string;
  overview: PlaceSection;
  zones: {
    title: string;
    intro: string;
    items: readonly { name: string; text: string; typicalTypes: readonly PropertyType[] }[];
  };
  whoItSuits: PlaceSection;
  access: PlaceSection;
  services: PlaceSection;
  buying: PlaceSection;
  renting: PlaceSection;
  /** 4–6 real questions; also emitted as FAQPage JSON-LD. */
  faq: readonly { q: string; a: string }[];
  /** 5–8 when verified; a draft may have none yet. */
  photos: readonly PlacePhoto[];
  /** `/guias/<slug>` slugs. */
  relatedGuides?: readonly string[];
  /** Proper names that contain digits ("Km 7"); each must also be a claim. */
  namesWithDigits?: readonly string[];
  /** Every factual claim in the prose above. */
  claimsToVerify: readonly string[];
}
