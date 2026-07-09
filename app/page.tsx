import Link from "next/link";
import type { Metadata } from "next";
import { es } from "@/i18n/es";
import { currentVertical } from "@/lib/vertical-context";
import {
  getRecentListings,
  getRecentListingsBy,
  countPublished,
  listCities,
  type ListingCard as Card,
} from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";
import { POPULAR_SEARCHES } from "@/config/popular-searches";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Propia — Encontrá tu propiedad en Paraguay",
  description:
    "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay, con cuota estimada y financiamiento.",
};

/** Publish CTA — same WhatsApp/mailto fallback logic as the header button. */
function publishHref(): string {
  const wa = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "");
  const text = encodeURIComponent(
    "Hola, quiero publicar una propiedad en Propia.",
  );
  return wa
    ? `https://wa.me/${wa}?text=${text}`
    : "mailto:hola@propia.com.py?subject=Quiero%20publicar%20una%20propiedad";
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Qué es Propia?",
    a: "Propia es un portal inmobiliario de Paraguay donde podés buscar casas, departamentos y terrenos en venta y alquiler, comparar precios y contactar directamente a vendedores e inmobiliarias por WhatsApp.",
  },
  {
    q: "¿Es gratis buscar propiedades?",
    a: "Sí, buscar y contactar es 100% gratis. No cobramos comisión al comprador ni al inquilino.",
  },
  {
    q: "¿Cómo publico mi propiedad?",
    a: "Tocá «Publicar propiedad» y contanos qué querés publicar. Es gratis y te ayudamos a cargar fotos, precio y ubicación.",
  },
  {
    q: "¿Cómo contacto a un vendedor o inmobiliaria?",
    a: "Cada aviso tiene un botón de WhatsApp que abre un chat directo con quien publicó, con el enlace de la propiedad ya incluido en el mensaje.",
  },
  {
    q: "¿Qué es la cuota estimada?",
    a: "Para propiedades en venta mostramos una cuota mensual estimada según los programas de financiamiento vigentes en Paraguay, para que sepas de entrada si te cierra el número.",
  },
];

function Row({
  title,
  href,
  cards,
}: {
  title: string;
  href: string;
  cards: Card[];
}) {
  if (cards.length === 0) return null;
  return (
    <section className="home-section">
      <div className="home-section__head">
        <h2 className="home-section__title">{title}</h2>
        <Link className="home-section__more" href={href}>
          Ver todas →
        </Link>
      </div>
      <div className="home-row">
        {cards.map((card) => (
          <ListingCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  await currentVertical();
  const [recent, cities, total, ventaDeptos, alquileres, terrenos] =
    await Promise.all([
      getRecentListings(8),
      listCities(),
      countPublished(),
      getRecentListingsBy({ operation: "venta", type: "departamento" }, 8),
      getRecentListingsBy({ operation: "alquiler" }, 8),
      getRecentListingsBy({ operation: "venta", type: "terreno" }, 8),
    ]);

  return (
    <main>
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero__inner">
          <h1 className="home-hero__title">Encontrá tu propiedad en Paraguay</h1>
          <p className="home-hero__subtitle">
            Casas, departamentos y terrenos en venta y alquiler — con cuota
            estimada y financiamiento.
          </p>

          <SearchBar cities={cities} />

          <div className="home-hero__chips">
            {POPULAR_SEARCHES.map((q) => (
              <Link key={q.href} href={q.href} className="home-hero__chip">
                {q.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <div className="home-stats">
        <div className="home-stats__inner">
          <span className="home-stats__item">
            🏠 {total > 0 ? `${total.toLocaleString("es-PY")} propiedades activas` : "Propiedades en todo Paraguay"}
          </span>
          <span className="home-stats__item">🔄 Actualizado diariamente</span>
          <a
            className="home-stats__item home-stats__item--link"
            href={publishHref()}
            target="_blank"
            rel="noopener noreferrer"
          >
            ✏️ {es.publishCta}
          </a>
        </div>
      </div>

      <div className="home-body">
        <Row
          title="Publicaciones recientes"
          href="/venta/asuncion"
          cards={recent}
        />
        <Row
          title="Departamentos en venta"
          href="/venta/asuncion/departamentos"
          cards={ventaDeptos}
        />
        <Row
          title="Alquileres"
          href="/alquiler/asuncion"
          cards={alquileres}
        />
        <Row
          title="Terrenos"
          href="/venta/asuncion/terrenos"
          cards={terrenos}
        />

        {recent.length === 0 && (
          <p style={{ color: "var(--color-ink-secondary)", padding: "2rem 0" }}>
            {es.emptyState}
          </p>
        )}
      </div>

      {/* Publish CTA banner */}
      <section className="home-cta">
        <div className="home-cta__inner">
          <h2 className="home-cta__title">Publicá tu propiedad gratis</h2>
          <p className="home-cta__text">
            Llegá a miles de compradores e inquilinos en todo Paraguay. Simple,
            rápido y sin costo.
          </p>
          <a
            className="home-cta__button"
            href={publishHref()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Publicar ahora
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="home-faq">
        <div className="home-faq__inner">
          <h2 className="home-faq__title">Preguntas frecuentes</h2>
          <p className="home-faq__subtitle">
            Todo lo que necesitás saber sobre Propia.
          </p>
          {FAQ.map((f) => (
            <details key={f.q} className="home-faq__item">
              <summary className="home-faq__q">{f.q}</summary>
              <p className="home-faq__a">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
