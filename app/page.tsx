import type { Metadata } from "next";
import { es } from "@/i18n/es";
import { currentVertical } from "@/lib/vertical-context";
import { getRecentListings, listCities } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { POPULAR_SEARCHES } from "@/config/popular-searches";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Propia — Encontrá tu propiedad en Paraguay",
  description:
    "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay, con cuota estimada y financiamiento.",
};

export default async function Home() {
  await currentVertical();
  const [recent, cities] = await Promise.all([
    getRecentListings(12),
    listCities(),
  ]);

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
      </section>

      <section>
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
