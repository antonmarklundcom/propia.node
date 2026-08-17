import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";
import { getRecentListingsBy, listCities } from "@/lib/queries";
import { getOperationHubData } from "@/lib/directory-queries";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import { categoryUrl, parseOperation, operationSlug } from "@/lib/urls";
import { CtaBand, Section } from "@/components/MarketingUI";
import type { Operation, PropertyType } from "@/lib/import/types";

// Live counts per city and per type; no build-time DB on Hostinger.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ operacion: string }> };

/**
 * National operation hub: /venta, /alquiler, /alquiler-temporal.
 *
 * The category route (`/[operacion]/[...segments]`) needs at least one
 * segment, so these bare URLs used to 404 — even though they are exactly
 * where competitors put their top-level "Venta" and "Alquiler" tabs, and
 * where a search for "casas en venta paraguay" wants to land. This page is
 * the parent of the whole category tree: every city and every property type
 * for the operation, with real counts.
 *
 * Static routes win over dynamic ones in the App Router, so /precios,
 * /planes and friends are unaffected; anything that isn't an operation slug
 * falls through to notFound().
 */
const COPY: Record<
  Operation,
  { h1: string; lead: string; label: string; cityLabel: string }
> = {
  venta: {
    h1: "Propiedades en venta en Paraguay",
    lead: "Casas, departamentos, terrenos y locales en venta en todo el país. Cada aviso muestra su cuota mensual estimada, para saber de entrada si el número te cierra.",
    label: "Venta",
    cityLabel: "Comprar en",
  },
  alquiler: {
    h1: "Propiedades en alquiler en Paraguay",
    lead: "Departamentos, casas, oficinas y locales en alquiler en todo el país. Contacto directo con el propietario o la inmobiliaria, sin comisión del portal.",
    label: "Alquiler",
    cityLabel: "Alquilar en",
  },
  alquiler_temporal: {
    h1: "Alquiler temporal en Paraguay",
    lead: "Estadías cortas y alquileres por temporada en todo el país.",
    label: "Alquiler temporal",
    cityLabel: "Alquilar por temporada en",
  },
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const brand = await brandName();
  const { operacion } = await params;
  const op = parseOperation(operacion);
  if (!op) return { title: brand };
  const copy = COPY[op];
  return {
    title: `${copy.h1}`,
    description: copy.lead,
    alternates: { canonical: `${await siteOrigin()}/${operationSlug(op)}` },
    // og:title doesn't inherit title.template, so the brand is explicit (F47).
    openGraph: { title: `${copy.h1} — ${brand}`, description: copy.lead },
  };
}

export default async function OperationHubPage({ params }: Params) {
  const { operacion } = await params;
  const op = parseOperation(operacion);
  if (!op) notFound();

  const copy = COPY[op];
  const [origin, hub, cities, recent] = await Promise.all([
    siteOrigin(),
    getOperationHubData(op),
    listCities(),
    getRecentListingsBy({ operation: op }, 8),
  ]);

  const topCity = hub.cities[0]?.slug ?? "asuncion";

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: "Inicio", url: "/" },
            { name: copy.label, url: `/${operationSlug(op)}` },
          ]),
        ]}
      />

      <section className="hub-hero">
        <div className="hub-hero__inner">
          <h1 className="hub-hero__title">{copy.h1}</h1>
          <p className="hub-hero__lead">{copy.lead}</p>
          {hub.total > 0 && (
            <div className="hub-hero__count">
              {hub.total.toLocaleString("es-PY")} propiedades publicadas
            </div>
          )}
          <SearchBar cities={cities} />
        </div>
      </section>

      {hub.types.length > 0 && (
        <Section
          title={`Por tipo de propiedad`}
          subtitle={`Elegí qué estás buscando. Los totales son avisos publicados hoy en ${copy.label.toLowerCase()}.`}
        >
          <div className="hub-grid">
            {hub.types.map((t) => (
              <Link
                key={t.type}
                className="hub-tile"
                href={categoryUrl({
                  operation: op,
                  citySlug: topCity,
                  type: t.type as PropertyType,
                })}
              >
                <span className="hub-tile__label">
                  {PROPERTY_TYPE_LABELS[t.type as PropertyType] ?? t.type}
                </span>
                <span className="hub-tile__count">
                  {t.count.toLocaleString("es-PY")}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {hub.cities.length > 0 && (
        <Section
          tone="muted"
          title={`Por ciudad`}
          subtitle="Todas las ciudades con inventario activo, ordenadas por cantidad de avisos."
        >
          <div className="hub-grid hub-grid--cities">
            {hub.cities.map((c) => (
              <Link
                key={c.slug}
                className="hub-tile"
                href={categoryUrl({ operation: op, citySlug: c.slug })}
              >
                <span className="hub-tile__label">
                  {copy.cityLabel} {c.name}
                </span>
                <span className="hub-tile__count">
                  {c.count.toLocaleString("es-PY")}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {recent.length > 0 && (
        <Section title="Últimas publicaciones">
          <div className="mk-project-grid">
            {recent.map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
          <p className="mk-note">
            ¿Buscás en una zona puntual? Entrá a{" "}
            <Link href={categoryUrl({ operation: op, citySlug: topCity })}>
              {copy.cityLabel} {hub.cities[0]?.name ?? "Asunción"}
            </Link>{" "}
            y filtrá por barrio, precio y dormitorios.
          </p>
        </Section>
      )}

      {hub.total === 0 && (
        <Section>
          <div className="mk-empty">
            <p>Todavía no hay propiedades publicadas en {copy.label.toLowerCase()}.</p>
            <Link className="mk-btn mk-btn--accent" href="/publicar">
              Publicar la primera
            </Link>
          </div>
        </Section>
      )}

      <CtaBand
        title={
          op === "venta"
            ? "¿Vendés una propiedad?"
            : "¿Tenés una propiedad para alquilar?"
        }
        text="Publicala gratis y llegá a quienes están buscando en tu zona."
        primary={{ label: "Publicar gratis", href: "/publicar" }}
        secondary={{ label: "¿Cuánto vale?", href: "/tasacion" }}
      />
    </main>
  );
}
