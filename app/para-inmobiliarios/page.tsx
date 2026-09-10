import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { dict } from "@/i18n/server";
import { currentVertical } from "@/lib/vertical-context";
import { directoryPagesEnabled } from "@/design/sections";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import { PageHero, Section } from "@/components/MarketingUI";

// Reads the request's host and locale, like every other public route here.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [d, brand, origin] = await Promise.all([
    dict(),
    brandName(),
    siteOrigin(),
  ]);
  const t = d.directory;
  return {
    // The layout template appends " — <brand>"; OG titles do not inherit it,
    // so the brand is spelled out there.
    title: t.proTitle,
    description: t.proText,
    alternates: { canonical: `${origin}/para-inmobiliarios` },
    robots: { index: true, follow: true },
    openGraph: { title: `${t.proTitle} — ${brand}`, description: t.proText },
  };
}

/**
 * The realtor side of the directory door (Stage 1 D item 4): what a
 * professional gets, and the existing `agent_signup` lead form to ask for it.
 *
 * **Not the marketplace's `/para-inmobiliarias`** (plural, and about
 * publishing a portfolio on inmobiliaria.com.py). This is the singular path on
 * the directory door only; every other door redirects it to `/`, the same rule
 * `/vender` and `/servicios` follow — a route that renders on a door whose
 * sitemap, chrome and hreflang all say it does not exist there is a
 * duplicate-content surface nobody links to.
 *
 * D1 ships the structure and the working form. D2
 * (`sonnet-d2-directory-copy.md`) writes the real value-prop copy and the FAQ.
 * No pricing and no plan table: paid placement would reuse `agencies.plan`,
 * and there are no payments in this plan (§3).
 */
export default async function ParaInmobiliariosPage() {
  const [vertical, d, brand, origin] = await Promise.all([
    currentVertical(),
    dict(),
    brandName(),
    siteOrigin(),
  ]);
  if (!directoryPagesEnabled(vertical.key)) redirect("/");

  const t = d.directory;

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: t.chromeNav[0].label, url: "/" },
            { name: t.proTitle, url: "/para-inmobiliarios" },
          ]),
        ]}
      />

      <PageHero kicker={t.proKicker} title={t.proTitle} subtitle={t.proText} />

      <Section width="narrow">
        <ul className="home-pro__list">
          {t.proBullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </Section>

      <Section title={t.formTitle} width="narrow" tone="muted">
        {/* `agent_signup` already exists as a lead type — this is the same
            pipeline /para-inmobiliarias uses, not a second one. The brand is an
            argument, never baked into the component. */}
        <LeadForm
          leadType="agent_signup"
          locale={vertical.locale}
          companyField
          messagePlaceholder={t.formMessagePlaceholder}
          submitLabel={t.teaserEmptyCta}
        />
        <p className="mk-note">{t.footerLegalLine(brand)}</p>
      </Section>
    </main>
  );
}
