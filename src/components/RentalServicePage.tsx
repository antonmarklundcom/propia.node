import Link from "next/link";
import type { Dictionary, Locale } from "@/i18n";
import type { RentalService } from "@/config/rental-services";
import { LeadForm } from "@/components/LeadForm";

/**
 * One service page (`/servicios/<slug>`) — the same component for all seven,
 * rendering the fixed shape in `rentalServices` (plan Appendix C). It knows
 * nothing about which service it is beyond the config row and the copy object
 * it was handed, which is what lets S3 fill six more objects without touching
 * a component.
 *
 * Every section renders only when it has content. That is not defensiveness:
 * O3 ships one service filled and six with a real intro and one entry per
 * section, so the empty ones must be invisible rather than an empty heading.
 *
 * The form is the shared `LeadForm` → `/api/leads`. `leadType` comes from the
 * config (the existing enum — no migration), and `source: "rental:<slug>"` is
 * how `/admin/leads` tells one service's leads from another's, the marker
 * `VenderForm` established.
 */
export function RentalServicePage({
  service,
  d,
  locale,
}: {
  service: RentalService;
  d: Dictionary;
  locale: Locale;
}) {
  const t = d.rental;
  const c = d.rentalServices[service.dictKey];

  return (
    <main className="rental-page">
      <section className="rp-hero">
        <div className="ds-container rp-hero__grid">
          <div>
            <Link className="rp-hero__back" href="/servicios">
              ← {t.allServices}
            </Link>
            <h1 className="rp-hero__title">{c.h1}</h1>
            <p className="rp-hero__lead">{c.tagline}</p>
          </div>
          <div className="rp-hero__photo-wrap">
            <img
              className="rp-hero__photo"
              src={service.image}
              alt=""
              fetchPriority="high"
            />
          </div>
        </div>
      </section>

      <section className="ds-section ds-container rp-intro">
        <p className="rp-intro__text">{c.intro}</p>
      </section>

      {c.challengeText && (
        <section className="ds-section ds-container rp-challenge">
          <h2 className="home-section__title">{c.challengeTitle}</h2>
          <p className="rp-challenge__text">{c.challengeText}</p>
        </section>
      )}

      {c.framework.length > 0 && (
        <section className="rh-process">
          <div className="ds-container">
            <h2 className="rh-process__title">{c.frameworkTitle}</h2>
            <ol className="rh-process__steps">
              {c.framework.map((f, i) => (
                <li key={f.title} className="rh-process__step">
                  <span className="rh-process__num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="rh-process__step-title">{f.title}</h3>
                  <p className="rh-process__step-text">{f.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {c.special.length > 0 && (
        <section className="ds-section ds-container">
          <h2 className="home-section__title">{c.specialTitle}</h2>
          <div className="rh-why">
            {c.special.map((s) => (
              <div key={s.title} className="rh-why__card">
                <h3 className="rh-why__card-title">{s.title}</h3>
                <p className="rh-why__card-text">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {c.benefits.length > 0 && (
        <section className="ds-section ds-container">
          <h2 className="home-section__title">{c.benefitsTitle}</h2>
          <div className="rh-why">
            {c.benefits.map((b) => (
              <div key={b.title} className="rh-why__card">
                <h3 className="rh-why__card-title">{b.title}</h3>
                <p className="rh-why__card-text">{b.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {c.faq.length > 0 && (
        <section className="home-faq">
          <div className="home-faq__inner">
            <h2 className="home-faq__title">{t.faqTitle}</h2>
            {c.faq.map((f) => (
              <details key={f.q} className="home-faq__item">
                <summary className="home-faq__q">{f.q}</summary>
                <p className="home-faq__a">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="ds-section ds-container rp-form" id="contacto">
        <div className="rp-form__copy">
          <h2 className="home-section__title">{c.ctaTitle}</h2>
          <p className="rp-intro__text">{c.ctaText}</p>
        </div>
        <div className="rp-form__form">
          <LeadForm
            leadType={service.leadType}
            locale={locale}
            source={`rental:${service.slug}`}
            submitLabel={c.ctaButton}
            messagePlaceholder={t.serviceFormLead}
          />
        </div>
      </section>
    </main>
  );
}
