/**
 * Listing reports in the staff inbox (plan-build-2026-09-26 A3, Seeker 7).
 *
 * A report is a `leads` row — `lead_type: question`, `routed_to: internal`,
 * `utm.source: "report:listing"` — so there is no table of its own, and no
 * `leads.source` column either (CLAUDE.md backlog 11). The marker lives in the
 * json `utm` column; `JSON_UNQUOTE(JSON_EXTRACT(...))` reads it the same way
 * on MySQL 8 and on MariaDB, where `json` is stored as longtext.
 */
import "server-only";
import { and, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";

export const REPORT_SOURCE = "report:listing";

/** WHERE fragment: this lead is a listing report. */
export function isReportLead(): SQL {
  return sql`JSON_UNQUOTE(JSON_EXTRACT(${leads.utm}, '$.source')) = ${REPORT_SOURCE}`;
}

/**
 * WHERE fragment: this lead is NOT a listing report. For the publisher-facing
 * counts — a report on a listing must never show up as "1 consulta" in the
 * panel of the person it is about. `coalesce` because a lead with no utm, or
 * no `source`, extracts NULL, and `NULL <> x` is not true.
 */
export function isNotReportLead(): SQL {
  return sql`coalesce(JSON_UNQUOTE(JSON_EXTRACT(${leads.utm}, '$.source')), '') <> ${REPORT_SOURCE}`;
}

/** How many reports the inbox holds — the "Reportes" chip's count. */
export async function countReportLeads(internalOnly = false): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(leads)
    .where(
      internalOnly
        ? and(eq(leads.routedTo, "internal"), isReportLead())
        : isReportLead(),
    );
  return Number(row?.n ?? 0);
}
