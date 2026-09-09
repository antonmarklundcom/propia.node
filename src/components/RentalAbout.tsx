import Link from "next/link";
import type { Dictionary } from "@/i18n";

/**
 * `/nosotros` on the rental doors. The marketplace's own about page is about
 * the portal — its listing counts, its price medians, its publishing model —
 * none of which describes this business, so the route forks in one line and
 * this renders instead.
 *
 * One person is named here, the founder, and only what the old site actually
 * said about him. The three-person "team" the WordPress theme shipped was
 * stock photography with invented names (plan §1 item 13); the counters it
 * displayed ("residencies approved on the first attempt", "nationalities
 * advised") were zero-state placeholders and are gone with it.
 */
export function RentalAbout({ d }: { d: Dictionary }) {
  const t = d.rental;
  const a = t.about;
  return (
    <main className="rental-page">
      <section className="rp-hero">
        <div className="ds-container rp-hero__grid">
          <div>
            <p className="ds-label">{a.h1}</p>
            <h1 className="rp-hero__title">{a.lead}</h1>
            <p className="rp-hero__lead">{a.intro}</p>
          </div>
          <div className="rp-hero__photo-wrap">
            <img
              className="rp-hero__photo"
              src="/img/rental/about.webp"
              alt=""
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="ds-section ds-container">
        <div className="rh-why">
          <div className="rh-why__card">
            <h2 className="rh-why__card-title">{a.founderTitle}</h2>
            <p className="rh-why__card-text">{a.founderText}</p>
          </div>
          <div className="rh-why__card">
            <h2 className="rh-why__card-title">{a.visionTitle}</h2>
            <p className="rh-why__card-text">{a.visionText}</p>
          </div>
          <div className="rh-why__card">
            <h2 className="rh-why__card-title">{a.missionTitle}</h2>
            <p className="rh-why__card-text">{a.missionText}</p>
          </div>
        </div>
      </section>

      <section className="ds-section ds-container">
        <h2 className="home-section__title">{a.valuesTitle}</h2>
        <div className="rh-why">
          {a.values.map((v) => (
            <div key={v.title} className="rh-why__card">
              <h3 className="rh-why__card-title">{v.title}</h3>
              <p className="rh-why__card-text">{v.text}</p>
            </div>
          ))}
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
