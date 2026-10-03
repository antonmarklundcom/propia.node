# Cached location lookups; capped, degradable map-view reads (2026-10-03)

Phase 2 of `docs/plan-category-pages-build.md`, report
`docs/report-telegram-alerts-2026-10-03.md` §C-2, §C-3, §C-4.

## What landed

- `src/lib/queries.ts`: the whole `locations` table is read through
  `cachedLocationRows` (`unstable_cache` + `singleFlight`, tag `locations`,
  TTL `CACHE_TTL.locations`). `locationsById()` (request-scoped) builds its map
  from it and re-wraps `guide_updated_at` into a Date. `resolveCity()` and
  `resolveBarrio()` no longer query: they look up in that map through the pure
  `findCity()` / `findBarrio()` (`src/lib/location-lookup.ts`). Before this,
  every category, map and `/api/mapa` request paid one or two `locations`
  queries plus a full-table read. `locationRowsRaw()` is the uncached reader
  for scripts.
- The writer: `revalidateLocations()` was already called by the
  `seed:locations` job in `/admin/operaciones`. A CLI run cannot drop a Next.js
  tag; the TTL (an hour) is the backstop. Written into CLAUDE.md "Caching".
- `src/lib/degrade.ts`: `loadAsides()` — `loadSections()` for reads that are
  all asides: a partial result is used, and pressure on every section is the
  fallback instead of a throw. Non-pressure errors still throw.
- `src/components/ListingBrowser.tsx`: the grid read stays essential; the city
  list, barrio list and stocked-path set run through `loadAsides()`, two at a
  time. Before: five reads in one `Promise.all`.
- `app/api/mapa/route.ts`: pool pressure → `503` + `Retry-After: 10` +
  `{ ok: false, degraded: true }`, logged as degraded, no 500 (so no operator
  alert per pin request in a burst). `CategoryMap` already shows its error
  state on `ok: false`.
- `app/datos/page.tsx`: the portal stats (the `COUNT(*) from projects` that
  500'd) and the financing programs degrade to "—"; the price table still
  throws.
- New `npm run verify:degrade` (pure), added to `verify:local`, the pre-push
  hook and AGENTS.md.

## Checks added (`verify:degrade`)

City and barrio lookups (level, parent, unknown slug, duplicate slug → lowest
id); pressure vs SQL error under a Drizzle wrapper; `settleLimited` never
exceeds its limit; `loadAsides` partial, all-failed and real-bug cases.

## Not verified

- No real pool pressure was produced; behaviour under load is reasoned from
  the code and the pure checks.
- No local database in this session: the cached location read was not run
  against MySQL/MariaDB. `npm run build` and the typecheck pass.
- Whether §C was connection exhaustion is still the report's hypothesis; the
  cause line from phase 1 (PR #281) will say.
- The cached read selects the whole row, including the unused
  `guide_content_es/en` columns (null today). If those are ever filled with
  long guides, trim this select to the columns pages use, so the cache entry
  stays small.
