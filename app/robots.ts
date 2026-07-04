import type { MetadataRoute } from "next";

const ORIGIN = () =>
  `https://${process.env.NEXT_PUBLIC_CANONICAL_HOST ?? "propia.com.py"}`;

/**
 * Per-page noindex is handled in each template's metadata (the thin-page
 * rule); robots.txt only points crawlers at the sitemap and keeps the
 * lead/OTP API surface out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${ORIGIN()}/sitemap.xml`,
  };
}
