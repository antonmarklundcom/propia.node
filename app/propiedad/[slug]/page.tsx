import { cache } from "react";
import { after } from "next/server";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getListingByPublicId,
  getSimilarListings,
  getAgencyListings,
  getBestFinancingProgram,
  citySubtreeIds,
} from "@/lib/queries";
import {
  parseListingPublicId,
  listingUrl,
  listingRef,
  categoryUrl,
  agencyUrl,
} from "@/lib/urls";
import { getPublicListingFinancing } from "@/lib/listing-financing";
import { displayPrice, formatCuota, formatUsd, formatSqft, imageUrl, imageThumbUrl } from "@/lib/format";
import { isPlaceholderPhoto, isSamplePhoto } from "@/lib/photos";
import { brandName } from "@/lib/brand-server";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import {
  listingJsonLd,
  breadcrumbJsonLd,
} from "@/lib/jsonld";
import { currentLocale, dict } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import {
  hostOwnsListingDetail,
  listingCanonicalOrigin,
  siteOrigin,
} from "@/lib/origin";
import { pageLanguageAlternates } from "@/lib/alternates-server";
import { listingOgImageUrl, OG_IMAGE_SIZE } from "@/lib/og-urls";
import { verticalAdmits } from "@/lib/facet-sql";
import { VERTICALS } from "@/config/verticals";
import { getCityPrices, medianFor } from "@/lib/precios-queries";
import { recordListingView } from "@/lib/stats-queries";
import { currentVertical } from "@/lib/vertical-context";
import {
  contactPrimaryFirst,
  showCuota,
  stickyMobileContactBar,
  secondaryAreaUnit,
  foreignerBox,
  foreignBuyerEnquiry,
  usdFirstPrice,
} from "@/design/sections";
import { isBotUserAgent } from "@/lib/view-tracking";
import { waLink, waPhone } from "@/lib/wa";
import { JsonLd } from "@/components/JsonLd";
import { Glyph, type GlyphName } from "@/components/Glyph";
import { ListingGallery } from "@/components/ListingGallery";
import { ContactForm } from "@/components/ContactForm";
import { FxSwap } from "@/components/FxSwap";
import { usdEurRate } from "@/lib/eur-rate";
import { ListingCard } from "@/components/ListingCard";
import { ListingMapLazy } from "@/components/ListingMapLazy";
import { PriceAlert } from "@/components/PriceAlert";
import { RecentlyViewedRecorder } from "@/components/RecentlyViewed";
import { FavoriteButton, CompareButton } from "@/components/SavedListings";
import { ReportListing } from "@/components/ReportListing";
import { safeImageUrl } from "@/lib/external-image";
import { isAgencyMode } from "@/lib/site-settings";
import { CONTACT_WHATSAPP } from "@/config/contact";

// Canonical URLs are derived from the Host header (one deployment, several
// domains — src/lib/origin.ts), which is a dynamic API, so this route can no
// longer be cached across requests: an ISR entry is not keyed by host and
// would serve one domain's canonical to another. The cache() below plus the
// parallelised loader in queries.ts pay for the lost ISR.

type Params = { params: Promise<{ slug: string }> };

// generateMetadata and the page body both need the listing; cache() collapses
// them into one set of queries per request.
const load = cache(async (slugParam: string) => {
  const publicId = parseListingPublicId(slugParam);
  if (!publicId) return null;
  return getListingByPublicId(publicId);
});

