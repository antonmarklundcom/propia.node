/**
 * Daily digest of leads nobody has followed up: `leads.status = 'new'` more
 * than `STALE_AFTER_HOURS` after they arrived. One operator alert — the same
 * channels as every other (`alertOperator()`: webhook, Telegram, email; silent
 * when none is configured) — carrying counts and a link, never a lead's name
 * or number.
 *
 * Scope is the **internal lane**: the leads the operator works. A lead routed
 * to an agency, agent or owner stays `new` in the operator's list forever by
 * design (the partner answers in their own panel, and nobody marks it), so
 * counting those would make the digest say the same thing every day.
 *
 * One pass, the same in both modes (AGENTS.md §4): a dry run counts exactly
 * what the real run would report and stops before the alert. Nothing is
 * written — no column marks "digested" — so the daily cadence lives in the
 * tick (`src/lib/cron-tick.ts`, `daily()`), not here. Spam
 * (`status = 'spam'`) is never `new`, so it is excluded by the filter itself.
 *
 * Scheduled by `/api/cron/tick`; also `npm run cron:lead-digest` and a card
 * on /admin/operaciones. No cache tag: nothing a visitor reads changes.
 */
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { CANONICAL_HOST } from "@/config/verticals";
import { alertOperator } from "@/lib/crm";
import { esPanel } from "@/i18n/es";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

/** Hours a lead may stay `new` before the digest counts it. */
export const STALE_AFTER_HOURS = 24;

export async function runLeadDigest(opts: OpsOptions): Promise<OpsResult> {
  return opsRun("cron:lead-digest", opts.dry, async (out) => {
    out.track("sin_atender", "mas_de_3_dias");
    out.note(`cutoff ${STALE_AFTER_HOURS} h, internal lane`);

    const [row] = await db
      .select({
        n: sql<number>`count(*)`,
        oldest: sql<Date | string | null>`min(${leads.createdAt})`,
        over3d: sql<number>`coalesce(sum(${leads.createdAt} < now() - interval 3 day), 0)`,
      })
      .from(leads)
      .where(
        and(
          eq(leads.status, "new"),
          eq(leads.routedTo, "internal"),
          sql`${leads.createdAt} < now() - interval ${sql.raw(String(STALE_AFTER_HOURS))} hour`,
        ),
      );
    const stale = Number(row?.n ?? 0);
    out.count("sin_atender", stale);
    out.count("mas_de_3_dias", Number(row?.over3d ?? 0));

    if (stale === 0) {
      out.note("nothing to report: no alert.");
      return;
    }
    const oldestDays = row?.oldest
      ? Math.max(1, Math.floor((Date.now() - new Date(row.oldest).getTime()) / 86_400_000))
      : 1;
    if (opts.dry) {
      out.note("--dry: no alert sent.");
      return;
    }

    // Request-free on purpose (CLI and Worker tick): the panel lives on the primary.
    await alertOperator({
      kind: "lead_digest",
      title: esPanel.leadDigestTitle(stale),
      detail: esPanel.leadDigestDetail(STALE_AFTER_HOURS, oldestDays, Number(row?.over3d ?? 0)),
      url: `https://${CANONICAL_HOST}/admin/leads?estado=new`,
      site: CANONICAL_HOST,
    });
    // alertOperator() never reports back, so this says it was handed over, not delivered.
    out.note("operator alert handed to the configured channels (if any)");
  });
}
