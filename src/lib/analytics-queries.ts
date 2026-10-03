/**
 * The reads behind /admin/analitica. Days still inside the raw-event retention
 * are counted from `analytics_events` (exact, including today); older days
 * come from the `analytics_daily` rollup. The two ranges never overlap, so
 * nothing is counted twice.
 *
 * Not cached: an admin page read a few times a day, and "today" must move.
 */
import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { analyticsDay } from "./analytics";
import { dayMinus, VISITOR_SOURCE_SQL } from "./ops/analytics";
import { getAnalyticsRawDays } from "./site-settings";

type Rows = Array<Record<string, unknown>>;

async function rows(query: SQL): Promise<Rows> {
  const [r] = (await db.execute(query)) as unknown as [Rows];
  return r;
}

const n = (v: unknown): number => Number(v ?? 0) || 0;

export interface AnalyticsWindow {
  from: string;
  to: string;
  /** First day read from raw events; days before it come from the rollup. */
  rawFrom: string;
  vertical: string | null;
}

/** `endDay` ends the window earlier than today (the previous period of a comparison). */
export async function analyticsWindow(
  days: number,
  vertical: string | null,
  endDay?: string,
): Promise<AnalyticsWindow> {
  const to = endDay ?? analyticsDay();
  const from = dayMinus(to, days - 1);
  const cutoff = dayMinus(to, await getAnalyticsRawDays());
  return { from, to, rawFrom: from > cutoff ? from : cutoff, vertical };
}

function rawWhere(w: AnalyticsWindow): SQL {
  return sql`day BETWEEN ${w.rawFrom} AND ${w.to}${w.vertical ? sql` AND vertical = ${w.vertical}` : sql``}`;
}

/** Null when the window is entirely inside the raw retention. */
function dailyWhere(w: AnalyticsWindow): SQL | null {
  if (w.from >= w.rawFrom) return null;
  const before = dayMinus(w.rawFrom, 1);
  // A window that ends before the raw retention starts is all rollup.
  const last = before < w.to ? before : w.to;
  return sql`day BETWEEN ${w.from} AND ${last}${w.vertical ? sql` AND vertical = ${w.vertical}` : sql``}`;
}

export interface VerticalSummary {
  vertical: string;
  visitors: number;
  pageViews: number;
  listingViews: number;
  listingViewers: number;
  waClicks: number;
  waClickers: number;
  leads: number;
}

export async function summaryByVertical(w: AnalyticsWindow): Promise<VerticalSummary[]> {
  const out = new Map<string, VerticalSummary>();
  const get = (v: string): VerticalSummary => {
    let s = out.get(v);
    if (!s) {
      s = { vertical: v, visitors: 0, pageViews: 0, listingViews: 0, listingViewers: 0, waClicks: 0, waClickers: 0, leads: 0 };
      out.set(v, s);
    }
    return s;
  };

  for (const r of await rows(sql`
    SELECT vertical,
      COUNT(DISTINCT CASE WHEN event = 'page_view' THEN CONCAT(day, visitor_hash) END) AS visitors,
      SUM(event = 'page_view') AS pv,
      SUM(event = 'page_view' AND path LIKE '/propiedad/%') AS lv,
      COUNT(DISTINCT CASE WHEN event = 'page_view' AND path LIKE '/propiedad/%' THEN CONCAT(day, visitor_hash) END) AS lvu,
      SUM(event = 'wa_click') AS wa,
      COUNT(DISTINCT CASE WHEN event = 'wa_click' THEN CONCAT(day, visitor_hash) END) AS wau,
      SUM(event = 'lead_submit') AS leads
    FROM analytics_events WHERE ${rawWhere(w)}
    GROUP BY vertical
  `)) {
    const s = get(String(r.vertical));
    s.visitors += n(r.visitors);
    s.pageViews += n(r.pv);
    s.listingViews += n(r.lv);
    s.listingViewers += n(r.lvu);
    s.waClicks += n(r.wa);
    s.waClickers += n(r.wau);
    s.leads += n(r.leads);
  }

  const dw = dailyWhere(w);
  if (dw) {
    for (const r of await rows(sql`
      SELECT vertical,
        SUM(CASE WHEN event = 'page_view' AND dim = 'total' THEN uniques END) AS visitors,
        SUM(CASE WHEN event = 'page_view' AND dim = 'total' THEN count END) AS pv,
        SUM(CASE WHEN event = 'page_view' AND dim = 'path' AND value LIKE '/propiedad/%' THEN count END) AS lv,
        SUM(CASE WHEN event = 'page_view' AND dim = 'path' AND value LIKE '/propiedad/%' THEN uniques END) AS lvu,
        SUM(CASE WHEN event = 'wa_click' AND dim = 'total' THEN count END) AS wa,
        SUM(CASE WHEN event = 'wa_click' AND dim = 'total' THEN uniques END) AS wau,
        SUM(CASE WHEN event = 'lead_submit' AND dim = 'total' THEN count END) AS leads
      FROM analytics_daily WHERE ${dw}
      GROUP BY vertical
    `)) {
      const s = get(String(r.vertical));
      s.visitors += n(r.visitors);
      s.pageViews += n(r.pv);
      s.listingViews += n(r.lv);
      // Per-path uniques summed can count one person twice across listings:
      // an upper bound for rolled-up days, exact for raw days.
      s.listingViewers += n(r.lvu);
      s.waClicks += n(r.wa);
      s.waClickers += n(r.wau);
      s.leads += n(r.leads);
    }
  }
  return [...out.values()].sort((a, b) => b.visitors - a.visitors);
}

