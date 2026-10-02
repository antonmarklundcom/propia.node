/**
 * CSV of /admin/calidad with the current agency / problem filter — the page's
 * own filter function over the page's own rows, super-admin only like the page.
 */
import type { NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { csvFilename, csvResponse } from "@/lib/csv";
import { filterQualityRows, qualityCsv } from "@/lib/admin-listing-export";
import { listingCanonicalOrigin } from "@/lib/origin";
import { listQualityRows } from "@/lib/quality-queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  await requireSuperAdmin();
  const sp = req.nextUrl.searchParams;
  const [all, origin] = await Promise.all([listQualityRows(), listingCanonicalOrigin()]);
  const { filtered } = filterQualityRows(all, {
    agencia: sp.get("agencia") ?? undefined,
    problema: sp.get("problema") ?? undefined,
  });
  return csvResponse(qualityCsv(filtered, origin), csvFilename("calidad"));
}
