/**
 * CSV of /admin/propiedades with the current filter: the page's own parser and
 * its own reader, behind the page's own guard.
 */
import type { NextRequest } from "next/server";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { csvFilename, csvResponse } from "@/lib/csv";
import { LISTING_EXPORT_LIMIT, listingsCsv, parseListingFilter } from "@/lib/admin-listing-export";
import { listAllListings } from "@/lib/listing-edit";
import { listingCanonicalOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  await requireStaffOrAbove();
  const sp = req.nextUrl.searchParams;
  const f = parseListingFilter({
    status: sp.get("status") ?? undefined,
    q: sp.get("q") ?? undefined,
    quien: sp.get("quien") ?? undefined,
  });
  const [rows, origin] = await Promise.all([
    listAllListings({ status: f.status, q: f.q, publisher: f.publisher, limit: LISTING_EXPORT_LIMIT }),
    listingCanonicalOrigin(),
  ]);
  return csvResponse(listingsCsv(rows, origin), csvFilename("propiedades"));
}
