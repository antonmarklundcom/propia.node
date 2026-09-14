import type { Metadata } from "next";
import { dict, currentLocale } from "@/i18n/server";
import { numberLocaleFor } from "@/i18n";
import { brandName } from "@/lib/brand-server";
import { listCities } from "@/lib/queries";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { ValuationTool } from "@/components/ValuationTool";
import { PageHero, Section } from "@/components/MarketingUI";
import { estimateAction, requestValuationContactAction } from "./actions";

// Reads the city list and (through the actions) live medians.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await brandName();
  const d = await dict();
  const t = d.tasacion;
  const locale = await currentLocale();
  const numberLocale = numberLocaleFor(locale);
  return {
    title: `${t.title}`,
    description: t.subtitle(brand),
    alternates: { canonical: `${await siteOrigin()}/tasacion` },
  };
}

export default async function TasacionPage() {
  const brand = await brandName();
  const d = await dict();
  const t = d.tasacion;
  const locale = await currentLocale();
  const numberLocale = numberLocaleFor(locale);
  const [cities, origin] = await Promise.all([listCities(), siteOrigin()]);

  return (
    <main className="mk-valuation">
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: d.publicUi.home, url: "/" },
            { name: t.title, url: "/tasacion" },
          ]),
        ]}
      />

      <PageHero title={t.title} subtitle={t.subtitle(brand)} />

      <Section width="narrow">
      <ValuationTool
        locale={locale}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        estimate={estimateAction}
        requestContact={requestValuationContactAction}
      />
      </Section>
    </main>
  );
}
