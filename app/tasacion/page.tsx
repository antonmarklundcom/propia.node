import type { Metadata } from "next";
import { dict, currentLocale } from "@/i18n/server";
import { numberLocaleFor } from "@/i18n";
import { brandName } from "@/lib/brand-server";
import { listCities } from "@/lib/queries";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { ValuationTool } from "@/components/ValuationTool";
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
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "1rem" }}>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: d.publicUi.home, url: "/" },
            { name: t.title, url: "/tasacion" },
          ]),
        ]}
      />

      <h1 style={{ fontSize: 26 }}>{t.title}</h1>
      <p style={{ color: "#55655F" }}>{t.subtitle(brand)}</p>

      <ValuationTool
        locale={locale}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name }))}
        estimate={estimateAction}
        requestContact={requestValuationContactAction}
      />
    </main>
  );
}
