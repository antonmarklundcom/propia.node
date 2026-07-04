import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tokens } from "@/design/tokens";
import { es } from "@/i18n/es";
import { getListingByPublicId } from "@/lib/queries";
import { parseListingPublicId, listingUrl } from "@/lib/urls";
import { formatPrice, formatCuota, imageUrl } from "@/lib/format";
import {
  listingJsonLd,
  breadcrumbJsonLd,
  locationBreadcrumb,
} from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { WhatsAppContact } from "@/components/WhatsAppContact";

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

  const crumbs = locationBreadcrumb(chain, {
    name: listing.title,
    url: listingUrl(listing),
  });

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "1rem" }}>
      <JsonLd data={[listingJsonLd(detail), breadcrumbJsonLd(crumbs)]} />

      <nav style={{ fontSize: 13, color: tokens.color.inkSecondary, marginBottom: 12 }}>
        {chain.map((c) => c.name).join(" › ")}
      </nav>

      {/* Gallery */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: images.length > 1 ? "2fr 1fr" : "1fr",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            aspectRatio: "4 / 3",
            borderRadius: tokens.radius.card,
            background: images[0]
              ? `#eee url(${imageUrl(images[0].r2Key)}) center/cover`
              : "#e3e6e2",
          }}
        />
        {images.length > 1 && (
          <div style={{ display: "grid", gap: 8 }}>
            {images.slice(1, 3).map((im) => (
              <div
                key={im.id}
                style={{
                  borderRadius: tokens.radius.card,
                  background: `#eee url(${imageUrl(im.r2Key)}) center/cover`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
        }}
      >
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
        </div>

        {/* Sticky contact card */}
        <aside
          style={{
            position: "sticky",
            bottom: 0,
            background: tokens.color.surface,
            borderRadius: tokens.radius.card,
            padding: 16,
            boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
          }}
        >
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
    </main>
  );
}
