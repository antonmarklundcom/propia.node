import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brandName } from "@/lib/brand-server";
import { currentLocale, dict } from "@/i18n/server";
import { siteOrigin } from "@/lib/origin";
import { languageAlternates } from "@/lib/alternates";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { ListingBrowser, listingPage } from "@/components/ListingBrowser";
import { facetSearchParams, hasListingUserParams } from "@/lib/facets";
import { SearchBar } from "@/components/SearchBar";
import { listCities } from "@/lib/queries";
import { currentVertical } from "@/lib/vertical-context";
import { getOperationHubData } from "@/lib/directory-queries";
import { categoryUrl, parseOperation, operationSlug, typePlural } from "@/lib/urls";
import { CtaBand, Section } from "@/components/MarketingUI";
import type { PropertyType } from "@/lib/import/types";

// Live counts per city and per type; no build-time DB on Hostinger.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ operacion: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * National operation hub: /venta, /alquiler, /alquiler-temporal.
 *
 * The category route (`/[operacion]/[...segments]`) needs at least one
 * segment, so these bare URLs used to 404 — even though they are exactly
 * where competitors put their top-level "Venta" and "Alquiler" tabs, and
 * where a search for "casas en venta paraguay" wants to land. This page is
 * the parent of the whole category tree: every city and every property type
 * for the operation, with real counts.
 *
 * Static routes win over dynamic ones in the App Router, so /precios,
 * /planes and friends are unaffected; anything that isn't an operation slug
 * falls through to notFound().
 */
export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const brand = await brandName();
  const { operacion } = await params;
  const op = parseOperation(operacion);
  if (!op) return { title: brand };
  // hreflang pairs a page only with the same content on a door of the same
  // family — the rental doors' /alquiler is not a language version of the
  // marketplace's (src/lib/alternates.ts).
  const vertical = await currentVertical();
  const copy = (await dict()).hub.copy[op];
  const sp = await searchParams;
  const indexed = !hasListingUserParams(sp) && listingPage(sp.page) === 1;
  return {
    robots: { index: indexed, follow: true },
    title: `${copy.h1}`,
    description: copy.lead,
    alternates: {
      canonical: `${await siteOrigin()}/${operationSlug(op)}`,
      languages: indexed ? languageAlternates({
        path: `/${operationSlug(op)}`,
        scope: "site",
        family: vertical.family,
      }) : undefined,
    },
    // og:title doesn't inherit title.template, so the brand is explicit (F47).
    openGraph: { title: `${copy.h1} — ${brand}`, description: copy.lead },
  };
}

export default async function OperationHubPage({ params, searchParams }: Params) {
  const { operacion } = await params;
  const op = parseOperation(operacion);
  if (!op) notFound();

  const [d, locale] = await Promise.all([dict(), currentLocale()]);
  const t = d.hub;
  const copy = t.copy[op];
  const numberLocale = locale === "en" ? "en-US" : "es-PY";
  // The door's own hard filters narrow this rail like every other listing
  // query on the domain (VerticalConfig.filters).
  const vertical = await currentVertical();
  const [origin, hub, cities] = await Promise.all([
    siteOrigin(),
    getOperationHubData(op, vertical),
    listCities(),
  ]);

  // National type links stay national (plan 2026-09-22 A7): the counts are
  // country-wide, so the link filters this hub by type instead of jumping to
  // the biggest city. There is no /venta/<tipo> route; ?tipo= is the same
  // facet the sidebar writes.
  const typeHref = (type: PropertyType) =>
    `/${operationSlug(op)}?${new URLSearchParams(facetSearchParams({}, { typeSlug: typePlural(type) }))}`;

  return (
    <main className={vertical.key === "inmobiliaria" || vertical.key === "en" ? "c3b-marketplace c3b-hub" : undefined}>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: t.breadcrumbHome, url: "/" },
            { name: copy.label, url: `/${operationSlug(op)}` },
          ]),
        ]}
      />

      <section className="hub-hero" data-op={op}>
        <div className="hub-hero__inner">
          <h1 className="hub-hero__title">{copy.h1}</h1>
          <p className="hub-hero__lead">{copy.lead}</p>
          {/* The bar opens on THIS hub's operation, not the site default: a
              visitor on /alquiler who saw "Comprar" preselected was one wrong
              click from the wrong hub. The bar has no short-term rung, so the
              temporary-rental hub opens on "alquiler". */}
          <SearchBar
            cities={cities}
            locale={locale}
            defaultOperation={op === "venta" ? "venta" : "alquiler"}
          />
        </div>
      </section>

      <div className="listing-hub-results"><ListingBrowser basePath={`/${operationSlug(op)}`} query={{ operation: op, vertical }} searchParams={await searchParams} /></div>

      {hub.cities.length > 0 && (
        <Section
          tone="muted"
          title={t.byCityTitle}
          subtitle={t.byCitySubtitle}
        >
          <div className="hub-grid hub-grid--cities">
            {hub.cities.map((c) => (
              <Link
                key={c.slug}
                className="hub-tile"
                href={categoryUrl({ operation: op, citySlug: c.slug })}
              >
                <span className="hub-tile__label">
                  {copy.cityLabel} {c.name}
                </span>
                <span className="hub-tile__count">
                  {c.count.toLocaleString(numberLocale)}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {hub.types.length >= 2 && (
        <Section
          title={t.byTypeTitle}
          subtitle={t.byTypeSubtitle(copy.label.toLowerCase())}
        >
          <div className="mk-chips hub-chips">
            {hub.types.map((row) => (
              <Link
                key={row.type}
                className="mk-chip hub-chip"
                href={typeHref(row.type as PropertyType)}
              >
                {d.category.typeLabel[row.type] ?? row.type}
                <span className="hub-chip__count">
                  {row.count.toLocaleString(numberLocale)}
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* SEO body copy — only the two doors this generic houses/apartments
          copy actually fits. terreno.com.py's hard property_type filter
          means this text would be wrong there. */}
      {(vertical.key === "inmobiliaria" || vertical.key === "en") &&
        t.seo[op] && (
          <Section title={t.seo[op].title}>
            <div className="mk-prose">
              {t.seo[op].paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </Section>
        )}

      {hub.total === 0 && (
        <Section>
          <div className="mk-empty">
            <p>{t.emptyBody(copy.label.toLowerCase())}</p>
            <Link className="mk-btn mk-btn--accent" href="/publicar">
              {t.emptyCta}
            </Link>
          </div>
        </Section>
      )}

      <CtaBand
        title={op === "venta" ? t.ctaTitleSale : t.ctaTitleRent}
        text={t.ctaText}
        primary={{ label: t.ctaPrimary, href: "/publicar" }}
        secondary={{ label: t.ctaSecondary, href: "/tasacion" }}
      />
    </main>
  );
}
