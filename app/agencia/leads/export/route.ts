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

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const ctx = await requireAgencyContext();
  const [set, origin] = await Promise.all([
    panelLeadSet({
      scope: panelScope(ctx),
      viewer: { agencyId: ctx.agencyId, userId: ctx.user.id },
      showOwn: panelShowsOwnLeads(ctx),
    }),
    listingCanonicalOrigin(),
  ]);
  return csvResponse(panelLeadsCsv(set, origin), csvFilename("consultas"));
}