const subtreeIds = cache(citySubtreeIds);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) return { title: (await dict()).listing.metaNotFound };
  const { listing } = detail;
  const [brand, d, locale, vertical] = await Promise.all([
    brandName(),
    dict(),
    currentLocale(),
    currentVertical(),
  ]);
  const t = d.listing;
  // English requests fall back to the Spanish text when cron:translate
  // hasn't produced titleEn/descriptionEn yet — never render blank or "es"
  // copy dressed up as an English meta tag by accident.
  const title =
    locale === "en" ? (listing.titleEn ?? listing.title) : listing.title;
  const description =
    locale === "en"
      ? (listing.descriptionEn ?? listing.descriptionEs)
      : listing.descriptionEs;
  const canonical = `${await listingCanonicalOrigin()}${listingUrl(listing)}`;
  // Only a host that OWNS its detail pages is a language version of anything;
  // a feeder canonicalises this page away, and hreflang on a non-canonical URL
  // is a contradiction. Same predicate the sitemap gates on (origin.ts).
  //
  // A door's filters narrow its listing set (foreign_exposure on the English
  // door, a type on a feeder), but this page loads by id, so an excluded
  // listing still renders here. It is not this door's page: noindex (on a door
  // that owns detail), and no hreflang. Nor is a set emitted that names a door which excludes it — that
  // alternate would be a page its own door does not list.
  const admitted = verticalAdmits(vertical, listing);
  const ownsDetail = await hostOwnsListingDetail();
  const allLanguages = admitted && ownsDetail
    ? await pageLanguageAlternates({
        path: listingUrl(listing),
        scope: "listing",
        family: vertical.family,
      })
    : undefined;
  const languages =
    allLanguages &&
    Object.values(allLanguages).every((url) => {
      const door = VERTICALS[new URL(url).host];
      return !door || verticalAdmits(door, listing);
    })
      ? allLanguages
      : undefined;
  // The branded preview card (photo, price, place, this door's brand), on the
  // origin that served this request — a feeder's og:url canonicalises away,
  // but the card it shows carries the feeder's own brand, like the page does.
  const ogImage = listingOgImageUrl(
    await siteOrigin(),
    listing.publicId,
    listing.updatedAt,
  );
  return {
    title: t.metaTitle(
      title,
      displayPrice(listing, {
        usdFirst: usdFirstPrice(vertical.key),
        numberLocale: locale === "en" ? "en-US" : "es-PY",
        approx: d.publicUi.approxPrice,
      }).main,
    ),
    description: description?.slice(0, 160) ?? title,
    alternates: { canonical, languages },
    openGraph: {
      // og:title doesn't inherit title.template — brand goes in by hand (F47).
      title: t.ogTitle(title, brand),
      url: canonical,
      images: [{ url: ogImage, ...OG_IMAGE_SIZE, type: "image/jpeg", alt: title }],
      type: "website",
    },
    twitter: { card: "summary_large_image" },
    // noindex only where this page is self-canonical: a feeder already
    // canonicalises away, and noindex beside a cross-domain canonical is two
    // contradicting signals.
    robots: { index: admitted || !ownsDetail, follow: true },
  };
}

/**
 * amenities is display-only JSON with no enforced shape (schema §2.1): accept
 * an array of strings, or an object whose truthy keys are the amenities.
 */
function normalizeAmenities(raw: unknown): string[] {
  const pretty = (s: string) => {
    const t = s.replace(/[_-]+/g, " ").trim();
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string").map(pretty);
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => pretty(k));
  }
  return [];
}

