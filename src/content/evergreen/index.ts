/**
 * The evergreen registry — the ONLY list of evergreen category paths
 * (ARCHITECTURE.md §4.3, founder decision 2026-09-27).
 *
 * An evergreen path is a curated exception to the thin-page rule: on its
 * owner door it is indexable at any stock (0 included), renders 200 instead
 * of 404/redirect, is in that door's sitemap and never drops out of its
 * menus. On every other door, and for every path not listed here, the old
 * count rule applies unchanged.
 *
 * Everything that needs to know reads the functions below —
 * `getIndexability()` callers (the category page, the sitemap, the related
 * links), `stockedPathsOrNull()` (menus) and `npm run verify:seo`. Pure: no
 * `next/*`, no drizzle.
 *
 * Adding a page: write `src/content/evergreen/<operation>-<city>-<type>.ts`
 * (the pilot, `venta-luque-casas.ts`, is the model), import it here, add it
 * to `EVERGREEN_PAGES`, run `npm run verify:seo`.
 */
import type { VerticalKey } from "../../config/verticals";
import type { EvergreenPage } from "./types";
import { ventaLuqueCasas } from "./venta-luque-casas";

export type { EvergreenPage, EvergreenPriceBand } from "./types";

export const EVERGREEN_PAGES: readonly EvergreenPage[] = [ventaLuqueCasas];

const BY_DOOR_PATH = new Map(
  EVERGREEN_PAGES.map((p) => [`${p.door}|${p.path}`, p] as const),
);

/** The evergreen page at `path` on `door`, or null (not evergreen there). */
export function evergreenPageFor(
  path: string,
  door: VerticalKey,
): EvergreenPage | null {
  return BY_DOOR_PATH.get(`${door}|${path}`) ?? null;
}

/** Whether `path` is evergreen on `door`. */
export function isEvergreenPath(path: string, door: VerticalKey): boolean {
  return BY_DOOR_PATH.has(`${door}|${path}`);
}

/** Every evergreen path owned by `door` — what its sitemap and menus add. */
export function evergreenPathsFor(door: VerticalKey): string[] {
  return EVERGREEN_PAGES.filter((p) => p.door === door).map((p) => p.path);
}

/**
 * Every block of running text a content file contributes, for the
 * "no two pages share a paragraph" check in verify:seo.
 */
export function evergreenParagraphs(p: EvergreenPage): string[] {
  return [
    p.lede,
    p.metaDescription,
    p.barrios.intro,
    ...p.barrios.items.map((b) => b.text),
    ...p.prices.paragraphs,
    p.checklist.intro,
    ...p.checklist.items,
    ...p.financing.paragraphs,
    ...p.faq.map((f) => f.a),
  ];
}

/** Words a visitor reads on the page from its content file (headings included). */
export function evergreenWordCount(p: EvergreenPage): number {
  const text = [
    p.h1,
    p.barrios.title,
    ...p.barrios.items.map((b) => b.name),
    p.prices.title,
    p.checklist.title,
    p.financing.title,
    ...p.faq.map((f) => f.q),
    ...evergreenParagraphs(p).filter((x) => x !== p.metaDescription),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}
