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
import { faqHome } from "@/config/faq";
import { faqJsonLd } from "@/lib/jsonld";
import { citiesWithPrices } from "@/lib/precios-queries";
import { categoryUrl } from "@/lib/urls";
import { brandTaglineFor } from "@/lib/brand";
import { brandName } from "@/lib/brand-server";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/config/contact";
import { waLink } from "@/lib/wa";

/**
 * Zone cards on the home page. Each one needs a photograph, so this is a fixed
 * curated list rather than a DB query — a city with no image would render an
 * empty tile in a grid built entirely out of photographs.
 */
const ZONE_CARDS = [
  {
    name: "Asunción",
    slug: "asuncion",
    sub: "Capital — la mayor oferta",
    img: "/img/zona-asuncion.webp",
  },
  {
    name: "San Bernardino",
    slug: "san-bernardino",
    sub: "Lago Ypacaraí, casas de fin de semana",
    img: "/img/zona-san-bernardino.webp",
  },
  {
    name: "Luque",
    slug: "luque",
    sub: "Zona en crecimiento",
    img: "/img/zona-luque.webp",
  },
  {
    name: "Encarnación",
    slug: "encarnacion",
    sub: "Sobre el Paraná, calidad de vida",
    img: "/img/zona-encarnacion.webp",
  },
] as const;

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

export async function generateMetadata(): Promise<Metadata> {
  const brand = await brandName();
  return {
    title: { absolute: `${brand} — ${brandTaglineFor("es")}` },
    description:
      "Casas, departamentos y terrenos en venta y alquiler en todo Paraguay, con cuota estimada y financiamiento.",
    // WhatsApp is how a link gets shared here, and it renders this card. 1200x630
    // is the size every network crops to.
    openGraph: {
      images: [{ url: "/img/og-share.webp", width: 1200, height: 630 }],
    },
  };
}

/** Publish CTA — same WhatsApp/mailto fallback logic as the header button. */
function publishHref(brand: string): string {
  return (
    waLink(CONTACT_WHATSAPP, `Hola, quiero publicar una propiedad en ${brand}.`) ??
    `mailto:${CONTACT_EMAIL}?subject=Quiero%20publicar%20una%20propiedad`
  );
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
  const brand = await brandName();
  const faq = faqHome(brand);
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
      <JsonLd data={[faqJsonLd(faq)]} />

      {/* Hero — full-bleed photograph, text on the gradient (design system
          §"Superposiciones sobre foto"). The search bar sits on the dark panel
          inside the hero rather than below it. */}
      <section className="home-hero">
        <img
          className="home-hero__photo"
          src="/img/hero-home.webp"
          alt=""
          fetchPriority="high"
        />
        <div className="home-hero__scrim" />
        <div className="home-hero__inner ds-container">
          <p className="ds-label">Asunción · Paraguay</p>
          <h1 className="home-hero__title">
            Encontrá tu propiedad en <span>Paraguay</span>
          </h1>
          <p className="home-hero__subtitle">
            Casas, departamentos y terrenos en venta y alquiler — con cuota
            estimada y financiamiento.
          </p>

          <div className="home-hero__actions">
            <Link className="ds-btn ds-btn--primary" href="/venta/asuncion">
              Ver propiedades
            </Link>
            <Link className="ds-btn ds-btn--on-photo" href="/publicar">
              Vender mi propiedad
            </Link>
          </div>

          <div className="home-hero__search">
            <SearchBar cities={cities} />
          </div>

          <div className="home-hero__chips">
            {POPULAR_SEARCHES.map((q) => (
              <Link key={q.href} href={q.href} className="home-hero__chip">
                {q.label}
              </Link>
            ))}
          </div>

          <div className="home-hero__stats">
            <span>
              {total > 0
                ? `${total.toLocaleString("es-PY")} propiedades publicadas`
                : "Propiedades en todo Paraguay"}
            </span>
            <span>Actualizado diariamente</span>
            <a href={publishHref(brand)} target="_blank" rel="noopener noreferrer">
              {es.publishCta}
            </a>
          </div>
        </div>
      </section>

      {/* Zonas — four photographed cards, the design's "tarjeta de zona".
          Cities are matched by name against the DB so a card never links to a
          category page that doesn't exist. */}
      <section className="ds-section ds-container" id="zonas">
        <div className="home-section__head">
          <div>
            <p className="ds-label">Zonas</p>
            <h2>Dónde querés vivir</h2>
          </div>
          <Link className="ds-link-underline" href="/venta/asuncion">
            Ver todas las zonas →
          </Link>
        </div>
        <div className="ds-grid" style={{ ["--ds-track" as string]: "220px" }}>
          {ZONE_CARDS.map((z) => (
            <Link key={z.slug} className="ds-photo-card ds-photo-card--zone" href={`/venta/${z.slug}`}>
              <img
                className="ds-photo-card__img"
                src={z.img}
                alt={z.name}
                loading="lazy"
                decoding="async"
              />
              <div className="ds-photo-card__scrim ds-photo-card__scrim--zone" />
              <div className="ds-photo-card__body">
                <div className="zone-card__name">{z.name}</div>
                <div className="zone-card__sub">{z.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

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

      {/* Editorial pair: the seller pitch on cream, the investor pitch on
          green. Two backgrounds per page is the system's rule, and these are
          the two. */}
      <section className="ds-section ds-container editorial">
        <div className="editorial__media">
          <img
            src="/img/editorial-vender.webp"
            alt="Interior de una casa en Paraguay"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="editorial__body">
          <p className="ds-label">Vender</p>
          <h2>Vendé con quien conoce el mercado</h2>
          <p className="editorial__text">
            Publicá tu propiedad gratis y llegá a compradores de todo Paraguay.
            Te damos un rango de precio estimado con los avisos publicados de tu
            zona, para que sepas dónde parás antes de decidir.
          </p>
          <div className="editorial__actions">
            <Link className="ds-btn ds-btn--secondary" href="/tasacion">
              Solicitar valuación
            </Link>
            <Link className="ds-link-underline" href="/publicar">
              Publicar una propiedad →
            </Link>
          </div>
        </div>
      </section>

      <section className="ds-section ds-section--dark">
        <div className="ds-container editorial editorial--reverse">
          <div className="editorial__media">
            <img
              src="/img/editorial-invertir.webp"
              alt="Asunción al atardecer"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="editorial__body">
            <p className="ds-label">Invertir</p>
            <h2>Invertí en Paraguay con datos, no con corazonadas</h2>
            <p className="editorial__text">
              Publicamos la mediana de precio por m² de cada ciudad, calculada
              sobre los avisos del portal, y la cuota estimada de cada propiedad
              en venta según los programas de financiamiento vigentes.
            </p>
            <div className="editorial__actions">
              <Link className="ds-btn ds-btn--outline-gold" href="/precios">
                Ver precios por zona
              </Link>
              <Link className="ds-link-underline ds-link-underline--dark" href="/financiamiento">
                Cómo funciona el financiamiento →
              </Link>
            </div>
          </div>
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
          <h2 className="home-discover__title">Descubre más en {brand}</h2>
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
              href={publishHref(brand)}
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
            Todo lo que necesitás saber sobre {brand}.
          </p>
          {faq.map((f) => (
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
