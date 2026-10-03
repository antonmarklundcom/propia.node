/**
 * The place registry — the ONLY list of place pages (plan
 * `docs/plan-category-pages-build.md` phase 4). Pure: no `next/*`, no
 * drizzle; the place route, the category pages' excerpt, the sitemap and
 * `npm run verify:seo` (block q) read it through the functions below.
 *
 * Adding a place: write `src/content/places/<city>[--<barrio>].ts` (the
 * Asunción draft is the model), import it here, add it to `PLACE_PAGES`, run
 * `npm run verify:seo`. It ships as `status: "draft"` (live, noindex) until the
 * founder has checked `claimsToVerify`.
 */
import type { VerticalKey } from "../../config/verticals";
import type { PlacePage } from "./types";
import { placePath } from "../../lib/place-path";
import { asuncion } from "./asuncion";

export type { PlacePage, PlacePhoto, PlaceSection } from "./types";

export const PLACE_PAGES: readonly PlacePage[] = [asuncion];

/** The file for a place on a door, if one exists. */
export function placePageFor(door: VerticalKey, city: string, barrio?: string): PlacePage | null {
  return PLACE_PAGES.find((p) => p.door === door && p.city === city && (p.barrio ?? null) === (barrio ?? null)) ?? null;
}

/** Every file for one place, across doors (one per language). */
export function placePagesAt(city: string, barrio?: string): PlacePage[] {
  return PLACE_PAGES.filter((p) => p.city === city && (p.barrio ?? null) === (barrio ?? null));
}

/** E-2/P-6: a place page is indexable on its own door once the founder has verified it. */
export function placeIndexable(p: PlacePage, servingDoor: VerticalKey): boolean {
  return p.status === "verified" && p.door === servingDoor;
}

/** The place paths a door lists in its sitemap: its own verified files. */
export function placeSitemapPaths(door: VerticalKey): string[] {
  return PLACE_PAGES.filter((p) => placeIndexable(p, door)).map((p) => placePath(p.city, p.barrio));
}

/**
 * The guide a category page borrows its excerpt from: the barrio's own file
 * on a barrio page when one exists, else the city's.
 */
export function placeGuideForCategory(door: VerticalKey, city: string, barrio?: string): PlacePage | null {
  return (barrio ? placePageFor(door, city, barrio) : null) ?? placePageFor(door, city);
}

/** Every paragraph a visitor reads, the FAQ answers included. */
export function placeParagraphs(p: PlacePage): string[] {
  return [
    p.lede,
    p.metaDescription,
    p.zones.intro,
    ...p.zones.items.map((z) => z.text),
    ...[p.overview, p.whoItSuits, p.access, p.services, p.buying, p.renting].flatMap((s) => s.paragraphs),
    ...p.faq.map((f) => f.a),
  ];
}

/** Every heading and short label a visitor reads. */
export function placeHeadings(p: PlacePage): string[] {
  return [
    p.h1,
    p.zones.title,
    ...p.zones.items.map((z) => z.name),
    ...[p.overview, p.whoItSuits, p.access, p.services, p.buying, p.renting].map((s) => s.title),
    ...p.faq.map((f) => f.q),
  ];
}

/** Words of its own (headings, prose and FAQ; the meta description excluded), like `evergreenWordCount`. */
export function placeWordCount(p: PlacePage): number {
  const text = [...placeHeadings(p), ...placeParagraphs(p).filter((x) => x !== p.metaDescription)].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}
