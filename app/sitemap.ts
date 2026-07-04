import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/sitemap";

const ORIGIN = () =>
  `https://${process.env.NEXT_PUBLIC_CANONICAL_HOST ?? "propia.com.py"}`;

// Depends on live DB — render at request time, not at build (Hostinger builds
// before the app connects). Crawlers fetch this rarely; cost is a non-issue.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = ORIGIN();
  const entries = await buildSitemapEntries();
  return entries.map((e) => ({
    url: `${origin}${e.path}`,
    lastModified: e.lastmod,
  }));
}
