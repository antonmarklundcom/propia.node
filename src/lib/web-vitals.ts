/**
 * Page speed from real visitors (Core Web Vitals), the server half. The
 * browser reports each metric once per page through the analytics beacon
 * (`AnalyticsBeacon` → `/api/a`); this buffers them in memory and writes one
 * multi-row INSERT a minute, exactly like the page views in `analytics.ts`
 * — a measurement must never cost a visitor a database round-trip.
 *
 * Stored per measurement: day, door, page type, metric, value, device. No
 * path, no visitor hash — nothing here identifies a visit.
 *
 * Until migration 0020 is applied the INSERT fails, is logged once per batch
 * and dropped; /admin/analitica says the table is missing instead of failing.
 */
import "server-only";
import { and, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { webVitals } from "@/db/schema";
import { analyticsDay, deviceOf, isTrackedPath, normalizePath } from "@/lib/analytics";
import { isBotUserAgent } from "@/lib/view-tracking";
import { isVitalMetricName, p75, pageTypeOf, type PageType, type VitalMetric } from "@/lib/web-vitals-shared";

type Row = typeof webVitals.$inferInsert;

const MAX_BUFFER = 5000;
const FLUSH_AT = 200;
const FLUSH_EVERY_MS = 60_000;
/** A value past this is a broken measurement, not a slow page (ms; CLS is far below). */
const MAX_VALUE = 120_000;

const buffer: Row[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<number> | null = null;

export interface VitalInput {
  metric: string;
  value: number;
  path: string;
  vertical: string;
  userAgent: string | null;
}

/** Queue one measurement. Synchronous and never throws. */
export function recordWebVital(input: VitalInput): void {
  try {
    const ua = input.userAgent ?? "";
    if (isBotUserAgent(ua)) return;
    if (!isVitalMetricName(input.metric)) return;
    if (!Number.isFinite(input.value) || input.value < 0 || input.value > MAX_VALUE) return;
    const path = normalizePath(input.path);
    if (!path || !isTrackedPath(path)) return;
    if (buffer.length >= MAX_BUFFER) return;
    buffer.push({
      day: analyticsDay(),
      vertical: input.vertical.slice(0, 20),
      pageType: pageTypeOf(path),
      metric: input.metric,
      value: input.value.toFixed(4),
      device: deviceOf(ua),
    });
    if (buffer.length >= FLUSH_AT) void flushWebVitals();
    else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        void flushWebVitals();
      }, FLUSH_EVERY_MS);
      timer.unref?.();
    }
  } catch {
    /* a measurement is never worth an error page */
  }
}

export async function flushWebVitals(): Promise<number> {
  if (flushing) return flushing;
  flushing = (async () => {
    const rows = buffer.splice(0, buffer.length);
    if (rows.length === 0) return 0;
    try {
      await db.insert(webVitals).values(rows);
      return rows.length;
    } catch (e) {
      console.warn(`[web-vitals] dropped ${rows.length} measurements: ${e instanceof Error ? e.name : "error"}`);
      return 0;
    }
  })();
  try {
    return await flushing;
  } finally {
    flushing = null;
  }
}

/**
 * The table is not there yet (migration 0020 pending). Drizzle hangs the
 * driver error off `cause`, so walk the chain — the lesson post-queries.ts
 * records — and match the message as a fallback.
 */
function isMissingTable(err: unknown): boolean {
  for (let e: unknown = err, hops = 0; e && hops < 5; hops++) {
    const node = e as { code?: string; message?: string; cause?: unknown };
    if (node.code === "ER_NO_SUCH_TABLE") return true;
    if (typeof node.message === "string" && /web_vitals.*doesn't exist|no such table/i.test(node.message)) return true;
    e = node.cause;
  }
  return false;
}

export interface VitalSummaryCell {
  p75: number | null;
  samples: number;
}

export type VitalSummary = Map<PageType, Map<VitalMetric, VitalSummaryCell>>;

/**
 * p75 per page type and metric over the last `days` days, for one door or
 * all (`vertical` null). Null when the table does not exist yet (migration
 * 0020 not applied) — any other error is the caller's.
 */
export async function webVitalsSummary(opts: {
  days: number;
  vertical: string | null;
  device?: "mobile" | "desktop" | null;
}): Promise<VitalSummary | null> {
  const since = analyticsDay(new Date(Date.now() - (opts.days - 1) * 86_400_000));
  const conds = [gte(webVitals.day, since)];
  if (opts.vertical) conds.push(sql`${webVitals.vertical} = ${opts.vertical}`);
  if (opts.device === "mobile") conds.push(sql`${webVitals.device} IN ('mobile', 'tablet')`);
  if (opts.device === "desktop") conds.push(sql`${webVitals.device} = 'desktop'`);
  let rows: { pageType: string; metric: VitalMetric; value: string }[];
  try {
    rows = await db
      .select({ pageType: webVitals.pageType, metric: webVitals.metric, value: webVitals.value })
      .from(webVitals)
      .where(and(...conds))
      .limit(50_000);
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
  const values = new Map<string, number[]>();
  for (const r of rows) {
    const k = `${r.pageType}|${r.metric}`;
    const list = values.get(k) ?? [];
    list.push(Number(r.value));
    values.set(k, list);
  }
  const out: VitalSummary = new Map();
  for (const [k, list] of values) {
    const [pageType, metric] = k.split("|") as [PageType, VitalMetric];
    const byMetric = out.get(pageType) ?? new Map<VitalMetric, VitalSummaryCell>();
    byMetric.set(metric, { p75: p75(list), samples: list.length });
    out.set(pageType, byMetric);
  }
  return out;
}

/** For `cron:analytics`: measurements older than the raw-event retention. */
export async function countWebVitalsBefore(day: string): Promise<number> {
  try {
    const [r] = await db.select({ n: sql<number>`count(*)` }).from(webVitals).where(sql`${webVitals.day} < ${day}`);
    return Number(r?.n ?? 0);
  } catch {
    return 0; // table not created yet
  }
}

/**
 * Errors propagate: the job calls this only after `countWebVitalsBefore()`
 * found rows, so the table exists and a failure is a real one.
 */
export async function deleteWebVitalsBefore(day: string): Promise<void> {
  await db.delete(webVitals).where(sql`${webVitals.day} < ${day}`);
}
