import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tokens } from "@/design/tokens";
import {
  getListingByPublicId,
  getSimilarListings,
  citySubtreeIds,
} from "@/lib/queries";
import {
  parseListingPublicId,
  listingUrl,
  categoryUrl,
} from "@/lib/urls";
import { formatPrice, formatCuota, imageUrl } from "@/lib/format";
import { isPlaceholderPhoto, TYPE_ICON } from "@/lib/photos";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import {
  listingJsonLd,
  breadcrumbJsonLd,
} from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { WhatsAppContact } from "@/components/WhatsAppContact";
import { ListingCard } from "@/components/ListingCard";
import { ListingMapLazy } from "@/components/ListingMapLazy";

export const revalidate = 3600;

const ORIGIN = () =>
  `https://${process.env.NEXT_PUBLIC_CANONICAL_HOST ?? "propia.com.py"}`;

type Params = { params: Promise<{ slug: string }> };

async function load(slugParam: string) {
  const publicId = parseListingPublicId(slugParam);
  if (!publicId) return null;
  return getListingByPublicId(publicId);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) return { title: "Propiedad no encontrada — Propia" };
  const { listing } = detail;
  const canonical = `${ORIGIN()}${listingUrl(listing)}`;
  const cover = imageUrl(detail.images[0]?.r2Key ?? null);
  return {
    title: `${listing.title} — ${formatPrice(listing)} | Propia`,
    description: listing.descriptionEs?.slice(0, 160) ?? listing.title,
    alternates: { canonical },
    openGraph: {
      title: listing.title,
      url: canonical,
      images: cover ? [cover] : undefined,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function ListingPage({ params }: Params) {
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) notFound();

  const { listing, images, chain, agency, agent } = detail;
  const cuota = formatCuota(listing.cuotaGs);
  const contactWhatsapp = agent?.whatsapp ?? agency?.whatsapp ?? null;
  const leadType = listing.operation === "venta" ? "buyer" : "renter";
  const area = listing.areaM2 ?? listing.landM2;

  const city = chain.find((c) => c.level === "ciudad");
  const barrio = chain.find((c) => c.level === "barrio");
  const typeLabel = PROPERTY_TYPE_LABELS[listing.propertyType];
  const typeUrl = city
    ? categoryUrl({ operation: listing.operation, citySlug: city.slug, type: listing.propertyType })
    : undefined;

  // Only include nodes with a genuinely routable URL in both the visible
  // nav and the JSON-LD (a bare barrio page isn't a valid route).
  const crumbs: { name: string; url?: string }[] = [{ name: "Inicio", url: "/" }];
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
  crumbs.push({ name: listing.title });

  const jsonLdCrumbs = crumbs
    .filter((c): c is { name: string; url: string } => Boolean(c.url))
    .concat([{ name: listing.title, url: listingUrl(listing) }]);

  const realImages = images.filter((im) => !isPlaceholderPhoto(im.r2Key));
  const visibleThumbs = realImages.slice(1, 4);
  const extraCount = realImages.length - 1 - visibleThumbs.length;

  // Approximate location only — barrio centroid, else city centroid. Never
  // the listing's own lat/lng (schema.ts: precise coords are "never shown
  // publicly at full precision").
  const approxLocation =
    barrio?.lat && barrio?.lng
      ? { lat: Number(barrio.lat), lng: Number(barrio.lng), label: `${barrio.name}, ${city?.name ?? ""}` }
      : city?.lat && city?.lng
        ? { lat: Number(city.lat), lng: Number(city.lng), label: city.name }
        : null;

  const similar = city
    ? await getSimilarListings({
        excludeId: listing.id,
        operation: listing.operation,
        type: listing.propertyType,
        locationIds: await citySubtreeIds(city.id),
        limit: 4,
      })
    : [];

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      <JsonLd data={[listingJsonLd(detail), breadcrumbJsonLd(jsonLdCrumbs)]} />

      <nav className="breadcrumb-nav" aria-label="Ruta de navegación">
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

      {/* Gallery */}
      {realImages.length === 0 ? (
        <div className="detail-gallery__empty">
          <span className="detail-gallery__empty-icon" aria-hidden>
            {TYPE_ICON[listing.propertyType]}
          </span>
          <span className="detail-gallery__empty-label">Fotos próximamente</span>
        </div>
      ) : (
        <div className="detail-gallery">
          <div
            className="detail-gallery__main"
            style={{ backgroundImage: `url(${imageUrl(realImages[0].r2Key)})` }}
            role="img"
            aria-label={listing.title}
          />
          {visibleThumbs.length > 0 && (
            <div className="detail-gallery__thumbs">
              {visibleThumbs.map((im, i) => {
                const isLast = i === visibleThumbs.length - 1;
                return (
                  <div
                    key={im.id}
                    className="detail-gallery__thumb"
                    style={{ backgroundImage: `url(${imageUrl(im.r2Key)})` }}
                  >
                    {isLast && extraCount > 0 && (
                      <div className="detail-gallery__more">+{extraCount} fotos</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="listing-detail__layout">
        <div>
          <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>{listing.title}</h1>
          <div style={{ fontSize: 28, fontWeight: 800, color: tokens.color.primary }}>
            {formatPrice(listing)}
          </div>
          {cuota && (
            <div
              style={{
                display: "inline-block",
                marginTop: 8,
                padding: "6px 12px",
                borderRadius: tokens.radius.chip,
                background: "#FCF3E4",
                color: tokens.color.accent,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              💳 {cuota}
            </div>
          )}

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "16px 0",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              fontSize: 15,
              color: tokens.color.ink,
            }}
          >
            {listing.bedrooms != null && <li>🛏 {listing.bedrooms} dormitorios</li>}
            {listing.bathrooms != null && <li>🚿 {listing.bathrooms} baños</li>}
            {listing.parking != null && <li>🚗 {listing.parking} cocheras</li>}
            {area && <li>📐 {Math.round(Number(area))} m²</li>}
          </ul>

          {listing.descriptionEs && (
            <p style={{ lineHeight: 1.6, color: tokens.color.ink, whiteSpace: "pre-line" }}>
              {listing.descriptionEs}
            </p>
          )}

          {approxLocation && (
            <div className="listing-location">
              <h2 className="listing-location__title">Ubicación aproximada</h2>
              <p className="listing-location__caption">{approxLocation.label}</p>
              <ListingMapLazy lat={approxLocation.lat} lng={approxLocation.lng} />
            </div>
          )}
        </div>

        {/* Sticky contact card */}
        <aside className="listing-detail__aside">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            {agency?.name ?? agent?.name ?? "Publicado en Propia"}
          </div>
          <WhatsAppContact
            listingPublicId={listing.publicId}
            contactWhatsapp={contactWhatsapp}
            leadType={leadType}
          />
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="similar-listings">
          <h2 className="similar-listings__title">Propiedades similares</h2>
          <div className="similar-listings__grid">
            {similar.map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
