/**
 * Domain routing layer — how one engine serves every door (ARCHITECTURE.md §2.8).
 *
 * Lives in code, not the database: it changes at deploy cadence and wants
 * type safety. Five hosts are routed today, in two families
 * (`VerticalFamily`, below):
 *
 *   marketplace — inmobiliaria.com.py (the Spanish primary, PLAN.md D6,
 *     flipped 2026-09-04), realestateinparaguay.com (its English translation,
 *     same flip), terreno.com.py (a terrenos-only feeder consolidated onto
 *     this app from its own standalone deployment, 2026-09-04).
 *   rental — alquiler.com.py and rentparaguay.com, one rental-services
 *     business in two languages (fable/plan-rentparaguay.md). Enabled in code
 *     from the O1 phase; DNS for both is still pending, so neither is reachable
 *     by a visitor yet.
 *
 * The remaining feeder domains are pre-declared so routing, canonical URLs,
 * and lead attribution never need a schema change when they switch on.
 */

export type VerticalKey =
  | "terreno"
  | "alquiler"
  | "rent"
  | "agents"
  | "devs"
  | "en"
  | "inmobiliaria";

/**
 * Which business a door belongs to. Distinct from `key` (one door) and from
 * `locale` (one language): two doors of the same family are the same site in
 * two languages, and that is the unit hreflang, the sitemap's static page
 * list and the chrome variant all reason about.
 *
 * It exists because `src/lib/alternates.ts` pairs *every served door* as a
 * language version of the same content. With the rental doors enabled and no
 * family field, `languageAlternates({ path: "/" })` on rentparaguay.com would
 * declare inmobiliaria.com.py as its Spanish version — two unrelated
 * businesses annotated as translations of each other — and `/servicios/...`
 * would be declared as existing on doors that redirect it away. Per-key
 * overrides (theme, card variant) stay per key; only what is genuinely shared
 * by a business keys off the family.
 */
export type VerticalFamily = "marketplace" | "rental" | "directory";

export interface VerticalConfig {
  key: VerticalKey;
  locale: "es" | "en";
  /** Which business this door belongs to — see `VerticalFamily`. */
  family: VerticalFamily;
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
    family: "marketplace",
    filters: { property_type: ["terreno"] },
    copy: "land",
    enabled: true,
    ownsListingDetail: false,
  },
  /**
   * The rental family's Spanish door (fable/plan-rentparaguay.md §1). Not a
   * marketplace feeder: alquiler.com.py and rentparaguay.com are one rental
   * services business — letting, Airbnb and apartment management, residency,
   * a virtual address — in two languages, with the shared listing set narrowed
   * to what that business rents out.
   *
   * `operation: ["alquiler", "alquiler_temporal"]` (widened from `["alquiler"]`,
   * §1 item 4): the business sells short-term "landing" rentals too, and
   * dropping them would narrow the door below what its own audience asks for.
   *
   * `ownsListingDetail: false` — /propiedad is the marketplace's page type and
   * inmobiliaria.com.py owns it in Spanish; a rental door renders it but
   * canonicalises it there (`listingCanonicalOrigin()` picks the detail owner
   * in the door's OWN language, so this door points at the Spanish primary and
   * rentparaguay.com at the English one).
   *
   * `enabled: true` before DNS exists (§1 item 3): `resolveVertical()` ignores
   * a disabled host, so a disabled door cannot be previewed with a `Host`
   * header and `verify:seo` would only ever check a synthetic copy of it.
   * Nothing reaches a visitor until the domain's DNS points at Hostinger —
   * that is the go-live switch, not this flag.
   */
  "alquiler.com.py": {
    key: "alquiler",
    brand: "Alquiler Paraguay",
    locale: "es",
    family: "rental",
    filters: { operation: ["alquiler", "alquiler_temporal"] },
    copy: "rental", // "tu próximo lugar" — never ownership language
    enabled: true,
    ownsListingDetail: false,
  },
  /**
   * The rental family's English door — the same business as alquiler.com.py,
   * not a translation of the marketplace. It is its own `VerticalKey` for the
   * same reason `en` is one: the middleware carries only the key in
   * `x-vertical`, `currentVertical()` resolves it by first match, and
   * `verify:seo` refuses two hosts sharing a key. What ties the two rental
   * doors together is `family: "rental"`, not a shared key.
   *
   * `ownsListingDetail: false`: realestateinparaguay.com already owns
   * /propiedad in English (`verify:seo` forbids two served doors owning detail
   * in one language), so this door's detail pages canonicalise there — an
   * English page whose canonical is a Spanish URL is a canonical Google
   * ignores, which is why the owner is chosen per locale.
   */
  "rentparaguay.com": {
    key: "rent",
    brand: "Rent Paraguay",
    locale: "en",
    family: "rental",
    filters: { operation: ["alquiler", "alquiler_temporal"] },
    copy: "rental",
    enabled: true,
    ownsListingDetail: false,
  },
  /**
   * Not a marketplace feeder and not the future agent-directory listing
   * either — that idea is shelved. This door sells two things instead
   * (owner decision): seller leads for property owners
   * (`leadType: "seller"`, same pipeline `/vender` and `/contacto` use) and
   * a marketing/exposure service pitch to realtors and agencies
   * (`leadType: "agent_signup"`), distinct from `/para-inmobiliarias`'
   * free "publish your own inventory" offer. Its home page is its own
   * shell (`LeadsHome`, `src/design/sections.ts`'s `homeLayout() ===
   * "leads"`) precisely so enabling it does not just mirror
   * inmobiliaria.com.py's catalogue under a different domain.
   */
  "inmobiliarios.com.py": {
    key: "agents",
    brand: "Inmobiliarios Paraguay",
    locale: "es",
    family: "directory",
    copy: "directory",
    enabled: true,
    ownsListingDetail: false,
  },
  "desarrolladores.com.py": {
    key: "devs",
    brand: "Desarrolladores Paraguay",
    locale: "es",
    family: "directory",
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
    family: "marketplace",
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
    family: "marketplace",
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

/**
 * The family a vertical key belongs to, for the registry functions in
 * `src/design/sections.ts` and anything else that holds a key rather than a
 * config. Keys are unique across the table (`verify:seo` enforces it), so
 * this lookup is total for every key that has an entry.
 */
const FAMILY_BY_KEY: Record<string, VerticalFamily> = Object.fromEntries(
  Object.values(VERTICALS).map((v) => [v.key, v.family]),
);

export function familyOf(key: VerticalKey): VerticalFamily {
  return FAMILY_BY_KEY[key] ?? DEFAULT.family;
}

/** Resolve a Host header to a vertical. Unknown hosts (localhost, previews) → CANONICAL_HOST's vertical. */
export function resolveVertical(host: string | null): VerticalConfig {
  if (!host) return DEFAULT;
  const bare = host.toLowerCase().replace(/^www\./, "").split(":")[0];
  const v = VERTICALS[bare];
  return v && v.enabled ? v : DEFAULT;
}
