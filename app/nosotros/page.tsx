import { numberLocaleFor } from "@/i18n";
import type { Dictionary } from "@/i18n";
import type { Metadata } from "next";
import { brandName } from "@/lib/brand-server";
import { dict, currentLocale } from "@/i18n/server";
import { currentVertical } from "@/lib/vertical-context";
import { rentalPagesEnabled } from "@/design/sections";
import {
  rentalAboutMetadata,
  redirectRentalToEnglish,
} from "@/lib/rental-routes";
import { RentalAbout } from "@/components/RentalAbout";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { getPortalStats } from "@/lib/directory-queries";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/config/contact";
import {
  CtaBand,
  FeatureGrid,
  PageHero,
  Prose,
  Section,
  StatRow,
} from "@/components/MarketingUI";

export const dynamic = "force-dynamic";


export async function generateMetadata(): Promise<Metadata> {
  const c = (await dict()).aboutPage;
  const [brand, vertical, d, origin] = await Promise.all([
    brandName(),
    currentVertical(),
    dict(),
    siteOrigin(),
  ]);
  // The rental doors describe a services firm, not the portal — one fork, in
  // the page that already resolves the vertical (same rule as app/page.tsx).
  // The metadata itself is shared with `/about`, the English door's URL for
  // the same page (R2), so the two cannot disagree about the canonical.
  if (rentalPagesEnabled(vertical.key)) return rentalAboutMetadata();
  return {
    title: `${c.title}`,
    description: c.description(brand),
    alternates: { canonical: `${origin}/nosotros` },
    openGraph: { title: `${c.title} — ${brand}`, description: c.description(brand) },
  };
}

const principles = (c: Dictionary["aboutPage"]) => [
  {
    icon: "search",
    title: c.principleInformation,
    text: c.principleInformationBody,
  },
  {
    icon: "handshake",
    title: c.principleDirect,
    text: c.principleDirectBody,
  },
  {
    icon: "pin",
    title: c.principleLocal,
    text: c.principleLocalBody,
  },
  {
    icon: "area",
    title: c.principleNumbers,
    text: c.principleNumbersBody,
  },
];

export default async function NosotrosPage() {
  const numberLocale = numberLocaleFor(await currentLocale());
  const c = (await dict()).aboutPage;
  const vertical = await currentVertical();
  // The English rental door publishes this page at /about (R2); this URL is
  // the Spanish one. Marketplace doors — realestateinparaguay.com included —
  // are untouched: /nosotros is their own page in their own language.
  redirectRentalToEnglish(vertical, "about");
  if (rentalPagesEnabled(vertical.key)) {
    // Before getPortalStats(): the rental doors have no use for the portal's
    // listing counts, and a page that redirects its own content should not
    // pay for the query first.
    return <RentalAbout d={await dict()} />;
  }
  const brand = await brandName();
  const [origin, stats] = await Promise.all([siteOrigin(), getPortalStats()]);
  const whatsapp = CONTACT_WHATSAPP;

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: c.home, url: "/" },
            { name: c.title, url: "/nosotros" },
          ]),
          organizationJsonLd(origin, {
            name: brand,
            whatsapp,
            email: CONTACT_EMAIL ?? undefined,
          }),
        ]}
      />

      <PageHero
        tone="dark"
        kicker={c.kicker}
        title={c.heading}
        subtitle={c.intro(brand)}
      />

      {stats.listings > 0 && (
        <Section>
          <StatRow
            stats={[
              {
                value: stats.listings.toLocaleString(numberLocale),
                icon: "home",
                label: c.listings,
              },
              {
                value: stats.cities.toLocaleString(numberLocale),
                icon: "pin",
                label: c.cities,
              },
              {
                value: stats.agencies.toLocaleString(numberLocale),
                icon: "building",
                label: c.agencies,
              },
              {
                value: stats.projects.toLocaleString(numberLocale),
                icon: "key",
                label: c.projects,
              },
            ]}
          />
        </Section>
      )}

      <Section title={c.principlesHeading} tone="muted">
        <FeatureGrid items={principles(c)} columns={2} />
      </Section>

      <Section title={c.revenueHeading} width="narrow">
        <Prose>
          <p>
            {c.revenueIntro}</p>
          <p>
            {c.revenueBody}</p>
          <h2>{c.limitsHeading}</h2>
          <p>
            {c.limitsBody}</p>
          <h2>{c.dataHeading}</h2>
          <p>
            {c.dataBody}</p>
        </Prose>
      </Section>

      <CtaBand
        title={c.ctaHeading}
        text={c.ctaBody}
        primary={{ label: c.publish, href: "/publicar" }}
        secondary={{ label: c.contact, href: "/contacto" }}
      />
    </main>
  );
}
