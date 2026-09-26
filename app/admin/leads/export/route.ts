/**
 * CSV of /admin/leads with the current filter (build A1, Agency 8). The filter
 * is parsed by the page's own parser and read by the page's own query, and a
 * `staff` user gets the internal lane only — the role decides, never the URL.
 */
import type { NextRequest } from "next/server";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import { csvFilename, csvResponse } from "@/lib/csv";
import { adminLeadRows, adminLeadsCsv, parseAdminLeadFilter } from "@/lib/lead-export";
import { listingCanonicalOrigin } from "@/lib/origin";
import { countLeadsByVertical } from "@/lib/panel-queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  const user = await requireStaffOrAbove();
  const internalOnly = isStaff(user.role);
  const sp = req.nextUrl.searchParams;
  const sites = await countLeadsByVertical(internalOnly);
  const filter = parseAdminLeadFilter(
    {
      tipo: sp.get("tipo") ?? undefined,
      sitio: sp.get("sitio") ?? undefined,
      estado: sp.get("estado") ?? undefined,
      tel: sp.get("tel") ?? undefined,
      q: sp.get("q") ?? undefined,
    },
    sites.map((s) => s.vertical),
  );
  const [rows, origin] = await Promise.all([
    adminLeadRows(filter, internalOnly),
    listingCanonicalOrigin(),
  ]);
  return csvResponse(adminLeadsCsv(rows, origin), csvFilename("consultas"));
}
