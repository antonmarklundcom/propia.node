import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/sitemap";
import { siteOrigin } from "@/lib/origin";

// Depends on live DB — render at request time, not at build (Hostinger builds
// before the app connects). Crawlers fetch this rarely; cost is a non-issue.
export const dynamic = "force-dynamic";

// Entries are host-relative and the origin comes from the request, so each
// domain's sitemap lists its own URLs. (A feeder domain will also need its
// entry set narrowed to the pages it owns — that lands with the feeder.)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  const entries = await buildSitemapEntries();
  return entries.map((e) => ({
    url: `${origin}${e.path}`,
    lastModified: e.lastmod,
  }));
}
