/**
 * Category page filters: price range, min bedrooms, sort. A plain GET form
 * — no client JS. Submitting reloads the same URL with a query string, which
 * the page reads via `searchParams`. Filters only narrow the visible grid;
 * they never affect indexability (see src/lib/queries.ts CategoryFilters).
 */
export function CategoryFilterBar({
  basePath,
  precioMin,
  precioMax,
  dormitorios,
  orden,
  hasActiveFilters,
}: {
  basePath: string;
  precioMin?: string;
  precioMax?: string;
  dormitorios?: string;
  orden?: string;
  hasActiveFilters: boolean;
}) {
  return (
    <form className="filter-bar" method="GET" action={basePath}>
      <div className="field">
        <label className="field__label" htmlFor="precio_min">
          Precio mín. (US$)
        </label>
        <input
          id="precio_min"
          name="precio_min"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Sin mínimo"
          defaultValue={precioMin}
          className="input"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="precio_max">
          Precio máx. (US$)
        </label>
        <input
          id="precio_max"
          name="precio_max"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Sin máximo"
          defaultValue={precioMax}
          className="input"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="dormitorios">
          Dormitorios
        </label>
        <select
          id="dormitorios"
          name="dormitorios"
          defaultValue={dormitorios ?? ""}
          className="select"
        >
          <option value="">Cualquiera</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="orden">
          Ordenar por
        </label>
        <select
          id="orden"
          name="orden"
          defaultValue={orden ?? "recientes"}
          className="select"
        >
          <option value="recientes">Más recientes</option>
          <option value="precio_asc">Menor precio</option>
          <option value="precio_desc">Mayor precio</option>
        </select>
      </div>

      <button className="btn btn--primary" type="submit">
        Filtrar
      </button>
      {hasActiveFilters && (
        <a className="filter-bar__clear" href={basePath}>
          Quitar filtros
        </a>
      )}
    </form>
  );
}
