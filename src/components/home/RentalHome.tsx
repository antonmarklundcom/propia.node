import Link from "next/link";
import type { VerticalConfig } from "@/config/verticals";
import type { Dictionary } from "@/i18n";
import type { ListingCard as Card } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/jsonld";
import { RENTAL_SERVICES } from "@/config/rental-services";
import { homeSections } from "@/design/sections";

/**
 * Home page for the rental family — alquiler.com.py and rentparaguay.com
 * (docs/style/rentparaguay.com.md §home). Selected by
 * `homeLayout(vertical.key) === "rental"` in `app/page.tsx`, the one place
 * allowed to fork on a registry return value.
 *
 * One component for both doors: they are one business, and the only thing that
 * differs between them is the dictionary the caller resolved from the request's
 * locale. It never reads `vertical.key` — only the section list the registry
 * decided and the data it was handed.
 *
 * Order: split hero · the seven services · why us · how it works · the door's
 * own rentals · faq · closing CTA. The rail renders **nothing** while this
 * door has no rental rows (the table has essentially none today) — an empty
 * section on a home page does not read as "coming soon", it reads as broken.
 * The FAQ (the same five Q&As `RentalServicesHub` shows) is real as of S2.
 *
 * No search bar. The marketplace's hero sells a search over 15k rows; this
 * door sells a conversation with a person, so the hero's two buttons are
 * "contact us" and "see the services", and the rail below is the inventory.
 */
export function RentalHome({
  vertical,
  d,
  recent,
}: {
  vertical: VerticalConfig;
  d: Dictionary;
  recent: Card[];
}) {
  const t = d.rental;
  const sections = homeSections(vertical.key);

  return (
    <main className="rental-home">
      {/* FAQPage structured data only when there are real questions to
          describe — the marketplace's own FAQ (faqHome) is about buying and
          publishing on the portal, so this door must not carry it. */}
      {t.faq.length > 0 && <JsonLd data={[faqJsonLd([...t.faq])]} />}
      {sections.includes("hero") && (
        <section className="rh-hero">
          <div className="ds-container rh-hero__grid">
            <div className="rh-hero__copy">
              <p className="ds-label">{t.heroKicker}</p>
              <h1 className="rh-hero__title">{t.heroTitle}</h1>
              <p className="rh-hero__subtitle">{t.heroSubtitle}</p>
              <div className="rh-hero__actions">
                <Link className="ds-btn ds-btn--primary" href={t.chromeCtaHref}>
                  {t.heroPrimary}
                </Link>
                <Link className="ds-btn ds-btn--secondary" href="/servicios">
                  {t.heroSecondary}
                </Link>
              </div>
            </div>
            <div className="rh-hero__photo-wrap">
              <img
                className="rh-hero__photo"
                src="/img/rental/hero-home.webp"
                alt=""
                fetchPriority="high"
              />
            </div>
          </div>
        </section>
      )}

      {sections.includes("servicios") && (
        <section className="ds-section ds-container">
          <div className="home-section__head">
            <div>
              <h2 className="home-section__title">{t.servicesTitle}</h2>
              <p className="rh-section__lead">{t.servicesLead}</p>
            </div>
            <Link className="home-section__more" href="/servicios">
              {t.servicesMore}
            </Link>
          </div>
          <div className="rh-services">
            {RENTAL_SERVICES.map((s) => {
              const copy = t.services[s.dictKey];
              return (
                <Link
                  key={s.slug}
                  className="rh-service"
                  href={`/servicios/${s.slug}`}
                >
                  <img
                    className="rh-service__img"
                    src={s.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <h3 className="rh-service__title">{copy.title}</h3>
                  <p className="rh-service__text">{copy.tagline}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {sections.includes("por-que") && (
        <section className="ds-section ds-container">
          <h2 className="home-section__title">{t.whyTitle}</h2>
          <p className="rh-section__lead">{t.whyLead}</p>
          <div className="rh-why">
            {t.whyCards.map((c) => (
              <div key={c.title} className="rh-why__card">
                <h3 className="rh-why__card-title">{c.title}</h3>
                <p className="rh-why__card-text">{c.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.includes("proceso") && (
        <section className="rh-process">
          <div className="ds-container">
            <h2 className="rh-process__title">{t.processTitle}</h2>
            <p className="rh-process__lead">{t.processLead}</p>
            <ol className="rh-process__steps">
              {t.processSteps.map((s) => (
                <li key={s.step} className="rh-process__step">
                  <span className="rh-process__num">{s.step}</span>
                  <h3 className="rh-process__step-title">{s.title}</h3>
                  <p className="rh-process__step-text">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* The door's own inventory. Nothing renders while it is empty — see the
          component note above. */}
      {sections.includes("recientes") && recent.length > 0 && (
        <section className="ds-section ds-container">
          <div className="home-section__head">
            <h2 className="home-section__title">{t.recentTitle}</h2>
            <Link className="home-section__more" href="/alquiler">
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

      {/* The JSON-LD above is gated on the same array, so the markup and the
          structured data can never disagree. */}
      {sections.includes("faq") && t.faq.length > 0 && (
        <section className="home-faq">
          <div className="home-faq__inner">
            <h2 className="home-faq__title">{t.faqTitle}</h2>
            <p className="home-faq__subtitle">{t.faqLead}</p>
            {t.faq.map((f) => (
              <details key={f.q} className="home-faq__item">
                <summary className="home-faq__q">{f.q}</summary>
                <p className="home-faq__a">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {sections.includes("cta") && (
        <section className="rh-cta">
          <div className="ds-container rh-cta__inner">
            <div>
              <h2 className="rh-cta__title">{t.ctaTitle}</h2>
              <p className="rh-cta__text">{t.ctaText}</p>
            </div>
            <Link className="ds-btn ds-btn--primary" href={t.chromeCtaHref}>
              {t.ctaButton}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
