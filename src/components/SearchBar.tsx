"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { categoryUrl } from "@/lib/urls";
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
 * Hero search bar: operación + ciudad + tipo, submits by pushing straight to
 * the matching category URL (§4 shapes) — no client-side filtering, no new
 * backend. Ciudad list comes from the DB (server-fetched, passed as a prop)
 * so it never drifts from what's actually seeded.
 */
export function SearchBar({ cities }: { cities: CityOption[] }) {
  const router = useRouter();
  const [operation, setOperation] = useState<Operation>("venta");
  const [citySlug, setCitySlug] = useState(cities[0]?.slug ?? "");
  const [type, setType] = useState<PropertyType | "">("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!citySlug) return;
    const href = categoryUrl({
      operation,
      citySlug,
      type: type || undefined,
    });
    router.push(href);
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

      <button className="search-bar__submit" type="submit">
        Buscar
      </button>
    </form>
  );
}
