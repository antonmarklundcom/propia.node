/**
 * GET /api/og/listing/{publicId} — the link-preview image of one listing.
 *
 * 1200×630 JPEG: cover photo, title in the door's language, price in the
 * request's number locale, barrio/city and the brand of the domain that was
 * asked. Published listings only; anything else is a 404 (no draft's title or
 * price ever renders here). `?v=` is a cache-buster the page adds and this
 * handler ignores. How it stays cheap on shared hosting: `src/lib/og-image.tsx`.
 */
import { getListingPreview } from "@/lib/queries";
import { currentVertical } from "@/lib/vertical-context";
import { siteOrigin } from "@/lib/origin";
import { currentLocale, dict } from "@/i18n/server";
import { formatPrice } from "@/lib/format";
import {
  admitOgRequest,
  clip,
  listingOgElement,
  loadCoverPhoto,
  ogNotFound,
  ogText,
  paletteFor,
  renderOgImage,
} from "@/lib/og-image";

export const dynamic = "force-dynamic";

const PUBLIC_ID = /^[a-z0-9]{10}$/;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const admitted = admitOgRequest(req.headers);
  if ("refused" in admitted) return admitted.refused;
  try {
    const { publicId } = await params;
    if (!PUBLIC_ID.test(publicId)) return ogNotFound();

    const listing = await getListingPreview(publicId);
    if (!listing) return ogNotFound();

    const [vertical, origin, locale, d] = await Promise.all([
      currentVertical(),
      siteOrigin(),
      currentLocale(),
      dict(),
    ]);
    const numberLocale = locale === "en" ? "en-US" : "es-PY";
    // English doors fall back to the Spanish title until cron:translate has
    // reached this listing — same rule as the page and the card.
    const title =
      locale === "en" ? (listing.titleEn ?? listing.title) : listing.title;
    const price =
      formatPrice(listing, numberLocale) +
      (listing.operation !== "venta" ? d.publicUi.perMonth : "");
    const city = listing.chain.find((c) => c.level === "ciudad");
    const barrio = listing.chain.find((c) => c.level === "barrio");
    const place = [barrio?.name, city?.name].filter(Boolean).join(", ");
    const area = listing.areaM2 ?? listing.landM2;
    const facts = [
      listing.bedrooms != null ? d.card.bedroomsShort(listing.bedrooms) : null,
      listing.bathrooms != null ? d.card.bathrooms(listing.bathrooms) : null,
      area ? d.card.area(Math.round(Number(area))) : null,
    ]
      .filter((s): s is string => s !== null)
      .join("  ·  ");

    // I/O before the serial section: a slow photo host must not hold up
    // another door's render. Sharp and the render happen inside it.
    const photo = await loadCoverPhoto(listing.coverKey);

    const props = {
      brand: ogText(vertical.brand),
      domain: ogText(origin.replace(/^https?:\/\//, "")),
      // A title in a script the font cannot draw filters to nothing; the
      // brand is a better headline than a gap.
      title: clip(ogText(title), 110) || ogText(vertical.brand),
      price: ogText(price),
      place: clip(ogText(place), 60),
      facts: ogText(facts),
      badge: ogText(d.card.operationBadge[listing.operation] ?? ""),
      palette: paletteFor(vertical.key),
    };
    return await renderOgImage((hasPhoto) => listingOgElement(props, hasPhoto), photo);
  } finally {
    admitted.release();
  }
}
