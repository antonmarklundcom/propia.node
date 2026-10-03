/**
 * Slug → location row, over rows already in memory. Pure (no db, no next/*),
 * so `npm run verify:routing` checks it, and the query layer serves both
 * lookups from one cached read of the whole `locations` table instead of a
 * round-trip per category, map and `/api/mapa` request (report 2026-10-03
 * §C-2).
 *
 * Same rules as the SQL they replace: a ciudad by `(slug, level)`, a barrio by
 * `(slug, level, parent_id)`. Slugs are unique per level in the seed; if two
 * rows ever shared one, the lowest id wins, which is what the old `LIMIT 1`
 * returned in practice.
 */
export interface LookupRow {
  id: number;
  parentId: number | null;
  level: "pais" | "departamento" | "ciudad" | "barrio";
  slug: string;
}

function lowestId<T extends LookupRow>(rows: Iterable<T>, match: (r: T) => boolean): T | null {
  let best: T | null = null;
  for (const r of rows) if (match(r) && (best === null || r.id < best.id)) best = r;
  return best;
}

export function findCity<T extends LookupRow>(rows: Iterable<T>, citySlug: string): T | null {
  return lowestId(rows, (r) => r.level === "ciudad" && r.slug === citySlug);
}

export function findBarrio<T extends LookupRow>(rows: Iterable<T>, cityId: number, barrioSlug: string): T | null {
  return lowestId(rows, (r) => r.level === "barrio" && r.parentId === cityId && r.slug === barrioSlug);
}
