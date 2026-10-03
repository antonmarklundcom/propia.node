# Zone maps: boundary data and renderer (plan phases 6–7, 2026-10-03)

Branch `claude/zone-maps`. Builds `docs/plan-category-pages-build.md` phase 6
(boundary data) and phase 7 (renderer), sections 1 and 4. **No page uses a map
yet**: `<ZoneMap>` is built and checked but wired into nothing; a later PR does
that once the place-page route exists. No schema, auth, payment or `src/db`
change.

## What landed

| File | What |
| --- | --- |
| `src/lib/zone-map/geometry.ts` | Pure plane geometry: ring assembly from OSM member ways (endpoint matching, reversal, open chains reported, never closed by a straight line), Douglas–Peucker for lines and rings (iterative, metres), rounding to 5 decimals, polygon/hole assembly, point-in-polygon, centroid, Sutherland–Hodgman ring clip and a coarse line clip. No dependencies. |
| `src/lib/zone-map/overpass.ts` | Pure Overpass half: the QL queries (departamento by name → city by name inside it → deeper admin boundaries inside the city → water + trunk/primary roads in the frame), accent-tolerant name regexes, response parsing, the choice of boundary, and `buildGeoFile()`. |
| `src/lib/zone-map/types.ts`, `places.ts` | The geo-file shape; the tree's ciudades with their barrios and departamento. |
| `src/lib/zone-map/svg.ts` | Pure SVG builder: 4:3 (1200×900 viewBox) and og (1200×630), equirectangular scaled by cos(latitude), page zone filled + outlined, other barrios outlined and labelled (crude collision skip), water and roads, type badge (one inline icon per `PropertyType`, `Record<PropertyType, …>` so a new type is a type error), "© OpenStreetMap" in the corner, circle fallback. Palette hard-coded in one object, each value naming its `app/globals.css` token. Deterministic. |
| `src/lib/zone-map/manifest.ts` | Pure: file naming, the hybrid lookup (per-URL image → base map + HTML badge overlay → nothing), manifest parsing. |
| `src/components/ZoneMap.tsx` | Server component: `<figure>`, `<img srcset 640w/1280w sizes width height loading=lazy decoding=async alt>`, badge overlay when needed, visible caption "© OpenStreetMap contributors" linking to the OSM copyright page. Renders nothing when the manifest has no image. CSS: `.zone-map*` at the end of `app/globals.css`. |
| `src/i18n/es.ts` / `en.ts` | `esZoneMap` / `enZoneMap` (`zoneMap` in the dictionary): alt text, badge words, credit, credit title. |
| `scripts/maps-fetch.ts` | `npm run maps:fetch [-- --dry] [-- --only <city>]`. Network + disk only. One request at a time, 2 s pause, named User-Agent, backoff 5/15/45/90 s on 429/5xx/network errors. |
| `scripts/maps-render.ts` | `npm run maps:render [-- --dry] [-- --only <city>]`. sharp → WebP; writes `maps-manifest.json` (keeps other cities' entries under `--only`). |
| `scripts/maps-contact-sheet.ts` | `npm run maps:contact-sheet [-- --out f.svg]`: every stored outline with its name and how it matched, for the founder's eyeball check. Output is git-ignored. |
| `scripts/maps-common.ts` | Paths and geo-file reading shared by the four scripts. |
| `scripts/verify-maps.ts` | `npm run verify:maps`, appended to `verify:local`, the pre-push hook and AGENTS.md §2. |
| `src/content/places/geo/README.md` | ODbL licence, credit, and the "GeoJSON is never served" rule; how to run the fetch. |
| `src/content/places/geo/maps-manifest.json` | Committed **empty** (no geo data yet). |

## Design choices

- **Admin level is matched, not assumed.** A city is the same-name
  administrative relation inside its departamento's area (Asunción: inside
  Paraguay); barrios are the administrative boundaries deeper than the city
  whose centroid lies inside it. Ties: contains the tree centroid, then
  largest area, then lowest id. The departamento itself is excluded, which is
  the Paraguarí case (departamento and district share a name). The level each
  place matched at is stored and printed.
- **Neighbours are kept.** Every subdivision inside the city is stored (tree
  barrios with their slug, others with `inTree: false`), so a barrio map shows
  its real surroundings, not only the 13 tree barrios. Neighbours use a
  coarser tolerance (10 m vs 4 m) to stay under the 150 KB budget.
