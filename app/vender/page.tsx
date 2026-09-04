import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { dict } from "@/i18n/server";
import { currentVertical } from "@/lib/vertical-context";
import { sellerLandingEnabled } from "@/design/sections";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { listCities } from "@/lib/queries";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { VenderForm } from "@/components/VenderForm";
import { ProofRow } from "@/components/home/ProofRow";
import { SalesProcessSection } from "@/components/home/SalesProcessSection";
import { Section, FeatureGrid } from "@/components/MarketingUI";

// Reads the live city list; the DB isn't reachable at build time on Hostinger
// (same reason /tasacion and /para-inmobiliarias carry this).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [d, brand, origin] = await Promise.all([
    dict(),
    brandName(),
    siteOrigin(),
  ]);
  const t = d.vender;
  return {
    title: t.metaTitle,
    description: t.metaDescription(brand),
    alternates: { canonical: `${origin}/vender` },
    // Indexable — guide: "Meta: title '...', indexable." No noindex here,
    // unlike a thin category page.
    robots: { index: true, follow: true },
    openGraph: {
      title: `${t.metaTitle} — ${brand}`,
      description: t.metaDescription(brand),
    },
  };
}

/**
 * A small stroke-icon set for "Qué hacemos distinto" (guide §5.3: "each
 * with a small stroke icon"). Inline SVG, `stroke="currentColor"` — the
 * same pattern `SiteHeader`'s brand mark already uses — never emoji.
 */
