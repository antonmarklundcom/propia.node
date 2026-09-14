import type { Metadata } from "next";
import Link from "next/link";
import { dict, currentLocale } from "@/i18n/server";
import { numberLocaleFor } from "@/i18n";
import { brandName } from "@/lib/brand-server";
import { citiesWithPrices } from "@/lib/precios-queries";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { PageHero, Section } from "@/components/MarketingUI";

// Depends on the medians job's output; render per request (cheap, two queries).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await brandName();
  const d = await dict();
  const t = d.precios;
  const locale = await currentLocale();
  const numberLocale = numberLocaleFor(locale);
  return {
    title: `${t.indexTitle}`,
    description: t.indexSubtitle(brand),
    alternates: { canonical: `${await siteOrigin()}/precios` },
  };
}

export default async function PreciosIndexPage() {
  const brand = await brandName();
  const d = await dict();
  const t = d.precios;
  const locale = await currentLocale();
  const numberLocale = numberLocaleFor(locale);
  const [cities, origin] = await Promise.all([citiesWithPrices(), siteOrigin()]);

  return (
    <main className="precios-index">
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: d.publicUi.home, url: "/" },
            { name: t.indexTitle, url: "/precios" },
          ]),
        ]}
      />

      <PageHero
        tone="light"
        kicker={brand}
        title={t.indexTitle}
        subtitle={t.indexSubtitle(brand)}
      />

      <Section width="narrow">
      {cities.length === 0 ? (
        <p className="panel-empty">{t.indexEmpty}</p>
      ) : (
        <ul className="precios-city-list">
          {cities.map((c) => (
            <li key={c.slug}>
              <Link className="precios-city-link" href={`/precios/${c.slug}`}>
                <span>{c.name}</span>
                <span className="precios-city-link__count">
                  {c.reliableSample} {t.tableSample.toLowerCase()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      </Section>

      <Section title={t.methodTitle} tone="muted" width="narrow">
        <p className="precios-index__method">{t.methodBody(brand)}</p>
      </Section>
    </main>
  );
}
