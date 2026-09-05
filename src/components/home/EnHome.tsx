import Link from "next/link";
import type { VerticalConfig } from "@/config/verticals";
import type { Dictionary } from "@/i18n";
import type { ListingCard as Card, LocationRow } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { SearchBar } from "@/components/SearchBar";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/jsonld";
import { homeSections } from "@/design/sections";

/**
 * One line-icon per facts-strip cell, in `t.factsStrip` order (Freehold ·
 * USD · closing costs · Public deed). Decorative only (`aria-hidden` at the
 * call site) — the label text already carries the meaning — so these are
 * plain inline SVG rather than a dictionary entry: an icon glyph isn't
 * copy, and this array's length is meant to track `factsStrip`, not widen
 * independently per locale like the i18n rule for actual visitor-facing
 * strings.
 */
const FACTS_ICONS = [
  <svg key="key" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M4 12 12 5l8 7" />
    <path d="M6 10.5V19a1 1 0 0 0 1 1H9.5v-6h5v6h3a1 1 0 0 0 1-1v-8.5" />
  </svg>,
  <svg key="usd" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.5c0-1.4 1.1-2 2.5-2s2.5.7 2.5 2c0 2.5-5 1.5-5 4 0 1.3 1.1 2 2.5 2s2.5-.6 2.5-2" />
  </svg>,
  <svg key="costs" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M4 19h16M7 19V9l5-5 5 5v10" />
  </svg>,
  <svg key="deed" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="4" y="5" width="16" height="14" rx="1" />
    <path d="M8 3v4M16 3v4M4 10h16" />
  </svg>,
];

/**
 * Home page for the "guide-first" layout (docs/style/realestateinparaguay.com.md
 * §6). Selected by `homeLayout(vertical.key) === "guide-en"` in
 * `app/page.tsx` — the one place allowed to fork on a registry return value.
 * This component never reads `vertical.key`; it only reads the sections the
 * caller decided to include (`homeSections`) and the data it was handed.
 *
 * Order: split hero (three-fact strap + search) · facts strip · new this
 * week · why Paraguay · where to buy · how buying works (+ costs table) ·
 * relocation · faq.
 */
