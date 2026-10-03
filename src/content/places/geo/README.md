<!--
  LICENCE AND SERVING RULE — read before using anything in this folder.

  The `<city-slug>.json` files here are OpenStreetMap data, © OpenStreetMap
  contributors, available under the Open Database License 1.0 (ODbL-1.0,
  https://opendatacommons.org/licenses/odbl/1-0/). Simplified and clipped as
  they are, they are a *Derivative Database* of OSM.

  1. They are used ONLY to render the zone-map images (`npm run maps:render`).
     The rendered WebP files in `public/img/maps/` are a *Produced Work*: the
     obligation for those is attribution.
  2. The GeoJSON is NEVER served publicly — no route, no API, no client
     component, no copy under `public/`. App code may import
     `maps-manifest.json` (a list of image paths) and nothing else from this
     folder; `npm run verify:maps` fails if anything under `app/` or `src/`
     imports a geo file. Serving it as data (for example to a client-side map)
     would trigger ODbL share-alike: the database would then have to be
     offered under the ODbL too. That is a founder decision (plan P-5), not an
     implementation detail.
  3. Credit: every image carries "© OpenStreetMap" inside it, and every page
     that shows one renders a visible caption "© OpenStreetMap contributors"
     linking to https://www.openstreetmap.org/copyright (`<ZoneMap>` does it;
     do not render a map image without it).

  This is a summary, not legal advice.
-->

# Zone-map boundary data

Geo files for the zone maps (`docs/plan-category-pages-build.md`, phases 6–7).
One file per ciudad in `src/lib/ops/location-tree.ts`, named by its slug:
the city outline, its barrios (the tree's own, matched by name, plus the other
OSM subdivisions inside the city for context), water and trunk/primary roads,
simplified (Douglas–Peucker, 4–8 m) and rounded to 5 decimals. Every feature
carries `osmId`, `osmType`, `name`, `fetchedAt` and `licence: "ODbL-1.0"`. A
tree place OSM has no polygon for is stored as `{ "fallback": "circle" }` with
the tree's centroid and drawn as a soft circle; nothing is hand-drawn.

`maps-manifest.json` lists the rendered images and is what `<ZoneMap>` reads.
With no geo files committed it is empty and `<ZoneMap>` renders nothing.

## Fetching (`maps:fetch`)

The script queries the public Overpass API at `overpass-api.de`: one request
at a time, a pause between requests, backoff on 429/5xx. It needs no
credential and no database. **Cloud sessions cannot reach `overpass-api.de`**
(the environment's network policy answers 403), so either:

- run it on your own machine, or
- add `overpass-api.de` to the cloud environment's allowed domains first.

Then, from a fresh checkout of the branch:

```bash
npm install
npm run maps:fetch -- --dry                 # fetches, prints what it would write and every place it could not match
npm run maps:fetch -- --dry --only asuncion # one city
npm run maps:fetch                          # writes src/content/places/geo/<city>.json
npm run maps:contact-sheet                  # writes maps-contact-sheet.svg — open it in a browser and check every outline
npm run maps:render -- --dry
npm run maps:render                         # writes public/img/maps/** and maps-manifest.json
npm run verify:maps
```

A full run is roughly 4 requests per city (~60 cities), so expect several
minutes. The `--dry` report lists the OSM `admin_level` each place matched at
(Paraguay's levels are recorded, not assumed), every place drawn as a circle,
and every matched outline that does not contain the tree's centroid — check
those before committing.

Commit the geo files, the images and the manifest together. Budgets checked
by `verify:maps`: 150 KB per geo file, 25 MB for `public/img/maps/`.
