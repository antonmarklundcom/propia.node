import type { Metadata } from "next";
import { es } from "@/i18n/es";
import { currentVertical } from "@/lib/vertical-context";
import { getRecentListings, getBrowseStats, listCities } from "@/lib/queries";
import { categoryUrl } from "@/lib/urls";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import { TYPE_ICON } from "@/lib/photos";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { POPULAR_SEARCHES } from "@/config/popular-searches";
import type { PropertyType } from "@/lib/import/types";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Propia — Encontrá tu propiedad en Paraguay",
  description:
    "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay, con cuota estimada y financiamiento.",
};

export default async function Home() {
  await currentVertical();
  const [recent, cities, stats] = await Promise.all([
    getRecentListings(12),
    listCities(),
    getBrowseStats(),
  ]);

  // Type tiles need a city segment (§4 URL scheme has no city-less URL) —
  // anchor them to whichever city has the most listings, or the first
  // seeded city if nothing is published yet.
  const anchorCity = stats.cities[0] ?? cities[0];

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
          <p
            style={{
              marginTop: "var(--space-4)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              color: "var(--color-ink-secondary)",
            }}
          >
            {stats.totalListings.toLocaleString("es-PY")}{" "}
            {stats.totalListings === 1 ? "propiedad" : "propiedades"} activas ·{" "}
            {stats.totalCities} {stats.totalCities === 1 ? "ciudad" : "ciudades"}
          </p>
        )}
      </section>

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