export async function EnHome({
  vertical,
  d,
  brand,
  recent,
  cities,
}: {
  vertical: VerticalConfig;
  d: Dictionary;
  brand: string;
  recent: Card[];
  cities: Pick<LocationRow, "id" | "name" | "slug">[];
}) {
  const t = d.guideEn;
  const sections = homeSections(vertical.key);
  // The shared `faqHome()` (src/config/faq.ts) is Spanish-only regardless of
  // locale (it is not locale-aware) and asks general marketplace questions,
  // not the foreign-buyer questions guide §6 "FAQ" wants — so this home uses
  // its own `t.faq` (English, foreign-buyer-specific) rather than the
  // caller's `faq` prop, unlike NordicoHome which reuses the shared one.
  const faq = t.faq;

  return (
    <main className="eh-home">
      {/* app/page.tsx's default template renders this at the top level for
          every other vertical — EnHome renders its own FAQ section (below)
          and must carry the same JSON-LD, or the English door loses its
          FAQPage structured data entirely (same pattern NordicoHome uses). */}
      <JsonLd data={[faqJsonLd([...faq])]} />

      {sections.includes("hero") && (
        <section className="eh-hero">
          <div className="ds-container eh-hero__grid">
            <div className="eh-hero__copy">
              <p className="eh-hero__kicker">
                <span className="eh-hero__kicker-rule" aria-hidden />
                {t.heroKicker}
              </p>
              <h1 className="eh-hero__title">
                {t.heroTitleLead}
                <em className="eh-hero__title-accent">{t.heroTitleAccent}</em>
                {t.heroTitleTail}
              </h1>
              <p className="eh-hero__strap">{t.heroStrap}</p>
              <div className="eh-hero__search">
                <SearchBar cities={cities} locale={vertical.locale} />
              </div>
              <Link className="eh-hero__guide-link" href="/guias/buying-property-in-paraguay">
                {t.heroGuideLink}
              </Link>
            </div>
            <div className="eh-hero__photo-wrap">
              <img
                className="eh-hero__photo"
                src="/img/hero-home.webp"
                alt=""
                fetchPriority="high"
              />
            </div>
          </div>
        </section>
      )}

      {sections.includes("facts-strip") && (
        <section className="eh-facts">
          <div className="ds-container eh-facts__row">
            {t.factsStrip.map((f, i) => (
              <div key={f.label} className="eh-facts__cell">
                <span className="eh-facts__icon" aria-hidden>
                  {FACTS_ICONS[i % FACTS_ICONS.length]}
                </span>
                <div className="eh-facts__numeral">{f.numeral}</div>
                <span className="eh-facts__rule" aria-hidden />
                <div className="eh-facts__label">{f.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.includes("new-this-week") && recent.length > 0 && (
        <section className="ds-section ds-container">
          <div className="home-section__head">
            <h2 className="home-section__title eh-serif-title">{t.newWeekTitle}</h2>
            <Link className="home-section__more" href="/venta/asuncion">
              {t.newWeekMore}
            </Link>
          </div>
          <div className="home-row">
            {recent.slice(0, 8).map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {sections.includes("why-paraguay") && (
        <section className="ds-section ds-container">
          <h2 className="eh-serif-title eh-centered">{t.whyTitle}</h2>
          <div className="eh-why__grid">
            {t.whyCards.map((c) => (
              <div key={c.title} className="eh-why__card">
                <h3 className="eh-why__card-title">{c.title}</h3>
                <p className="eh-why__card-text">{c.text}</p>
                <Link className="eh-why__card-link" href={c.href}>
                  {t.whyReadGuide}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.includes("where-to-buy") && (
        <section className="ds-section ds-container">
          <h2 className="eh-serif-title">{t.whereTitle}</h2>
          <div className="eh-where__grid">
            {t.whereTiles.map((z) => (
              <Link key={z.slug} className="eh-where__tile" href={`/venta/${z.slug}`}>
                <div className="eh-where__name">{z.name}</div>
                <div className="eh-where__why">{z.why}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sections.includes("how-buying-works") && (
        <section className="ds-section ds-container eh-how">
          <h2 className="eh-serif-title">{t.howTitle}</h2>
          <ol className="eh-how__steps">
            {t.howSteps.map((s, i) => (
              <li key={s.title} className="eh-how__step">
                <span className="eh-how__num" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="eh-how__step-title">{s.title}</h3>
                  <p className="eh-how__step-text">{s.text}</p>
                  <p className="eh-how__step-meta">
                    {s.who} · {s.time}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <h3 className="eh-how__costs-title">{t.costsTableTitle}</h3>
          <div className="eh-table-wrap">
            <table className="eh-table">
              <thead>
                <tr>
                  {t.costsTableHead.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.costsRows.map((r) => (
                  <tr key={r.item}>
                    <td>{r.item}</td>
                    <td>{r.who}</td>
                    <td>{r.typical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {sections.includes("relocation") && (
        <section className="ds-section ds-container">
          <h2 className="eh-serif-title">{t.relocationTitle}</h2>
          <div className="eh-relocation__grid">
            {t.relocationCards.map((c) => (
              <Link key={c.title} className="eh-relocation__card" href={c.href}>
                <h3 className="eh-relocation__title">{c.title}</h3>
                <p className="eh-relocation__text">{c.text}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sections.includes("faq") && (
        <section className="home-faq eh-faq">
          <div className="home-faq__inner">
            <h2 className="home-faq__title eh-serif-title">{t.faqTitle}</h2>
            <p className="home-faq__subtitle">{t.faqSubtitle(brand)}</p>
            {faq.map((f) => (
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
