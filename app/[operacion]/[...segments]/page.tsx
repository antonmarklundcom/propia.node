import { cache } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { dict } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { brandName } from "@/lib/brand-server";
import {
  resolveCity,
  resolveBarrio,
  citySubtreeIds,
  countCategory,
  type LocationRow,
} from "@/lib/queries";
import {
  hasListingUserParams,
} from "@/lib/facets";
import { currentVertical } from "@/lib/vertical-context";
import type { VerticalConfig } from "@/config/verticals";
import {
  parseOperation,
  parseCategorySegments,
  categoryUrl,
  typePlural,
  parseTypePlural,
} from "@/lib/urls";
import { getIndexability } from "@/lib/indexability";
import { formatUsd } from "@/lib/format";
import {
  bestMedianFor,
  getCityPrices as cityPricesFor,
  medianFor,
} from "@/lib/precios-queries";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { siteOrigin } from "@/lib/origin";
import { languageAlternates } from "@/lib/alternates";
import { JsonLd } from "@/components/JsonLd";
import { ListingBrowser, listingPage as parsePage } from "@/components/ListingBrowser";
import type { Operation, PropertyType } from "@/lib/import/types";

// Already rendered per request (searchParams drive the filter bar); the Host
// header now feeds the canonical URL too — see src/lib/origin.ts.

type Params = {
  params: Promise<{ operacion: string; segments: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

interface Resolved {
  operation: Operation;
  city: LocationRow;
  barrio: LocationRow | null;
  type: PropertyType | null;
  locationIds: number[];
  canonicalPath: string;
  parentUrl?: string;
  /** True only when parentUrl (the 0-result redirect target) drops the tipo filter. */
  parentDropsType: boolean;
  title: string;
}

/**
 * generateMetadata and the page body run the same resolution and the same
 * counts on every request. cache() makes the second caller free — note that
 * it keys on argument identity, which is why locationIds must come from the
 * cached subtreeIds() (same array reference) for countFor() to hit.
 */
const subtreeIds = cache(citySubtreeIds);

const countFor = cache(
  (
    operation: Operation,
    locationIds: number[],
    type: PropertyType | null,
    vertical: VerticalConfig,
  ) =>
    countCategory({
      operation,
      locationIds,
      type: type ?? undefined,
      vertical,
    }),
);

/** Shared resolution for metadata + page (structure + DB lookups, no listings). */
const resolve = cache(async function resolve(
  operacion: string,
  segments: string[],
): Promise<Resolved | null> {
  // The title is the one piece of resolution that is copy rather than
  // structure, so this reaches for the dictionary. cache() keys on the two
  // string arguments, and the locale cannot change within a request, so the
  // lookup does not need to join the key.
  const t = (await dict()).category;
  const operation = parseOperation(operacion);
  if (!operation) return null;
  const shape = parseCategorySegments(segments);
  if (!shape) return null;

  const city = await resolveCity(shape.citySlug);
  if (!city) return null;

  let barrio: LocationRow | null = null;
  let type: PropertyType | null = null;
  let locationIds: number[];
  let parentUrl: string | undefined;
  let parentDropsType = false;

  if (shape.kind === "city") {
    locationIds = await subtreeIds(city.id);
  } else if (shape.kind === "city-type") {
    type = shape.type;
    locationIds = await subtreeIds(city.id);
    parentUrl = categoryUrl({ operation, citySlug: city.slug });
    parentDropsType = true;
  } else {
    type = shape.type;
    barrio = await resolveBarrio(city.id, shape.barrioSlug);
    if (!barrio) return null;
    locationIds = [barrio.id];
    parentUrl = categoryUrl({
      operation,
      citySlug: city.slug,
      type: shape.type,
    });
  }

  const where = barrio ? `${barrio.name}, ${city.name}` : city.name;
  const typeLabel = type ? t.typeLabel[type] : t.typeLabelAny;
  const title = t.title(typeLabel, t.operationLabel[operation], where);

  return {
    operation,
    city,
    barrio,
    type,
    locationIds,
    canonicalPath: categoryUrl({
      operation,
      citySlug: city.slug,
      barrioSlug: barrio?.slug,
      type: type ?? undefined,
    }),
    parentUrl,
    parentDropsType,
    title,
  };
});

export async function generateMetadata({
  params,
  searchParams,
}: Params): Promise<Metadata> {
  const brand = await brandName();
  const t = (await dict()).category;
  const { operacion, segments } = await params;
  const r = await resolve(operacion, segments);
  if (!r) return { title: t.metaNotFound };

  const metadataParams = await searchParams;
  const page = parsePage(metadataParams.page);
  const userFiltered = hasListingUserParams(metadataParams);
  const vertical = await currentVertical();
  const count = await countFor(r.operation, r.locationIds, r.type, vertical);
  const parentIndexable = r.barrio
    ? (await countFor(
        r.operation,
        await subtreeIds(r.city.id),
        r.type,
        vertical,
      )) >= 3
    : undefined;
  const ix = getIndexability({
    listingCount: count,
    parentIndexable,
    parentUrl: r.parentUrl,
  });

  // Deep pages (?page=2+) self-canonicalise and stay out of the index while
  // their links are still followed — page 1 remains the only indexed URL for
  // the category (F33).
  const canonical =
    page > 1 && !userFiltered
      ? `${await siteOrigin()}${r.canonicalPath}?page=${page}`
      : `${await siteOrigin()}${r.canonicalPath}`;

  // hreflang belongs on indexed canonical URLs only: a ?page=2 self-canonical
  // and a thin category are both noindex here, and pairing a noindex URL with
  // its translation asks Google to weigh a page we asked it to ignore.
  const indexed = ix.state === "index" && page === 1 && !userFiltered;

  const title = page > 1 ? t.titlePaged(r.title, page) : r.title;
  const description = t.metaDescription(count, r.title, brand);
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: indexed
        ? languageAlternates({
            path: r.canonicalPath,
            scope: "site",
            family: vertical.family,
          })
        : undefined,
    },
    // og:title doesn't inherit title.template, so the brand is explicit (F47).
    openGraph: { title: `${title} — ${brand}`, description },
    robots: indexed
        ? { index: true, follow: true }
        : { index: false, follow: true },
  };
}