function VenderIcon({ path }: { path: string }) {
  return (
    <svg
      className="vd-feature__icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

const DIFFERENT_ICON_PATHS = [
  // camera
  "M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  // home styling (sofa-ish / room)
  "M4 20v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6 M4 14V9a2 2 0 0 1 2-2h2v5 M16 14V7h2a2 2 0 0 1 2 2v5 M2 20h20",
  // chart / valuation
  "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  // languages / globe
  "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3 12h18 M12 3c2.4 2.6 3.6 5.7 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.7-3.6-9s1.2-6.4 3.6-9Z",
  // marketing / megaphone
  "M3 11v2a2 2 0 0 0 2 2h1l3 5V4l-3 5H5a2 2 0 0 0-2 2Z M14 9a3 3 0 0 1 0 6 M17 6a7 7 0 0 1 0 12",
  // network
  "M12 3v4 M12 17v4 M4.2 7.8l3.5 2 M16.3 14.2l3.5 2 M4.2 16.2l3.5-2 M16.3 9.8l3.5-2 M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M12 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M4 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M20 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M4 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M20 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
];

export default async function VenderPage() {
  const vertical = await currentVertical();
  if (!sellerLandingEnabled(vertical.key)) {
    // Guide: "Build /vender on the Spanish door only (the English door
    // 404s it or redirects to /)." terreno.com.py gets the same treatment
    // — see sellerLandingEnabled()'s doc comment for why.
    redirect("/");
  }

  const [d, brand, origin, cities] = await Promise.all([
    dict(),
    brandName(),
    siteOrigin(),
    listCities(),
  ]);
  const t = d.vender;
  const cityOptions = cities.map((c) => ({ slug: c.slug, name: c.name }));
  const faq = [...t.faq];

  return (
    <main className="nordico-home vd-page">
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: "Inicio", url: "/" },
            { name: t.metaTitle, url: "/vender" },
          ]),
          faqJsonLd(faq),
        ]}
      />

      {/* 1. Hero: copy left, form right (guide §5.1). */}
      <section className="nh-hero vd-hero">
        <div className="ds-container nh-hero__grid">
          <div className="nh-hero__copy">
            <p className="ds-label">{t.heroKicker}</p>
            <h1 className="nh-hero__title">{t.heroTitle}</h1>
            <ul className="vd-hero__lines">
              {t.heroSubtitleLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="vd-hero__form-wrap">
            <VenderForm cities={cityOptions} idPrefix="vd-hero" />
          </div>
        </div>
      </section>

      {/* 2. Proof row — same component as home (guide §5.2). */}
      <ProofRow rows={d.nordico.proofRow} />

      {/* 3. "Qué hacemos distinto" — six cards, 3x2 grid, stroke icons
          (guide §5.3). */}
      <Section title={t.differentTitle} width="wide">
        <FeatureGrid
          columns={3}
          items={t.differentCards.map((c, i) => ({
            icon: <VenderIcon path={DIFFERENT_ICON_PATHS[i % DIFFERENT_ICON_PATHS.length]} />,
            title: c.title,
            text: c.text,
          }))}
        />
      </Section>

      {/* 4. "Compradores del exterior" — split, placeholder screenshot
          (guide §5.4). */}
      <section className="ds-section ds-container vd-foreign">
        <div className="vd-foreign__grid">
          <div className="vd-foreign__copy">
            <h2 className="home-section__title">{t.foreignTitle}</h2>
            <p className="vd-foreign__text">{t.foreignText}</p>
            <ul className="vd-foreign__points">
              {t.foreignPoints.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          {/* PLACEHOLDER (founder): replace with a real screenshot of
              realestateinparaguay.com on a laptop. Not a fabricated
              screenshot — a marked frame instead. */}
          <div
            className="vd-foreign__mock"
            role="img"
            aria-label={t.foreignImageLabel}
          >
            <div className="vd-foreign__mock-screen">
              <span className="vd-foreign__mock-url">
                realestateinparaguay.com
              </span>
            </div>
            <div className="vd-foreign__mock-base" aria-hidden />
            <p className="vd-foreign__mock-note">
              {t.foreignImagePlaceholderNote}
            </p>
          </div>
        </div>
      </section>

      {/* 5. The dark sales-process band — same component as home (guide
          §5.5). CTA points at the closing form on this page rather than a
          self-link to /vender (see PR description). */}
      <SalesProcessSection
        title={d.nordico.processTitle}
        steps={d.nordico.processSteps}
        ctaLabel={d.nordico.processCta}
        ctaHref="#vd-closing-form"
      />

      {/* 6. "Quién está detrás" (guide §5.6) — photo and licence line are
          placeholders, marked for the founder. */}
      <section className="ds-section ds-container vd-behind">
        <div className="vd-behind__grid">
          {/* PLACEHOLDER (founder): replace with the founder's real photo. */}
          <div
            className="vd-behind__photo"
            role="img"
            aria-label={t.behindPhotoLabel}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden
            >
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 20c1.5-4 4.7-6 8-6s6.5 2 8 6" />
            </svg>
            <p className="vd-behind__photo-note">
              {t.behindPhotoPlaceholderNote}
            </p>
          </div>
          <div className="vd-behind__copy">
            <h2 className="home-section__title">{t.behindTitle}</h2>
            <p className="vd-behind__name">{t.behindName}</p>
            <p className="vd-behind__line">{t.behindRole}</p>
            <p className="vd-behind__line">{t.behindCompany(brand)}</p>
            {/* PLACEHOLDER (founder): confirm licence wording/number before
                launch — see esVender.behindLicense's comment in es.ts. */}
            <p className="vd-behind__line vd-behind__line--license">
              {t.behindLicense}
            </p>
          </div>
        </div>
      </section>

      {/* 7. FAQ for sellers (guide §5.7) — real policy content, adapted
          from src/config/faq.ts and /terminos, not invented. */}
      <Section title={t.faqTitle} width="narrow">
        <div className="mk-faq">
          {faq.map((f) => (
            <details key={f.q} className="mk-faq__item">
              <summary className="mk-faq__q">{f.q}</summary>
              <p className="mk-faq__a">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* 8. Closing CTA, same form (guide §5.8). */}
      <section id="vd-closing-form" className="ds-section ds-container vd-closing">
        <div className="vd-closing__inner">
          <div>
            <h2 className="home-section__title">{t.closingTitle}</h2>
            <p className="vd-closing__text">{t.closingText}</p>
          </div>
          <VenderForm cities={cityOptions} idPrefix="vd-closing" />
        </div>
      </section>
    </main>
  );
}
