import Link from "next/link";
import type { Metadata } from "next";
import { tokens } from "@/design/tokens";
import { es } from "@/i18n/es";
import { currentVertical } from "@/lib/vertical-context";
import { getRecentListings } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Propia — Encontrá tu propiedad en Paraguay",
  description:
    "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay, con cuota estimada y financiamiento.",
};

// Entry points into the category tree — the highest-intent starting pages.
const QUICK_LINKS = [
  { label: "Casas en Asunción", href: "/venta/asuncion/casas" },
  { label: "Departamentos en Asunción", href: "/venta/asuncion/departamentos" },
  { label: "Terrenos en Luque", href: "/venta/luque/terrenos" },
  { label: "Alquileres en Asunción", href: "/alquiler/asuncion" },
];

export default async function Home() {
  await currentVertical();
  const recent = await getRecentListings(12);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      <section style={{ padding: "2.5rem 0 1.5rem" }}>
        <h1 style={{ fontSize: 34, margin: 0, color: tokens.color.primary }}>
          Encontrá tu propiedad en Paraguay
        </h1>
        <p style={{ fontSize: 18, color: tokens.color.inkSecondary, marginTop: 8 }}>
          Casas, departamentos y terrenos — con cuota estimada y financiamiento.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              style={{
                padding: "8px 14px",
                borderRadius: tokens.radius.chip,
                background: tokens.color.surface,
                border: "1px solid #E1E5E0",
                color: tokens.color.ink,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {q.label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 20 }}>Publicaciones recientes</h2>
        {recent.length === 0 ? (
          <p style={{ color: tokens.color.inkSecondary }}>{es.emptyState}</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
              marginTop: 12,
            }}
          >
            {recent.map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
