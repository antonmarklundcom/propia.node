/**
 * The pure half of page-speed measurement (`src/lib/web-vitals.ts` is the
 * server half): which page type a path is, the 75th percentile, and Google's
 * published "good / needs improvement / poor" thresholds for each metric.
 * No `next/*`, no drizzle — `verify:telegram`'s site-health block drives it,
 * and the analytics beacon (a client component) imports it.
 */

export const VITAL_METRICS = ["LCP", "INP", "CLS", "FCP", "TTFB"] as const;
export type VitalMetric = (typeof VITAL_METRICS)[number];

/** Next also reports its own timings (`Next.js-hydration`, …): those are not stored. */
export function isVitalMetricName(m: string): m is VitalMetric {
  return (VITAL_METRICS as readonly string[]).includes(m);
}

/**
 * Google's Core Web Vitals thresholds (web.dev/articles/vitals): at or
 * below `good` is good, above `poor` is poor. Milliseconds, except CLS.
 */
export const VITAL_THRESHOLDS: Record<VitalMetric, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

export type VitalRating = "good" | "needs-improvement" | "poor";

export function vitalRating(metric: VitalMetric, value: number): VitalRating {
  const t = VITAL_THRESHOLDS[metric];
  return value <= t.good ? "good" : value > t.poor ? "poor" : "needs-improvement";
}

export const PAGE_TYPES = ["home", "listing", "category", "hub", "guide", "other"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

const OPERATIONS = new Set(["venta", "alquiler", "alquiler-temporal"]);

/** The kind of page a path is — the unit page speed is reported by. */
export function pageTypeOf(path: string): PageType {
  const segs = path.split(/[?#]/)[0].split("/").filter(Boolean);
  if (segs.length === 0) return "home";
  if (segs[0] === "propiedad") return "listing";
  if (segs[0] === "guias" && segs.length > 1) return "guide";
  if (OPERATIONS.has(segs[0])) return segs.length === 1 ? "hub" : "category";
  return "other";
}

/** The 75th percentile (nearest-rank), the figure Google assesses; null for none. */
export function p75(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.75) - 1)];
}
