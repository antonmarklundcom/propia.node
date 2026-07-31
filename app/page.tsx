import Link from "next/link";
import type { Metadata } from "next";
import { es } from "@/i18n/es";
import { currentVertical } from "@/lib/vertical-context";
import {
  getRecentListings,
  getRecentListingsBy,
  getFeaturedProjects,
  getFeaturedDevelopers,
  countPublished,
  listCities,
  type ListingCard as Card,
} from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { ProjectCard } from "@/components/ProjectCard";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { SearchBar } from "@/components/SearchBar";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { JsonLd } from "@/components/JsonLd";
import { POPULAR_SEARCHES } from "@/config/popular-searches";
import { FAQ_HOME } from "@/config/faq";
import { faqJsonLd } from "@/lib/jsonld";
import { citiesWithPrices } from "@/lib/precios-queries";
import { categoryUrl } from "@/lib/urls";
import { BRAND_NAME } from "@/lib/brand";

/** Hero quick-access tiles under the search bar. */
const HERO_TILES = [
  {
    icon: "🏛",
    title: "Asunción",
    sub: "Capital — mayor oferta",
    href: "/venta/asuncion",
  },
  {
    icon: "🌆",
    title: "Luque",
    sub: "Zona en crecimiento",
    href: "/venta/luque",
  },
  {
    icon: "🔑",
    title: "Alquileres",
    sub: "Tu próximo lugar",
    href: "/alquiler/asuncion",
  },
  {
    icon: "🏗",
    title: "Proyectos en pozo",
    sub: "Obra nueva y preventa",
    href: "/#proyectos",
  },
];

/** Curated, high-population cities — a fixed shortcut row (avoids querying
 * every seeded city, some of which have little to no live inventory yet). */
const CITY_SHORTCUTS = [
  "Asunción",
  "Luque",
  "San Lorenzo",
  "Lambaré",
  "Fernando de la Mora",
  "Ciudad del Este",
  "Encarnación",
];

export const revalidate = 600;

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Encontrá tu propiedad en Paraguay`,
  description:
    "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay, con cuota estimada y financiamiento.",
};

/** Publish CTA — same WhatsApp/mailto fallback logic as the header button. */
function publishHref(): string {
  const wa = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "");
  const text = encodeURIComponent(
    `Hola, quiero publicar una propiedad en ${BRAND_NAME}.`,
  );
  return wa
    ? `https://wa.me/${wa}?text=${text}`
    : "mailto:hola@propia.com.py?subject=Quiero%20publicar%20una%20propiedad";
}

/**
 * Both cards used to point at the same outbound WhatsApp link, because neither
 * destination existed yet. The valuation card now has a real one.
 */
const DISCOVER_CARDS: {
  icon: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  external?: boolean;
}[] = [
  {
    icon: "🏡",
    title: "Publicá tu propiedad gratis",
    text: "Cargá fotos, precio y ubicación en minutos. Sin comisión, sin costo de publicación.",
    cta: "Publicar ahora",
    href: "/publicar",
  },
  {
    icon: "💰",
    title: es.valuationMagnet,
    text: "Te damos un rango estimado con los precios publicados en la zona. Gratis y sin registrarte.",
    cta: "Calcular gratis",
    href: "/tasacion",
  },
  {
    icon: "📊",
    title: "Precios del mercado",
    text: "Mediana de precio por m² en cada ciudad, calculada sobre los avisos publicados del portal.",
    cta: "Ver precios",
    href: "/precios",
  },
  {
    icon: "🏦",
    title: "Financiamiento y cuotas",
    text: "Qué programas existen en Paraguay, qué piden y cómo calculamos la cuota estimada de cada aviso.",
    cta: "Leer la guía",
    href: "/financiamiento",
  },
];