- **Water is clipped to the frame** before storing: the Paraguay River's
  riverbank relation is far bigger than any city. Ponds under 2 ha are dropped.
- **Typeless evergreen paths** (`/alquiler/asuncion`, `/alquiler-temporal/asuncion`)
  have no badge, so their 4:3 images would equal the base map byte for byte:
  they reuse the base images and get only their own og card.
- **Locale in file names.** A per-URL image carries words, so the English
  door's version is a separate file (`venta-casas-en-640.webp`); Spanish has no
  suffix. File stems use the URL's own segments (`alquiler-temporal`, `casas`).
- **Badge words come from the caller** (`maps:render` composes them from
  `category.typeLabel` / `category.operationLabel` through `zoneMap.badge`);
  `svg.ts` contains no copy apart from the "© OpenStreetMap" credit.
- **Base maps have no og variant**: the plan gives og images to place pages
  and evergreen pages; place pages do not exist yet, so the og for a place
  page is added with that route.

## Checks (`verify:maps`, 156 with nothing committed)

Ring assembly (out of order, reversed, closed way, two rings, unclosable chains
reported), Douglas–Peucker (no original point further than the tolerance, ends
kept, only original points, ring stays closed and ≥ a triangle, tiny ring
kept), ring clip, name matching (accents, Guaraní nasal vowels, optional prefixes, no partial match) and QL escaping, query shape, Overpass fixture →
areas/roads → boundary pick (district over same-name sub-unit and parent) →
parent pick → full geo file (matched barrio, circle fallback, undrawable,
neighbour kept, outsider and city dropped, pond dropped, river clipped, road
filtered and clipped, licence/ids/5 decimals on every feature), SVG determinism
by sha256 over a JSON round-trip, viewBoxes and pixel size, badge iff type, an
icon for every `PropertyType`, circle fallback for city and barrio, label
escaping, wrong-city ref throws, credit in the image / both dictionaries / the
component, manifest lookup (hit, other type, other locale, place page, unknown
barrio, empty), file naming, every evergreen path parses, unique city slugs,
and for whatever is committed: geo budget 150 KB, licence and ids, barrio
inside city, manifest files exist on disk, `public/img/maps` under 25 MB, no
geo file imported by `app/` or `src/`, no JSON under `public/img/maps`.

`npm run verify:local` green (typecheck, build and every verify step).

## NOT verified

- **No real data was fetched or rendered.** This sandbox cannot reach
  `overpass-api.de` (the proxy answers 403; `maps:fetch -- --dry --only
  asuncion` was run and fails fast with "HTTP 403 after 1 attempt"). The
  queries, the name matching against real OSM names, which `admin_level`
  Paraguay's districts and Asunción's barrios use, OSM's barrio coverage, the
  real file sizes against the 150 KB budget and the real image sizes against
  25 MB are all unproven until the first real run.
- The renderer was exercised end to end only on a **synthetic** geo file
  (hand-made blobs named after Asunción's barrios, written to the geo folder,
  rendered with `maps:render`, checked with `verify:maps` and the contact sheet,
  then deleted — none of it is committed). It produced 53 images, ~1 MB, for
  one city; the output looked right at 640 and 1280 px.
- Fonts: labels use `DejaVu Sans, Verdana, Arial, Helvetica, sans-serif` via
  the renderer's fontconfig. The SVG is byte-deterministic; the WebP bytes
  depend on the fonts installed on the machine that renders.
- `<ZoneMap>` is not rendered by any page, so it has not been seen in a
  browser.

## What the founder runs

On a machine that can reach `overpass-api.de` (or after adding that domain to
the cloud environment's allowed domains), from a checkout of this branch:

```bash
npm install
npm run maps:fetch -- --dry           # read the report: admin levels, circle fallbacks, centroids outside outlines
npm run maps:fetch                    # writes src/content/places/geo/<city>.json (~61 cities, several minutes)
npm run maps:contact-sheet            # open maps-contact-sheet.svg, flag any outline that looks wrong (plan §5.5)
npm run maps:render                   # writes public/img/maps/** and maps-manifest.json
npm run verify:maps
git add src/content/places/geo public/img/maps && git commit
```

The district seats in Cordillera and Paraguarí added without coordinates
get a map only if OSM has their outline; with neither an outline nor a tree
centroid they are reported as "not drawable" and skipped.
