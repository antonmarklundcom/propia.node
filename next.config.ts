import type { NextConfig } from "next";
// Relative, not "@/…": Next's config loader compiles this file outside the
// app's module graph, so the tsconfig path alias does not resolve — here or in
// anything this reaches. `rental-services.ts` is deliberately import-free for
// exactly that reason (the app reaches the same helper through
// `@/design/sections`), which is what lets the redirects below be generated
// from the URL table rather than be a second copy of it.
import { RENTAL_SERVICES, rentalPath } from "./src/config/rental-services";
import { execSync } from "node:child_process";

/**
 * Which build is running, for the health section on `/admin`.
 *
 * There is no deploy log an operator can see: Hostinger builds on a webhook and
 * the only evidence a deploy happened is the site changing. So the build stamps
 * itself, and `/admin` can answer "is the code I merged actually live?".
 *
 * Best-effort by design. Hostinger may or may not expose a commit env var, and a
 * build from an exported tarball has no `.git` at all — in both cases this
 * returns null and the panel says "desconocido" rather than inventing a value.
 * It must never fail the build: a health nicety is not worth a deploy.
 */
function buildCommit(): string | null {
  const fromEnv =
    process.env.HOSTINGER_GIT_COMMIT ??
    process.env.GIT_COMMIT ??
    process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromEnv) return fromEnv.slice(0, 12);
  try {
    return execSync("git rev-parse --short=12 HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim() || null;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  /**
   * Inlined at build time and read by `src/lib/health.ts`. Values, not secrets:
   * a commit hash and a timestamp.
   */
  env: {
    BUILD_COMMIT: buildCommit() ?? "",
    BUILD_TIME: new Date().toISOString(),
  },
  // Listing photos live on Cloudflare R2 behind the CDN — never on hosting disk.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  // Shared-hosting friendly: standalone output keeps the deployed footprint small.
  output: "standalone",
  experimental: {
    /**
     * The import upload posts the spreadsheet itself to a server action, twice
     * — once to preview, once to commit — so the bytes the operator approved
     * are the bytes that get written. The 1 MB default cuts that off at a few
     * hundred rows. `MAX_UPLOAD_BYTES` in lib/import/intake.ts is the real
     * limit and is set below this on purpose, so an oversized file gets a
     * Spanish error instead of a framework stack trace.
     */
    serverActions: { bodySizeLimit: "8mb" },
  },
  /**
   * Security headers (audit F20). Everything here is static and host-agnostic,
   * so it belongs in the config rather than the middleware — which matters
   * because the middleware matcher deliberately skips static assets, and those
   * responses should still carry `nosniff` and HSTS.
   *
   * The Content-Security-Policy is NOT here: it carries a per-response nonce
   * and is set in middleware.ts (see src/lib/csp.ts). Two CSP headers would be
   * intersected by the browser, so there must only ever be one source.
   */
  /**
   * Host-scoped permanent redirects for the rental family's two doors.
   *
   * Two maps, both host-scoped so the same paths on any other door (which
   * never published them) 404 or render their own page as they should:
   *
   * 1. **The old WordPress URLs** (plan Appendix A,
   *    fable/plan-rentparaguay.md §6.1) on `rentparaguay.com`. `/` is
   *    unchanged; `/wp-sitemap*.xml` and `/wp-content/*` are deliberately not
   *    mapped. **Retargeted in R2 to the English slugs** — the old site was
   *    English, `/services/airbnb-management` is where that page now lives,
   *    and pointing these at the Spanish paths would land every inbound link
   *    on a second 301. Two of the old entries (`/services`, `/contact`) are
   *    gone from the map because they are now real pages on this door;
   *    redirecting them would be a loop.
   * 2. **The cross-language pair** (R2): each rental door 301s the *other*
   *    language's version of its own pages. One page, one URL per door — the
   *    canonical tag, the hreflang map and the sitemap all say so, and this is
   *    what makes that true for a visitor who followed an old link or typed
   *    the wrong one. `/propiedad/*` is not in here and never will be: that is
   *    the marketplace's page type, Spanish-slugged on every door.
   *
   * Both maps are generated from `RENTAL_SERVICES` and `rentalPath()`, the
   * same source the links and the sitemap read, so a service cannot be added
   * with a redirect missing. `permanent: true` is Next's 308 — the permanent
   * signal Google treats as a 301, and what S1's map already emitted.
   */
  async redirects() {
    const wordpressMap: Array<[string, string]> = [
      ...RENTAL_SERVICES.map(
        (s): [string, string] => [
          // `oldPath` carries the old site's trailing slash (and, for the
          // virtual address, its misspelling); the loop below adds the
          // slashless form.
          s.oldPath.replace(/\/$/, ""),
          rentalPath("en", "services", s),
        ],
      ),
      ["/asuncion", "/alquiler"],
      ["/about-us", rentalPath("en", "about")],
      ["/blog", "/"],
    ];

    /** The other language's URLs for this door's own pages. */
    const localeMap = (locale: "es" | "en"): Array<[string, string]> => {
      const other = locale === "en" ? "es" : "en";
      return [
        [rentalPath(other, "services"), rentalPath(locale, "services")],
        ...RENTAL_SERVICES.map(
          (s): [string, string] => [
            rentalPath(other, "services", s),
            rentalPath(locale, "services", s),
          ],
        ),
        [rentalPath(other, "about"), rentalPath(locale, "about")],
        [rentalPath(other, "contact"), rentalPath(locale, "contact")],
      ];
    };

    const byHost: Array<[string[], Array<[string, string]>]> = [
      [
        ["rentparaguay.com", "www.rentparaguay.com"],
        [...wordpressMap, ...localeMap("en")],
      ],
      [["alquiler.com.py", "www.alquiler.com.py"], localeMap("es")],
    ];

    return byHost.flatMap(([hosts, map]) =>
      hosts.flatMap((host) =>
        map.flatMap(([oldPath, destination]) =>
          // Trailing-slash and bare forms both match.
          [oldPath, `${oldPath}/`].map((source) => ({
            source,
            has: [{ type: "host" as const, value: host }],
            destination,
            permanent: true,
          })),
        ),
      ),
    );
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            // Two years, subdomains included. Deliberately no `preload`: that
            // is a one-way submission to the browser vendors' list and a
            // founder decision, not a code one.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Belt and braces with the CSP's frame-ancestors, for the browsers
          // and middleboxes that only understand the older header.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // Nothing on this site asks for any of these; the map uses tiles,
            // never the visitor's position.
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
