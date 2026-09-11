import Link from "next/link";
import type { ReactNode } from "react";
import type { VerticalConfig } from "@/config/verticals";
import type { Dictionary, Locale } from "@/i18n";
import { numberLocaleFor } from "@/i18n";
import type { ListingCard as Card, LocationRow } from "@/lib/queries";
import { ListingCard } from "@/components/ListingCard";
import { Picture } from "@/components/Picture";
import { SearchBar } from "@/components/SearchBar";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/jsonld";
import { homeSections, sellerCtaHref } from "@/design/sections";
import { categoryUrl } from "@/lib/urls";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/config/contact";
import { waLink } from "@/lib/wa";

/**
 * "Premium Editorial" home — the one shell both marketplace doors render
 * (`inmobiliaria.com.py` in Spanish, `realestateinparaguay.com` in English)
 * since 2026-09-11, replacing NordicoHome and EnHome.
 * Spec: `docs/prompts/premium-editorial.md`.
 *
 * Selected by `homeLayout(vertical.key) === "premium"` in `app/page.tsx` — the
 * one place allowed to fork on a registry return value. This component itself
 * **never reads `vertical.key`**: it reads the section list the registry
 * decided (`homeSections`), `vertical.locale`, and the data it was handed. The
 * two doors differ only in their dictionary and in which pages exist in their
 * language; nothing here is a per-domain conditional.
 *
 * Order (`homeSections`): hero · destacadas · tipos · nosotros · servicios ·
 * zonas · como-funciona · faq-contacto.
 *
 * Two things it deliberately does not do:
 *  - **No testimonials.** The reference design has a review wall; this portal
 *    has no reviews and inventing them is not on the table
 *    (`docs/decisions-needed.md`). "Cómo funciona" takes that slot instead.
 *  - **No contact channel without something behind it.** The WhatsApp button,
 *    the contact row and the floating bubble all render only when
 *    `waLink(CONTACT_WHATSAPP)` is non-null, and the email row only when
 *    `CONTACT_EMAIL` is — which it is not today, on purpose (CLAUDE.md:
 *    "there is no portal email"). A label that promises WhatsApp must never
 *    quietly become something else.
 */

/** `"a\nb"` → `a<br />b`. Used by the trust row and the about headline. */
function lines(text: string): ReactNode[] {
  return text.split("\n").flatMap((part, i) =>
    i === 0 ? [part] : [<br key={i} />, part],
  );
}

/* -- Icons ---------------------------------------------------------------- */
/* Inline SVG rather than an icon font or a sprite: there are twelve of them,
   they are one stroke weight, and they inherit `currentColor` from the CSS so
   the trust row can be gold on the photo and the type row ink-green on cream
   without two copies of each path. */

const TRUST_ICONS: Record<string, ReactNode> = {
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),
  "check-square": (
    <>
      <rect x="3" y="3" width="18" height="18" />
      <path d="M7.5 12.5l3 3 6-6.5" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 20c0-3.7 2.9-5.8 6.5-5.8s6.5 2.1 6.5 5.8" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M17.5 14.6c2.5.6 4 2.5 4 5.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.8V12l3.6 2.2" />
    </>
  ),
};

const TYPE_ICONS: Record<string, ReactNode> = {
  casas: (
    <>
      <path d="M3 11.5L12 4.5l9 7" />
      <path d="M5.5 10.6V20h13v-9.4" />
      <path d="M10 20v-5.2h4V20" />
    </>
  ),
  departamentos: (
    <>
      <path d="M4 20V4h10v16" />
      <path d="M14 20V9h6v11" />
      <path d="M7 7.5h1.5M10.5 7.5H12M7 11h1.5M10.5 11H12M7 14.5h1.5M10.5 14.5H12M16.5 12.5H18M16.5 16H18" />
    </>
  ),
  terrenos: (
    <>
      <path d="M3 6.5h18v11H3z" />
      <path d="M3 17.5L21 6.5" />
    </>
  ),
  alquileres: (
    <>
      <circle cx="8" cy="12" r="4.2" />
      <path d="M12.2 12H21" />
      <path d="M17.5 12v3.4M20.2 12v2.4" />
    </>
  ),
  comercial: (
    <>
      <path d="M3.8 9.5h16.4V20H3.8z" />
      <path d="M3 9.5L4.8 4.5h14.4L21 9.5" />
      <path d="M3 9.5c0 1.7 1.3 2.6 2.6 2.6S8.2 11.2 8.2 9.5c0 1.7 1.3 2.6 2.6 2.6s2.6-.9 2.6-2.6c0 1.7 1.3 2.6 2.6 2.6s2.6-.9 2.6-2.6" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  proyectos: (
    <>
      <path d="M6 21V5h9v16" />
      <path d="M15 9h4v12" />
      <path d="M4 5h13" />
      <path d="M9 8.5h3M9 12h3M9 15.5h3" />
    </>
  ),
};

const SERVICE_ICONS: Record<string, ReactNode> = {
  buscar: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.4 15.4L21 21" />
    </>
  ),
  vender: (
    <>
      <path d="M3 10.5L12 3.5l9 7" />
      <path d="M5.5 9.6V20h13V9.6" />
      <path d="M12 16.5v-4.8M9.8 13.6L12 11.4l2.2 2.2" />
    </>
  ),
  tasacion: (
    <>
      <path d="M3 15.5L15.5 3 21 8.5 8.5 21z" />
      <path d="M7.5 11l2 2M11 7.5l2 2M14.5 4l2 2" />
    </>
  ),
  financiamiento: (
    <>
      <path d="M3 9.5L12 4l9 5.5" />
      <path d="M5 9.5V19M9.7 9.5V19M14.3 9.5V19M19 9.5V19" />
      <path d="M3 21h18" />
    </>
  ),
  precios: (
    <>
      <path d="M3 21h18" />
      <path d="M5.5 21V13M10.5 21V8.5M15.5 21v-6M20.5 21V4.5" />
    </>
  ),
};

