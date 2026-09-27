/**
 * Where the link-preview images live, as metadata sees them.
 *
 * Pure (no `next/*`, no database) so any `generateMetadata` can import it.
 * The images themselves are rendered by the two route handlers under
 * `app/api/og/` (see `src/lib/og-image.tsx` for why they are route handlers
 * and not `opengraph-image.tsx` files).
 *
 * The door image's path is relative on purpose: the root layout's
 * `metadataBase` is `siteOrigin()`, so Next resolves it against the door the
 * visitor — or WhatsApp's fetcher — actually used, and never against another
 * domain or the raw `*.hostingersite.com` name.
 */

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * Part of every preview URL. Crawlers and CDNs cache an og:image by its URL
 * for days, so a redesign of the images bumps this, or nobody sees it.
 */
export const OG_IMAGE_VERSION = "1";

export const DOOR_OG_PATH = "/api/og/door";

/**
 * The per-door default preview (brand, tagline, the door's colours) as an
 * `openGraph.images` value. A page that sets its own `openGraph` replaces the
 * layout's wholesale — Next does not merge the two — so every such page passes
 * this in explicitly or it shares as a bare link.
 */
export function doorOgImages(alt: string) {
  return [
    {
      url: `${DOOR_OG_PATH}?v=${OG_IMAGE_VERSION}`,
      ...OG_IMAGE_SIZE,
      type: "image/jpeg",
      alt,
    },
  ];
}

/**
 * The per-listing preview, absolute on `origin` (pass `siteOrigin()`). The
 * listing's `updatedAt` is in the URL so a price change is a new image rather
 * than a week-old cached one; the route ignores the parameter.
 */
export function listingOgImageUrl(
  origin: string,
  publicId: string,
  updatedAt: Date | string | null | undefined,
): string {
  const stamp = updatedAt ? new Date(updatedAt).getTime() : NaN;
  const v = Number.isFinite(stamp)
    ? `${OG_IMAGE_VERSION}.${Math.floor(stamp / 1000).toString(36)}`
    : OG_IMAGE_VERSION;
  return `${origin}/api/og/listing/${publicId}?v=${v}`;
}
