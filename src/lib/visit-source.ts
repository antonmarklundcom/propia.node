/**
 * Where a visit came from, shared by the analytics beacon and the lead forms.
 *
 * The beacon (src/components/AnalyticsBeacon.tsx) stores the first page's
 * referrer and utm tags in this tab's sessionStorage under
 * `VISIT_SOURCE_KEY`. A lead form reads the URL's own `utm_*` first and, when
 * there are none (the visitor clicked on from the landing page), falls back
 * to that stored source — so a lead three pages into a campaign visit is
 * still credited to the campaign. Pure: no `next/*`, no `server-only`; the
 * browser wrapper `readVisitUtm()` is the only part that touches `window`.
 */

export const VISIT_SOURCE_KEY = "analytics:visit-source";

/** The beacon's stored shape: referrer URL and the three utm tags. */
export interface VisitSource {
  r?: string;
  us?: string;
  um?: string;
  uc?: string;
}

/** The utm key a lead form sends for the visit's referrer host (never the full URL). */
export const VISIT_REFERRER_UTM_KEY = "utm_referrer";

const URL_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/** Parse the stored source defensively; anything malformed is "none". */
export function parseVisitSource(raw: string | null | undefined): VisitSource | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const out: VisitSource = {};
    for (const k of ["r", "us", "um", "uc"] as const) {
      if (typeof o[k] === "string" && o[k]) out[k] = (o[k] as string).slice(0, 300);
    }
    return out;
  } catch {
    return null;
  }
}

/** Host of a referrer URL without `www.`, or null; `ownHost` is dropped (internal navigation). */
export function referrerHost(referrer: string | null | undefined, ownHost?: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    const own = (ownHost ?? "").toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
    return host && host !== own ? host.slice(0, 120) : null;
  } catch {
    return null;
  }
}

/**
 * The utm keys a lead form sends: the URL's own `utm_*` when it has any,
 * otherwise the visit's stored campaign tags, plus the visit's referrer host
 * (`utm_referrer`) when there is one. Empty object when nothing is known.
 */
export function leadUtmFrom(
  search: string,
  storedRaw: string | null | undefined,
  ownHost?: string | null,
): Record<string, string> {
  const p = new URLSearchParams(search);
  const utm: Record<string, string> = {};
  for (const k of URL_KEYS) {
    const v = p.get(k);
    if (v) utm[k] = v;
  }
  const visit = parseVisitSource(storedRaw);
  if (Object.keys(utm).length === 0 && visit) {
    if (visit.us) utm.utm_source = visit.us;
    if (visit.um) utm.utm_medium = visit.um;
    if (visit.uc) utm.utm_campaign = visit.uc;
  }
  const host = referrerHost(visit?.r, ownHost);
  if (host) utm[VISIT_REFERRER_UTM_KEY] = host;
  return utm;
}

/** Browser wrapper for the lead forms; `{}` on the server or when storage is blocked. */
export function readVisitUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  let stored: string | null = null;
  try {
    stored = window.sessionStorage.getItem(VISIT_SOURCE_KEY);
  } catch {
    stored = null;
  }
  return leadUtmFrom(window.location.search, stored, window.location.host);
}
