/**
 * The dictionary layer (Batch 3, layer 1).
 *
 * `es.ts` holds the strings; this module is how a surface *reaches* them.
 * The point of the indirection is that layer 2 adds `en.ts` by editing this
 * file alone — no page, no component, and no call site changes again.
 *
 * **Client-safe on purpose.** This module must never import `next/headers`,
 * directly or transitively — `SearchBar` and five other client components
 * consume it, the same constraint `src/lib/brand.ts` lives under. The
 * request-scoped half (reading the `x-locale` header the middleware sets)
 * lives in `./server.ts`, which is `server-only`.
 *
 * Two ways in, and picking the wrong one is the mistake to avoid:
 *
 * - `dict()` from `@/i18n/server` — async, request-scoped, correct on every
 *   public page. Use it anywhere a visitor sees the result.
 * - `getDictionary(locale)` below — pure. For client components (which get
 *   their locale as a prop) and for callers that already hold a locale.
 */
import {
  es,
  esCard,
  esCategory,
  esFilters,
  esHome,
  esHub,
  esListing,
  esSearchBar,
} from "./es";

export type Locale = "es" | "en";

/**
 * Both live hosts are `locale: "es"` (verticals.ts) and the English vertical
 * waits until the Spanish site is finished — see CLAUDE.md. This is the
 * fallback for a request that reached a page without the middleware's
 * `x-locale` header, and for a locale with no dictionary yet.
 */
export const DEFAULT_LOCALE: Locale = "es";

const esDictionary = {
  common: es,
  searchBar: esSearchBar,
  filters: esFilters,
  card: esCard,
  home: esHome,
  hub: esHub,
  category: esCategory,
  listing: esListing,
} as const;

/**
 * The shape every locale must satisfy. Deriving it from the Spanish
 * dictionary rather than hand-writing an interface is what makes `en.ts` a
 * type error until it is complete — a missing key cannot ship as a blank
 * string on a live page.
 */
export type Dictionary = typeof esDictionary;

/**
 * No `en.ts` yet — that is layer 2 of Batch 3. Until it lands, `en` resolves
 * to the Spanish dictionary rather than to English-shaped placeholders: a
 * host that somehow declared `locale: "en"` today would still render a
 * coherent Spanish page, which is what both live hosts serve anyway.
 */
const DICTIONARIES: Record<Locale, Dictionary> = {
  es: esDictionary,
  en: esDictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/** Narrow an arbitrary header value to a locale we actually have. */
export function parseLocale(value: string | null | undefined): Locale {
  return value === "en" || value === "es" ? value : DEFAULT_LOCALE;
}
