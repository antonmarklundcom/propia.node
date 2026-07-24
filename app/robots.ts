import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/origin";

// Reads the Host header, so it must be rendered per request rather than
// baked once — otherwise every domain advertises the first one's sitemap.
export const dynamic = "force-dynamic";

/**
 * Per-page noindex is handled in each template's metadata (the thin-page
 * rule); robots.txt only points crawlers at the sitemap and keeps the
 * lead/OTP API surface out of the index.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${await siteOrigin()}/sitemap.xml`,
  };
}
