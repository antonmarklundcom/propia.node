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
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: d.publicUi.home, url: "/" },
            { name: t.indexTitle, url: "/precios" },
            { name: city.name, url: `/precios/${city.slug}` },
          ]),
        ]}
      />

      <p>
        <Link className="panel-btn" href="/precios">
          {t.backToPrices}
        </Link>
      </p>

      <h1 style={{ fontSize: 24 }}>{t.cityTitle(city.name)}</h1>
      <p style={{ color: "#55655F" }}>
        {t.citySubtitle(brand, city.name, period)}
      </p>

      {cells.length === 0 ? (
        <p className="panel-empty">{t.emptyCity}</p>
      ) : (
        <div className="panel-table__wrap">
          <table className="panel-table precios-table">
            <thead>
              <tr>
                <th>{t.tableType}</th>
                <th>{t.tableOperation}</th>
                <th className="panel-table__num">{t.tableMedian}</th>
                <th className="panel-table__num">{t.tableMedianM2}</th>
                <th className="panel-table__num">{t.tableSample}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cells.map((cell) => (
                <tr
                  key={`${cell.propertyType}-${cell.operation}`}
                  className={cell.reliable ? undefined : "precios-row--thin"}
                >
                  <td>{d.publicUi.propertyTypes[cell.propertyType]}</td>
                  <td>{d.publicUi.operations[cell.operation]}</td>
                  <td className="panel-table__num">
                    {cell.medianPriceUsd != null
                      ? formatUsd(cell.medianPriceUsd, numberLocale)
                      : "—"}
                  </td>
                  <td className="panel-table__num">
                    {cell.medianPriceM2Usd != null
                      ? formatUsd(cell.medianPriceM2Usd, numberLocale)
                      : "—"}
                  </td>
                  <td className="panel-table__num">
                    {cell.sampleSize}
                    {!cell.reliable && (
                      <span
                        className="precios-caveat"
                        title={t.fewSamples}
                      >
                        {" "}
                        ⚠
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

      {cells.some((c) => !c.reliable) && (
        <p className="precios-thin-note">
          ⚠ {t.fewSamples} (&lt; {MIN_RELIABLE_SAMPLE})
        </p>
      )}

      <section className="precios-method">
        <h2 style={{ fontSize: 16, margin: "0 0 .5rem" }}>
          {t.methodTitle}
        </h2>
        <p style={{ margin: 0 }}>{t.methodBody(brand)}</p>
      </section>
    </main>
  );
}
