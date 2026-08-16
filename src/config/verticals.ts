/**
 * Domain routing layer — how one engine serves every door (ARCHITECTURE.md §2.8).
 *
 * Lives in code, not the database: it changes at deploy cadence and wants
 * type safety. v1 launches with ONLY realestateinparaguay.com enabled
 * (interim primary — see its entry below); feeder domains are pre-declared
 * so routing, canonical URLs, and lead attribution never need a schema
 * change when they switch on.
 */

export type VerticalKey =
  | "propia"
  | "terreno"
  | "alquiler"
  | "agents"
  | "devs"
  | "en"
  | "inmobiliaria";

export interface VerticalConfig {
  key: VerticalKey;
  locale: "es" | "en";
  /** Hard filters applied to every listing query on this domain. */
  filters?: {
    property_type?: string[];
    operation?: string[];
    foreign_exposure?: boolean;
  };
  /** Directory/projects domains render a different shell entirely. */
  mode?: "portal" | "directory" | "projects";
  copy: "ownership" | "land" | "rental" | "foreign" | "directory";
  /** Only enabled verticals are routed; others 302 to propia until launch. */
  enabled: boolean;
  /**
   * Whether /propiedad/{slug} is canonical on THIS host (§2.8: detail pages
   * live on propia only; the EN site is the translation exception). Feeder
   * domains own category/landing pages and link into the primary host, so
   * their detail pages canonicalise away — see `listingCanonicalOrigin()`.
   */
  ownsListingDetail: boolean;
}

export const VERTICALS: Record<string, VerticalConfig> = {
  /**
   * NOT owned by the founder — aspirational future primary domain (see
   * CLAUDE.md). Declared but disabled so routing/canonical types stay ready
   * for it; do not delete or re-enable until the domain is actually bought.
   */
  "propia.com.py": {
    key: "propia",
    locale: "es",
    copy: "ownership",
    enabled: false,
    ownsListingDetail: true,
  },
  "terreno.com.py": {
    key: "terreno",
    locale: "es",
    filters: { property_type: ["terreno"] },
    copy: "land",
    enabled: false,
    ownsListingDetail: false,
  },
  "alquiler.com.py": {
    key: "alquiler",
    locale: "es",
    filters: { operation: ["alquiler"] },
    copy: "rental", // "tu próximo lugar" — never ownership language
    enabled: false,
    ownsListingDetail: false,
  },
  "inmobiliarios.com.py": {
    key: "agents",
    locale: "es",
    mode: "directory",
    copy: "directory",
    enabled: false,
    ownsListingDetail: false,
  },
  "desarrolladores.com.py": {
    key: "devs",
    locale: "es",
    mode: "projects",
    copy: "directory",
    enabled: false,
    ownsListingDetail: false,
  },
  /**
   * INTERIM: this is the live production host (see CLAUDE.md) — the founder
   * does not yet own a .com.py marketplace domain, so the Spanish site is
   * primary here instead of on `propia.com.py`. When a .com.py domain is
   * bought and becomes primary, this entry reverts to the originally planned
   * English feeder vertical: `key: "en"`, `locale: "en"`,
   * `filters: { foreign_exposure: true }`, `copy: "foreign"`,
   * `enabled: false`, `ownsListingDetail: true` (its own translated detail
   * pages, hreflang'd against the primary — translation ≠ duplicate).
   */
  "realestateinparaguay.com": {
    key: "en",
    locale: "es",
    copy: "ownership",
    enabled: true,
    ownsListingDetail: true,
  },
  /**
   * SECOND production host (see CLAUDE.md, PLAN.md D6) — same app, same
   * database as realestateinparaguay.com. Owned by the founder for his own
   * individual agency brand; he lists his own inventory here directly and,
   * until his EAS/SERPLAID license is issued (~Oct 2026), also takes
   * listings from other realtors/agencies on a case-by-case basis.
   *
   * `ownsListingDetail: false` is INTENTIONAL and TEMPORARY, not the final
   * state: this host and realestateinparaguay.com currently serve the exact
   * same Spanish listing rows. If both self-canonicalised /propiedad pages,
   * Google would see two domains publishing identical content — duplicate
   * content, ranking cannibalisation. So for now this host's listing detail
   * pages canonicalise back to the primary (realestateinparaguay.com) same
   * as any other feeder; every other page type here (home, search, guías)
   * is genuinely unique and indexes normally. Flip this to `true` — and
   * simultaneously flip realestateinparaguay.com to
   * `locale: "en", filters: { foreign_exposure: true }, copy: "foreign"` —
   * only once inmobiliaria.com.py becomes the real publishing primary and
   * realestateinparaguay.com's content is genuinely translated, not just a
   * mirrored copy (PLAN.md D6 sequencing).
   */
  "inmobiliaria.com.py": {
    key: "inmobiliaria",
    locale: "es",
    copy: "ownership",
    enabled: true,
    ownsListingDetail: false,
  },
} as const;

/**
 * The host this deployment answers to first. Every other host either
 * self-references (if it is an enabled vertical) or points its canonical
 * URLs here — see `src/lib/origin.ts`. Changing it is a D2 decision, not a
 * code decision.
 *
 * INTERIM default: `realestateinparaguay.com`, the only production host
 * actually owned today (see CLAUDE.md). `propia.com.py` is aspirational and
 * not owned — if this fell back to it, a missing env var on Hostinger would
 * resurrect canonicals pointing at a domain that doesn't resolve. Revert this
 * default to `propia.com.py` only once that domain is actually acquired.
 */
export const CANONICAL_HOST =
  process.env.NEXT_PUBLIC_CANONICAL_HOST ?? "realestateinparaguay.com";

const DEFAULT = VERTICALS[CANONICAL_HOST] ?? VERTICALS["propia.com.py"];

/** Resolve a Host header to a vertical. Unknown hosts (localhost, previews) → CANONICAL_HOST's vertical. */
export function resolveVertical(host: string | null): VerticalConfig {
  if (!host) return DEFAULT;
  const bare = host.toLowerCase().replace(/^www\./, "").split(":")[0];
  const v = VERTICALS[bare];
  return v && v.enabled ? v : DEFAULT;
}
