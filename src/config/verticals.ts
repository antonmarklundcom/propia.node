/**
 * Domain routing layer — how one engine serves every door (ARCHITECTURE.md §2.8).
 *
 * Lives in code, not the database: it changes at deploy cadence and wants
 * type safety. Three hosts are enabled today — inmobiliaria.com.py (the
 * Spanish marketplace primary, PLAN.md D6, flipped 2026-09-04),
 * realestateinparaguay.com (its English translation, same flip), and
 * terreno.com.py (consolidated onto this app from its own former standalone
 * Node deployment, 2026-09-04: a terrenos-only feeder, same database,
 * canonicalizing /propiedad back to the Spanish primary); the remaining
 * feeder domains are pre-declared so routing, canonical URLs, and lead
 * attribution never need a schema change when they switch on.
 */

export type VerticalKey =
  | "terreno"
  | "alquiler"
  | "agents"
  | "devs"
  | "en"
  | "inmobiliaria";

export interface VerticalConfig {
  key: VerticalKey;
  locale: "es" | "en";
  /**
   * The public brand name for this door. The domain IS the brand (founder
   * decision, 2026-08-16) — there is no separate wordmark to keep in sync, so
   * every user-visible name is derived from here rather than from a single
   * global constant. Read it through `src/lib/brand.ts`, never directly:
   * that module is what resolves the current request's host to a name.
   */
  brand: string;
  /** Hard filters applied to every listing query on this domain. */
  filters?: {
    property_type?: string[];
    operation?: string[];
    foreign_exposure?: boolean;
  };
  /** Directory/projects domains render a different shell entirely. */
  mode?: "portal" | "directory" | "projects";
  copy: "ownership" | "land" | "rental" | "foreign" | "directory";
  /** Only enabled verticals are routed; others 302 to CANONICAL_HOST until launch. */
  enabled: boolean;
  /**
   * Whether /propiedad/{slug} is canonical on THIS host (§2.8: detail pages
   * live on the primary host only; the EN site is the translation exception).
   * Feeder domains own category/landing pages and link into the primary host,
   * so their detail pages canonicalise away — see `listingCanonicalOrigin()`.
   */
  ownsListingDetail: boolean;
}

export const VERTICALS: Record<string, VerticalConfig> = {
  "terreno.com.py": {
    key: "terreno",
    brand: "Terreno.com.py",
    locale: "es",
    filters: { property_type: ["terreno"] },
    copy: "land",
    enabled: true,
    ownsListingDetail: false,
  },
  "alquiler.com.py": {
    key: "alquiler",
    brand: "Alquiler.com.py",
    locale: "es",
    filters: { operation: ["alquiler"] },
    copy: "rental", // "tu próximo lugar" — never ownership language
    enabled: false,
    ownsListingDetail: false,
  },
  "inmobiliarios.com.py": {
    key: "agents",
    brand: "Inmobiliarios Paraguay",
    locale: "es",
    mode: "directory",
    copy: "directory",
    enabled: false,
    ownsListingDetail: false,
  },
  "desarrolladores.com.py": {
    key: "devs",
    brand: "Desarrolladores Paraguay",
    locale: "es",
    mode: "projects",
    copy: "directory",
    enabled: false,
    ownsListingDetail: false,
  },
  /**
   * FLIPPED 2026-09-04 (PLAN.md D6): the English feeder, auto-translated from
   * the Spanish rows now published primarily on inmobiliaria.com.py. Narrowed
   * to listings that opted into foreign exposure (`listings.foreign_exposure`,
   * default true, so this is an opt-out in practice, not an empty grid).
   * `ownsListingDetail: true` because a translation is its own content, not a
   * duplicate — hreflang pairs it against inmobiliaria.com.py automatically
   * (src/lib/alternates.ts reads this table). Detail page, ListingCard and
   * generateMetadata now read `title_en`/`description_en` with a Spanish
   * fallback (app/propiedad/[slug]/page.tsx, src/components/ListingCard.tsx)
   * for listings `npm run cron:translate` hasn't reached yet.
   */
  "realestateinparaguay.com": {
    key: "en",
    brand: "Real Estate in Paraguay",
    locale: "en",
    filters: { foreign_exposure: true },
    copy: "foreign",
    enabled: true,
    ownsListingDetail: true,
  },
  /**
   * FLIPPED 2026-09-04 (PLAN.md D6): the Spanish marketplace primary. Same
   * app, same database as realestateinparaguay.com. Owned by the founder;
   * nearly all publishing happens here — his own agency inventory plus other
   * realtors'/agencies' listings he takes on case-by-case until his
   * EAS/SERPLAID license issues (~Oct 2026).
   *
   * `ownsListingDetail: true` (flipped from `false`): now that
   * realestateinparaguay.com is genuinely English, the two hosts no longer
   * serve identical content in the same language, so this host's /propiedad
   * pages self-canonicalise and rejoin its sitemap — one flag, both effects.
   */
  "inmobiliaria.com.py": {
    key: "inmobiliaria",
    brand: "Inmobiliaria Paraguay",
    locale: "es",
    copy: "ownership",
    enabled: true,
    ownsListingDetail: true,
  },
} as const;

/**
 * The host this deployment answers to first. Every other host either
 * self-references (if it is an enabled vertical) or points its canonical
 * URLs here — see `src/lib/origin.ts`. Changing it is a D2 decision, not a
 * code decision.
 *
 * FLIPPED 2026-09-04 (PLAN.md D6): `inmobiliaria.com.py`, the Spanish
 * marketplace primary. `DEFAULT` below derives the locale, filters and copy
 * of every request that doesn't match an enabled host from whatever this
 * names, so the code fallback is kept in sync with the intended live value —
 * but the **live value itself comes from `NEXT_PUBLIC_CANONICAL_HOST` on
 * Hostinger**, which is a separate manual step (hPanel env var + rebuild,
 * `NEXT_PUBLIC_*` is inlined at build time) that this commit cannot perform.
 * Until that env var is updated, production keeps resolving from whatever
 * it was last set to — set it to `inmobiliaria.com.py` and redeploy to
 * complete the flip.
 */
export const CANONICAL_HOST =
  process.env.NEXT_PUBLIC_CANONICAL_HOST ?? "inmobiliaria.com.py";

// Fallback must be an OWNED host: if CANONICAL_HOST ever names a host with no
// entry, every page would be branded with a domain the founder does not own
// while canonicals still self-reference (audit F41).
const DEFAULT =
  VERTICALS[CANONICAL_HOST] ?? VERTICALS["inmobiliaria.com.py"];

/**
 * The vertical key to stamp on a row when no `x-vertical` header reached the
 * handler (direct API call, a request that bypassed middleware). Derived from
 * DEFAULT so it can never name a door that no longer exists.
 */
export const DEFAULT_VERTICAL_KEY: VerticalKey = DEFAULT.key;

/** Resolve a Host header to a vertical. Unknown hosts (localhost, previews) → CANONICAL_HOST's vertical. */
export function resolveVertical(host: string | null): VerticalConfig {
  if (!host) return DEFAULT;
  const bare = host.toLowerCase().replace(/^www\./, "").split(":")[0];
  const v = VERTICALS[bare];
  return v && v.enabled ? v : DEFAULT;
}
