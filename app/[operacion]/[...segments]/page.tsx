import { cache } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { tokens } from "@/design/tokens";
import { es } from "@/i18n/es";
import {
  resolveCity,
  resolveBarrio,
  citySubtreeIds,
  getFilteredCategoryListings,
  countCategory,
  listCities,
  type CategoryFilters,
  type LocationRow,
  type SortOption,
} from "@/lib/queries";
import {
  parseOperation,
  parseCategorySegments,
  categoryUrl,
  operationSlug,
  typePlural,
} from "@/lib/urls";
import { getIndexability } from "@/lib/indexability";
import { itemListJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { siteOrigin, listingCanonicalOrigin } from "@/lib/origin";
import { JsonLd } from "@/components/JsonLd";
import { ListingCard } from "@/components/ListingCard";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { CategoryMapLazy } from "@/components/CategoryMapLazy";
import { SearchBar } from "@/components/SearchBar";
import { listingUrl } from "@/lib/urls";
import type { Operation, PropertyType } from "@/lib/import/types";

// Already rendered per request (searchParams drive the filter bar); the Host
// header now feeds the canonical URL too — see src/lib/origin.ts.

const OP_LABEL: Record<Operation, string> = {
  venta: "venta",
  alquiler: "alquiler",
  alquiler_temporal: "alquiler temporal",
};
const TYPE_LABEL: Record<PropertyType, string> = {
  casa: "Casas",
  departamento: "Departamentos",
  terreno: "Terrenos",
  duplex: "Dúplex",
  comercial: "Locales comerciales",
  oficina: "Oficinas",
  deposito: "Depósitos",
  quinta: "Quintas",
};

type Params = {
  params: Promise<{ operacion: string; segments: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Reads ?precio_min=&precio_max=&dormitorios=&orden= into typed filters. Bad/missing values are just dropped, never an error. */
function parseFilters(sp: Record<string, string | string[] | undefined>): CategoryFilters {
  const num = (v: string | string[] | undefined) => {
    if (typeof v !== "string") return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const sortRaw = typeof sp.orden === "string" ? sp.orden : undefined;
  const sort: SortOption | undefined =
    sortRaw === "precio_asc" || sortRaw === "precio_desc" ? sortRaw : undefined;
  return {
    priceMin: num(sp.precio_min),
    priceMax: num(sp.precio_max),
    minBedrooms: num(sp.dormitorios),
    sort,
  };
}

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
  (operation: Operation, locationIds: number[], type: PropertyType | null) =>
    countCategory({ operation, locationIds, type: type ?? undefined }),
);

/** Shared resolution for metadata + page (structure + DB lookups, no listings). */
const resolve = cache(async function resolve(
  operacion: string,
  segments: string[],
): Promise<Resolved | null> {
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
  const typeLabel = type ? TYPE_LABEL[type] : "Propiedades";
  const title = `${typeLabel} en ${OP_LABEL[operation]} en ${where}`;

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

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { operacion, segments } = await params;
  const r = await resolve(operacion, segments);
  if (!r) return { title: "No encontrado — Homes Paraguay" };

  const count = await countFor(r.operation, r.locationIds, r.type);
  const parentIndexable = r.barrio
    ? (await countFor(r.operation, await subtreeIds(r.city.id), r.type)) >= 3
    : undefined;
  const ix = getIndexability({
    listingCount: count,
    parentIndexable,
    parentUrl: r.parentUrl,
  });

  return {
    title: `${r.title} — Homes Paraguay`,
    description: `${count} ${r.title.toLowerCase()} en Homes Paraguay. Encontrá tu próxima propiedad con cuota estimada y financiamiento.`,
    alternates: { canonical: `${await siteOrigin()}${r.canonicalPath}` },
    robots:
      ix.state === "index"
        ? { index: true, follow: true }
        : { index: false, follow: true },
  };
}

export default async function CategoryPage({ params, searchParams }: Params) {
  const { operacion, segments } = await params;
  const sp = await searchParams;
  const r = await resolve(operacion, segments);
  if (!r) notFound();

  const baseQuery = {
    operation: r.operation,
    locationIds: r.locationIds,
    type: r.type ?? undefined,
  };

  // Indexability is always computed from the canonical (unfiltered) count —
  // a visitor's price/bedroom filter must never change whether this page
  // is indexable or gate it behind the 404/redirect below.
  const count = await countFor(r.operation, r.locationIds, r.type);
  const parentIndexable = r.barrio
    ? (await countFor(r.operation, await subtreeIds(r.city.id), r.type)) >= 3
    : undefined;
  const ix = getIndexability({
    listingCount: count,
    parentIndexable,
    parentUrl: r.parentUrl,
  });

  if (ix.state === "gone") {
    if (ix.redirectTo) redirect(ix.redirectTo);
    notFound();
  }

  const filters = parseFilters(sp);
  const hasActiveFilters = Boolean(
    filters.priceMin || filters.priceMax || filters.minBedrooms || filters.sort,
  );
  const [{ listings, filteredCount }, cities] = await Promise.all([
    getFilteredCategoryListings(baseQuery, filters),
    listCities(),
  ]);

  // Breadcrumbs are this host's own pages; the ItemList points at listing
  // detail pages, which may be canonical on a different host entirely.
  const [origin, listingOrigin] = await Promise.all([
    siteOrigin(),
    listingCanonicalOrigin(),
  ]);

  const crumbs = [
    { name: "Inicio", url: "/" },
    { name: r.city.name, url: categoryUrl({ operation: r.operation, citySlug: r.city.slug }) },
    ...(r.barrio ? [{ name: r.barrio.name, url: r.canonicalPath }] : []),
  ];

  /**
   * Map view is opt-in via ?vista=mapa. A query param rather than a route so
   * the canonical URL is unchanged and no thin duplicate page gets indexed —
   * the map is a way to browse this page, not a page of its own.
   */
  const mapView = sp.vista === "mapa";

  // The map centres on the barrio when the path names one, else the city.
  const centre = r.barrio?.lat && r.barrio?.lng ? r.barrio : r.city;
  const mapCentre =
    centre.lat && centre.lng
      ? { lat: Number(centre.lat), lng: Number(centre.lng) }
      : null;

  // Forwarded verbatim to /api/mapa so the pins match the grid's filters.
  const mapQuery: Record<string, string> = {
    operacion: operationSlug(r.operation),
    ...(r.type ? { tipo: typePlural(r.type) } : {}),
    ...(filters.priceMin ? { precio_min: String(filters.priceMin) } : {}),
    ...(filters.priceMax ? { precio_max: String(filters.priceMax) } : {}),
    ...(filters.minBedrooms ? { dormitorios: String(filters.minBedrooms) } : {}),
  };

  const controls = (
    <>
      <SearchBar
        cities={cities}
        defaultOperation={r.operation}
        defaultCitySlug={r.city.slug}
        defaultType={r.type ?? ""}
      />

      <CategoryFilterBar
        basePath={r.canonicalPath}
        precioMin={typeof sp.precio_min === "string" ? sp.precio_min : undefined}
        precioMax={typeof sp.precio_max === "string" ? sp.precio_max : undefined}
        dormitorios={typeof sp.dormitorios === "string" ? sp.dormitorios : undefined}
        orden={typeof sp.orden === "string" ? sp.orden : undefined}
        hasActiveFilters={hasActiveFilters}
      />
    </>
  );

  /** Keep every active filter when switching views. */
  const viewHref = (view: "lista" | "mapa") => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (typeof value === "string" && key !== "vista") params.set(key, value);
    }
    if (view === "mapa") params.set("vista", "mapa");
    const qs = params.toString();
    return qs ? `${r.canonicalPath}?${qs}` : r.canonicalPath;
  };

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      {ix.state === "index" && (
        <JsonLd
          data={[
            breadcrumbJsonLd(origin, crumbs),
            itemListJsonLd(
              listingOrigin,
              listings.map((l) => ({ title: l.title, url: listingUrl(l) })),
            ),
          ]}
        />
      )}

      <h1 style={{ fontSize: 24 }}>{r.title}</h1>
      <p style={{ color: tokens.color.inkSecondary, marginTop: 4 }}>
        {count > 0
          ? `${count} ${count === 1 ? "propiedad" : "propiedades"} disponibles.`
          : es.emptyState}
      </p>

      {/* In map view the controls go BELOW the map: on a phone the search and
          filter cards fill the whole first screen, so a visitor who tapped
          "Mapa" would have to scroll past both to reach what they asked for. */}
      {!mapView && controls}

      {mapCentre && (
        <nav className="view-switch" aria-label="Vista">
          <a
            className={`view-switch__option${!mapView ? " view-switch__option--active" : ""}`}
            href={viewHref("lista")}
          >
            Lista
          </a>
          <a
            className={`view-switch__option${mapView ? " view-switch__option--active" : ""}`}
            href={viewHref("mapa")}
          >
            Mapa
          </a>
        </nav>
      )}

      {mapView && mapCentre ? (
        <CategoryMapLazy
          centerLat={mapCentre.lat}
          centerLng={mapCentre.lng}
          zoom={r.barrio ? 14 : 12}
          query={mapQuery}
        />
      ) : filteredCount === 0 ? (
        <div className="filter-empty">
          No hay propiedades que coincidan con estos filtros.
          <br />
          <a className="filter-empty__clear" href={r.canonicalPath}>
            Quitar filtros
          </a>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          {listings.map((card) => (
            <ListingCard key={card.id} card={card} />
          ))}
        </div>
      )}

      {mapView && controls}
    </main>
  );
}
