/**
 * GET /api/og/door — the default link-preview image of the door that was
 * asked: its brand, its tagline and its own colours, in its own language.
 *
 * The layout and every page without an image of its own point here
 * (`doorOgImages()` in `src/lib/og-urls.ts`). It takes no parameters — the
 * Host header is the whole input, so there is no text a caller can put on
 * one of our domains' preview cards. `?v=` is a cache-buster it ignores.
 */
import { currentVertical } from "@/lib/vertical-context";
import { siteOrigin } from "@/lib/origin";
import { dict } from "@/i18n/server";
import {
  admitOgRequest,
  doorOgElement,
  ogText,
  paletteFor,
  renderOgImage,
} from "@/lib/og-image";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admitted = admitOgRequest(req.headers);
  if ("refused" in admitted) return admitted.refused;
  try {
    const [vertical, origin, d] = await Promise.all([
      currentVertical(),
      siteOrigin(),
      dict(),
    ]);
    // The same per-family line the home page's own <title> uses (app/page.tsx):
    // the rental and directory doors do not sell a listing search.
    const tagline =
      vertical.family === "directory"
        ? d.directory.metaTitle
        : vertical.family === "rental"
          ? d.rental.metaTagline
          : d.publicUi.tagline;
    return await renderOgImage(() =>
      doorOgElement({
        brand: ogText(vertical.brand),
        domain: ogText(origin.replace(/^https?:\/\//, "")),
        tagline: ogText(tagline),
        palette: paletteFor(vertical.key),
      }),
    );
  } finally {
    admitted.release();
  }
}
