/**
 * CSV of /agencia/leads (build A1, Agency 8): exactly the rows that page shows
 * this caller — their own inbox (`getPanelLeads()` under `panelScope()`) and
 * what the portal shared with them (`getSharedLeads()`). Same guard, same
 * scope, same two reads; see src/lib/lead-export.ts.
 */
import { panelScope, requireAgencyContext } from "@/lib/auth/guards";
import { csvFilename, csvResponse } from "@/lib/csv";
import { panelLeadSet, panelLeadsCsv, panelShowsOwnLeads } from "@/lib/lead-export";
import { listingCanonicalOrigin } from "@/lib/origin";
import type { NextRequest } from "next/server";
import { AGENCY_LEAD_VIEW_COOKIE, panelLeadAccess, parseAgencyLeadView } from "@/lib/panel-lead-access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  const ctx = await requireAgencyContext();
  // The page's view (?vista=, else the remembered cookie): an agent's own,
  // or an agency admin's "Mis consultas" / "Todo el equipo".
  const access = await panelLeadAccess(
    ctx,
    parseAgencyLeadView(
      req.nextUrl.searchParams.get("vista") ?? undefined,
      req.cookies.get(AGENCY_LEAD_VIEW_COOKIE)?.value,
    ),
  );
  const [set, origin] = await Promise.all([
    panelLeadSet({
      scope: panelScope(ctx),
      access,
      showOwn: panelShowsOwnLeads(ctx),
    }),
    listingCanonicalOrigin(),
  ]);
  return csvResponse(panelLeadsCsv(set, origin), csvFilename("consultas"));
}