/** Three-step explainer — the "what is this site" answer above the fold fold. */
const HOW_STEPS = [
  {
    icon: "🔎",
    title: "Buscá por zona y presupuesto",
    text: "Filtrá por ciudad, barrio, tipo de propiedad y rango de precio. Mirá los resultados en lista o sobre el mapa.",
  },
  {
    icon: "📊",
    title: "Compará con el mercado",
    text: "Cada propiedad en venta muestra su cuota estimada, y publicamos la mediana de precio por m² de cada ciudad.",
  },
  {
    icon: "💬",
    title: "Contactá directo",
    text: "Escribile por WhatsApp a quien publicó, desde la misma ficha y sin intermediarios ni costo.",
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
  const [
    recent,
    cities,
    total,
    ventaCasas,
    ventaDeptos,
    alquileres,
    terrenos,
    featuredProjects,
    featuredDevelopers,
    priceCities,
  ] = await Promise.all([
    getRecentListings(8),
    listCities(),
    countPublished(),
    getRecentListingsBy({ operation: "venta", type: "casa" }, 8),
    getRecentListingsBy({ operation: "venta", type: "departamento" }, 8),
    getRecentListingsBy({ operation: "alquiler" }, 8),
    getRecentListingsBy({ operation: "venta", type: "terreno" }, 8),
    getFeaturedProjects(6),
    getFeaturedDevelopers(8),
    citiesWithPrices(),
  ]);

  const cityShortcuts = CITY_SHORTCUTS.map((name) =>
    cities.find((c) => c.name === name),
  ).filter((c): c is (typeof cities)[number] => Boolean(c));

  return (
    <main>
      <JsonLd data={[faqJsonLd(FAQ_HOME)]} />

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

          <div className="home-hero__tiles">
            {HERO_TILES.map((t) => (
              <Link key={t.title} href={t.href} className="home-hero__tile">
                <span className="home-hero__tile-icon" aria-hidden>
                  {t.icon}
                </span>
                <span>
                  <span className="home-hero__tile-title">{t.title}</span>
                  <span className="home-hero__tile-sub">{t.sub}</span>
                </span>
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

      {/* Cómo funciona — the "what is this site" answer, before any listing */}
      <section className="home-how">
        <div className="home-how__inner">
          <h2 className="home-how__title">Cómo funciona</h2>
          <p className="home-how__subtitle">
            Buscar, comparar y contactar. Gratis, sin registro y sin comisión.
          </p>
          <div className="home-how__grid">
            {HOW_STEPS.map((s, i) => (
              <div key={s.title} className="home-how__step">
                <span className="home-how__num" aria-hidden>
                  {i + 1}
                </span>
                <span className="home-how__icon" aria-hidden>
                  {s.icon}
                </span>
                <h3 className="home-how__step-title">{s.title}</h3>
                <p className="home-how__step-text">{s.text}</p>
              </div>
            ))}
          </div>
          <Link className="home-how__more" href="/como-funciona">
            Ver la guía completa →
          </Link>
        </div>
      </section>

      {/* Nuevos proyectos — renders only once real projects exist */}
      {featuredProjects.length > 0 && (
        <section className="home-projects" id="proyectos">
          <div className="home-projects__inner">
            <div className="home-section__head">
              <h2 className="home-section__title">
                🏗 Nuevos proyectos en Paraguay
              </h2>
            </div>
            <p className="home-projects__subtitle">
              Obra nueva verificada — departamentos en pozo, en construcción y
              entrega inmediata.
            </p>
            <div className="home-row home-row--projects">
              {featuredProjects.map((p) => (
                <ProjectCard key={p.id} card={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* City shortcuts */}
      {cityShortcuts.length > 0 && (
        <section className="home-cities">
          <div className="home-cities__inner">
            <h2 className="home-cities__title">Explorá por ciudad</h2>
            <div className="home-cities__row">
              {cityShortcuts.map((c) => (
                <Link
                  key={c.slug}
                  className="home-cities__chip"
                  href={categoryUrl({ operation: "venta", citySlug: c.slug })}
                >
                  📍 {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="home-body">
        <RecentlyViewed />
        <Row
          title="Propiedades recomendadas"
          href="/venta/asuncion"
          cards={recent}
        />
        <Row
          title="Casas en Venta — Asunción y alrededores"
          href="/venta/asuncion/casas"
          cards={ventaCasas}
        />
        <Row
          title="Departamentos en Venta — Asunción"
          href="/venta/asuncion/departamentos"
          cards={ventaDeptos}
        />
        <Row
          title="Alquileres en Asunción"
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

      {/* Desarrolladoras destacadas — renders only once developers exist */}
      {featuredDevelopers.length > 0 && (
        <section className="home-devs">
          <div className="home-devs__inner">
            <div className="home-section__head">
              <h2 className="home-section__title">Desarrolladoras destacadas</h2>
            </div>
            <p className="home-projects__subtitle">
              Conocé quién construye los proyectos del país.
            </p>
            <div className="home-devs__grid">
              {featuredDevelopers.map((d) => (
                <div key={d.id} className="home-devs__card">
                  {d.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="home-devs__logo" src={d.logoUrl} alt={d.name} />
                  ) : (
                    <div className="home-devs__logo home-devs__logo--fallback" aria-hidden>
                      {d.name.charAt(0)}
                    </div>
                  )}
                  <div className="home-devs__name">{d.name}</div>
                  <div className="home-devs__count">
                    {d.projectCount} {d.projectCount === 1 ? "proyecto" : "proyectos"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Market data — the reason to come back between searches. Renders only
          when the medians job has produced a defensible sample. */}
      {priceCities.length > 0 && (
        <section className="home-prices">
          <div className="home-prices__inner">
            <div className="home-section__head">
              <h2 className="home-section__title">
                📊 Precios de referencia por ciudad
              </h2>
              <Link className="home-section__more" href="/precios">
                Ver todos →
              </Link>
            </div>
            <p className="home-prices__subtitle">
              Medianas de precio por m² calculadas sobre los avisos publicados.
              Para saber si un aviso está en línea con su zona antes de
              negociar.
            </p>
            <div className="home-prices__row">
              {priceCities.slice(0, 8).map((c) => (
                <Link
                  key={c.slug}
                  className="home-prices__card"
                  href={`/precios/${c.slug}`}
                >
                  <span className="home-prices__city">{c.name}</span>
                  <span className="home-prices__sample">
                    {c.reliableSample.toLocaleString("es-PY")} avisos analizados
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Value proposition strip */}
      <section className="home-values">
        <div className="home-values__inner">
          {[
            {
              icon: "✅",
              title: "Contacto directo",
              text: "Hablás directo con el vendedor o la inmobiliaria, sin intermediarios.",
            },
            {
              icon: "💳",
              title: "Cuota estimada",
              text: "Cada propiedad en venta muestra su cuota mensual con financiamiento vigente.",
            },
            {
              icon: "🇵🇾",
              title: "Hecho para Paraguay",
              text: "Precios en guaraníes y dólares, barrios reales y WhatsApp primero.",
            },
          ].map((v) => (
            <div key={v.title} className="home-values__item">
              <span className="home-values__icon" aria-hidden>
                {v.icon}
              </span>
              <div>
                <div className="home-values__title">{v.title}</div>
                <div className="home-values__text">{v.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Descubre más — secondary product surfaces */}
      <section className="home-discover">
        <div className="home-discover__inner">
          <h2 className="home-discover__title">Descubre más en {BRAND_NAME}</h2>
          <div className="home-discover__grid">
            {DISCOVER_CARDS.map((c) => (
              <a
                key={c.title}
                className="home-discover__card"
                href={c.href}
                {...(c.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <span className="home-discover__icon" aria-hidden>
                  {c.icon}
                </span>
                <h3 className="home-discover__card-title">{c.title}</h3>
                <p className="home-discover__card-text">{c.text}</p>
                <span className="home-discover__card-cta">{c.cta} →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Professional lane — the revenue side of the marketplace. Guests see
          what publishing a whole portfolio gets them, not just one property. */}
      <section className="home-pro">
        <div className="home-pro__inner">
          <div className="home-pro__copy">
            <div className="home-pro__kicker">Para inmobiliarias y agentes</div>
            <h2 className="home-pro__title">
              ¿Vendés propiedades todos los días?
            </h2>
            <p className="home-pro__text">
              Publicá tu cartera completa, mostrá tu inmobiliaria con perfil
              verificado y recibí las consultas directo en tu WhatsApp. Sin
              costo por aviso, sin costo por lead y sin comisión sobre tus
              operaciones.
            </p>
            <ul className="home-pro__list">
              <li>✓ Avisos ilimitados en el plan gratuito</li>
              <li>✓ Perfil público de la inmobiliaria y de cada agente</li>
              <li>✓ Importación de cartera desde planilla o enlace</li>
              <li>✓ Panel con las consultas de cada propiedad</li>
            </ul>
            <div className="home-pro__actions">
              <Link className="home-pro__button" href="/para-inmobiliarias">
                Conocer más
              </Link>
              <Link className="home-pro__link" href="/planes">
                Ver planes →
              </Link>
            </div>
          </div>
          <div className="home-pro__aside">
            <Link className="home-pro__card" href="/inmobiliarias">
              <span className="home-pro__card-icon" aria-hidden>
                🏢
              </span>
              <span className="home-pro__card-title">
                Directorio de inmobiliarias
              </span>
              <span className="home-pro__card-text">
                Mirá quiénes ya publican su cartera en el portal.
              </span>
            </Link>
            <Link className="home-pro__card" href="/proyectos">
              <span className="home-pro__card-icon" aria-hidden>
                🏗
              </span>
              <span className="home-pro__card-title">
                Desarrolladoras y proyectos
              </span>
              <span className="home-pro__card-text">
                Obra nueva, en pozo y entrega inmediata.
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Publish CTA banner */}
      <section className="home-cta">
        <div className="home-cta__inner">
          <h2 className="home-cta__title">Publicá tu propiedad gratis</h2>
          <p className="home-cta__text">
            Llegá a miles de compradores e inquilinos en todo Paraguay. Simple,
            rápido y sin costo.
          </p>
          <div className="home-cta__actions">
            <Link className="home-cta__button" href="/publicar">
              Publicar ahora
            </Link>
            <a
              className="home-cta__alt"
              href={publishHref()}
              target="_blank"
              rel="noopener noreferrer"
            >
              o escribinos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="home-newsletter">
        <div className="home-newsletter__inner">
          <div>
            <h2 className="home-newsletter__title">
              Oportunidades inmobiliarias, una vez por semana
            </h2>
            <p className="home-newsletter__text">
              Propiedades curadas, señales del mercado y las últimas del sector —
              en tu correo. Sin spam, podés cancelar cuando quieras.
            </p>
          </div>
          <NewsletterSignup />
        </div>
      </section>

      {/* FAQ */}
      <section className="home-faq">
        <div className="home-faq__inner">
          <h2 className="home-faq__title">Preguntas frecuentes</h2>
          <p className="home-faq__subtitle">
            Todo lo que necesitás saber sobre {BRAND_NAME}.
          </p>
          {FAQ_HOME.map((f) => (
            <details key={f.q} className="home-faq__item">
              <summary className="home-faq__q">{f.q}</summary>
              <p className="home-faq__a">{f.a}</p>
            </details>
          ))}
          <Link className="home-faq__more" href="/preguntas-frecuentes">
            Ver todas las preguntas →
          </Link>
        </div>
      </section>
    </main>
  );
}
