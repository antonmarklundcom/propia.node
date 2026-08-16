import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/sitemap";
import { siteOrigin, hostOwnsListingDetail } from "@/lib/origin";

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
  const [origin, ownsListingDetail] = await Promise.all([
    siteOrigin(),
    hostOwnsListingDetail(),
  ]);
  const entries = await buildSitemapEntries({
    includeListingDetail: ownsListingDetail,
  });
  return entries.map((e) => ({
    url: `${origin}${e.path}`,
    lastModified: e.lastmod,
  }));
}
