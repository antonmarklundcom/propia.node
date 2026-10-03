/**
 * Google Search Console, read-only, for /admin/google: clicks, impressions,
 * click rate and average position per domain for the last 28 days, the top
 * pages and searches, and a row for every evergreen page the domain owns —
 * the pages built to rank, so the operator sees which ones do.
 *
 * Off until `GSC_SERVICE_ACCOUNT_JSON` holds a Google service-account key
 * (the whole JSON, or the same JSON base64-encoded) whose `client_email` has
 * been added as a user on each Search Console property. No SDK: the server
 * signs its own JWT with `node:crypto` and trades it for a one-hour token —
 * the documented service-account flow, two HTTPS calls.
 *
 * "Candidatas a página evergreen": category URLs with impressions that the
 * evergreen registry does not list (`src/lib/gsc-candidates.ts`, pure), with
 * their top searches from one extra page × query read per property — its own
 * six-hour cache entry, so a failure there leaves the rest of the report intact.
 *
 * Properties default to `sc-domain:<host>` for every live door;
 * `GSC_PROPERTIES` (comma list, e.g. `sc-domain:inmobiliaria.com.py,https://terreno.com.py/`)
 * overrides that. Results are cached six hours per property (TTL only — no
 * write in this app changes them). Never throws into the page: a property
 * that fails reports its error in place.
 */
import "server-only";
import { createSign } from "node:crypto";
import { unstable_cache } from "next/cache";
import { VERTICALS } from "@/config/verticals";
import { evergreenPathsFor, isEvergreenPath } from "@/content/evergreen";
import { liveHosts } from "@/lib/ops/live-check";
import {
  categoryPageFilterRegex,
  categoryPathOf,
  evergreenCandidates,
  type Candidate,
  type PageQueryRow,
  type PageRow,
} from "@/lib/gsc-candidates";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DAYS = 28;
/** Search Console data lags; the last two days are incomplete. */
const LAG_DAYS = 2;
const TOP_ROWS = 20;
const TIMEOUT_MS = 12_000;

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

/** The key from the environment, or null when unset or unreadable. */
export function serviceAccount(raw = process.env.GSC_SERVICE_ACCOUNT_JSON): ServiceAccount | null {
  const v = raw?.trim();
  if (!v) return null;
  for (const text of [v, Buffer.from(v, "base64").toString("utf8")]) {
    try {
      const j = JSON.parse(text) as Partial<ServiceAccount>;
      if (j.client_email && j.private_key) return { client_email: j.client_email, private_key: j.private_key };
    } catch {
      // try the other spelling
    }
  }
  return null;
}

