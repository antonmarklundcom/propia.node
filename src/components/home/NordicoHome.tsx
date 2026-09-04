import Link from "next/link";
import type { VerticalConfig } from "@/config/verticals";
import type { Dictionary } from "@/i18n";
import type { ListingCard as Card, LocationRow } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";
import { homeSections, sellerCtaHref } from "@/design/sections";

/**
 * Home page for the Nórdico layout (docs/style/inmobiliaria.com.py.md §6).
 * Selected by `homeLayout(vertical.key) === "nordico"` in `app/page.tsx` —
 * the one place allowed to fork on a registry return value. This component
 * itself never reads `vertical.key`; it only reads the sections the caller
 * decided to include (`homeSections`) and the data it was handed.
 *
 * Order: hero (split, search under) · proof row · recién publicadas ·
 * sales-process (dark) · buscar por ciudad · por qué vender acá ·
 * para inmobiliarias · faq.
 */
export async function NordicoHome({
  vertical,
  d,
  brand,
  recent,
  cities,
  cityTiles,
  faq,
}: {
  vertical: VerticalConfig;
  d: Dictionary;
  brand: string;
  recent: Card[];
  cities: Pick<LocationRow, "id" | "name" | "slug">[];
  cityTiles: readonly { name: string; slug: string; img: string }[];
  faq: { q: string; a: string }[];
}) {
  const t = d.nordico;
  const sections = homeSections(vertical.key);
  const sellHref = sellerCtaHref(vertical.key);

  return (
    <main className="nordico-home">
      {sections.includes("hero") && (
        <section className="nh-hero">
          <div className="ds-container nh-hero__grid">
            <div className="nh-hero__copy">
              <p className="ds-label">{t.heroKicker}</p>
              <h1 className="nh-hero__title">{t.heroTitle}</h1>
              <p className="nh-hero__subtitle">{t.heroSubtitle}</p>
              <div className="nh-hero__actions">
                <Link className="ds-btn ds-btn--primary" href={sellHref}>
                  {t.heroSell}
                </Link>
                <Link className="ds-btn ds-btn--secondary" href="/venta/asuncion">
                  {t.heroSearch}
                </Link>
              </div>
            </div>
            <div className="nh-hero__photo-wrap">
              <img
                className="nh-hero__photo"
                src="/img/hero-home.webp"
                alt=""
                fetchPriority="high"
              />
              {/* Floating proof card only when there's a true recent sale to
                  quote (guide §5) — omitted rather than filled with a
                  plausible-looking placeholder. */}
            </div>
          </div>
          <div className="ds-container">
            <div className="nh-search">
              <SearchBar cities={cities} locale={vertical.locale} />
            </div>
          </div>
        </section>
      )}

      {sections.includes("proof-row") && (
        <section className="nh-proof">
          <div className="ds-container nh-proof__row">
            {t.proofRow.map((p) => (
              <div key={p.label} className="nh-proof__cell">
                <div className="nh-proof__numeral">{p.numeral}</div>
                <div className="nh-proof__label">{p.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.includes("recientes") && recent.length > 0 && (
        <section className="ds-section ds-container">
          <div className="home-section__head">
            <h2 className="home-section__title">{t.recentTitle}</h2>
            <Link className="home-section__more" href="/venta/asuncion">
              {t.recentMore}
            </Link>
          </div>
          <div className="home-row">
            {recent.map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {sections.includes("proceso-venta") && (
        <section className="ds-section ds-section--dark nh-process">
          <div className="ds-container">
            <h2 className="nh-process__title">{t.processTitle}</h2>
            <div className="nh-process__grid">
              {t.processSteps.map((s, i) => (
                <div key={s.title} className="nh-process__step">
                  <span className="nh-process__num" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="nh-process__step-title">{s.title}</h3>
                  <p className="nh-process__step-text">{s.text}</p>
                </div>
              ))}
            </div>
            <Link className="ds-btn ds-btn--on-photo nh-process__cta" href={sellHref}>
              {t.processCta}
            </Link>
          </div>
        </section>
      )}

      {sections.includes("buscar-ciudad") && (
        <section className="ds-section ds-container">
          <h2 className="home-section__title">{t.citiesTitle}</h2>
          <div className="ds-grid nh-city-grid" style={{ ["--ds-track" as string]: "220px" }}>
            {cityTiles.map((z) => (
              <Link key={z.slug} className="ds-photo-card ds-photo-card--zone nh-city-tile" href={`/venta/${z.slug}`}>
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
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sections.includes("por-que-vender") && (
        <section className="ds-section ds-container">
          <h2 className="home-section__title nh-why__title">{t.whySellTitle}</h2>
          <div className="nh-why__grid">
            {t.whySellCards.map((c) => (
              <div key={c.title} className="nh-why__card">
                <h3 className="nh-why__card-title">{c.title}</h3>
                <p className="nh-why__card-text">{c.text}</p>
              </div>
            ))}
          </div>
          <Link className="ds-btn ds-btn--primary nh-why__cta" href={sellHref}>
            {t.whySellCta}
          </Link>
        </section>
      )}

      {sections.includes("para-inmobiliarias-row") && (
        <section className="ds-container nh-partners">
          <div className="nh-partners__inner">
            <div>
              <h2 className="nh-partners__title">{t.partnersTitle}</h2>
              <p className="nh-partners__text">{t.partnersText}</p>
            </div>
            <Link className="ds-btn ds-btn--secondary" href="/para-inmobiliarias">
              {t.partnersCta}
            </Link>
          </div>
        </section>
      )}

      {sections.includes("faq") && (
        <section className="home-faq">
          <div className="home-faq__inner">
            <h2 className="home-faq__title">{d.home.faqTitle}</h2>
            <p className="home-faq__subtitle">{d.home.faqSubtitle(brand)}</p>
            {faq.map((f) => (
              <details key={f.q} className="home-faq__item">
                <summary className="home-faq__q">{f.q}</summary>
                <p className="home-faq__a">{f.a}</p>
              </details>
            ))}
            <Link className="home-faq__more" href="/preguntas-frecuentes">
              {d.home.faqMore}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
