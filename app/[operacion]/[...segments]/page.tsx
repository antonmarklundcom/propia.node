import { cache } from "react";
import type { Metadata } from "next";
import { doorOgImages } from "@/lib/og-urls";
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
import { VERTICALS } from "@/config/verticals";
import { evergreenPageFor, evergreenPathsFor, isEvergreenPath } from "@/content/evergreen";
import { EvergreenCategory } from "@/components/evergreen/EvergreenCategory";
import { formatUsd } from "@/lib/format";
import {
  bestMedianFor,
  getCityPrices as cityPricesFor,
  medianFor,
} from "@/lib/precios-queries";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import {
  siteOrigin,
  categoryCanonicalFor,
} from "@/lib/origin";
import { orDegraded } from "@/lib/degrade";
import { pageLanguageAlternates } from "@/lib/alternates-server";
import { JsonLd } from "@/components/JsonLd";
import { ListingBrowser, listingPage as parsePage } from "@/components/ListingBrowser";
import { EmptyCategory } from "@/components/EmptyCategory";
import { doorAllowsCategory } from "@/lib/empty-state";
import { treePlace, type FlatNode } from "@/lib/ops/location-tree";
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
  /**
   * The city or barrio is in the code's location tree but not yet in this
   * database (`seed:locations` has not run since it was added): the page
   * renders from the tree with no listings instead of 404ing — report
   * 2026-10-03 §A. The sitemap leaves such a path out until the seed runs.
   */
  fromTree: boolean;
}

/**
 * A `locations`-shaped row for a place the tree knows and the database does
 * not. Negative ids never match a row, so every count on it is 0.
 */
function treeRow(node: FlatNode, id: number, parentId: number | null): LocationRow {
  return {
    id,
    parentId,
    level: node.level,
    name: node.name,
    slug: node.slug,
    fullSlug: node.fullSlug,
    lat: node.lat != null ? String(node.lat) : null,
    lng: node.lng != null ? String(node.lng) : null,
    listingCounts: null,
    guideContentEs: null,
    guideContentEn: null,
    guideUpdatedAt: null,
  };
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
    rows,
    byId,
    facts: categoryFacts(rows, byId, ref),
    related: relatedCategoryLinks(rows, byId, ref, new Set(evergreenPathsFor(vertical.key))),
  };
});

/**
 * Whether the parent a barrio page needs indexable is: its city/type page
 * with ≥ 3 listings on this door, or an evergreen one (indexable at any
 * count on its owner door). The sitemap and the related links apply the
 * same rule, so the three never disagree.
 */
