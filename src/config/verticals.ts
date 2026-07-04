/**
 * Domain routing layer — how one engine serves every door (ARCHITECTURE.md §2.8).
 *
 * Lives in code, not the database: it changes at deploy cadence and wants
 * type safety. v1 launches with ONLY propia.com.py enabled; feeder domains
 * are pre-declared so routing, canonical URLs, and lead attribution never
 * need a schema change when they switch on.
 */

export type VerticalKey =
  | "propia"
  | "terreno"
  | "alquiler"
  | "agents"
  | "devs"
  | "en";

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
}

export const VERTICALS: Record<string, VerticalConfig> = {
  "propia.com.py": {
    key: "propia",
    locale: "es",
    copy: "ownership",
    enabled: true,
  },
  "terreno.com.py": {
    key: "terreno",
    locale: "es",
    filters: { property_type: ["terreno"] },
    copy: "land",
    enabled: false,
  },
  "alquiler.com.py": {
    key: "alquiler",
    locale: "es",
    filters: { operation: ["alquiler"] },
    copy: "rental", // "tu próximo lugar" — never ownership language
    enabled: false,
  },
  "inmobiliarios.com.py": {
    key: "agents",
    locale: "es",
    mode: "directory",
    copy: "directory",
    enabled: false,
  },
  "desarrolladores.com.py": {
    key: "devs",
    locale: "es",
    mode: "projects",
    copy: "directory",
    enabled: false,
  },
  "realestateinparaguay.com": {
    key: "en",
    locale: "en",
    filters: { foreign_exposure: true },
    copy: "foreign",
    enabled: false,
  },
} as const;

export const CANONICAL_HOST =
  process.env.NEXT_PUBLIC_CANONICAL_HOST ?? "propia.com.py";

const DEFAULT = VERTICALS[CANONICAL_HOST] ?? VERTICALS["propia.com.py"];

/** Resolve a Host header to a vertical. Unknown hosts (localhost, previews) → propia. */
export function resolveVertical(host: string | null): VerticalConfig {
  if (!host) return DEFAULT;
  const bare = host.toLowerCase().replace(/^www\./, "").split(":")[0];
  const v = VERTICALS[bare];
  return v && v.enabled ? v : DEFAULT;
}
