import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tokens } from "@/design/tokens";
import {
  getListingByPublicId,
  getSimilarListings,
  getAgencyListings,
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
import { inquiryPrefillFor } from "@/i18n/es";
import { JsonLd } from "@/components/JsonLd";
import { ContactForm } from "@/components/ContactForm";
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

const STATE_LABELS: Record<string, string> = {
  entrega_inmediata: "Entrega inmediata",
  en_construccion: "En construcción",
  en_pozo: "En pozo",
  usado: "Usado",
};

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
  const { slug } = await params;
  const detail = await load(slug);
  if (!detail) notFound();

  const { listing, images, chain, agency, agent } = detail;
  const cuota = formatCuota(listing.cuotaGs);
  const contactWhatsapp = agent?.whatsapp ?? agency?.whatsapp ?? null;
  const leadType = listing.operation === "venta" ? "buyer" : "renter";
  const area = listing.areaM2 ?? listing.landM2;
  const canonical = `${ORIGIN()}${listingUrl(listing)}`;
  const waMessage = inquiryPrefillFor(listing.title, canonical);

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

  const [similar, fromAgency] = await Promise.all([
    city
      ? getSimilarListings({
          excludeId: listing.id,
          operation: listing.operation,
          type: listing.propertyType,
          locationIds: await citySubtreeIds(city.id),
          limit: 4,
        })
      : Promise.resolve([]),
    listing.agencyId
      ? getAgencyListings({ agencyId: listing.agencyId, excludeId: listing.id, limit: 4 })
      : Promise.resolve([]),
  ]);

  const amenities = normalizeAmenities(listing.amenities);
  const publishedAgo = listing.publishedAt
    ? formatPublishedAgo(listing.publishedAt)
    : null;

  // "Detalles de la propiedad" rows — only what we actually know.
  const details: { label: string; value: string }[] = [];
  if (barrio) details.push({ label: "Barrio", value: barrio.name });
  if (city) details.push({ label: "Ciudad", value: city.name });
  details.push({ label: "Tipo", value: typeLabel });
  if (listing.propertyState)
    details.push({ label: "Estado", value: STATE_LABELS[listing.propertyState] ?? listing.propertyState });
  if (listing.areaM2)
    details.push({ label: "Superficie", value: `${Math.round(Number(listing.areaM2))} m²` });
  if (listing.landM2)
    details.push({ label: "Terreno", value: `${Math.round(Number(listing.landM2))} m²` });
  if (listing.parking != null)
    details.push({ label: "Cocheras", value: String(listing.parking) });

  const sellerName = agency?.name ?? agent?.name ?? "Publicado en Propia";
  const sellerInitials = sellerName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

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

      <h1 className="listing-title">{listing.title}</h1>

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
          {/* Facts strip: type · beds · baths · area · freshness */}
          <ul className="listing-facts">
            <li className="listing-facts__item">
              <span aria-hidden>{TYPE_ICON[listing.propertyType]}</span> {typeLabel.replace(/s$/, "")}
            </li>
            {listing.bedrooms != null && (
              <li className="listing-facts__item">🛏 {listing.bedrooms} dorm</li>
            )}
            {listing.bathrooms != null && (
              <li className="listing-facts__item">
                🚿 {listing.bathrooms} {listing.bathrooms === 1 ? "baño" : "baños"}
              </li>
            )}
            {listing.parking != null && (
              <li className="listing-facts__item">🚗 {listing.parking} cocheras</li>
            )}
            {area && (
              <li className="listing-facts__item">📐 {Math.round(Number(area))} m²</li>
            )}
            {publishedAgo && (
              <li className="listing-facts__item listing-facts__item--muted">
                🕓 {publishedAgo}
              </li>
            )}
          </ul>

          <div className="listing-price">
            {listing.operation !== "venta" ? (
              <>
                <span className="listing-price__label">Alquiler</span>{" "}
                <span className="listing-price__amount">{formatPrice(listing)}</span>
                <span className="listing-price__period">/mes</span>
              </>
            ) : (
              <span className="listing-price__amount">{formatPrice(listing)}</span>
            )}
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

          {details.length > 0 && (
            <section className="listing-section">
              <h2 className="listing-section__title">☰ Detalles de la propiedad</h2>
              <dl className="listing-details-grid">
                {details.map((d) => (
                  <div className="listing-details-grid__row" key={d.label}>
                    <dt className="listing-details-grid__label">{d.label}</dt>
                    <dd className="listing-details-grid__value">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {amenities.length > 0 && (
            <section className="listing-section">
              <h2 className="listing-section__title">✨ Comodidades de la propiedad</h2>
              <ul className="listing-amenities">
                {amenities.map((a) => (
                  <li className="listing-amenities__item" key={a}>
                    <span className="listing-amenities__check" aria-hidden>✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {listing.descriptionEs && (
            <section className="listing-section">
              <h2 className="listing-section__title">📄 Descripción</h2>
              <p style={{ lineHeight: 1.6, color: tokens.color.ink, whiteSpace: "pre-line", margin: 0 }}>
                {listing.descriptionEs}
              </p>
            </section>
          )}

          {approxLocation && (
            <section className="listing-section">
              <h2 className="listing-section__title">📍 Ubicación aproximada</h2>
              <p className="listing-location__caption">{approxLocation.label}</p>
              <ListingMapLazy lat={approxLocation.lat} lng={approxLocation.lng} />
            </section>
          )}
        </div>

        {/* Sticky contact card */}
        <aside className="listing-detail__aside">
          <div className="seller-card__head">
            {agency?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="seller-card__logo" src={agency.logoUrl} alt={sellerName} />
            ) : (
              <div className="seller-card__avatar" aria-hidden>
                {sellerInitials || "P"}
              </div>
            )}
            <div>
              <div className="seller-card__name">
                {sellerName}
                {(agency?.isVerified || agent?.isVerified) && (
                  <span className="seller-card__verified" title="Verificado">✓</span>
                )}
              </div>
              <div className="seller-card__kind">
                {agency ? "Inmobiliaria" : agent ? "Agente" : "propia.com.py"}
              </div>
            </div>
          </div>
          <ContactForm
            listingPublicId={listing.publicId}
            contactWhatsapp={contactWhatsapp}
            leadType={leadType}
            prefillMessage={waMessage}
            variant="card"
          />
        </aside>
      </div>

      {/* Full-width contact panel, mirrors the sticky card for visitors
          who scrolled past it without noticing. */}
      <section className="contact-panel">
        <h2 className="contact-panel__title">¿Interesado en esta propiedad?</h2>
        <p className="contact-panel__subtitle">
          Contactanos hoy para más información o para agendar una visita.
        </p>
        <ContactForm
          listingPublicId={listing.publicId}
          contactWhatsapp={contactWhatsapp}
          leadType={leadType}
          prefillMessage={waMessage}
          variant="panel"
        />
      </section>

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

      {fromAgency.length > 0 && (
        <section className="similar-listings">
          <h2 className="similar-listings__title">Más de {agency?.name ?? "esta inmobiliaria"}</h2>
          <div className="similar-listings__grid">
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
              📍 Más propiedades en {barrio.name}
            </Link>
          )}
          <Link
            className="listing-morelinks__chip"
            href={categoryUrl({ operation: listing.operation, citySlug: city.slug })}
          >
            🏙 Todas las propiedades en {city.name}
          </Link>
        </div>
      )}
    </main>
  );
}

/** "Publicado hace N días/semanas/meses" — coarse freshness, es-PY voseo-neutral. */
function formatPublishedAgo(publishedAt: Date | string): string | null {
  const ts = new Date(publishedAt).getTime();
  if (!Number.isFinite(ts)) return null;
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return "Publicado hoy";
  if (days === 1) return "Publicado ayer";
  if (days < 14) return `Publicado hace ${days} días`;
  if (days < 60) return `Publicado hace ${Math.floor(days / 7)} semanas`;
  return `Publicado hace ${Math.floor(days / 30)} meses`;
}
