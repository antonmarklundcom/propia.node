import Link from "next/link";
import { tokens } from "@/design/tokens";

/**
 * Branded 404. Also what renders for category URLs with zero matching
 * listings (getIndexability() → "gone" with no parent to redirect to,
 * ARCHITECTURE.md §4.3) — that's an intentional SEO signal, but a visitor
 * who just searched should get a helpful page, not Next's bare default.
 */
export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "4rem 1rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 48 }} aria-hidden>
        🏡
      </div>
      <h1 style={{ fontSize: 26, margin: "16px 0 8px", color: tokens.color.primary }}>
        No encontramos propiedades para esa búsqueda
      </h1>
      <p style={{ fontSize: 16, color: tokens.color.inkSecondary, lineHeight: 1.6 }}>
        Puede que no haya publicaciones disponibles en esa zona o combinación
        todavía. Probá con otra ciudad o tipo de propiedad.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          marginTop: 20,
          padding: "10px 22px",
          borderRadius: tokens.radius.chip,
          background: tokens.color.primary,
          color: "#fff",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Volver a buscar
      </Link>
    </main>
  );
}