async function barrioParentIndexable(r: Resolved, vertical: VerticalConfig): Promise<boolean | undefined> {
  if (!r.barrio || !r.type) return undefined;
  const parentPath = categoryUrl({ operation: r.operation, citySlug: r.city.slug, type: r.type });
  if (evergreenPageFor(parentPath, vertical.key)) return true;
  return (await countFor(r.operation, await subtreeIds(r.city.id), r.type, vertical)) >= 3;
}

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
  const cityTypePath = categoryUrl({ operation: r.operation, citySlug: r.city.slug, type });
  if (
    r.barrio &&
    (evergreenPageFor(cityTypePath, vertical.key) ||
      (await countFor(r.operation, cityIds, type, vertical)) > 0)
  ) {
    return cityTypePath;
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

  const barrioSlug = shape.kind === "barrio-type" ? shape.barrioSlug : undefined;
  let fromTree = false;
  let city = await resolveCity(shape.citySlug);
  // Report 2026-10-03 §A: a place the code links but production has not been
  // seeded with renders from the tree, never 404s. Unknown to both: 404.
  const tree = !city || barrioSlug ? treePlace(shape.citySlug, barrioSlug) : null;
  if (!city) {
    if (!tree) return null;
    city = treeRow(tree.city, -1, null);
    fromTree = true;
  }

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
    barrio = fromTree ? null : await resolveBarrio(city.id, shape.barrioSlug);
    if (!barrio) {
      if (!tree?.barrio) return null;
      barrio = treeRow(tree.barrio, -2, city.id);
      fromTree = true;
    }
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
    fromTree,
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
  const parentIndexable = await barrioParentIndexable(r, vertical);
  // Evergreen (src/content/evergreen/): indexable at any count on its owner
  // door only — `vertical.key` is the door serving this request.
  const evergreen = evergreenPageFor(r.canonicalPath, vertical.key);
  const ix = getIndexability({
    listingCount: count,
    parentIndexable,
    parentUrl: r.parentUrl,
    evergreen: !!evergreen,
    // E-1: a combination this door can carry renders at 0 (noindex, E-2).
    emptyRenders: doorAllowsCategory(vertical.filters, r.operation, r.type),
  });

  // Deep pages (?page=2+) self-canonicalise and stay out of the index while
  // their links are still followed — page 1 remains the only indexed URL for
  // the category (F33).
  //
  // A door that does not own category pages (`ownsCategories: false`, S8)
  // canonicalises to the EQUIVALENT page on the door that does — the same
  // listing set — and a page with no single equivalent stays self-canonical
  // and noindex. Unset everywhere today: every door owns its own.
  // An evergreen page's OWNER door outranks the flag in both directions
  // (`categoryTarget()`, category-owner.ts): the owner stays self-canonical
  // even with `ownsCategories: false`, and the other doors serving the same
  // set point at it.
  const shape = parseCategorySegments(segments);
  const target = await categoryCanonicalFor(shape, r.operation, r.canonicalPath);
  const noEquivalent = target === null;
  const canonicalOrigin = target?.origin ?? (await siteOrigin());
  const canonicalPath = target?.path ?? r.canonicalPath;
  const delegated = !!target?.delegated;
  const canonical =
    page > 1 && !userFiltered
      ? `${canonicalOrigin}${canonicalPath}?page=${page}`
      : `${canonicalOrigin}${canonicalPath}`;

  // hreflang belongs on indexed canonical URLs only: a ?page=2 self-canonical
  // and a thin category are both noindex here, and pairing a noindex URL with
  // its translation asks Google to weigh a page we asked it to ignore.
  const indexed =
    ix.state === "index" && page === 1 && !userFiltered && !noEquivalent;
  // A page whose canonical is elsewhere is not itself a language version.
  // An evergreen page is indexed below the count rule, where its other-
  // language version (which follows the ordinary rule) may be a 404: pair
  // it only while the count alone would have indexed it too — or when every
  // version in the set is itself evergreen on its door, so each one is a
  // 200, indexable page whatever its stock.
  const languages = indexed && !delegated
    ? await pageLanguageAlternates({
        path: r.canonicalPath,
        scope: "category",
        family: vertical.family,
      })
    : undefined;
  const everyVersionEvergreen =
    !!languages &&
    Object.values(languages).every((url) => {
      const door = VERTICALS[new URL(url).host];
      return !!door && isEvergreenPath(r.canonicalPath, door.key);
    });
  const pairable =
    indexed &&
    (getIndexability({ listingCount: count, parentIndexable }).state === "index" ||
      everyVersionEvergreen);

  const baseTitle = evergreen?.h1 ?? r.title;
  const title = page > 1 ? t.titlePaged(baseTitle, page) : baseTitle;
  // The lowest asking price comes from the same cached aggregate the intro
  // reads; `count` stays the authoritative COUNT above. A failed aggregate
  // costs the price clause, never the page.
  const facts = await pageContext(r, vertical)
    .then((c) => c.facts)
    .catch(() => null);
  const description = evergreen && count === 0
    ? evergreen.metaDescription
    : count === 0
      ? t.emptyNow(
          (r.type ? t.typeLabel[r.type] : t.typeLabelAny).toLowerCase(),
          t.operationLabel[r.operation],
          whereOf(r),
        )
      : t.metaDescription({
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
      languages: pairable ? languages : undefined,
    },
    // og:title doesn't inherit title.template, so the brand is explicit (F47).
    openGraph: { title: `${title} — ${brand}`, description, images: doorOgImages(brand) },
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
  const parentIndexable = await barrioParentIndexable(r, vertical);
  // An evergreen page renders 200 at any count on its owner door, never the
  // 404 / redirect below (ARCHITECTURE.md §4.3).
  const evergreen = evergreenPageFor(r.canonicalPath, vertical.key);
  const ix = getIndexability({
    listingCount: count,
    parentIndexable,
    parentUrl: r.parentUrl,
    evergreen: !!evergreen,
    // E-1: a combination this door can carry renders at 0 (noindex, E-2).
    emptyRenders: doorAllowsCategory(vertical.filters, r.operation, r.type),
  });

  if (ix.state === "gone") {
    // Only a combination this door never carries gets here (a house page on a
    // land-only door): every other valid page renders its empty state below
    // (E-1). The bounce target explains itself (?tipo_vacio).
    if (ix.redirectTo && r.type) redirect(await emptyRedirectTarget(r, vertical));
    notFound();
  }
  // A valid page with nothing on this door today (E-1): the empty state, not
  // the grid. An evergreen page has its own 0-stock body.
  const emptyNow = count === 0 && !evergreen;

  // Set when an old link (or the land-door bounce above) carries ?tipo_vacio
  // — explains the bounce instead of silently swapping what was asked for.
  const tipoVacio =
    typeof sp.tipo_vacio === "string" ? parseTypePlural(sp.tipo_vacio) : null;

  // Does this city have a price page worth linking to? Cheap: one aggregate.
  // An aside, not the grid: under pool pressure it renders as "no prices" for
  // this request (never cached — src/lib/degrade.ts) instead of a 500.
  const cityPrices = await orDegraded(
    `city-prices[${r.city.slug}]`,
    cityPricesFor(r.city.slug),
    null,
  );
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

  // The URL hierarchy: operation hub › city › city/type › barrio/type. Since
  // E-1 every ancestor of a page this door carries renders (its listings, or
  // the empty state), so no crumb is ever a 404 or a redirect and none is
  // dropped.
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

  const breadcrumbs = (
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
  );

  // Related searches: only pages indexable on this door (see
  // src/lib/category-context.ts), so it never links into a noindex, an
  // empty or a redirected category. An evergreen target can have no stock;
  // it shows no count rather than a 0.
  const related = relatedGroups.length > 0 && (
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
                {link.count > 0 && (
                  <span className="category-related__count">
                    {link.count.toLocaleString(numberLocale)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );

  // Internal link module: market context for this city. Only rendered when
  // the medians job has something defensible to show, so we never link into
  // an empty page.
  const pricesAside = cityHasPrices && (
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
  );

  const marketplaceClass =
    vertical.key === "inmobiliaria" || vertical.key === "en" ? "c3b-marketplace c3b-category" : undefined;

  if (evergreen) {
    return (
      <main
        className={[marketplaceClass, "evg-page"].filter(Boolean).join(" ")}
        style={{ maxWidth: 1440, margin: "0 auto", padding: "1rem" }}
      >
        <JsonLd data={[breadcrumbJsonLd(origin, crumbs)]} />
        <EvergreenCategory
          page={evergreen}
          operation={r.operation}
          city={r.city}
          barrio={r.barrio}
          type={r.type}
          canonicalPath={r.canonicalPath}
          locationIds={r.locationIds}
          vertical={vertical}
          count={count}
          searchParams={sp}
          inventory={context ? { rows: context.rows, byId: context.byId } : null}
          breadcrumbs={breadcrumbs}
          related={related}
          pricesAside={pricesAside}
        />
      </main>
    );
  }

  return (
    <main className={marketplaceClass} style={{ maxWidth: 1440, margin: "0 auto", padding: "1rem" }}>
      {ix.state === "index" && (
        <JsonLd
          data={[
            breadcrumbJsonLd(origin, crumbs),
          ]}
        />
      )}

      {breadcrumbs}

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

      {emptyNow ? (
        <EmptyCategory
          operation={r.operation}
          city={r.city}
          barrio={r.barrio}
          type={r.type}
          canonicalPath={r.canonicalPath}
          vertical={vertical}
          inventory={context ? { rows: context.rows, byId: context.byId } : null}
        />
      ) : (
        <ListingBrowser basePath={r.canonicalPath} query={baseQuery} searchParams={sp} city={r.city} barrio={r.barrio} />
      )}

      {related}

      {pricesAside}
    </main>
  );
}
