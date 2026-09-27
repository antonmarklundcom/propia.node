/**
 * CSV of the deal ledger (plan-agency batch 6) — super-admin only, like the
 * page: it carries the money columns. Same rows as /admin/negocios's table
 * (`listDeals()`), written by the pure `dealsCsv()`.
 */
import { requireSuperAdmin } from "@/lib/auth/guards";
import { csvFilename, csvResponse } from "@/lib/csv";
import { dealsCsv } from "@/lib/deal-export";
import { listDeals } from "@/lib/deals";
import { siteOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

/** `listDeals()`'s own ceiling; the page table shows the newest 500. */
const EXPORT_LIMIT = 1000;

export async function GET(): Promise<Response> {
  await requireSuperAdmin();
  const [rows, origin] = await Promise.all([listDeals(EXPORT_LIMIT), siteOrigin()]);
  return csvResponse(dealsCsv(rows, origin), csvFilename("negocios"));
}
