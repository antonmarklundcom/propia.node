import { listCities } from "@/lib/queries";
import { SearchBar } from "@/components/SearchBar";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { POPULAR_SEARCHES } from "@/config/popular-searches";

// Renders per-request rather than at build time — it queries the DB for the
// city list, and this page has no dynamic segment to otherwise force that.
export const dynamic = "force-dynamic";

/**
 * Branded 404. Also what renders for category URLs with zero matching
 * listings (getIndexability() → "gone" with no parent to redirect to,
 * ARCHITECTURE.md §4.3) — that's an intentional SEO signal, but a visitor
 * who just searched should get somewhere to go next, not a dead end.
 */
export default async function NotFound() {
  const cities = await listCities();

  return (
    <main
      className="container container--narrow"
      style={{ padding: "4rem var(--space-4)", textAlign: "center" }}
    >
      <div style={{ fontSize: 48 }} aria-hidden>
        🏡
      </div>
      <h1
        className="page-title"
        style={{ margin: "16px 0 8px", color: "var(--color-primary)", fontSize: 26 }}
      >
        No encontramos propiedades para esa búsqueda
      </h1>
      <p
        style={{
          fontSize: "var(--text-body)",
          color: "var(--color-ink-secondary)",
          lineHeight: 1.6,
        }}
      >
        Puede que no haya publicaciones disponibles en esa zona o combinación
        todavía. Probá con otra ciudad o tipo de propiedad.
      </p>

      <div style={{ textAlign: "left" }}>
        <SearchBar cities={cities} />
      </div>

      <p
        style={{
          marginTop: 28,
          fontSize: "var(--text-xs)",
          fontWeight: 700,
          letterSpacing: "0.02em",
          color: "var(--color-ink-secondary)",
        }}
      >
        BÚSQUEDAS POPULARES
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-2)",
          justifyContent: "center",
          marginTop: "var(--space-2)",
        }}
      >
        {POPULAR_SEARCHES.map((s) => (
          <Chip key={s.href} href={s.href}>
            {s.label}
          </Chip>
        ))}
      </div>

      <div style={{ marginTop: "var(--space-5)" }}>
        <Button href="/" variant="ghost">
          Volver al inicio
        </Button>
      </div>
    </main>
  );
}
