import Link from "next/link";
import type { VerticalConfig } from "@/config/verticals";
import type { Dictionary } from "@/i18n";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/jsonld";
import { homeSections } from "@/design/sections";
import { DirectoryLeadForm } from "@/components/DirectoryLeadForm";
import { agentUrl } from "@/lib/urls";
import { safeImageUrl } from "@/lib/external-image";
import type { AgentDirectoryRow } from "@/lib/directory-queries";

/**
 * Home page for the directory door — inmobiliarios.com.py
 * (fable-plan-realtor-terreno-rental.md Stage 1 D item 1). Selected by
 * `homeLayout(vertical.key) === "directory"` in `app/page.tsx`, the one place
 * allowed to fork on a registry return value.
 *
 * It is a **seller-first landing page**, not a marketplace home: no search bar,
 * no listing grid, no `/publicar` CTA, no login. The form is the product — the
 * visitor is an owner who has decided to sell or rent out and wants a
 * professional, and every section below the hero exists to make sending that
 * form reasonable.
 *
 * The one rule worth restating: **the teaser never pads**. With fewer than
 * `MIN_TEASER_AGENTS` verified professionals it renders the "sé de los
 * primeros" band instead of filler cards (§1 item 7). A directory whose cards
 * are placeholders is the exact failure of the site this door replaces, and it
 * is invisible in a screenshot — which is why it is a constant here rather than
 * a judgement call at render time.
 */
const MIN_TEASER_AGENTS = 3;

export function DirectoryHome({
  vertical,
  d,
  cities,
  agents,
}: {
  vertical: VerticalConfig;
  d: Dictionary;
  cities: { slug: string; name: string }[];
  /** Verified professionals with live inventory. Real rows only. */
  agents: AgentDirectoryRow[];
}) {
  const t = d.directory;
  const sections = homeSections(vertical.key);
  const teaser = agents.slice(0, 6);
  const showTeaser = teaser.length >= MIN_TEASER_AGENTS;

  return (
    <main className="directory-home">
      {t.faq.length > 0 && <JsonLd data={[faqJsonLd([...t.faq])]} />}

      {sections.includes("hero") && (
        <section className="nh-hero vd-hero" id="form">
          <div className="ds-container nh-hero__grid">
            <div className="nh-hero__copy">
              <p className="ds-label">{t.heroKicker}</p>
              <h1 className="nh-hero__title">{t.heroTitle}</h1>
              <p className="rh-hero__subtitle">{t.heroSubtitle}</p>
              <ul className="vd-hero__lines">
                {t.heroPoints.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="vd-hero__form-wrap">
              <h2 className="home-section__title">{t.formTitle}</h2>
              <DirectoryLeadForm
                cities={cities}
                idPrefix="dir-hero"
                locale={vertical.locale}
              />
            </div>
          </div>
        </section>
      )}

      {sections.includes("como-funciona") && (
        <section className="home-how">
          <div className="home-how__inner">
            <h2 className="home-how__title">{t.howTitle}</h2>
            <div className="home-how__grid">
              {t.howSteps.map((s, i) => (
                <div key={s.title} className="home-how__step">
                  <span className="home-how__num" aria-hidden>
                    {i + 1}
                  </span>
                  <h3 className="home-how__step-title">{s.title}</h3>
                  <p className="home-how__step-text">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {sections.includes("como-elegimos") && (
        <section className="ds-section ds-container">
          <div className="home-section__head">
            <div>
              <h2 className="home-section__title">{t.chooseTitle}</h2>
              <p className="home-projects__subtitle">{t.chooseSubtitle}</p>
            </div>
          </div>
          <div className="home-values__inner">
            {t.choosePoints.map((p) => (
              <div key={p.title} className="home-values__item">
                <div>
                  <div className="home-values__title">{p.title}</div>
                  <div className="home-values__text">{p.text}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.includes("directorio-teaser") && (
        <section className="ds-section ds-container" id="directorio">
          {showTeaser ? (
            <>
              <div className="home-section__head">
                <div>
                  <h2 className="home-section__title">{t.teaserTitle}</h2>
                  <p className="home-projects__subtitle">{t.teaserSubtitle}</p>
                </div>
                <Link className="ds-link-underline" href="/agentes">
                  {t.teaserAllLink}
                </Link>
              </div>
              <div className="mk-agency-grid">
                {teaser.map((a) => (
                  <Link
                    key={a.id}
                    className="mk-agency"
                    href={agentUrl(a.slug)}
                  >
                    <div className="mk-agency__head">
                      {safeImageUrl(a.photoUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="mk-agency__logo mk-agency__logo--round"
                          src={safeImageUrl(a.photoUrl) ?? undefined}
                          referrerPolicy="no-referrer"
                          alt={a.name}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div
                          className="mk-agency__logo mk-agency__logo--fallback mk-agency__logo--round"
                          aria-hidden
                        >
                          {a.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="mk-agency__name">{a.name}</div>
                        <div className="mk-agency__cities">
                          {a.agencyName ?? ""}
                        </div>
                      </div>
                    </div>
                    {a.cities.length > 0 && (
                      <div className="mk-chips">
                        {a.cities.map((c) => (
                          <span key={c} className="mk-chip">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            /* Fewer than MIN_TEASER_AGENTS verified professionals: the band
               says so plainly and recruits, rather than showing cards that
               stand for nobody. */
            <div className="mk-empty">
              <h2 className="home-section__title">{t.teaserEmptyTitle}</h2>
              <p>{t.teaserEmptyText}</p>
              <Link className="mk-btn mk-btn--accent" href="/para-inmobiliarios">
                {t.teaserEmptyCta}
              </Link>
            </div>
          )}
        </section>
      )}

      {sections.includes("profesional") && (
        <section className="home-pro">
          <div className="home-pro__inner">
            <div className="home-pro__copy">
              <div className="home-pro__kicker">{t.proKicker}</div>
              <h2 className="home-pro__title">{t.proTitle}</h2>
              <p className="home-pro__text">{t.proText}</p>
              <ul className="home-pro__list">
                {t.proBullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div className="home-pro__actions">
                <Link className="home-pro__button" href="/para-inmobiliarios">
                  {t.proCta}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {sections.includes("faq") && t.faq.length > 0 && (
        <section className="home-faq">
          <div className="home-faq__inner">
            <h2 className="home-faq__title">{t.faqTitle}</h2>
            {t.faq.map((f) => (
              <details key={f.q} className="home-faq__item">
                <summary className="home-faq__q">{f.q}</summary>
                <p className="home-faq__a">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