export function isSearchConsoleConfigured(): boolean {
  return serviceAccount() !== null;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

/** The signed assertion the token endpoint trades for an access token. Pure. */
export function signedAssertion(sa: ServiceAccount, nowSeconds: number): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 3600 }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`;
}

let token: { value: string; until: number } | null = null;

async function accessToken(sa: ServiceAccount): Promise<string> {
  if (token && token.until > Date.now()) return token.value;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedAssertion(sa, Math.floor(Date.now() / 1000)),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !body.access_token) throw new Error(body.error_description ?? `token ${res.status}`);
  token = { value: body.access_token, until: Date.now() + ((body.expires_in ?? 3600) - 120) * 1000 };
  return token.value;
}

export interface GscRow {
  key: string;
  /** The dimension values, in request order (absent on hand-built zero rows). */
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The reporting window: 28 full days ending two days ago. */
export function reportWindow(now = new Date()): { startDate: string; endDate: string } {
  const end = new Date(now.getTime() - LAG_DAYS * 86_400_000);
  const start = new Date(end.getTime() - (DAYS - 1) * 86_400_000);
  return { startDate: isoDay(start), endDate: isoDay(end) };
}

/** One `dimensionFilterGroups` filter of the Search Analytics API. */
interface DimensionFilter {
  dimension: string;
  operator: "includingRegex" | "equals" | "contains";
  expression: string;
}

async function query(
  site: string,
  dimensions: string[],
  rowLimit: number,
  filters: DimensionFilter[] = [],
): Promise<GscRow[]> {
  const sa = serviceAccount();
  if (!sa) throw new Error("not configured");
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${await accessToken(sa)}`, "content-type": "application/json" },
      body: JSON.stringify({
        ...reportWindow(),
        dimensions,
        rowLimit,
        ...(filters.length > 0 ? { dimensionFilterGroups: [{ groupType: "and", filters }] } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  const body = (await res.json().catch(() => ({}))) as {
    rows?: { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(body.error?.message ?? `Search Console ${res.status}`);
  return (body.rows ?? []).map((r) => ({
    key: r.keys?.join(" · ") ?? "",
    keys: r.keys ?? [],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

export interface PropertyReport {
  property: string;
  host: string | null;
  window: { startDate: string; endDate: string };
  totals: GscRow | null;
  topPages: GscRow[];
  topQueries: GscRow[];
  /** Every evergreen path the door owns, with its numbers or zeros. */
  evergreen: (GscRow & { path: string })[];
  /**
   * The category-page rows of the page request (`categoryPathOf()` accepts
   * them), kept for the candidate list — a few dozen rows, not the 1 000.
   */
  categoryPages: PageRow[];
  /** Category pages with impressions that are not evergreen here (`src/lib/gsc-candidates.ts`). */
  candidates: Candidate[];
  /** Set when the page × query read failed: candidates then carry no queries. */
  candidateQueriesError: string | null;
  error: string | null;
}

/** `sc-domain:x` / `https://x/` → the host, when it is one of our doors. */
export function propertyHost(property: string): string | null {
  const host = property.startsWith("sc-domain:")
    ? property.slice("sc-domain:".length)
    : (() => {
        try {
          return new URL(property).host;
        } catch {
          return "";
        }
      })();
  return VERTICALS[host] ? host : null;
}

export function searchConsoleProperties(): string[] {
  const env = process.env.GSC_PROPERTIES?.trim();
  if (env) return env.split(",").map((p) => p.trim()).filter(Boolean);
  return liveHosts().map((h) => `sc-domain:${h}`);
}

function emptyReport(property: string): PropertyReport {
  return {
    property,
    host: propertyHost(property),
    window: reportWindow(),
    totals: null,
    topPages: [],
    topQueries: [],
    evergreen: [],
    categoryPages: [],
    candidates: [],
    candidateQueriesError: null,
    error: null,
  };
}

/** Throws on any failure, so a failed report is never cached. */
async function propertyReportUncached(property: string): Promise<PropertyReport> {
  const base = emptyReport(property);
  const host = base.host;
  const [totals, pages, queries] = await Promise.all([
    query(property, [], 1),
    query(property, ["page"], 1000),
    query(property, ["query"], TOP_ROWS),
  ]);
  const byPath = new Map<string, GscRow>();
  for (const p of pages) {
    try {
      const u = new URL(p.key);
      if (!host || u.host === host) byPath.set(u.pathname, p);
    } catch {
      // not a URL
    }
  }
  const door = host ? VERTICALS[host] : null;
  const categoryPages: PageRow[] = [];
  for (const p of pages) {
    if (categoryPathOf(p.key, host) !== null) {
      categoryPages.push({ page: p.key, clicks: p.clicks, impressions: p.impressions, position: p.position });
    }
  }
  return {
    ...base,
    categoryPages,
    totals: totals[0] ?? { key: "", clicks: 0, impressions: 0, ctr: 0, position: 0 },
    topPages: pages.slice(0, TOP_ROWS),
    topQueries: queries,
    evergreen: (door ? evergreenPathsFor(door.key) : []).map((path) => ({
      path,
      ...(byPath.get(path) ?? { key: path, clicks: 0, impressions: 0, ctr: 0, position: 0 }),
    })),
  };
}

const CACHE_SECONDS = 6 * 60 * 60;
const cachedReport = unstable_cache(propertyReportUncached, ["gsc:report"], { revalidate: CACHE_SECONDS });

/** Rows asked for in the page × query read; category URLs only (pre-filtered). */
const PAGE_QUERY_ROWS = 5000;

/**
 * Page × query rows for the category URLs of a property — the searches behind
 * each evergreen candidate. Its own cache entry (same six hours), so a failure
 * here never costs the main report, and like it, it throws on any failure so a
 * failed read is never cached.
 */
async function categoryPageQueriesUncached(property: string): Promise<PageQueryRow[]> {
  const rows = await query(property, ["page", "query"], PAGE_QUERY_ROWS, [
    { dimension: "page", operator: "includingRegex", expression: categoryPageFilterRegex() },
  ]);
  return rows.map((r) => ({
    page: r.keys?.[0] ?? "",
    query: r.keys?.[1] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    position: r.position,
  }));
}

const cachedPageQueries = unstable_cache(categoryPageQueriesUncached, ["gsc:page-query"], {
  revalidate: CACHE_SECONDS,
});

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** The report plus its candidate list; the candidates are derived, never cached on their own. */
async function reportWithCandidates(property: string): Promise<PropertyReport> {
  const report = await cachedReport(property);
  const door = report.host ? VERTICALS[report.host] : null;
  // Without a door there is no registry to compare against: no candidates.
  if (!door || (report.categoryPages ?? []).length === 0) return report;
  const sameLocaleKeys = [
    ...new Set(Object.values(VERTICALS).filter((v) => v.locale === door.locale).map((v) => v.key)),
  ];
  let pageQueries: PageQueryRow[] | null = null;
  let candidateQueriesError: string | null = null;
  try {
    pageQueries = await cachedPageQueries(property);
  } catch (e) {
    candidateQueriesError = errorText(e);
  }
  return {
    ...report,
    candidates: evergreenCandidates(report.categoryPages, pageQueries, {
      host: report.host,
      // The door's own registry entries, and also a path evergreen on another
      // door in the same language: verify:seo allows one evergreen page per
      // path per language, so that one cannot be promoted here.
      isEvergreen: (path) => sameLocaleKeys.some((k) => isEvergreenPath(path, k)),
    }),
    candidateQueriesError,
  };
}

export async function searchConsoleReports(): Promise<PropertyReport[]> {
  return Promise.all(
    searchConsoleProperties().map((p) =>
      reportWithCandidates(p).catch((e: unknown) => ({
        ...emptyReport(p),
        error: errorText(e),
      })),
    ),
  );
}

/** The service account's address, for the setup instructions. */
export function serviceAccountEmail(): string | null {
  return serviceAccount()?.client_email ?? null;
}
