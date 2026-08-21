import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import { buildSitemapEntries } from "@/lib/sitemap";
import { siteOrigin, hostOwnsListingDetail } from "@/lib/origin";
import { currentVertical } from "@/lib/vertical-context";
import { VERTICALS, type VerticalKey } from "@/config/verticals";

/**
 * The entry list loads every published row, so concurrent Googlebot fetches
 * used to each pay the full scan (audit F43). One cache entry per
 * owns-listing-detail variant; the origin prefix stays per-request. lastmod
 * survives the JSON round-trip as an ISO string, which the XML wants anyway.
 * Chunked sitemaps (generateSitemaps) become necessary near the 50k-URL XML
 * limit — at that point split before extending this cache.
 */
const cachedEntries = unstable_cache(
  async (includeListingDetail: boolean, verticalKey: VerticalKey) =>
    buildSitemapEntries({
      includeListingDetail,
      vertical: Object.values(VERTICALS).find((v) => v.key === verticalKey),
    }),
  ["sitemap-entries"],
  { revalidate: 3600, tags: [CACHE_TAGS.listings] },
);

// Depends on live DB — render at request time, not at build (Hostinger builds
// before the app connects). Crawlers fetch this rarely; cost is a non-issue.
export const dynamic = "force-dynamic";

// Entries are host-relative and the origin comes from the request, so each
// domain's sitemap lists its own URLs — and only the URLs it owns. A host with
// `ownsListingDetail: false` (a feeder; today inmobiliaria.com.py, see PLAN.md
// D6) canonicalises its /propiedad pages back to the primary, so listing them
// here would submit URLs Google is told not to index. Everything else on such
// a host — home, search, categories, guías — is its own content and stays.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [origin, ownsListingDetail, vertical] = await Promise.all([
    siteOrigin(),
    hostOwnsListingDetail(),
    currentVertical(),
  ]);
  const entries = await cachedEntries(ownsListingDetail, vertical.key);
  return entries.map((e) => ({
    url: `${origin}${e.path}`,
    lastModified: e.lastmod,
  }));
}
