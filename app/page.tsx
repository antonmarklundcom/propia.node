import type { Metadata } from "next";
import { es } from "@/i18n/es";
import { currentVertical } from "@/lib/vertical-context";
import {
  getRecentListings,
  getBrowseStats,
  getPreventaListings,
  listCities,
} from "@/lib/queries";
import { categoryUrl } from "@/lib/urls";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import { TYPE_ICON } from "@/lib/photos";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";
import { Chip } from "@/components/ui/Chip";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { POPULAR_SEARCHES } from "@/config/popular-searches";
import type { PropertyType } from "@/lib/import/types";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Propia — Encontrá tu propiedad en Paraguay",
  description:
    "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay, con cuota estimada y financiamiento.",
};

const STAGE_LABEL: Record<string, string> = {
  en_pozo: "En pozo",
  en_construccion: "En construcción",
};

export default async function Home() {
  await currentVertical();
  const [recent, cities, stats, preventa] = await Promise.all([
    getRecentListings(12),
    listCities(),
    getBrowseStats(),
    getPreventaListings(),
  ]);

  // Type tiles need a city segment (§4 URL scheme has no city-less URL) —
  // anchor them to whichever city has the most listings, or the first
  // seeded city if nothing is published yet.
  const anchorCity = stats.cities[0] ?? cities[0];

  const HIGHLIGHTS = [
    {
      icon: "🏙",
      bg: "#FDEBD3",
      title: "Asunción",
      subtitle: "Capital · Mayor oferta",
      href: categoryUrl({ operation: "venta", citySlug: "asuncion" }),
    },
    {
      icon: "📈",
      bg: "#DCE6FB",
      title: "Luque",
      subtitle: "Zona en crecimiento",
      href: categoryUrl({ operation: "venta", citySlug: "luque" }),
    },
    {
      icon: "🌊",
      bg: "#D6F2EF",
      title: "Areguá",
      subtitle: "Lago Ypacaraí",
      href: categoryUrl({ operation: "venta", citySlug: "aregua" }),
    },
    {
      icon: "🚧",
      bg: "#D9F2E3",
      title: "Proyectos en pozo",
      subtitle: "Obra nueva y preventa",
      href: `${categoryUrl({ operation: "venta", citySlug: "asuncion" })}?estado=en_pozo`,
    },
  ];

  return (
    <main className="container">
      <section style={{ padding: "2.5rem 0 1.5rem" }}>
        <h1
          className="page-title"
          style={{ fontSize: "var(--text-3xl)", color: "var(--color-primary)" }}
        >
          Encontrá tu propiedad en Paraguay
        </h1>
        <p className="page-subtitle" style={{ fontSize: "var(--text-md)" }}>
          Casas, departamentos y terrenos — con cuota estimada y financiamiento.
        </p>

        <SearchBar cities={cities} />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-2)",
            marginTop: "var(--space-4)",
          }}
        >
          {POPULAR_SEARCHES.map((q) => (
            <Chip key={q.href} href={q.href}>
              {q.label}
            </Chip>
          ))}
        </div>

        {stats.totalListings > 0 && (
          <div className="stats-strip">
            {stats.newLast7Days > 0 && (
              <span className="stats-strip__highlight">
                <span className="stats-strip__dot" aria-hidden />
                {stats.newLast7Days}{" "}
                {stats.newLast7Days === 1
                  ? "nueva publicación"
                  : "nuevas publicaciones"}{" "}
                en los últimos 7 días
              </span>
            )}
            <span className="stats-strip__meta">
              Más de {stats.totalListings.toLocaleString("es-PY")} propiedades
              activas · Actualizado diariamente · {es.publishCta}
            </span>
          </div>
        )}
      </section>

      <section>
        <div className="highlight-grid">
          {HIGHLIGHTS.map((h) => (
            <a key={h.title} href={h.href} className="highlight-tile">
              <span
                className="highlight-tile__icon"
                style={{ background: h.bg }}
                aria-hidden
              >
                {h.icon}
              </span>
              <span className="highlight-tile__text">
                <span className="highlight-tile__title">{h.title}</span>
                <span className="highlight-tile__subtitle">{h.subtitle}</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      {preventa.length > 0 && (
        <section style={{ marginTop: "var(--space-6)" }}>
          <h2 className="section-title">Proyectos en construcción y en pozo</h2>
          <div className="scroll-row">
            {preventa.map((card) => (
              <div className="scroll-row__item" key={card.id}>
                {card.propertyState && STAGE_LABEL[card.propertyState] && (
                  <div className="scroll-row__stage">
                    <Badge variant="accent">
                      {STAGE_LABEL[card.propertyState]}
                    </Badge>
                  </div>
                )}
                <ListingCard card={card} />
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.cities.length > 0 && (
        <section style={{ marginTop: "var(--space-6)" }}>
          <h2 className="section-title">Explorá por ciudad</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "var(--space-3)",
            }}
          >
            {stats.cities.map((c) => (
              <a
                key={c.id}
                href={categoryUrl({ operation: "venta", citySlug: c.slug })}
                className="card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ fontWeight: 700, fontSize: "var(--text-body)" }}>
                  {c.name}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: "var(--text-sm)",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  {c.count > 0
                    ? `${c.count} ${c.count === 1 ? "propiedad" : "propiedades"}`
                    : "Ver zona"}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {stats.types.length > 0 && anchorCity && (
        <section style={{ marginTop: "var(--space-6)" }}>
          <h2 className="section-title">Explorá por tipo</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "var(--space-3)",
            }}
          >
            {stats.types.map(({ type, count }) => (
              <a
                key={type}
                href={categoryUrl({
                  operation: "venta",
                  citySlug: anchorCity.slug,
                  type: type as PropertyType,
                })}
                className="card"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 28 }} aria-hidden>
                  {TYPE_ICON[type as PropertyType]}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontWeight: 700,
                    fontSize: "var(--text-sm)",
                  }}
                >
                  {PROPERTY_TYPE_LABELS[type as PropertyType]}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  {count} {count === 1 ? "propiedad" : "propiedades"}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: "var(--space-6)" }}>
        <h2 className="section-title">Publicaciones recientes</h2>
        {recent.length === 0 ? (
          <EmptyState title={es.emptyState} />
        ) : (
          <div className="listing-grid">
            {recent.map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
