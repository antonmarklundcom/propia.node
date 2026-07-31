import type { Metadata } from "next";
import Link from "next/link";
import { esPrecios } from "@/i18n/es";
import { BRAND_NAME } from "@/lib/brand";
import { citiesWithPrices } from "@/lib/precios-queries";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";

// Depends on the medians job's output; render per request (cheap, two queries).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `${esPrecios.indexTitle} — ${BRAND_NAME}`,
    description: esPrecios.indexSubtitle,
    alternates: { canonical: `${await siteOrigin()}/precios` },
  };
}

export default async function PreciosIndexPage() {
  const [cities, origin] = await Promise.all([citiesWithPrices(), siteOrigin()]);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: "Inicio", url: "/" },
            { name: esPrecios.indexTitle, url: "/precios" },
          ]),
        ]}
      />

      <h1 style={{ fontSize: 24 }}>{esPrecios.indexTitle}</h1>
      <p style={{ color: "#55655F" }}>{esPrecios.indexSubtitle}</p>

      {cities.length === 0 ? (
        <p className="panel-empty">{esPrecios.indexEmpty}</p>
      ) : (
        <ul className="precios-city-list">
          {cities.map((c) => (
            <li key={c.slug}>
              <Link className="precios-city-link" href={`/precios/${c.slug}`}>
                <span>{c.name}</span>
                <span className="precios-city-link__count">
                  {c.reliableSample} {esPrecios.tableSample.toLowerCase()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="precios-method">
        <h2 style={{ fontSize: 16, margin: "0 0 .5rem" }}>
          {esPrecios.methodTitle}
        </h2>
        <p style={{ margin: 0 }}>{esPrecios.methodBody}</p>
      </section>
    </main>
  );
}