export default async function ListingPage({ params }: Params) {
  const brand = await brandName();
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) notFound();

  const { listing, images, chain } = detail;
  /**
   * Agency mode (docs/plan-agency-2026-09-26.md batch 3): the listing is
   * presented as the operator's — no lister name, logo or number — and every
   * contact reaches the operator, who shares the lead with a partner. With
   * the lister cleared here, the seller card, the form's recipient line and
   * the verified tick below all fall through to the door's brand.
   */
  const agencyMode = await isAgencyMode();
  const agency = agencyMode ? null : detail.agency;
  const agent = agencyMode ? null : detail.agent;
  const ownerUser = agencyMode ? null : detail.ownerUser;
  const [d, locale] = await Promise.all([dict(), currentLocale()]);
  const t: Dictionary["listing"] = d.listing;
  const numberLocale = locale === "en" ? "en-US" : "es-PY";
  // Same fallback as generateMetadata: an English visitor sees Spanish text
  // rather than nothing when cron:translate hasn't caught up to this listing.
  const title =
    locale === "en" ? (listing.titleEn ?? listing.title) : listing.title;
  const description =
    locale === "en"
      ? (listing.descriptionEn ?? listing.descriptionEs)
      : listing.descriptionEs;

  /**
   * Count the view after the response is sent: the owner's stats must never
   * cost the visitor latency, and a failed counter must never break a page
   * that rendered fine. Crawlers are excluded so the number means people
   * (see view-tracking.ts).
   */
  const userAgent = (await headers()).get("user-agent");
  if (!isBotUserAgent(userAgent)) {
    after(async () => {
      try {
        await recordListingView(listing.id);
      } catch {
        /* a dropped view is not worth an error page */
      }
    });
  }
  const vertical = await currentVertical();
  // The publisher's own financing terms (plan-admin-next O8) replace the
  // site-wide estimate on this listing; a purchase only.
  const sellerFinancing =
    listing.operation === "venta" ? await getPublicListingFinancing(listing.id) : null;
  const cuota =
    showCuota(vertical.key) && !sellerFinancing ? formatCuota(listing.cuotaGs) : null;
  // US$ first on the English marketplace doors (a Guaraní price becomes "≈
  // US$ …" with the listed Guaraní price beside it), with an approximate EUR
  // alternative when USD_EUR_RATE is set; unchanged elsewhere.
  const usdFirst = usdFirstPrice(vertical.key);
  const price = displayPrice(listing, {
    usdFirst,
    numberLocale,
    approx: d.publicUi.approxPrice,
    eurRate: usdFirst ? usdEurRate() : null,
  });
  const pricePeriod = listing.operation !== "venta" ? t.priceRentPeriod : "";
  const listedPriceLine = price.listed ? d.publicUi.listedPrice(price.listed) + pricePeriod : null;
  const eurListedLine = price.eur ? d.publicUi.listedPrice(price.eur.listed) + pricePeriod : null;
  /**
   * Contact chain, most specific first. `ownerUser` is the FSBO tail: a
   * listing published through /publicar belongs to a person, not an agency,
   * and without this link the card, the panel form and the mobile CTA bar all
   * rendered with no way to reach the seller (audit F4).
   */
  const contactWhatsapp = agencyMode
    ? CONTACT_WHATSAPP
    : (agent?.whatsapp ?? agency?.whatsapp ?? ownerUser?.whatsapp ?? null);
  const leadType = listing.operation === "venta" ? "buyer" : "renter";
  const area = listing.areaM2 ?? listing.landM2;
  // English door only (guide §3/§6): "sq ft" next to every m² figure, and a
  // US$/m² line next to the native price — secondaryAreaUnit() gates both,
  // never a vertical-key check inline. No US$/m² for a Guaraní listing: its
  // US$ figure is a conversion, shown only as the "≈" headline beside the
  // listed Guaraní price (displayPrice() in src/lib/format.ts), never derived
  // further.
  const showSqft = secondaryAreaUnit(vertical.key) === "sqft";
  const areaSqft = showSqft && area != null ? formatSqft(Number(area)) : null;
  const pricePerM2 =
    showSqft && area != null && Number(area) > 0 && listing.operation === "venta" &&
    listing.priceCurrency === "USD"
      ? formatUsd(Number(listing.priceUsd) / Number(area), "en-US")
      : null;
  const showForeignerBox = foreignerBox(vertical.key);
  // Closing costs are named but never estimated (plan 2026-09-22 A6): the
  // 3–5% band had no source. The buyer is told to get the figure in writing.
  const showClosingCosts = showForeignerBox && listing.operation === "venta";
  const origin = await listingCanonicalOrigin();
  const servingOrigin = await siteOrigin();
  const canonical = `${origin}${listingUrl(listing)}`;
  const waMessage = d.inquiryPrefillFor(
    brand,
    locale === "en" ? title : listing.title,
    canonical,
    listingRef(listing.publicId),
  );
  const waHref = waLink(contactWhatsapp, waMessage);

  const city = chain.find((c) => c.level === "ciudad");
  const barrio = chain.find((c) => c.level === "barrio");
  // Plural for the breadcrumb (it names the category page), singular for the
  // facts strip and the details row; both in the request's language.
  const typeLabel = d.category.typeLabel[listing.propertyType] ?? PROPERTY_TYPE_LABELS[listing.propertyType];
  const typeSingular = t.typeSingular[listing.propertyType] ?? typeLabel;
  const typeUrl = city
    ? categoryUrl({ operation: listing.operation, citySlug: city.slug, type: listing.propertyType })
    : undefined;

  // Only include nodes with a genuinely routable URL in both the visible
  // nav and the JSON-LD (a bare barrio page isn't a valid route).
  const crumbs: { name: string; url?: string }[] = [
    { name: t.breadcrumbHome, url: "/" },
  ];
  if (city) {
    crumbs.push({
      name: city.name,
      url: categoryUrl({ operation: listing.operation, citySlug: city.slug }),
    });
  }
  if (typeUrl) crumbs.push({ name: typeLabel, url: typeUrl });
  if (barrio) {
    crumbs.push({
      name: barrio.name,
      url: city
        ? categoryUrl({
            operation: listing.operation,
            citySlug: city.slug,
            barrioSlug: barrio.slug,
            type: listing.propertyType,
          })
        : undefined,
    });
  }
  crumbs.push({ name: title });

  // Ancestor crumbs are this host's own category pages; only the leaf lives
  // on the listing's canonical origin, so it goes in absolute (F32).
  const jsonLdCrumbs = crumbs
    .filter((c): c is { name: string; url: string } => Boolean(c.url))
    .concat([{ name: title, url: canonical }]);

  const realImages = images.filter((im) => !isPlaceholderPhoto(im.r2Key));
  const isSample = isSamplePhoto(images[0]?.r2Key);

  // Approximate location only — barrio centroid, else city centroid. Never
  // the listing's own lat/lng (schema.ts: precise coords are "never shown
  // publicly at full precision").
  const approxLocation =
    barrio?.lat && barrio?.lng
      ? { lat: Number(barrio.lat), lng: Number(barrio.lng), label: `${barrio.name}, ${city?.name ?? ""}` }
      : city?.lat && city?.lng
        ? { lat: Number(city.lat), lng: Number(city.lng), label: city.name }
        : null;

  // citySubtreeIds must be awaited BEFORE the Promise.all array is built —
  // inside it, the await ran to completion before the other two branches were
  // even started, so the "parallel" block was three serial round-trips.
  const similarLocationIds = city ? await subtreeIds(city.id) : null;

  const [similar, fromAgency, financingProgram, cityPrices] = await Promise.all([
    city && similarLocationIds
      ? getSimilarListings({
          excludeId: listing.id,
          operation: listing.operation,
          type: listing.propertyType,
          locationIds: similarLocationIds,
          limit: 4,
          vertical,
        })
      : Promise.resolve([]),
    // Agency mode presents every listing as the operator's, so "more from
    // this agency" would only point at the partner behind it.
    listing.agencyId && !agencyMode
      ? getAgencyListings({ agencyId: listing.agencyId, excludeId: listing.id, limit: 4, vertical })
      : Promise.resolve([]),
    listing.operation === "venta" && cuota
      ? getBestFinancingProgram()
      : Promise.resolve(null),
    // Market context for the internal link module below — independent of the
    // three above, so it belongs inside this block, not before it.
    city ? getCityPrices(city.slug) : Promise.resolve(null),
  ]);

  const cityHasPrices = (cityPrices?.reliableSample ?? 0) > 0;

  /**
   * Market context for this exact listing (audit I8). The medians payload was
   * already fetched and reduced to a boolean; naming the number turns a link
   * into a reason to click it. Only a sample of MIN_RELIABLE_SAMPLE or more
   * qualifies — see medianFor().
   */
  const contextCell = medianFor(cityPrices, listing.operation, listing.propertyType);
  // This listing's own price per m², for the reader to compare against. Land
  // is priced on the lot, everything else on built area — the same rule
  // /tasacion uses for its area question.
  const listingArea = Number(
    listing.propertyType === "terreno"
      ? (listing.landM2 ?? listing.areaM2)
      : (listing.areaM2 ?? listing.landM2),
  );
  // The city medians are USD market figures; this listing's own per-m² joins
  // them only when it is priced in USD (format.ts: no USD for a Gs listing).
  const listingPerM2 =
    contextCell && listing.priceCurrency === "USD" &&
    Number.isFinite(listingArea) && listingArea > 0
      ? Number(listing.priceUsd) / listingArea
      : null;

  const amenities = normalizeAmenities(listing.amenities);
  const publishedAgo = listing.publishedAt
    ? formatPublishedAgo(listing.publishedAt, t)
    : null;

  // "Detalles de la propiedad" rows — only what we actually know.
  const propertyGlyph: GlyphName =
    listing.propertyType === "terreno" || listing.propertyType === "quinta"
      ? "land"
      : listing.propertyType === "casa" || listing.propertyType === "duplex"
        ? "home"
        : "building";
  const details: { icon: GlyphName; label: string; value: string }[] = [];
  if (barrio) details.push({ icon: "pin", label: t.detailBarrio, value: barrio.name });
  if (city) details.push({ icon: "building", label: t.detailCity, value: city.name });
  details.push({ icon: propertyGlyph, label: t.detailType, value: typeSingular });
  if (listing.propertyState)
    details.push({
      icon: "key",
      label: t.detailState,
      value: t.stateLabel[listing.propertyState] ?? listing.propertyState,
    });
  if (listing.areaM2)
    details.push({ icon: "area", label: t.detailArea, value: t.factArea(Math.round(Number(listing.areaM2))) });
  if (listing.landM2)
    details.push({ icon: "land", label: t.detailLand, value: t.factArea(Math.round(Number(listing.landM2))) });
  if (listing.parking != null)
    details.push({ icon: "car", label: t.detailParking, value: String(listing.parking) });

  const sellerName =
    agency?.name ??
    agent?.name ??
    ownerUser?.name ??
    (ownerUser ? t.sellerKindOwner : t.sellerFallback(brand));
  const sellerInitials = (agency?.name ?? "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <main className="listing-main">
      <JsonLd
        data={[
          listingJsonLd(origin, detail, { name: title, description }),
          breadcrumbJsonLd(servingOrigin, jsonLdCrumbs),
        ]}
      />
      <RecentlyViewedRecorder
        entry={{
          href: listingUrl(listing),
          title,
          price: price.main,
          operation: listing.operation,
          // realImages already excludes placeholder keys, so a listing with no
          // real photo stores no img and the card renders the fallback.
          img: imageThumbUrl(realImages[0]?.r2Key ?? null),
          specs: [
            listing.bedrooms != null ? t.factBedrooms(listing.bedrooms) : null,
            listing.bathrooms != null ? t.factBathrooms(listing.bathrooms) : null,
            area ? t.factArea(Math.round(Number(area))) : null,
          ].filter((s): s is string => s !== null),
        }}
      />

      <nav className="breadcrumb-nav" aria-label={t.breadcrumbLabel}>
        {crumbs.map((c, i) => (
          <span key={`${c.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span aria-hidden>›</span>}
            {c.url && i < crumbs.length - 1 ? (
              <Link className="breadcrumb-nav__link" href={c.url}>
                {c.name}
              </Link>
            ) : (
              <span className="breadcrumb-nav__current" aria-current={i === crumbs.length - 1 ? "page" : undefined}>
                {c.name}
              </span>
            )}
          </span>
        ))}
      </nav>

      <header className="listing-header">
        <div>
          {isSample && <span className="listing-sample-chip">{t.sampleListing}</span>}
          <h1 className="listing-title">{title}</h1>
          {(barrio || city) && <p className="listing-header__location"><Glyph name="pin" /> {[barrio?.name, city?.name].filter(Boolean).join(", ")}</p>}
        </div>
        <div className="listing-price">
          <div className="listing-price__line">
            <span className="listing-price__amount">
              <FxSwap
                usd={
                  <span title={price.listed ? d.publicUi.approxPriceTitle : undefined}>
                    {price.main}
                  </span>
                }
                eur={price.eur && <span title={d.publicUi.currencyEurTitle}>{price.eur.main}</span>}
              />
            </span>
            <span className="listing-price__currency">
              <FxSwap usd={price.currency} eur={price.eur && d.publicUi.currencyEur} />
            </span>
            {listing.operation !== "venta" && <span className="listing-price__period">{t.priceRentPeriod}</span>}
          </div>
          {listedPriceLine && (
            <span className={`listing-price__secondary${price.eur ? " fx--usd" : ""}`}>{listedPriceLine}</span>
          )}
          {eurListedLine && <span className="listing-price__secondary fx--eur">{eurListedLine}</span>}
          {cuota && <span className="listing-price__secondary">{d.card.cuotaLine(cuota)}</span>}
          {pricePerM2 && <span className="listing-price__secondary">{d.card.cardPerM2(pricePerM2)}</span>}
          <PriceAlert locale={locale} listingPublicId={listing.publicId} listingTitle={title} leadType={leadType} />
          <div className="listing-save-actions">
            <FavoriteButton publicId={listing.publicId} locale={locale} />
            <CompareButton publicId={listing.publicId} locale={locale} />
          </div>
        </div>
      </header>
      <ListingGallery locale={locale} images={realImages.map((im, i) => ({
        url: imageUrl(im.r2Key) ?? "",
        alt: i === 0 ? title : t.galleryThumbAlt(title, i + 1),
      }))} />

      <div className="listing-detail__layout">
        <div>
          {/* Facts strip: type · beds · baths · area · freshness */}
          <ul className="listing-facts">
            <li className="listing-facts__item">
              <Glyph name={propertyGlyph} /> {typeSingular}
            </li>
            {listing.bedrooms != null && (
              <li className="listing-facts__item"><Glyph name="bed" /> {t.factBedrooms(listing.bedrooms)}</li>
            )}
            {listing.bathrooms != null && (
              <li className="listing-facts__item">
                <Glyph name="bath" /> {t.factBathrooms(listing.bathrooms)}
              </li>
            )}
            {listing.parking != null && (
              <li className="listing-facts__item"><Glyph name="car" /> {t.factParking(listing.parking)}</li>
            )}
            {area && (
              <li className="listing-facts__item">
                <Glyph name="area" /> {t.factArea(Math.round(Number(area)))}
                {areaSqft && <> ({areaSqft})</>}
              </li>
            )}
            {publishedAgo && (
              <li className="listing-facts__item listing-facts__item--muted">
                <Glyph name="clock" /> {publishedAgo}
              </li>
            )}
          </ul>

          {showForeignerBox && (
            <div className="foreigner-box">
              <div className="foreigner-box__title">{d.guideEn.foreignerBoxTitle}</div>
              <div className="foreigner-box__grid">
                <div>
                  <div className="foreigner-box__label">{d.guideEn.foreignerBoxOwnershipLabel}</div>
                  <div className="foreigner-box__value">{d.guideEn.foreignerBoxOwnershipValue}</div>
                </div>
                <div>
                  <div className="foreigner-box__label">{d.guideEn.foreignerBoxTitleStatusLabel}</div>
                  <div className="foreigner-box__value">{d.guideEn.foreignerBoxTitleStatusValue}</div>
                </div>
                {showClosingCosts && (
                  <div>
                    <div className="foreigner-box__label">{d.guideEn.foreignerBoxCostsLabel}</div>
                    <div className="foreigner-box__value">
                      {d.guideEn.foreignerBoxCostsValue}
                    </div>
                  </div>
                )}
                <div>
                  <div className="foreigner-box__label">{d.guideEn.foreignerBoxNextStepLabel}</div>
                  <div className="foreigner-box__value">{d.guideEn.foreignerBoxNextStepValue}</div>
                </div>
              </div>
            </div>
          )}

          {/* Financing module — the cuota differentiator (ARCHITECTURE.md §3) */}
          {cuota && financingProgram && (
            <div className="financing-box">
              <div className="financing-box__head">
                <Glyph name="money" /> {t.financingHead(financingProgram.name)}
                {financingProgram.code === "che_roga_pora" &&
                  t.financingStateProgram}
              </div>
              <div className="financing-box__grid">
                <div>
                  <div className="financing-box__label">{t.financingCuotaLabel}</div>
                  <div className="financing-box__value">{cuota}</div>
                </div>
                <div>
                  <div className="financing-box__label">{t.financingTermsLabel}</div>
                  <div className="financing-box__value financing-box__value--muted">
                    {t.financingTerms(
                      Number(financingProgram.annualRate).toLocaleString(numberLocale),
                      Math.round(financingProgram.maxTermMonths / 12),
                    )}
                  </div>
                </div>
              </div>
              <div className="financing-box__foot">{t.financingFoot}</div>
            </div>
          )}
          {cuota && !financingProgram && (
            <div className="cuota-chip"><Glyph name="money" /> {cuota}</div>
          )}
          {sellerFinancing && (
            <div className="financing-box" data-seller-financing>
              <div className="financing-box__head">
                <Glyph name="money" /> {t.sellerFinancingHead}
              </div>
              <dl className="financing-box__grid">
                {(
                  [
                    [t.sellerFinancingEntity, sellerFinancing.entity],
                    [t.sellerFinancingRate, sellerFinancing.rate],
                    [t.sellerFinancingTerm, sellerFinancing.term],
                    [t.sellerFinancingDownPayment, sellerFinancing.downPayment],
                  ] as const
                )
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="financing-box__label">{label}</dt>
                      <dd className="financing-box__value">{value}</dd>
                    </div>
                  ))}
              </dl>
              {sellerFinancing.notes ? (
                <p className="financing-box__notes">
                  <span className="financing-box__label">{t.sellerFinancingNotes}</span> {sellerFinancing.notes}
                </p>
              ) : null}
              <div className="financing-box__foot">
                {t.sellerFinancingSource(agency?.name ?? agent?.name ?? t.sellerFinancingWhoGeneric)}
              </div>
            </div>
          )}

          {details.length > 0 && (
            <section className="listing-section">
              <h2 className="listing-section__title"><Glyph name="list" /> {t.detailsTitle}</h2>
              <dl className="listing-details-grid">
                {details.map((d) => (
                  <div className="listing-details-grid__row" key={d.label}>
                    <dt className="listing-details-grid__label">
                      <Glyph name={d.icon} /> {d.label}
                    </dt>
                    <dd className="listing-details-grid__value">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {amenities.length > 0 && (
            <section className="listing-section">
              <h2 className="listing-section__title"><Glyph name="palette" /> {t.amenitiesTitle}</h2>
              <ul className="listing-amenities">
                {amenities.map((a) => (
                  <li className="listing-amenities__item" key={a}>
                    <Glyph name="check" className="listing-amenities__check" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {description && (
            <section className="listing-section">
              <h2 className="listing-section__title"><Glyph name="doc" /> {t.descriptionTitle}</h2>
              <p className="listing-description">{description}</p>
            </section>
          )}

          {approxLocation && (
            <section className="listing-section">
              <h2 className="listing-section__title"><Glyph name="pin" /> {t.locationTitle}</h2>
              <p className="listing-location__caption">{approxLocation.label}</p>
              <ListingMapLazy lat={approxLocation.lat} lng={approxLocation.lng} />
            </section>
          )}
        </div>

        {/* Sticky contact card */}
        <aside className="listing-detail__aside">
          <div className="seller-card__head">
            {safeImageUrl(agency?.logoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="seller-card__logo" src={safeImageUrl(agency?.logoUrl) ?? undefined} alt={sellerName} referrerPolicy="no-referrer" />
            ) : (
              <div className="seller-card__avatar" aria-hidden>
                {agency && sellerInitials ? sellerInitials : <Glyph name="home" size={24} />}
              </div>
            )}
            <div>
              <div className="seller-card__name">
                {agency ? (
                  <Link href={agencyUrl(agency.slug)}>{sellerName}</Link>
                ) : (
                  sellerName
                )}
                {(agency?.isVerified ||
                  agent?.isVerified ||
                  (ownerUser != null && listing.isVerified)) && (
                  <Link
                    className="seller-card__verified"
                    href="/como-funciona#verificado"
                    title={d.a3.verified.linkLabel}
                    aria-label={d.a3.verified.linkLabel}
                  >
                    <Glyph name="check" />
                  </Link>
                )}
              </div>
              <div className="seller-card__kind">
                {agency
                  ? t.sellerKindAgency
                  : agent
                    ? t.sellerKindAgent
                    : ownerUser
                      ? t.sellerKindOwner
                      : brand}
              </div>
            </div>
          </div>
          {!contactPrimaryFirst(vertical.key) && waHref && (
            <>
              <a className="seller-card__whatsapp" href={waHref} target="_blank" rel="noopener noreferrer">
                <Glyph name="whatsapp" /> {t.askWhatsapp}
              </a>
              <div className="seller-card__divider"><span>{t.contactOr}</span></div>
            </>
          )}
          <ContactForm
            id="contacto"
            listingPublicId={listing.publicId}
            contactWhatsapp={contactWhatsapp}
            leadType={leadType}
            prefillMessage={waMessage}
            variant="card"
            locale={locale}
            foreignBuyer={foreignBuyerEnquiry(vertical.key)}
            recipients={{
              agent: agent?.name ?? null,
              agency: agency?.name ?? null,
              brand,
            }}
          />
          <p className="seller-card__privacy">{t.contactPrivacy}</p>
          {isSample && <p className="seller-card__sample-note">{t.sampleNote}</p>}
          <ReportListing listingPublicId={listing.publicId} locale={locale} />
          {showForeignerBox && (
            <p className="seller-card__reply-note">{d.guideEn.replyInEnglish}</p>
          )}
        </aside>
      </div>

      {/* Desktop reminder links back to the single aside form. */}
      <section className="contact-panel">
        <h2 className="contact-panel__title">{t.contactTitle}</h2>
        <p className="contact-panel__subtitle">{t.contactSubtitle}</p>
        <a className="ds-btn ds-btn--primary" href="#contacto">{d.contactForm.submitIdle}</a>
      </section>

      {/* Market context for this city — the internal link into /precios.
          Rendered only when the medians job has a defensible number, so we
          never send a visitor (or a crawler) to an empty page. */}
      {city && cityHasPrices && (
        <aside className="precios-cta">
          <span>
            {contextCell ? (
              <>
                {d.precios.contextMedian({
                  typeLabel: d.category.typeLabel[contextCell.propertyType] ?? PROPERTY_TYPE_LABELS[contextCell.propertyType],
                  operationLabel:
                    d.precios.contextOperationLabel[contextCell.operation] ??
                    contextCell.operation,
                  city: city.name,
                  median:
                    contextCell.medianPriceUsd != null
                      ? formatUsd(contextCell.medianPriceUsd, numberLocale)
                      : "—",
                  perM2:
                    contextCell.medianPriceM2Usd != null
                      ? formatUsd(contextCell.medianPriceM2Usd, numberLocale)
                      : null,
                  sample: contextCell.sampleSize,
                })}
                {listingPerM2 != null && (
                  <>
                    {" — "}
                    {d.precios.contextThisListing(formatUsd(listingPerM2, numberLocale))}
                  </>
                )}
              </>
            ) : (
              d.precios.relatedPrices(city.name)
            )}
          </span>
          <Link className="panel-btn" href={`/precios/${city.slug}`}>
            {d.precios.relatedPricesCta}
          </Link>
        </aside>
      )}

      {similar.length > 0 && (
        <section className="similar-listings">
          <h2 className="similar-listings__title">{t.similarTitle}</h2>
          <div className="similar-listings__grid ph-grid-4">
            {similar.map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {fromAgency.length > 0 && (
        <section className="similar-listings">
          <h2 className="similar-listings__title">
            {t.fromAgencyTitleLead}{" "}
            {agency ? (
              <Link href={agencyUrl(agency.slug)}>{agency.name}</Link>
            ) : (
              t.fromAgencyFallback
            )}
          </h2>
          <div className="similar-listings__grid ph-grid-4">
            {fromAgency.map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {/* Internal-link chips back into the category tree */}
      {city && (
        <div className="listing-morelinks">
          {barrio && (
            <Link
              className="listing-morelinks__chip"
              href={categoryUrl({
                operation: listing.operation,
                citySlug: city.slug,
                barrioSlug: barrio.slug,
                type: listing.propertyType,
              })}
            >
              <Glyph name="pin" /> {t.moreInBarrio(barrio.name)}
            </Link>
          )}
          <Link
            className="listing-morelinks__chip"
            href={categoryUrl({ operation: listing.operation, citySlug: city.slug })}
          >
            <Glyph name="building" /> {t.moreInCity(city.name)}
          </Link>
        </div>
      )}

      {/* Mobile-only contact bar. Below 860px the sidebar card is in the flow
          (globals.css), so this keeps the price and a one-tap contact within
          reach without covering the page the way the old sticky card did. */}
      <div className="listing-cta-bar">
        <div className="listing-cta-bar__price">
          <span className="listing-cta-bar__amount">
            <FxSwap usd={price.main} eur={price.eur?.main} />
            {pricePeriod}
          </span>
          {listedPriceLine && (
            <span className={`listing-cta-bar__listed${price.eur ? " fx--usd" : ""}`}>{listedPriceLine}</span>
          )}
          {eurListedLine && <span className="listing-cta-bar__listed fx--eur">{eurListedLine}</span>}
          {cuota && <span className="listing-cta-bar__cuota"><Glyph name="money" /> {cuota}</span>}
        </div>
        <div className="listing-cta-bar__actions">
          {waHref && (
            <a
              className="listing-cta-bar__btn listing-cta-bar__btn--whatsapp"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.ctaBarWhatsapp}
            >
              <Glyph name="whatsapp" />
              {t.ctaBarWhatsappShort}
            </a>
          )}
          {/* Guide §5 "Detail page" (mobile): WhatsApp + Llamar for Nórdico —
              stickyMobileContactBar() gates it rather than a vertical-key
              check here. Every other door keeps the existing WhatsApp +
              "Consultar" scroll-to-form pair. */}
          {stickyMobileContactBar(vertical.key) && waPhone(contactWhatsapp) ? (
            <a
              className="listing-cta-bar__btn listing-cta-bar__btn--primary"
              href={`tel:+${waPhone(contactWhatsapp)}`}
            >
              {t.ctaBarCall}
            </a>
          ) : (
            <a className="listing-cta-bar__btn listing-cta-bar__btn--primary" href="#contacto">
              {t.ctaBarConsult}
            </a>
          )}
        </div>
      </div>
    </main>
  );
}

/** "Publicado hace N días/semanas/meses" — coarse freshness, es-PY voseo-neutral. */
function formatPublishedAgo(
  publishedAt: Date | string,
  t: Dictionary["listing"],
): string | null {
  const ts = new Date(publishedAt).getTime();
  if (!Number.isFinite(ts)) return null;
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return t.publishedToday;
  if (days === 1) return t.publishedYesterday;
  if (days < 14) return t.publishedDaysAgo(days);
  if (days < 60) return t.publishedWeeksAgo(Math.floor(days / 7));
  return t.publishedMonthsAgo(Math.floor(days / 30));
}