function LineIcon({
  glyph,
  size,
  className,
}: {
  glyph: ReactNode;
  size: number;
  className: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {glyph}
    </svg>
  );
}

function WhatsappGlyph() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.83c2.16 0 4.19.84 5.72 2.37a8.03 8.03 0 0 1 2.37 5.71c0 4.46-3.63 8.08-8.09 8.08a8.2 8.2 0 0 1-4.13-1.13l-.3-.18-3.11.82.83-3.04-.19-.31a8.02 8.02 0 0 1-1.24-4.29c0-4.45 3.63-8.03 8.14-8.03Zm-3.4 4.02c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03 0 1.2.87 2.35.99 2.52.12.16 1.69 2.7 4.19 3.68 2.08.82 2.5.66 2.95.61.45-.04 1.45-.59 1.66-1.17.2-.57.2-1.06.14-1.17-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.72-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.77.96-.14.16-.28.18-.52.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.35-1.69-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.33-.76-1.82-.19-.43-.38-.4-.53-.41h-.45Z" />
    </svg>
  );
}

/* -- Structure ------------------------------------------------------------ */
/* Which type tiles exist and which icon each draws is structure, not copy —
   the labels come from `d.premium.types[key]`. Same rule as the zone tiles,
   whose names, slugs and photographs live in `app/page.tsx`. */
const TYPE_TILES = [
  { key: "casas", href: categoryUrl({ operation: "venta", citySlug: "asuncion", type: "casa" }) },
  { key: "departamentos", href: categoryUrl({ operation: "venta", citySlug: "asuncion", type: "departamento" }) },
  { key: "terrenos", href: categoryUrl({ operation: "venta", citySlug: "asuncion", type: "terreno" }) },
  { key: "alquileres", href: categoryUrl({ operation: "alquiler", citySlug: "asuncion" }) },
  { key: "comercial", href: categoryUrl({ operation: "venta", citySlug: "asuncion", type: "comercial" }) },
  { key: "proyectos", href: "/proyectos" },
] as const;

export interface PremiumZoneTile {
  name: string;
  slug: string;
  /** webimg slug under `public/img/premium/`, not a path — see Picture.tsx. */
  img: string;
}

