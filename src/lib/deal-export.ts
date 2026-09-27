/**
 * CSV of the deal ledger (`/admin/negocios/export`, plan-agency batch 6).
 * Pure — no database, no `next/*` — so `verify:scopes` can check its output.
 *
 * No query of its own: the route hands it `listDeals()`, the same read the
 * /admin/negocios table renders, so the file and the page cannot disagree.
 * Money columns are the stored DECIMAL strings exactly as typed ("1800.50"),
 * never re-formatted or recomputed — the app stores and adds up the owner's
 * figures, it does not derive them. Cells go through `toCsv()`, which
 * neutralises anything a spreadsheet would run as a formula (a note or a
 * buyer's name is free text).
 */
import { esDeals } from "@/i18n/es-deals";
import { csvDate, toCsv } from "@/lib/csv";
import type { DealListRow } from "@/lib/deals";

/** The paid date as the operator typed it (stored at 12:00 UTC, so the UTC date is the typed one). */
function paidDay(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export function dealsCsv(rows: readonly DealListRow[], origin: string): string {
  const t = esDeals;
  return toCsv(
    t.csvHead,
    rows.map((d) => [
      d.id,
      csvDate(d.createdAt),
      d.stageAt ? csvDate(d.stageAt) : null,
      d.leadId,
      d.leadName,
      d.listingTitle,
      d.partnerName ?? t.noPartner,
      t.stage[d.stage] ?? d.stage,
      d.stage === "lost" && d.lostReason ? (t.lostReason[d.lostReason] ?? d.lostReason) : null,
      d.salePriceUsd,
      d.commissionPct,
      d.mySharePct,
      d.myShareUsd,
      paidDay(d.paidAt),
      d.note,
      `${origin}/admin/leads#lead-${d.leadId}`,
    ]),
  );
}
