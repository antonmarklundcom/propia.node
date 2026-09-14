import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { dict, currentLocale } from "@/i18n/server";
import { numberLocaleFor } from "@/i18n";
import { brandName } from "@/lib/brand-server";
import { formatUsd } from "@/lib/format";
import { getCityPrices, MIN_RELIABLE_SAMPLE } from "@/lib/precios-queries";
import { categoryUrl } from "@/lib/urls";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { PageHero, Section } from "@/components/MarketingUI";

export const dynamic = "force-dynamic";


type Params = { params: Promise<{ ciudad: string }> };

// generateMetadata and the body need the same aggregate; cache() collapses them.
const load = cache(getCityPrices);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const brand = await brandName();
  const d = await dict();
  const t = d.precios;
  const locale = await currentLocale();
  const numberLocale = numberLocaleFor(locale);
  const { ciudad } = await params;
  const prices = await load(ciudad);
  if (!prices) return { title: d.publicUi.notFound };

  /**
   * Indexable only once at least one group is defensible. A price page with
   * three listings behind it is precisely the thin programmatic page the
   * indexability rule exists to keep out of the index — and here the stakes are
   * higher than on a category page, because the number *looks* authoritative.
   */
  const indexable = prices.reliableSample > 0;

  return {
    title: `${t.cityTitle(prices.city.name)}`,
    description: t.citySubtitle(brand, prices.city.name, prices.period),
    alternates: { canonical: `${await siteOrigin()}/precios/${prices.city.slug}` },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function CityPricesPage({ params }: Params) {
  const brand = await brandName();
  const d = await dict();
  const t = d.precios;
  const locale = await currentLocale();
  const numberLocale = numberLocaleFor(locale);
  const { ciudad } = await params;
  const [prices, origin] = await Promise.all([load(ciudad), siteOrigin()]);
  if (!prices) notFound();

  const { city, cells, period } = prices;

  return (
    <main className="precios-city">
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: d.publicUi.home, url: "/" },
            { name: t.indexTitle, url: "/precios" },
            { name: city.name, url: `/precios/${city.slug}` },
          ]),
        ]}
      />

      <PageHero
        tone="light"
        kicker={brand}
        title={t.cityTitle(city.name)}
        subtitle={t.citySubtitle(brand, city.name, period)}
      />

      <Section width="narrow">
        <Link className="precios-city__back" href="/precios">
          {t.backToPrices}
        </Link>

      {cells.length === 0 ? (
        <p className="precios-city__empty">{t.emptyCity}</p>
      ) : (
        <div className="precios-table__wrap">
          <table className="precios-table">
            <thead>
              <tr>
                <th>{t.tableType}</th>
                <th>{t.tableOperation}</th>
                <th className="precios-table__num">{t.tableMedian}</th>
                <th className="precios-table__num">{t.tableMedianM2}</th>
                <th className="precios-table__num">{t.tableSample}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cells.map((cell) => (
                <tr
                  key={`${cell.propertyType}-${cell.operation}`}
                  className={cell.reliable ? undefined : "precios-table__row--thin"}
                >
                  <td>{d.publicUi.propertyTypes[cell.propertyType]}</td>
                  <td>{d.publicUi.operations[cell.operation]}</td>
                  <td className="precios-table__num">
                    {cell.medianPriceUsd != null
                      ? formatUsd(cell.medianPriceUsd, numberLocale)
                      : "—"}
                  </td>
                  <td className="precios-table__num">
                    {cell.medianPriceM2Usd != null
                      ? formatUsd(cell.medianPriceM2Usd, numberLocale)
                      : "—"}
                  </td>
                  <td className="precios-table__num">
                    {cell.sampleSize}
                    {!cell.reliable && (
                      <span
                        className="precios-table__caveat"
                        title={t.fewSamples}
                      >
                        {" "}
                        †
                      </span>
                    )}
                  </td>
                  <td>
                    {/* The link that makes this page worth indexing: market
                        context leading straight into the inventory. */}
                    <Link
                      href={categoryUrl({
                        operation: cell.operation,
                        citySlug: city.slug,
                        type: cell.propertyType,
                      })}
                    >
                      {t.seeListings}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      </Section>

      <Section title={t.methodTitle} tone="muted" width="narrow">
      {cells.some((c) => !c.reliable) && (
        <p className="precios-city__thin-note">
          † {t.fewSamples} (&lt; {MIN_RELIABLE_SAMPLE})
        </p>
      )}

        <p className="precios-city__method">{t.methodBody(brand)}</p>
      </Section>
    </main>
  );
}