export function PremiumHome({
  vertical,
  d,
  brand,
  recent,
  cities,
  zoneTiles,
  faq,
  total,
}: {
  vertical: VerticalConfig;
  d: Dictionary;
  brand: string;
  recent: Card[];
  cities: Pick<LocationRow, "id" | "name" | "slug">[];
  zoneTiles: readonly PremiumZoneTile[];
  faq: { q: string; a: string }[];
  total: number;
}) {
  const t = d.premium;
  const sections = homeSections(vertical.key);
  const locale: Locale = vertical.locale;
  const numberLocale = numberLocaleFor(locale);
  const sellHref = sellerCtaHref(vertical.key);
  const heroWaHref = waLink(CONTACT_WHATSAPP, t.waPrefill(brand));
  const contactWaHref = waLink(CONTACT_WHATSAPP);
  const alt = (slug: string) => t.imgAlt[slug] ?? "";
  // Only the Spanish door has /preguntas-frecuentes; the English door's FAQ
  // lives on the home page and nowhere else, so it gets no "see all" link
  // rather than a link into a 404.
  const faqMoreHref = locale === "es" ? "/preguntas-frecuentes" : null;
  const zones = zoneTiles.filter((z) => cities.some((c) => c.slug === z.slug));

  return (
    <main className="premium-home">
      {/* The default template renders this at the top level for every other
          door; a dedicated home component has to carry its own, or the door
          loses its FAQPage structured data entirely. */}
      <JsonLd data={[faqJsonLd(faq)]} />

      {sections.includes("hero") && (
        <section className="ph-hero">
          <Picture
            slug="casa-premium-asuncion-atardecer"
            alt=""
            className="ph-hero__photo"
            priority
          />
          <div className="ph-hero__scrim" />
          <div className="ds-container ph-hero__inner">
            <div className="ph-hero__copy">
              <p className="ds-label">{t.heroKicker}</p>
              <h1 className="ph-hero__title">
                {t.heroTitleLead}
                <span className="ph-hero__gold">{t.heroTitleHighlight}</span>
                {t.heroTitleTail}
              </h1>
              <p className="ph-hero__subtitle">{t.heroSubtitle}</p>
              <div className="ph-hero__actions">
                <Link className="ds-btn ds-btn--primary" href="/venta/asuncion">
                  {t.heroBrowse}
                </Link>
                {heroWaHref ? (
                  <a
                    className="ds-btn ds-btn--on-photo"
                    href={heroWaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsappGlyph />
                    {t.heroWhatsapp}
                  </a>
                ) : (
                  <Link className="ds-btn ds-btn--on-photo" href={sellHref}>
                    {d.common.publishCta}
                  </Link>
                )}
              </div>
              <ul className="ph-hero__trust">
                {t.trust.map((item) => (
                  <li key={item.icon} className="ph-hero__trust-item">
                    <LineIcon
                      glyph={TRUST_ICONS[item.icon]}
                      size={22}
                      className="ph-hero__trust-icon"
                    />
                    <span className="ph-hero__trust-label">
                      {lines(item.label)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="ds-container ph-hero__search-wrap">
            <div className="ph-hero__search">
              <p className="ds-label ph-hero__search-title">{t.searchTitle}</p>
              <SearchBar cities={cities} locale={locale} />
              <p className="ph-hero__stat">
                {total > 0
                  ? d.home.heroStatCount(total.toLocaleString(numberLocale))
                  : d.home.heroStatCountEmpty}
              </p>
            </div>
          </div>
        </section>
      )}

      {sections.includes("destacadas") && recent.length > 0 && (
        <section className="ds-section ds-container">
          <div className="home-section__head">
            <h2 className="ph-h2">{t.featuredTitle}</h2>
            <Link className="ds-link-underline" href="/venta/asuncion">
              {t.featuredMore}
            </Link>
          </div>
          <div className="ph-grid-4">
            {recent.slice(0, 8).map((card) => (
              <ListingCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {sections.includes("tipos") && (
        <section className="ds-section ds-container">
          <h2 className="ph-h2 ph-h2--centered">{t.typesTitle}</h2>
          <div className="ph-types">
            {TYPE_TILES.map((tile) => (
              <Link key={tile.key} className="ph-types__item" href={tile.href}>
                <LineIcon
                  glyph={TYPE_ICONS[tile.key]}
                  size={30}
                  className="ph-types__icon"
                />
                <span className="ph-types__label">{t.types[tile.key]}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sections.includes("nosotros") && (
        <section className="ph-about">
          <div className="ph-about__grid">
            <div className="ph-about__copy">
              <p className="ds-label">{t.aboutKicker(brand)}</p>
              <h2 className="ph-about__title">{lines(t.aboutTitle)}</h2>
              <p className="ph-about__text">{t.aboutText(brand)}</p>
              <Link className="ds-btn ds-btn--secondary" href={t.aboutHref}>
                {t.aboutCta}
              </Link>
            </div>
            <div className="ph-about__media">
              <Picture
                slug="living-moderno-vista-rio-asuncion"
                alt={alt("living-moderno-vista-rio-asuncion")}
                className="ph-about__photo"
                sizes="(max-width: 900px) 100vw, 55vw"
              />
            </div>
          </div>
        </section>
      )}

      {sections.includes("servicios") && (
        <section className="ds-section ds-container">
          <h2 className="ph-h2 ph-h2--centered">{t.servicesTitle}</h2>
          <div className="ph-services">
            {t.services.map((s) => (
              <Link
                key={s.key}
                className="ph-services__item"
                // The seller lane is the one href the dictionary cannot spell:
                // it is `/vender` on the Spanish door and `/publicar`
                // everywhere else, and that is a registry answer, not copy.
                href={s.key === "vender" ? sellHref : s.href}
              >
                <LineIcon
                  glyph={SERVICE_ICONS[s.key]}
                  size={30}
                  className="ph-services__icon"
                />
                <span className="ph-services__body">
                  <span className="ph-services__title">{s.title}</span>
                  <span className="ph-services__text">{s.text}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sections.includes("zonas") && zones.length > 0 && (
        <section className="ds-section ds-container" id="zonas">
          <div className="home-section__head">
            <h2 className="ph-h2">{t.zonesTitle}</h2>
            <Link className="ds-link-underline" href="/venta/asuncion">
              {t.zonesMore}
            </Link>
          </div>
          <div className="ph-zones">
            {zones.map((z) => (
              <Link
                key={z.slug}
                className="ds-photo-card ds-photo-card--zone ph-zones__tile"
                href={`/venta/${z.slug}`}
              >
                <Picture
                  slug={z.img}
                  alt={alt(z.img)}
                  className="ds-photo-card__img"
                  sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 17vw"
                />
                <div className="ds-photo-card__scrim ds-photo-card__scrim--zone" />
                <div className="ds-photo-card__body">
                  <div className="zone-card__name">{z.name}</div>
                  <div className="zone-card__sub">{t.zoneSub}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sections.includes("como-funciona") && (
        <section className="ds-section ds-section--dark ph-how">
          <div className="ds-container">
            <h2 className="ph-h2 ph-h2--centered ph-h2--on-dark">
              {t.howTitle}
            </h2>
            <div className="ph-how__grid">
              {d.home.howSteps.map((s, i) => (
                <div key={s.title} className="ph-how__step">
                  <span className="ph-how__num" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="ph-how__step-title">{s.title}</h3>
                  <p className="ph-how__step-text">{s.text}</p>
                </div>
              ))}
            </div>
            <div className="ph-how__more">
              <Link
                className="ds-link-underline ds-link-underline--dark"
                href="/como-funciona"
              >
                {d.home.howMore}
              </Link>
            </div>
          </div>
        </section>
      )}

      {sections.includes("faq-contacto") && (
        <section className="ds-section ds-container">
          <div className="ph-faqcontact">
            <div className="ph-faq">
              <h2 className="ph-h2">{d.home.faqTitle}</h2>
              {faq.map((f) => (
                <details key={f.q} className="home-faq__item">
                  <summary className="home-faq__q">{f.q}</summary>
                  <p className="home-faq__a">{f.a}</p>
                </details>
              ))}
              {faqMoreHref && (
                <Link className="home-faq__more" href={faqMoreHref}>
                  {d.home.faqMore}
                </Link>
              )}
            </div>
            <aside className="ph-contact">
              <h2 className="ph-h2 ph-h2--small">{t.contactTitle}</h2>
              {contactWaHref && (
                <a
                  className="ph-contact__row"
                  href={contactWaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsappGlyph />
                  <span>
                    <span className="ph-contact__label">
                      {t.contactWhatsapp}
                    </span>
                    <span className="ph-contact__value">
                      {CONTACT_WHATSAPP}
                    </span>
                  </span>
                </a>
              )}
              {/* Null today, on purpose (CLAUDE.md): never a placeholder. */}
              {CONTACT_EMAIL && (
                <a className="ph-contact__row" href={`mailto:${CONTACT_EMAIL}`}>
                  <span className="ph-contact__value">{CONTACT_EMAIL}</span>
                </a>
              )}
              <div className="ph-contact__row ph-contact__row--static">
                <LineIcon
                  glyph={
                    <>
                      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
                      <circle cx="12" cy="10" r="2.6" />
                    </>
                  }
                  size={18}
                  className="ph-contact__icon"
                />
                <span className="ph-contact__value">{t.contactLocation}</span>
              </div>
              {contactWaHref ? (
                <a
                  className="ds-btn ds-btn--primary ph-contact__cta"
                  href={contactWaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.contactWhatsapp}
                </a>
              ) : (
                <Link
                  className="ds-btn ds-btn--primary ph-contact__cta"
                  href={t.contactHref}
                >
                  {t.contactFormCta}
                </Link>
              )}
            </aside>
          </div>
        </section>
      )}

      {/* Floating WhatsApp bubble — only with a real number behind it. */}
      {contactWaHref && (
        <a
          className="ph-wa-float"
          href={contactWaHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.contactWhatsapp}
        >
          <WhatsappGlyph />
        </a>
      )}
    </main>
  );
}
