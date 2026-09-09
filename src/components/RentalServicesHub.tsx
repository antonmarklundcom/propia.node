import Link from "next/link";
import type { Dictionary } from "@/i18n";
import { RENTAL_SERVICES } from "@/config/rental-services";

/**
 * `/servicios` on the rental doors — the index of the seven services.
 *
 * Deliberately the same card as the home page's services section rather than a
 * second treatment of the same list: a visitor who arrives here from the nav
 * and one who scrolls the home page are looking at the same seven things, and
 * two layouts for one list is how they drift apart.
 */
export function RentalServicesHub({ d }: { d: Dictionary }) {
  const t = d.rental;
  return (
    <main className="rental-page">
      <section className="rp-hero">
        <div className="ds-container">
          <p className="ds-label">{t.chromeNav[1].label}</p>
          <h1 className="rp-hero__title">{t.servicesTitle}</h1>
          <p className="rp-hero__lead">{t.hubIntro}</p>
        </div>
      </section>

      <section className="ds-section ds-container">
        <div className="rh-services">
          {RENTAL_SERVICES.map((s) => {
            const copy = t.services[s.dictKey];
            return (
              <Link key={s.slug} className="rh-service" href={`/servicios/${s.slug}`}>
                <img
                  className="rh-service__img"
                  src={s.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <h2 className="rh-service__title">{copy.title}</h2>
                <p className="rh-service__text">{copy.tagline}</p>
              </Link>
            );
          })}
        </div>
      </section>

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
    </main>
  );
}
