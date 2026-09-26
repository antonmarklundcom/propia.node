import type { MetadataRoute } from "next";
import { brandName } from "@/lib/brand-server";
import { currentLocale, dict } from "@/i18n/server";

// Reads the Host header (brand and language are per door), so it is rendered
// per request — baked once, every door would install as the first one's app.
export const dynamic = "force-dynamic";

/**
 * The web app manifest (plan-build A4, Realtor 10): makes the agency panel
 * installable on a phone's home screen, named after the door it was installed
 * from.
 *
 * **Install only — there is no service worker, on purpose.** Every route is
 * dynamic (CLAUDE.md, "Caching"), so a worker caching pages would serve one
 * login's panel, or yesterday's leads, from a cache nobody can see. Browsers
 * no longer require a worker to offer installation; offline support is not a
 * goal for a panel whose whole job is live data.
 *
 * Icons are the same house mark as `app/apple-icon.png`, rendered at the two
 * sizes Android asks for (`public/img/pwa/`, outside the middleware matcher).
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [brand, locale, t] = await Promise.all([
    brandName(),
    currentLocale(),
    dict(),
  ]);
  return {
    name: t.a4.manifest.name(brand),
    short_name: t.a4.manifest.shortName,
    description: t.a4.manifest.description,
    lang: locale,
    start_url: "/agencia",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#123a2b",
    icons: [
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/img/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/img/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/img/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
