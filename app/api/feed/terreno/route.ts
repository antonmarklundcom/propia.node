import { NextRequest, NextResponse } from "next/server";
import { buildTerrenoFeed } from "@/lib/feed-terreno";

/**
 * GET /api/feed/terreno — token-gated export of propia's own land listings
 * for terreno.com.py's importer (docs handshake: terreno's
 * docs/PROPIA-MIGRATION.md §1). Full snapshot, not paginated — land volume
 * is small (ARCHITECTURE.md's own cross-posting note). Never cached: this is
 * a machine-to-machine sync endpoint, not a page.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.FEED_SHARED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "feed_not_configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const listings = await buildTerrenoFeed();
  return NextResponse.json({
    version: 1,
    site: "propia",
    generated_at: new Date().toISOString(),
    listings,
  });
}
