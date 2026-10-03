import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/origin";
import { robotsDisallow } from "@/lib/robots-rules";

// Reads the Host header, so it must be rendered per request rather than
// baked once — otherwise every domain advertises the first one's sitemap.
export const dynamic = "force-dynamic";

/**
 * Per-page noindex is handled in each template's metadata (the thin-page
 * rule); robots.txt points crawlers at the sitemap and keeps the API surface,
 * the account/panel pages and every facet/map query variant out of the crawl.
 * The rules live in `src/lib/robots-rules.ts`, where `verify:seo` checks them.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: robotsDisallow(),
    },
    sitemap: `${await siteOrigin()}/sitemap.xml`,
  };
}
