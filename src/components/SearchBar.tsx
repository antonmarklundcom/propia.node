"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { categoryUrl, operationSlug } from "@/lib/urls";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/property-types";
import type { Operation, PropertyType } from "@/lib/import/types";

export interface CityOption {
  name: string;
  slug: string;
}

const OPERATION_OPTIONS: { value: Operation; label: string }[] = [
  { value: "venta", label: "Comprar" },
  { value: "alquiler", label: "Alquilar" },
];

/**
 * Optional max-budget shortcut (feeds ?precio_max=, the same USD filter the
 * category page's filter bar reads). Sale and rent budgets are different
 * orders of magnitude, so each operation gets its own rungs.
 */
const BUDGET_OPTIONS: Record<"venta" | "alquiler", number[]> = {
  venta: [50_000, 100_000, 150_000, 250_000, 500_000],
  alquiler: [300, 500, 800, 1_200, 2_000],
};

function budgetLabel(n: number): string {
  return `Hasta US$ ${n.toLocaleString("es-PY")}`;
}

/**
 * Hero search bar: operación + ciudad + tipo, submits by pushing straight to
 * the matching category URL (§4 shapes) — no client-side filtering, no new
 * backend. Ciudad list comes from the DB (server-fetched, passed as a prop)
 * so it never drifts from what's actually seeded.
 *
 * Also reused on category pages, pre-filled with the current selection
 * (defaultOperation/defaultCitySlug/defaultType) so a visitor can pivot the
 * search without going back to the homepage.
 */
export function SearchBar({
  cities,
  defaultOperation = "venta",
  defaultCitySlug,
  defaultType = "",
}: {
  cities: CityOption[];
  defaultOperation?: Operation;
  defaultCitySlug?: string;
  defaultType?: PropertyType | "";
}) {
  const router = useRouter();
  const [operation, setOperation] = useState<Operation>(defaultOperation);
  // "" = todas las ciudades → the national operation hub (/venta, /alquiler).
  const [citySlug, setCitySlug] = useState(defaultCitySlug ?? "");
  const [type, setType] = useState<PropertyType | "">(defaultType);
  const [budget, setBudget] = useState("");

  const budgets =
    BUDGET_OPTIONS[operation === "venta" ? "venta" : "alquiler"];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Without a city there is no category route; the operation hub lists
    // every city and type with live counts, so that's where "todas" lands.
    const href = citySlug
      ? categoryUrl({ operation, citySlug, type: type || undefined })
      : `/${operationSlug(operation)}`;
    router.push(citySlug && budget ? `${href}?precio_max=${budget}` : href);
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <div className="search-bar__field">
        <label className="search-bar__label" htmlFor="search-operation">
          Operación
        </label>
        <select
          id="search-operation"
          className="search-bar__select"
          value={operation}
          onChange={(e) => setOperation(e.target.value as Operation)}
        >
          {OPERATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="search-bar__field search-bar__field--grow">
        <label className="search-bar__label" htmlFor="search-city">
          Ciudad
        </label>
        <select
          id="search-city"
          className="search-bar__select"
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
        >
          <option value="">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="search-bar__field search-bar__field--grow">
        <label className="search-bar__label" htmlFor="search-type">
          Tipo
        </label>
        <select
          id="search-type"
          className="search-bar__select"
          value={type}
          onChange={(e) => setType(e.target.value as PropertyType | "")}
        >
          <option value="">Todos los tipos</option>
          {PROPERTY_TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="search-bar__field">
        <label className="search-bar__label" htmlFor="search-budget">
          Presupuesto
        </label>
        <select
          id="search-budget"
          className="search-bar__select"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        >
          <option value="">Sin límite</option>
          {budgets.map((b) => (
            <option key={b} value={b}>
              {budgetLabel(b)}
            </option>
          ))}
        </select>
      </div>

      <button className="search-bar__submit" type="submit">
        Buscar
      </button>
    </form>
  );
}