export default async function CategoryPage({ params, searchParams }: Params) {
  const d = await dict();
  const t: Dictionary["category"] = d.category;
  const { operacion, segments } = await params;
  const sp = await searchParams;
  const r = await resolve(operacion, segments);
  if (!r) notFound();

  // The door this request came through. Its `filters` (VerticalConfig) narrow
  // the grid, the count that decides indexability and the map's pins alike —
  // one vertical, one listing set, no surface disagreeing with another.
  const vertical = await currentVertical();

  const baseQuery = {
    operation: r.operation,
    locationIds: r.locationIds,
    type: r.type ?? undefined,
    vertical,
  };

  // Indexability is always computed from the canonical (unfiltered) count —
  // a visitor's price/bedroom filter must never change whether this page
  // is indexable or gate it behind the 404/redirect below.
  const count = await countFor(r.operation, r.locationIds, r.type, vertical);
  const parentIndexable = r.barrio
    ? (await countFor(
        r.operation,
        await subtreeIds(r.city.id),
        r.type,
        vertical,
      )) >= 3
    : undefined;
  const ix = getIndexability({
    listingCount: count,
    parentIndexable,
    parentUrl: r.parentUrl,
  });

  if (ix.state === "gone") {
    if (ix.redirectTo) {
      // Tell the parent page which sub-category was empty so it can explain
      // the bounce instead of silently swapping what the visitor asked for.
      const to =
        r.type && r.parentDropsType
          ? `${ix.redirectTo}?tipo_vacio=${typePlural(r.type)}`
          : ix.redirectTo;
      redirect(to);
    }
    notFound();
  }

  // Set only when we just redirected here from an empty city+tipo URL
  // (see the "gone" branch above) — explains the bounce instead of
  // silently swapping what the visitor asked for.
  const tipoVacio =
    typeof sp.tipo_vacio === "string" ? parseTypePlural(sp.tipo_vacio) : null;

  // Does this city have a price page worth linking to? Cheap: one aggregate.
  const cityPrices = await cityPricesFor(r.city.slug);
  const cityHasPrices = (cityPrices?.reliableSample ?? 0) > 0;

  /**
   * The payload above was already being fetched and then reduced to a boolean.
   * Stating the actual median is what turns the module from a question into a
   * credibility signal (audit I8) — and it costs nothing extra.
   *
   * A page with a type in its path gets that type's median; a bare city page
   * gets the best-evidenced type for the operation, named so the copy never
   * implies it covers everything.
   */
  const contextCell = r.type
    ? medianFor(cityPrices, r.operation, r.type)
    : bestMedianFor(cityPrices, r.operation);

  // Breadcrumbs are this host's own pages; the ItemList points at listing
  // detail pages, which may be canonical on a different host entirely.
  const origin = await siteOrigin();

  const crumbs = [
    { name: t.breadcrumbHome, url: "/" },
    { name: r.city.name, url: categoryUrl({ operation: r.operation, citySlug: r.city.slug }) },
    ...(r.barrio ? [{ name: r.barrio.name, url: r.canonicalPath }] : []),
  ];

  return (
    <main className={vertical.key === "inmobiliaria" || vertical.key === "en" ? "c3b-marketplace c3b-category" : undefined} style={{ maxWidth: 1440, margin: "0 auto", padding: "1rem" }}>
      {ix.state === "index" && (
        <JsonLd
          data={[
            breadcrumbJsonLd(origin, crumbs),
          ]}
        />
      )}

      <h1 className="category-title">{r.title}</h1>

      {tipoVacio && (
        <p className="category-redirect-notice">
          {t.emptyTypeNotice(
            t.typeLabel[tipoVacio].toLowerCase(),
            t.operationLabel[r.operation],
            r.city.name,
          )}
        </p>
      )}

      <ListingBrowser basePath={r.canonicalPath} query={baseQuery} searchParams={sp} city={r.city} barrio={r.barrio} />

      {/* Internal link module: market context for this city. Only rendered
          when the medians job has something defensible to show, so we never
          link into an empty page. */}
      {cityHasPrices && (
        <aside className="precios-cta">
          <span>
            {contextCell
              ? d.precios.contextMedian({
                  typeLabel: t.typeLabel[contextCell.propertyType],
                  operationLabel:
                    d.precios.contextOperationLabel[contextCell.operation] ??
                    contextCell.operation,
                  city: r.city.name,
                  median:
                    contextCell.medianPriceUsd != null
                      ? formatUsd(contextCell.medianPriceUsd)
                      : "—",
                  perM2:
                    contextCell.medianPriceM2Usd != null
                      ? formatUsd(contextCell.medianPriceM2Usd)
                      : null,
                  sample: contextCell.sampleSize,
                })
              : d.precios.relatedPrices(r.city.name)}
          </span>
          <Link className="panel-btn" href={`/precios/${r.city.slug}`}>
            {d.precios.relatedPricesCta}
          </Link>
        </aside>
      )}

    </main>
  );
}
