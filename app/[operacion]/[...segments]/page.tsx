import { cache } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { dict } from "@/i18n/server";
import { numberLocaleFor, type Dictionary } from "@/i18n";
import { brandName } from "@/lib/brand-server";
import {
  resolveCity,
  resolveBarrio,
  citySubtreeIds,
  countCategory,
  getCategoryInventory,
  locationIndex,
  type LocationRow,
} from "@/lib/queries";
import {
  categoryFacts,
  relatedCategoryLinks,
  type CategoryPageRef,
  type RelatedLink,
} from "@/lib/category-context";
import {
  hasListingUserParams,
} from "@/lib/facets";
import { currentVertical } from "@/lib/vertical-context";
import type { VerticalConfig } from "@/config/verticals";
import {
  parseOperation,
  parseCategorySegments,
  categoryUrl,
  operationSlug,
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
import { pageLanguageAlternates } from "@/lib/alternates-server";
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

/**
 * The type every listing on the page is: the one in its path, else the
 * door's only type (terreno.com.py's /venta/luque is all terrenos, whatever
 * its title says). Counted phrases use it so they name what the visitor sees.
 */
function nounType(r: Resolved, vertical: VerticalConfig): PropertyType | null {
  if (r.type) return r.type;
  const only = vertical.filters?.property_type;
  return only?.length === 1 ? (only[0] as PropertyType) : null;
}

/** Where the page is: "Luque", or "Recoleta, Asunción" on a barrio page. */
function whereOf(r: Resolved): string {
  return r.barrio ? `${r.barrio.name}, ${r.city.name}` : r.city.name;
}

/**
 * A price this page may print, or null. Short-term rentals get none: the
 * listing form does not record whether their amount is per night or per
 * month, and a range with the wrong period is a wrong fact.
 */
function priceText(
  usd: number | null,
  operation: Operation,
  vertical: VerticalConfig,
): string | null {
  if (usd == null || !(usd > 0) || operation === "alquiler_temporal") return null;
  return formatUsd(usd, numberLocaleFor(vertical.locale));
}

/**
 * The page's facts (intro, meta description) and its related links, from ONE
 * cached aggregate of this door's inventory for the operation
 * (`getCategoryInventory()`, whose cache key carries the vertical key) plus
 * the location table this request already loaded. cache() shares it between
 * generateMetadata and the page body; both callers pass the same `Resolved`
 * (itself from the cached resolve()) and the same vertical object.
 */
const pageContext = cache(async (r: Resolved, vertical: VerticalConfig) => {
  const [rows, byId] = await Promise.all([
    getCategoryInventory(vertical, r.operation),
    locationIndex(),
  ]);
  const ref: CategoryPageRef = {
    operation: r.operation,
    cityId: r.city.id,
    barrioId: r.barrio?.id ?? null,
    type: r.type,
  };
  return {
    facts: categoryFacts(rows, byId, ref),
    related: relatedCategoryLinks(rows, byId, ref),
  };
});

/**
 * Where an empty typed page sends the visitor: the nearest level up that has
 * stock on this door. The direct parent can be empty too, and a redirect into
 * a 404 is worse than either page, so it walks barrio/type → city/type →
 * city (with ?tipo_vacio to explain the bounce) → the operation hub with the
 * type as a filter, which always renders.
 */
async function emptyRedirectTarget(r: Resolved, vertical: VerticalConfig): Promise<string> {
  const type = r.type!;
  const cityIds = await subtreeIds(r.city.id);
  if (r.barrio && (await countFor(r.operation, cityIds, type, vertical)) > 0) {
    return categoryUrl({ operation: r.operation, citySlug: r.city.slug, type });
  }
  if ((await countFor(r.operation, cityIds, null, vertical)) > 0) {
    return `${categoryUrl({ operation: r.operation, citySlug: r.city.slug })}?tipo_vacio=${typePlural(type)}`;
  }
  return `/${operationSlug(r.operation)}?tipo=${typePlural(type)}`;
}

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

  if (shape.kind === "city") {
    locationIds = await subtreeIds(city.id);
  } else if (shape.kind === "city-type") {
    type = shape.type;
    locationIds = await subtreeIds(city.id);
    parentUrl = categoryUrl({ operation, citySlug: city.slug });
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
  // The lowest asking price comes from the same cached aggregate the intro
  // reads; `count` stays the authoritative COUNT above. A failed aggregate
  // costs the price clause, never the page.
  const facts = await pageContext(r, vertical)
    .then((c) => c.facts)
    .catch(() => null);
  const description = t.metaDescription({
    count,
    type: nounType(r, vertical),
    opLabel: t.operationLabel[r.operation],
    where: whereOf(r),
    fromPrice: priceText(facts?.minUsd ?? null, r.operation, vertical),
    monthly: r.operation === "alquiler",
    brand,
  });
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: indexed
        ? await pageLanguageAlternates({
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
    // Only typed pages have a parent to bounce to; the target explains the
    // bounce (?tipo_vacio) and is never itself an empty page.
    if (ix.redirectTo && r.type) redirect(await emptyRedirectTarget(r, vertical));
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

  // Breadcrumbs are this host's own pages; the ItemList (ListingBrowser)
  // points at listing detail pages, which may be canonical on another host.
  const origin = await siteOrigin();
  const numberLocale = numberLocaleFor(vertical.locale);

  // The same URL-hierarchy the redirects walk: operation hub › city ›
  // city/type › barrio/type. Every ancestor holds at least this page's
  // listings on this door, so none of them is empty (404) or a redirect.
  const crumbs = [
    { name: t.breadcrumbHome, url: "/" },
    { name: d.hub.copy[r.operation].label, url: `/${operationSlug(r.operation)}` },
    { name: r.city.name, url: categoryUrl({ operation: r.operation, citySlug: r.city.slug }) },
    ...(r.type
      ? [{
          name: t.typeLabel[r.type],
          url: categoryUrl({ operation: r.operation, citySlug: r.city.slug, type: r.type }),
        }]
      : []),
    ...(r.barrio ? [{ name: r.barrio.name, url: r.canonicalPath }] : []),
  ];

  // The intro describes the canonical listing set, so it shows only where
  // that set is what the page is about: page 1, no visitor filter, indexable.
  // The related module only ever links pages indexable on this door, so it
  // is safe (and useful) on every state that renders.
  const indexed =
    ix.state === "index" && parsePage(sp.page) === 1 && !hasListingUserParams(sp);
  const context = await pageContext(r, vertical).catch(() => null);
  const facts = context?.facts;
  const noun = nounType(r, vertical);

  let intro: string | null = null;
  if (indexed && facts) {
    const min = priceText(facts.minUsd, r.operation, vertical);
    const max = priceText(facts.maxUsd, r.operation, vertical);
    intro = [
      t.intro({
        count,
        type: noun,
        opLabel: t.operationLabel[r.operation],
        where: whereOf(r),
        barrioCount: facts.barrioCount,
      }),
      facts.types.length >= 2
        ? t.introTypes(facts.types.map((x) => t.countNoun(x.count, x.type)))
        : null,
      min && max
        ? t.introPrice({ min, max, monthly: r.operation === "alquiler" })
        : null,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const typeName = (type: PropertyType | null) =>
    type ? t.typeLabel[type] : t.typeLabelAny;
  const relatedGroups: { key: string; title: string; links: { href: string; label: string; count: number }[] }[] = [];
  if (context) {
    const { types, barrios, cities } = context.related;
    const withLabel = (links: RelatedLink[], label: (l: RelatedLink) => string) =>
      links.map((l) => ({ href: l.href, label: label(l), count: l.count }));
    if (types.length > 0) {
      relatedGroups.push({
        key: "types",
        title: t.relatedTypesTitle(r.city.name),
        links: withLabel(types, (l) => typeName(l.type)),
      });
    }
    if (barrios.length > 0) {
      relatedGroups.push({
        key: "barrios",
        title: r.barrio && r.type
          ? t.relatedSiblingBarriosTitle(t.typeLabel[r.type], r.city.name)
          : t.relatedBarriosTitle(r.type ? t.typeLabel[r.type] : null, r.city.name),
        links: withLabel(barrios, (l) =>
          r.type ? l.place : t.relatedBarrioLink(typeName(l.type), l.place),
        ),
      });
    }
    if (cities.length > 0) {
      relatedGroups.push({
        key: "cities",
        title: t.relatedCitiesTitle(typeName(noun), t.operationLabel[r.operation]),
        links: withLabel(cities, (l) => l.place),
      });
    }
  }

  return (
    <main className={vertical.key === "inmobiliaria" || vertical.key === "en" ? "c3b-marketplace c3b-category" : undefined} style={{ maxWidth: 1440, margin: "0 auto", padding: "1rem" }}>
      {ix.state === "index" && (
        <JsonLd
          data={[
            breadcrumbJsonLd(origin, crumbs),
          ]}
        />
      )}

      <nav className="breadcrumb-nav category-breadcrumb" aria-label={t.breadcrumbLabel}>
        {crumbs.map((crumb, i) => (
          <span key={crumb.url} className="category-breadcrumb__item">
            {i > 0 && <span aria-hidden>›</span>}
            {i === crumbs.length - 1 ? (
              <span className="breadcrumb-nav__current" aria-current="page">
                {crumb.name}
              </span>
            ) : (
              <Link className="breadcrumb-nav__link" href={crumb.url}>
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <h1 className="category-title">{r.title}</h1>

      {intro && <p className="category-intro">{intro}</p>}

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

      {/* Related searches: only pages indexable on this door (see
          src/lib/category-context.ts), so it never links into a noindex,
          an empty or a redirected category. */}
      {relatedGroups.length > 0 && (
        <nav className="category-related" aria-label={t.relatedAria}>
          {relatedGroups.map((group) => (
            <section key={group.key} className="category-related__group">
              <h2 className="category-related__title">{group.title}</h2>
              <ul className="category-related__list">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link className="category-related__link" href={link.href}>
                      {link.label}
                    </Link>{" "}
                    <span className="category-related__count">
                      {link.count.toLocaleString(numberLocale)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      )}

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
                      ? formatUsd(contextCell.medianPriceUsd, numberLocale)
                      : "—",
                  perM2:
                    contextCell.medianPriceM2Usd != null
                      ? formatUsd(contextCell.medianPriceM2Usd, numberLocale)
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
