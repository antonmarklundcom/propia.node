import { JsonLd } from "./JsonLd";
import { itemListJsonLd } from "@/lib/jsonld";
import { listingCanonicalOrigin } from "@/lib/origin";
import { listingUrl } from "@/lib/urls";
import { currentLocale, dict } from "@/i18n/server";
import { PROPERTY_TYPES } from "@/lib/import/types";
import { CategoryFilterBar } from "./CategoryFilterBar";
import { ListingCard } from "./ListingCard";
import { CategoryMapLazy } from "./CategoryMapLazy";
import { categoryUrl, operationSlug, typePlural } from "@/lib/urls";
import { facetSearchParams, parseFacetParams, parseLocationSlugs } from "@/lib/facets";
import { getFilteredCategoryListings, listCities, listCityBarrios, resolveBarrio, type CategoryQuery, type LocationRow } from "@/lib/queries";

export function listingPage(value: string | string[] | undefined) {
  const n = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(n) && n > 1 ? Math.min(n, 1000000) : 1;
}
/** Existing facets only; the path and the door always remain independent constraints. */
export async function ListingBrowser({ basePath, query, searchParams, city, barrio }: {
  basePath: string; query: CategoryQuery;
  searchParams: Record<string, string | string[] | undefined>;
  city?: LocationRow; barrio?: LocationRow | null;
}) {
  const [d, locale] = await Promise.all([dict(), currentLocale()]);
  const params = Object.fromEntries(Object.entries(searchParams).filter((entry): entry is [string,string] => typeof entry[1] === "string"));
  const filters = parseFacetParams(searchParams);
  // The type in the category path wins; changing type uses a canonical link.
  if (query.type) { delete filters.propertyType; delete params.tipo; }
  const { barrioSlug } = parseLocationSlugs(searchParams);
  const selectedBarrio = city && !barrio && barrioSlug ? await resolveBarrio(city.id, barrioSlug) : null;
  const locationIds = city && !barrio && barrioSlug ? (selectedBarrio ? [selectedBarrio.id] : []) : undefined;
  const page = listingPage(searchParams.page);
  const [{ listings, filteredCount }, cities, barrios] = await Promise.all([
    getFilteredCategoryListings({ ...query, limit: 48, offset: (page - 1) * 48 }, { ...filters, locationIds }),
    listCities(), city ? listCityBarrios(city.id) : Promise.resolve([]),
  ]);
  const href = (changes: Record<string,string | undefined>, path = basePath) => {
    const sp = new URLSearchParams(params);
    for (const [k,v] of Object.entries(changes)) { sp.delete(k); if (v) sp.set(k,v); }
    return `${path}${sp.size ? `?${sp}` : ""}`;
  };
  const locations = city ? barrios.map(b => ({ label: b.name, href: barrio
    ? href({ page: undefined, barrio: undefined }, categoryUrl({ operation: query.operation, citySlug: city.slug, barrioSlug: b.slug, type: query.type }))
    : href({ page: undefined, barrio: b.slug }) }))
    : cities.map(c => ({ label: c.name, href: href({ page: undefined, barrio: undefined }, categoryUrl({ operation: query.operation, citySlug: c.slug })) }));
  const mapView = params.vista === "mapa";
  const center = barrio ?? selectedBarrio ?? city;
  const mapQuery = { ...facetSearchParams(filters, { operationSlug: operationSlug(query.operation), typeSlug: query.type ? typePlural(query.type) : filters.propertyType ? typePlural(filters.propertyType) : undefined }), ...(city ? { ciudad: city.slug } : {}), ...(barrio || barrioSlug ? { barrio: barrio?.slug ?? barrioSlug! } : {}) };
  const totalPages = Math.max(1, Math.ceil(filteredCount / 48));
  const typeChoices = query.type && city ? [{ label: d.category.typeLabelAny, href: href({ page: undefined, tipo: undefined }, categoryUrl({ operation: query.operation, citySlug: city.slug })) }, ...PROPERTY_TYPES.map(type => ({ label: d.category.typeLabel[type], href: href({ page: undefined, tipo: undefined }, categoryUrl({ operation: query.operation, citySlug: city.slug, barrioSlug: barrio?.slug, type })) }))] : [];
  return <CategoryFilterBar basePath={basePath} params={params} locale={locale} count={filteredCount} operation={query.operation} fixedType={query.type} typeChoices={typeChoices} locations={locations} locationLabel={city ? d.filters.barrio : d.filters.city}
    viewSwitch={<nav className="view-switch" aria-label={d.category.viewSwitchLabel}>{(["lista","mapa"] as const).map(view => <a className={`view-switch__option${(view === "mapa") === mapView ? " view-switch__option--active" : ""}`} key={view} href={href({ vista: view === "mapa" ? view : undefined, page: undefined })}>{view === "mapa" ? d.category.viewMap : d.category.viewList}</a>)}</nav>}>
    <JsonLd data={itemListJsonLd(await listingCanonicalOrigin(), listings.map(l => ({ title: locale === "en" ? l.titleEn ?? l.title : l.title, url: listingUrl(l) })))} />
    {mapView ? <CategoryMapLazy centerLat={Number(center?.lat ?? -25.3)} centerLng={Number(center?.lng ?? -57.6)} zoom={barrio ? 14 : city ? 12 : 8} query={mapQuery} /> : filteredCount === 0 || listings.length === 0 ? <div className="filter-empty">{d.category.filterEmpty}<br /><a href={basePath}>{d.category.filterEmptyClear}</a></div> : <div className="category-results listing-results-grid">{listings.map(card => <ListingCard key={card.id} card={card} />)}</div>}
    {!mapView && filteredCount > 48 && <nav className="pagination" aria-label={d.category.paginationLabel}>
      {page > 1 && <a className="pagination__link" href={href({ page: page === 2 ? undefined : String(page - 1) })}>{d.category.paginationPrev}</a>}
      <span className="pagination__status">{d.category.paginationStatus(page,totalPages)}</span>
      {page < totalPages && <a className="pagination__link" href={href({ page: String(page + 1) })}>{d.category.paginationNext}</a>}
    </nav>}
  </CategoryFilterBar>;
}
