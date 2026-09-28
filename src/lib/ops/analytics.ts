/**
 * Roll raw analytics events up into `analytics_daily`, then prune raw events
 * older than the retention setting (/admin/ajustes, 365 days by default).
 *
 * Every complete day (Paraguay time) that has raw events but no `total` rows
 * yet is rolled up; a re-run recomputes a day with the same numbers
 * (`ON DUPLICATE KEY UPDATE` sets, it does not add), so the job is safe to run
 * hourly from the cron tick and by hand. Raw rows are only ever deleted for
 * days that are already rolled up — the totals outlive the detail, never the
 * other way round.
 *
 * Page-speed measurements (`web_vitals`, src/lib/web-vitals.ts) have no
 * rollup — /admin/analitica reads the last seven days raw — so they are
 * simply pruned at the same retention cutoff.
 */
import "server-only";
import { and, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { analyticsDay } from "@/lib/analytics";
import { getAnalyticsRawDays } from "@/lib/site-settings";
import { countWebVitalsBefore, deleteWebVitalsBefore } from "@/lib/web-vitals";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

/** One statement per dimension; `value` is what `analytics_daily.value` holds. */
const DIMENSIONS: Array<{ dim: string; value: string; where: string }> = [
  { dim: "total", value: "''", where: "1=1" },
  { dim: "path", value: "LEFT(path, 191)", where: "1=1" },
  { dim: "listing", value: "CAST(listing_id AS CHAR)", where: "listing_id IS NOT NULL" },
  { dim: "referrer", value: "COALESCE(referrer_host, '')", where: "1=1" },
  { dim: "utm_source", value: "utm_source", where: "utm_source IS NOT NULL" },
  { dim: "utm_campaign", value: "LEFT(utm_campaign, 191)", where: "utm_campaign IS NOT NULL" },
  { dim: "device", value: "device", where: "1=1" },
];

export function dayMinus(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Complete days with raw events and no rollup yet, oldest first. */
async function daysToRoll(today: string): Promise<string[]> {
  const [rows] = (await db.execute(sql`
    SELECT DISTINCT DATE_FORMAT(e.day, '%Y-%m-%d') AS day
    FROM analytics_events e
    WHERE e.day < ${today}
      AND NOT EXISTS (
        SELECT 1 FROM analytics_daily d WHERE d.day = e.day AND d.dim = 'total'
      )
    ORDER BY e.day
    LIMIT 400
  `)) as unknown as [Array<{ day: string }>];
  // DATE_FORMAT: a DATE read as a JS Date shifts by the process timezone.
  return rows.map((r) => String(r.day));
}

export async function rollUpDay(day: string): Promise<void> {
  await db.transaction(async (tx) => {
    for (const d of DIMENSIONS) {
      await tx.execute(sql`
        INSERT INTO analytics_daily (day, vertical, event, dim, value, count, uniques)
        SELECT day, vertical, event, ${d.dim}, ${sql.raw(d.value)} AS v,
               COUNT(*), COUNT(DISTINCT visitor_hash)
        FROM analytics_events
        WHERE day = ${day} AND ${sql.raw(d.where)}
        GROUP BY day, vertical, event, v
        ON DUPLICATE KEY UPDATE count = VALUES(count), uniques = VALUES(uniques)
      `);
    }
  });
}

export async function runAnalytics(opts: OpsOptions): Promise<OpsResult> {
  return opsRun("cron:analytics", opts.dry, async (out) => {
    out.track("dias_a_resumir", "eventos_a_borrar", "vitals_a_borrar");
    const today = analyticsDay();
    const days = await daysToRoll(today);
    out.count("dias_a_resumir", days.length);

    const rawDays = await getAnalyticsRawDays();
    const cutoff = dayMinus(today, rawDays);
    // Only days already rolled up (or about to be, in this same run) are
    // eligible: everything before `cutoff` that is also before today.
    const [old] = await db
      .select({ n: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(lt(analyticsEvents.day, cutoff));
    out.count("eventos_a_borrar", Number(old?.n ?? 0));
    const oldVitals = await countWebVitalsBefore(cutoff);
    out.count("vitals_a_borrar", oldVitals);
    out.note(`Retención de eventos detallados: ${rawDays} días (se borra antes del ${cutoff}).`);

    if (opts.dry) return;

    for (const day of days) await rollUpDay(day);
    if (Number(old?.n ?? 0) > 0) {
      // Never delete a day that is not rolled up yet (only possible if more
      // than 400 days were pending): stop at the oldest one still waiting.
      const pending = await daysToRoll(today);
      const safeCutoff = pending.length && pending[0] < cutoff ? pending[0] : cutoff;
      if (safeCutoff !== cutoff) out.note(`Borrado limitado hasta ${safeCutoff}: quedan días sin resumir.`);
      await db
        .delete(analyticsEvents)
        .where(and(lt(analyticsEvents.day, safeCutoff), lt(analyticsEvents.day, today)));
    }
    if (oldVitals > 0) await deleteWebVitalsBefore(cutoff);
  });
}
