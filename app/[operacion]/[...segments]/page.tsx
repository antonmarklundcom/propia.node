import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
  typePlural,
} from "@/lib/urls";
import { getIndexability } from "@/lib/indexability";
import { itemListJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { ListingCard } from "@/components/ListingCard";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { listingUrl } from "@/lib/urls";
import type { Operation, PropertyState, PropertyType } from "@/lib/import/types";

const VALID_ESTADOS: readonly PropertyState[] = [
  "en_pozo",
  "en_construccion",
  "entrega_inmediata",
  "usado",
];

export const revalidate = 3600;

const ORIGIN = () =>
  `https://${process.env.NEXT_PUBLIC_CANONICAL_HOST ?? "propia.com.py"}`;

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
  const estadoRaw = typeof sp.estado === "string" ? sp.estado : undefined;
  const estado = VALID_ESTADOS.find((e) => e === estadoRaw);
  return {
    priceMin: num(sp.precio_min),
    priceMax: num(sp.precio_max),
    minBedrooms: num(sp.dormitorios),
    sort,
    estado,
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

/** Shared resolution for metadata + page (structure + DB lookups, no listings). */
async function resolve(
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
    locationIds = await citySubtreeIds(city.id);
  } else if (shape.kind === "city-type") {
    type = shape.type;
    locationIds = await citySubtreeIds(city.id);
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
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { operacion, segments } = await params;
  const r = await resolve(operacion, segments);
  if (!r) return { title: "No encontrado — Propia" };

  const count = await countCategory({
    operation: r.operation,
    locationIds: r.locationIds,
    type: r.type ?? undefined,
  });
  const parentIndexable = r.barrio
    ? (await countCategory({
        operation: r.operation,
        locationIds: await citySubtreeIds(r.city.id),
        type: r.type ?? undefined,
      })) >= 3
    : undefined;
  const ix = getIndexability({
    listingCount: count,
    parentIndexable,
    parentUrl: r.parentUrl,
  });

  return {
    title: `${r.title} — Propia`,
    description: `${count} ${r.title.toLowerCase()} en Propia. Encontrá tu próxima propiedad con cuota estimada y financiamiento.`,
    alternates: { canonical: `${ORIGIN()}${r.canonicalPath}` },
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
  const count = await countCategory(baseQuery);
  const parentIndexable = r.barrio
    ? (await countCategory({
        operation: r.operation,
        locationIds: await citySubtreeIds(r.city.id),
        type: r.type ?? undefined,
      })) >= 3
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
    filters.priceMin || filters.priceMax || filters.minBedrooms || filters.sort || filters.estado,
  );
  const [{ listings, filteredCount }, cities] = await Promise.all([
    getFilteredCategoryListings(baseQuery, filters),
    listCities(),
  ]);

  const crumbs = [
    { name: "Inicio", url: "/" },
    { name: r.city.name, url: categoryUrl({ operation: r.operation, citySlug: r.city.slug }) },
    ...(r.barrio ? [{ name: r.barrio.name, url: r.canonicalPath }] : []),
  ];

  return (
    <main className="container">
      {ix.state === "index" && (
        <JsonLd
          data={[
            breadcrumbJsonLd(crumbs),
            itemListJsonLd(
              listings.map((l) => ({ title: l.title, url: listingUrl(l) })),
            ),
          ]}
        />
      )}

      <h1 className="page-title" style={{ marginTop: "var(--space-3)" }}>
        {r.title}
      </h1>
      <p className="page-subtitle">
        {count > 0
          ? `${count} ${count === 1 ? "propiedad" : "propiedades"} disponibles.`
          : es.emptyState}
      </p>

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

      {filteredCount === 0 ? (
        <div style={{ marginTop: "var(--space-4)" }}>
          <EmptyState
            icon="🔍"
            title="No hay propiedades que coincidan con estos filtros."
            action={
              <Button href={r.canonicalPath} variant="ghost" size="sm">
                Quitar filtros
              </Button>
            }
          />
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map((card) => (
            <ListingCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </main>
  );
}