export interface DayRow {
  day: string;
  visitors: number;
  pageViews: number;
  waClicks: number;
  leads: number;
}

export async function byDay(w: AnalyticsWindow): Promise<DayRow[]> {
  const out = new Map<string, DayRow>();
  const get = (d: string) => {
    let r = out.get(d);
    if (!r) {
      r = { day: d, visitors: 0, pageViews: 0, waClicks: 0, leads: 0 };
      out.set(d, r);
    }
    return r;
  };
  for (const r of await rows(sql`
    SELECT DATE_FORMAT(day, '%Y-%m-%d') AS d,
      COUNT(DISTINCT CASE WHEN event = 'page_view' THEN visitor_hash END) AS visitors,
      SUM(event = 'page_view') AS pv, SUM(event = 'wa_click') AS wa, SUM(event = 'lead_submit') AS leads
    FROM analytics_events WHERE ${rawWhere(w)} GROUP BY day
  `)) {
    const x = get(String(r.d));
    x.visitors += n(r.visitors);
    x.pageViews += n(r.pv);
    x.waClicks += n(r.wa);
    x.leads += n(r.leads);
  }
  const dw = dailyWhere(w);
  if (dw) {
    for (const r of await rows(sql`
      SELECT DATE_FORMAT(day, '%Y-%m-%d') AS d,
        SUM(CASE WHEN event = 'page_view' THEN uniques END) AS visitors,
        SUM(CASE WHEN event = 'page_view' THEN count END) AS pv,
        SUM(CASE WHEN event = 'wa_click' THEN count END) AS wa,
        SUM(CASE WHEN event = 'lead_submit' THEN count END) AS leads
      FROM analytics_daily WHERE ${dw} AND dim = 'total' GROUP BY day
    `)) {
      const x = get(String(r.d));
      x.visitors += n(r.visitors);
      x.pageViews += n(r.pv);
      x.waClicks += n(r.wa);
      x.leads += n(r.leads);
    }
  }
  return [...out.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
}

export interface DimRow {
  value: string;
  pageViews: number;
  visitors: number;
  waClicks: number;
  leads: number;
}

const TOP_DIMENSION_SQL = {
  path: { expr: "LEFT(path, 191)", notNull: "path" },
  listing_id: { expr: "CAST(listing_id AS CHAR)", notNull: "listing_id" },
  referrer: { expr: "COALESCE(referrer_host, '')", notNull: "referrer_host" },
  utm_source: { expr: "utm_source", notNull: "utm_source" },
  utm_campaign: { expr: "LEFT(utm_campaign, 191)", notNull: "utm_campaign" },
  device: { expr: "device", notNull: "device" },
} as const satisfies Record<string, { expr: string; notNull: string }>;

/**
 * Top values of one dimension. `column` is the raw-event expression and `dim`
 * the rollup's name for the same thing — both fixed strings from this file,
 * never user input.
 */
async function topDimension(
  w: AnalyticsWindow,
  column: "path" | "listing_id" | "referrer" | "utm_source" | "utm_campaign" | "device",
  dim: string,
  limit: number,
  onlyNonNull = false,
): Promise<DimRow[]> {
  // Looked up, never spelled from the argument: the column is raw SQL, and a
  // type alone does not stop a future caller passing a request value
  // (audit 2026-10 Q2). `notNull` is the column the dimension reads.
  const spec = TOP_DIMENSION_SQL[column];
  if (!spec) throw new Error(`topDimension: unknown column ${String(column)}`);
  const notNull = onlyNonNull ? sql` AND ${sql.raw(spec.notNull)} IS NOT NULL` : sql``;
  const expr = spec.expr;
  const out = new Map<string, DimRow>();
  const get = (v: string) => {
    let r = out.get(v);
    if (!r) {
      r = { value: v, pageViews: 0, visitors: 0, waClicks: 0, leads: 0 };
      out.set(v, r);
    }
    return r;
  };
  for (const r of await rows(sql`
    SELECT ${sql.raw(expr)} AS v,
      SUM(event = 'page_view') AS pv,
      COUNT(DISTINCT CASE WHEN event = 'page_view' THEN CONCAT(day, visitor_hash) END) AS visitors,
      SUM(event = 'wa_click') AS wa, SUM(event = 'lead_submit') AS leads
    FROM analytics_events WHERE ${rawWhere(w)}${notNull}
    GROUP BY v
  `)) {
    const x = get(String(r.v ?? ""));
    x.pageViews += n(r.pv);
    x.visitors += n(r.visitors);
    x.waClicks += n(r.wa);
    x.leads += n(r.leads);
  }
  const dw = dailyWhere(w);
  if (dw) {
    for (const r of await rows(sql`
      SELECT value AS v,
        SUM(CASE WHEN event = 'page_view' THEN count END) AS pv,
        SUM(CASE WHEN event = 'page_view' THEN uniques END) AS visitors,
        SUM(CASE WHEN event = 'wa_click' THEN count END) AS wa,
        SUM(CASE WHEN event = 'lead_submit' THEN count END) AS leads
      FROM analytics_daily WHERE ${dw} AND dim = ${dim} GROUP BY value
    `)) {
      const x = get(String(r.v ?? ""));
      x.pageViews += n(r.pv);
      x.visitors += n(r.visitors);
      x.waClicks += n(r.wa);
      x.leads += n(r.leads);
    }
  }
  return [...out.values()]
    .sort((a, b) => b.pageViews + b.waClicks * 10 + b.leads * 20 - (a.pageViews + a.waClicks * 10 + a.leads * 20))
    .slice(0, limit);
}

export const topPages = (w: AnalyticsWindow) => topDimension(w, "path", "path", 20);
export const topListings = (w: AnalyticsWindow) => topDimension(w, "listing_id", "listing", 20, true);
export const topUtmCampaigns = (w: AnalyticsWindow) => topDimension(w, "utm_campaign", "utm_campaign", 15, true);
export const byDevice = (w: AnalyticsWindow) => topDimension(w, "device", "device", 3);

export interface SourceRow {
  /** utm_source, else referrer host; '' = direct. */
  value: string;
  visitors: number;
  waClicks: number;
  leads: number;
}

/**
 * "Fuente": every visitor once, under one source — their utm_source if any
 * event of the day carried one, else their referrer host, else direct ('').
 * WhatsApp clicks and form leads are credited to the same source. Raw days
 * group per (day, door, visitor); rolled-up days read the rollup's `source`
 * dimension, written by the same rule (src/lib/ops/analytics.ts). Days rolled
 * up before that dimension existed (2026-10-02) have no `source` rows.
 */
export async function sourceTable(w: AnalyticsWindow, limit = 20): Promise<SourceRow[]> {
  const out = new Map<string, SourceRow>();
  const get = (v: string) => {
    let r = out.get(v);
    if (!r) {
      r = { value: v, visitors: 0, waClicks: 0, leads: 0 };
      out.set(v, r);
    }
    return r;
  };
  for (const r of await rows(sql`
    SELECT src AS v, SUM(saw) AS visitors, SUM(wa) AS wa, SUM(leads) AS leads
    FROM (
      SELECT ${sql.raw(VISITOR_SOURCE_SQL)} AS src,
        MAX(event = 'page_view') AS saw,
        SUM(event = 'wa_click') AS wa,
        SUM(event = 'lead_submit') AS leads
      FROM analytics_events WHERE ${rawWhere(w)}
      GROUP BY day, vertical, visitor_hash
    ) per_visitor
    GROUP BY src
  `)) {
    const x = get(String(r.v ?? ""));
    x.visitors += n(r.visitors);
    x.waClicks += n(r.wa);
    x.leads += n(r.leads);
  }
  const dw = dailyWhere(w);
  if (dw) {
    for (const r of await rows(sql`
      SELECT value AS v,
        SUM(CASE WHEN event = 'page_view' THEN uniques END) AS visitors,
        SUM(CASE WHEN event = 'wa_click' THEN count END) AS wa,
        SUM(CASE WHEN event = 'lead_submit' THEN count END) AS leads
      FROM analytics_daily WHERE ${dw} AND dim = 'source' GROUP BY value
    `)) {
      const x = get(String(r.v ?? ""));
      x.visitors += n(r.visitors);
      x.waClicks += n(r.wa);
      x.leads += n(r.leads);
    }
  }
  return [...out.values()]
    .sort((a, b) => b.visitors - a.visitors || b.leads - a.leads || b.waClicks - a.waClicks)
    .slice(0, limit);
}
