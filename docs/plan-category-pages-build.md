# Category pages, place pages and zone maps: build plan (2026-10-03)

Plan only. No code ships with this file. It turns two briefs into ordered
phases, one PR each:

- `docs/plan-empty-category-seo-2026-10-03.md` (decisions E-1..E-4 taken, the
  SEO strategy, the place content model, the zone-map idea);
- `docs/report-telegram-alerts-2026-10-03.md` §C (the open `Failed query`
  errors).

Both files are on branch `claude/magical-shannon-kkjlw5` and not yet on
`main`. The questions this plan cannot settle alone are in
`docs/decisions-needed.md` under **2026-10-03 — Category pages, place pages
and zone maps** (P-1..P-12). Each phase below names the decisions it waits
on.

**Goal.** Every valid category page (`/venta|alquiler/<ciudad>[/<barrio>]/<tipo>`)
always returns a working page. An empty page shows an honest empty state,
the CTAs (BuyerBrief, then WhatsApp, then SaveSearch), the nearest stock and
related links. Each priority place gets one page with 500–1000 words of its
own text, real photos, an FAQ and live market data. Every page gets a
generated zone-map image. The §C load problems are fixed first.

---

## 1. Phases in order

Each phase is one PR on its own `claude/<phase>` branch, cut from a fresh
`origin/main`, with `npm run verify:local` green before every push. No phase
touches `src/db/schema.ts`, auth or payments, so no phase is
`MIGRATION REQUIRED —`. If a phase turns out to need one, it stops and asks.

"Merge" says what happens once the PR is green. The founder confirms that
column in decision P-11. Until then every PR is opened and left for the
founder.

| # | Branch | What | Risk | Waits on | Merge |
|---|---|---|---|---|---|
| 1 | `claude/alerts-robots` | §C-1 error cause in alerts, robots.txt facet rules | Low (robots is SEO policy) | P-3 | Founder |
| 2 | `claude/location-cache-degrade` | §C-2 cached slug lookups, §C-3/§C-4 capped and degradable reads | Medium (hot path) | — | Founder |
| 3 | `claude/empty-category-state` | E-1/E-2/E-4: a 200 empty state, no redirect, "did you mean" on 404s, evergreen pages survive a missing DB row | **High** (indexability) | — | Founder |
| 4 | `claude/place-pages` | Place content model, registry, `/zonas/…` route, JSON-LD, excerpt on combination pages | Medium | P-1, P-2, P-6 | Founder |
| 5 | `claude/market-box` | Live market box: pure facts → sentences | Low | — | Agent, if P-11 allows |
| 6 | `claude/zone-maps-data` | OSM boundary fetch script and committed, simplified GeoJSON | Low (data only) | P-4, P-5, P-12 | Agent, if P-11 allows |
| 7 | `claude/zone-maps-render` | SVG → WebP renderer, `<ZoneMap>` with srcset, og:image | Medium (repo size, LCP) | P-4 | Founder |
| 8+ | `claude/places-<batch>` | Content: 2–3 places per PR, drafts first, verified later | Low (draft = noindex) | Founder photos and notes | Agent for drafts, if P-11 allows |

Phases 1 and 2 are independent of the rest and go first: they reduce live
500s today. Phase 5 can run in parallel with 4. Phases 6 and 7 can start
after 4 has fixed the place registry. Phase 8 repeats per batch.

### Phase 1 — `claude/alerts-robots` (report §C-1 and the crawl hygiene part of brief §5.4)

Files:
- `src/lib/error-alerts.ts`: `planErrorAlert()` adds a line built from
  `e.cause` (`code`, `errno`, `sqlState`, `message`, clipped). The throttle key
  (`errorKey`) takes the cause code too, so `ER_CON_COUNT_ERROR` and
  `Queue limit reached` on the same path are separate alerts. An error with
  no cause produces exactly today's text.
- `app/robots.ts`: disallow rules built from the facet query names in
  `src/lib/facets.ts` (one exported constant, so a new facet is disallowed
  without anyone remembering to), plus `vista` and `tipo_vacio`. The exact
  list and the `page` question are decision P-3. Each name gets two
  patterns, `/*?name=` and `/*&name=`.

Verify checks added:
- `verify:telegram`: a Drizzle-shaped error with `cause.code` produces the
  cause line. Two causes on one path are not merged by the throttle. A
  cause-less error's text is unchanged.
- `verify:seo`: every facet name from `facets.ts`, plus `vista` and
  `tipo_vacio`, is disallowed. No rule matches a bare category path, an
  evergreen path, a `/zonas/…` path or `/propiedad/…`. The sitemap line is
  still present.

After merge, the founder checks `https://<door>/robots.txt` on two doors and
the robots tester in Search Console.

### Phase 2 — `claude/location-cache-degrade` (report §C-2, §C-3, §C-4)

Files:
- `src/lib/queries.ts`: `resolveCity()` and `resolveBarrio()` read from one
  cached slug map (`unstable_cache` plus `singleFlight`, tag
  `CACHE_TAGS.locations`, TTL `CACHE_TTL.locations`). This follows the
  existing `listCities()` pattern at `queries.ts:58`. Uncached siblings
  (`resolveCityRaw`, `resolveBarrioRaw`) are added for scripts (AGENTS.md:
  "give it an uncached sibling"). The lookup itself is a pure
  `findCity(map, slug)` / `findBarrio(map, cityId, slug)`, so it is testable.
- **The writer.** `revalidateLocations()` already exists and is already
  called by the `seed:locations` job in `/admin/operaciones`
  (`app/admin/operaciones/jobs.ts:250`). A run from the CLI cannot drop a
  Next.js tag, so the TTL is the backstop. The phase adds one line to the
  CLI's output saying so, and an `ops` note in CLAUDE.md "Caching": "after a
  CLI `seed:locations`, new places appear within `CACHE_TTL.locations`; run
  it from `/admin/operaciones` to see them at once."
- `src/components/ListingBrowser.tsx`: the five-read `Promise.all` goes
  through `loadSections()` with a concurrency cap of 2. The listings read
  stays essential. `listCities`, `listCityBarrios` and `stockedPathsOrNull`
  degrade through `src/lib/degrade.ts`: an empty list, and `null` for
  "show every link".
- `app/api/mapa/route.ts`: a pool-pressure error (`isPoolPressureError`)
  returns `503` with `Retry-After` and `{ ok: false, degraded: true }`
  instead of a 500. `CategoryMap` already handles a non-ok answer; the phase
  checks that it does.
- `app/datos/page.tsx`: the `projects` count and the other non-essential
  aggregates go through `orDegraded()`.

Verify checks added:
- `verify:routing` (pure): `findCity` / `findBarrio` on a fixture map, which
  covers a barrio slug that exists under another city.
- The existing degrade checks get a case: a section that throws a
  pool-pressure error returns its fallback and does not throw. A
  non-pressure error still throws.

What cannot be verified here: real pool pressure. The phase's PR says so.
The alert text from phase 1 is what confirms or rejects the
connection-exhaustion hypothesis after deploy.

### Phase 3 — `claude/empty-category-state` (E-1, E-2, E-4, and report §A hardening)

Files:
- `src/lib/indexability.ts`: `getIndexability()` no longer returns `gone`
  for a valid combination. 0 listings and not evergreen gives `noindex`.
  `gone` stays in the type only for "not a valid page" (see below). The
  doc comment and ARCHITECTURE.md §4.3 are updated in the same commit.
- `app/[operacion]/[...segments]/page.tsx`:
  - the `gone` branch, `emptyRedirectTarget()` and the evergreen-only
    breadcrumb pruning go, because ancestors no longer 404 or redirect;
  - an old `?tipo_vacio=` link still renders its notice. It is harmless, and
    there are links to it in the wild;
  - `resolve()` falls back to `location-tree.ts` (name and centroid, count
    0) when a slug is in the static tree but missing from the database, so
    a registered evergreen page never 404s again (report §A-1).
- **What "valid" means**, chosen here, not a founder call: a known
  operation, a city (DB or tree), an optional barrio under it, and a type
  **the serving door's `filters` allow**. `/venta/asuncion/casas` on
  terreno.com.py (land only) is not a valid page on that door and keeps
  today's behaviour, so a land site never says "no hay casas". Unknown
  slugs still 404.
- New `src/components/EmptyCategory.tsx` plus a pure
  `src/lib/empty-state.ts` that decides what it shows:
  1. an honest line, `t.emptyNow(type, op, place)`: "No hay casas en alquiler
     en Loma Pytã en este momento";
  2. CTAs in E-4 order: `BuyerBrief` (prefilled, not collapsible), then the
     WhatsApp button when `CONTACT_WHATSAPP` is set, then `SaveSearch` when
     email is configured;
  3. nearest stock, at most 3 groups, never a link to a page with 0
     listings: the same type in sibling barrios or the city (nearest by
     centroid), the same place in the other operation, and other types here.
     This is built on `relatedCategoryLinks()` and `getCategoryInventory()`,
     and each read is `orDegraded()`;
  4. related evergreen pages and guides (`guide-links.ts`);
  5. the place excerpt and link, once phase 4 exists;
  6. the zone map, once phase 7 exists.
- `app/not-found.tsx`: a "¿Quisiste decir …?" link built from a pure
  `closestSlug()` (edit distance over city and barrio slugs, threshold 2).
- `src/lib/sitemap.ts`: evergreen paths whose location is missing from the
  database are left out until `seed:locations` runs (report §A-3).
- `src/i18n/es.ts` and `en.ts`: the new strings, as peers.

Verify checks added (`verify:seo`, all pure):
- `getIndexability` never returns `gone` for `listingCount: 0` with a valid
  shape. At 0 listings it returns `noindex`, and `index` when evergreen.
- The sitemap builder leaves out every 0-stock non-evergreen path, and
  every evergreen path whose location is flagged missing.
- `emptyStateModel()`: the CTA order is brief, then WhatsApp, then alert.
  WhatsApp is absent when the number is null, and the alert is absent
  without email. No nearest-stock link has count 0. There are at most 3
  groups.
- `closestSlug()`: `"san-lorenso"` finds `san-lorenzo`; a far-off slug finds
  nothing.
- A door-filtered type is not valid on that door (terreno + casas).

Risk and why: this changes thousands of URLs from 404/307 to 200 noindex. A
mistake indexes empty template pages site-wide, which is exactly what E-2
forbids. The verify checks above are the guard. After deploy, the founder
spot-checks one empty URL per door: `noindex,follow` in the source, absent
from `sitemap.xml`.

### Phase 4 — `claude/place-pages` (brief §3, §5.2)

Files:
- `src/content/places/types.ts`, `src/content/places/index.ts`: the type and
  registry (§3 below), pure like `src/content/evergreen/`.
- The route: `app/zonas/[ciudad]/page.tsx` and
  `app/zonas/[ciudad]/[barrio]/page.tsx` (URL per P-1). A static `zonas`
  segment wins over `app/[operacion]`. `"zonas"` joins
  `MARKETPLACE_PATH_ROOTS` (`src/config/site-nav.ts`), so a door without
  marketplace pages 308s it like `/guias`.
- `src/lib/place-path.ts`: `placePath(citySlug, barrioSlug?, locale)`. The
  URL is spelled in one place, as `rentalPath()` does, so P-1(b) is an edit
  to one function, not to every call site.
- `src/components/PlacePage.tsx`: a real-photo hero (eager,
  `fetchpriority="high"`), the lede, the market box (phase 5), the sections,
  the photo gallery with captions and credits, the FAQ, the zone map
  (phase 7), links to every type page here that has stock or is evergreen,
  barrio links, and related guides.
- `src/lib/indexability.ts`: `getIndexability()` takes `placeVerified`. A
  place page is indexable on its owner door when its file has
  `status: "verified"` (E-2, P-6). A draft renders `noindex,follow` and is
  not in the sitemap.
- The sitemap and `languageAlternates()` get a `place` scope. hreflang pairs
  only two verified files for the same place.
- JSON-LD: `BreadcrumbList`, `Place` (name, `geo` from the tree centroid,
  `containedInPlace` for a barrio), `FAQPage` from the file's FAQ.
- The combination page (`app/[operacion]/…`) and `EmptyCategory` show the
  place's `excerpt` plus a link "Guía de <lugar>" when a file exists. An
  evergreen page gets only the link, because it has its own text.
- One draft file ships as a fixture: **Asunción**, status `draft`, so the
  route is exercised. It is noindex until the founder verifies it.

Verify checks added: every rule in §3.3 below.

### Phase 5 — `claude/market-box` (brief §5.3)

Files:
- `src/lib/market-box.ts` (pure): inventory rows, medians and price bands go
  in; a list of `{ kind, values }` facts comes out. A fact is emitted only
  when its sample meets the existing reliability threshold (`cityPricesFor`'s
  `reliableSample`). The "last updated" fact is the newest `published_at` in
  the set.
- `src/components/MarketBox.tsx`: renders the facts through i18n functions,
  with numbers formatted by `numberLocaleFor()`. Content files never hold a
  number.
- Used on the place page, the empty state, and indexable category pages
  (replacing the ad-hoc `pricesAside` sentence, so there is one source).

Verify checks added (`verify:prices` or `verify:seo`, pure): no median fact
below the sample threshold; a type with count 0 emits no fact; the same
input gives the same output in `es-PY` and `en-US` apart from formatting.

### Phase 6 — `claude/zone-maps-data` (brief §7, boundary data)

Files:
- `scripts/maps-fetch.ts` (`npm run maps:fetch -- --dry`): for each place in
  `location-tree.ts`, it queries OpenStreetMap through Overpass for the
  boundary relation, plus water areas and trunk/primary roads inside the
  city's bounding box. It simplifies the geometry (Douglas–Peucker, about
  2–5 m tolerance at the render scale), rounds coordinates to 5 decimals, and
  writes `src/content/places/geo/<city>.json`: the city outline, its barrios,
  water and roads, each feature with `osmRelationId` or `osmWayId`, `name`,
  `fetchedAt`, `licence: "ODbL-1.0"`. `--dry` prints what it would write and
  any place it could not match.
- A place with no polygon in OSM gets `{ fallback: "circle" }` and is
  rendered as a soft circle at its centroid. The script lists them; nothing
  is hand-drawn.
- **Network:** this cloud session cannot reach `overpass-api.de`,
  `download.geofabrik.de` or `nominatim.openstreetmap.org` (the environment's
  network policy answers 403). Either the founder adds `overpass-api.de` to
  the environment's allowed domains, or runs `npm run maps:fetch` once
  locally and commits the output (P-12). The script needs no credentials.
- `scripts/maps-contact-sheet.ts`: one SVG with every outline and its name,
  for the founder to eyeball against reality before phase 7 renders
  anything.

Verify checks added: a new `verify:maps` in `verify:local`. Every
place-registry entry and every evergreen path's place has a geo feature or an
explicit circle fallback. Every feature carries `licence` and an OSM id. A
barrio polygon's centroid lies inside its city polygon. The files stay under a
size budget (for example 150 KB per city).

### Phase 7 — `claude/zone-maps-render` (brief §7, images)

Files:
- `src/lib/zone-map/svg.ts` (pure): geo plus a page reference produce an SVG
  string. It uses an equirectangular projection scaled by cos(latitude), the
  site palette tokens from `docs/visual-identity-2026-09.md`, the page's zone
  filled and outlined, the neighbouring barrios labelled, water and main
  roads, the type badge (one icon per `PropertyType`, inline paths, no AI)
  with the operation, and a small "© OpenStreetMap" in the image corner.
- `scripts/maps-render.ts` (`npm run maps:render`): SVG → `sharp` → WebP at
  640 and 1280 wide, 4:3, plus a 1200×630 og variant. Output goes to
  `public/img/maps/<city>[/<barrio>]/…`. Rendering happens on a dev or
  session machine and the WebP files are committed, so no font or `sharp`
  work happens at request time or on Hostinger's build.
- **Which images exist** (P-4, recommended hybrid): one base map per place
  (city or barrio highlighted, no badge) for every place in the tree, and
  a per-URL map (zone plus type badge) for every evergreen path and place
  page. Every other combination shows its place's base map with the type
  badge as an HTML overlay. That covers every page on day one, and the file
  count stays bounded as stock changes.
- `src/components/ZoneMap.tsx`: `<img srcset="…640w, …1280w"
  sizes="(max-width: 768px) 100vw, 640px" width height loading="lazy"
  decoding="async">`, alt text from i18n ("Mapa de Asunción con Villa Morra
  resaltado, casas en venta"), and a visible caption credit "© OpenStreetMap
  contributors" linking to `https://www.openstreetmap.org/copyright`. On
  mobile it sits below the CTAs and is lazy. On desktop it sits in the side
  column.
- og:image: place pages and evergreen pages use their og variant. Others keep
  the door image (`doorOgImages`).

Verify checks added (`verify:maps`): the SVG builder is deterministic (same
input, same hash). Every per-URL image the hybrid rule requires exists at
both widths and as og. Every `ZoneMap` usage passes non-empty alt text. The
credit string is present in the component. The total size of
`public/img/maps` stays under a budget (proposed 25 MB; P-4).

### Phase 8+ — `claude/places-<batch>`: the content loop

Per batch of 2–3 places:
1. The founder sends photos and notes (§5).
2. The session drafts each place file. A subagent (Sonnet 5.5 or Opus 5.5,
   medium effort, never Fable) drafts from a spec carrying the outline, the
   founder's notes, the place's keyword group from `docs/kwp/…`, and the
   rules in §3.3. The session reviews every draft against the notes, removes
   anything not supported, and fills `claimsToVerify`.
3. Photos go through `scripts/place-photos.ts` (`sharp`: 640, 1280, 1920;
   WebP and AVIF, like `public/img/premium/`), into `public/img/places/<slug>/`.
4. The PR merges with `status: "draft"`, so the page is live but noindex.
5. The founder checks each claim and replies with corrections. The session
   fixes the text and flips the file to `status: "verified"` with
   `verifiedAt`. That PR makes the page indexable.
6. English peers only for the places in P-7.

Later, as a separate step after Search Console data (`/admin/google`):
promote the strongest combinations to evergreen (see the "Target URL"
column in §2).

---

## 2. Priority places (from `docs/kwp/real-estate-paraguay-2026-10-01.md`)

Volumes are monthly searches. Cities use the file's "Places (deduplicated)"
table. Barrios (not in that table) are summed from the Part 3 phrases that
name them, counting each phrase once. **Noise** means the place name is
shared with a place outside Paraguay (Chile, Argentina, Spain, Texas) and the
total includes some of those searches. The top phrases are verbatim from the
file.

| # | Place | Level | In tree? | Searches/mo | Top phrases (searches/mo) | Target URL for the top phrase |
|---|---|---|---|---|---|---|
| 1 | Asunción | ciudad | yes | 1,210 | casa en asuncion venta (390); venta de casa en asuncion (140); alquiler de oficinas asuncion (50) | evergreen `/venta/asuncion/casas` (exists). The place page takes the "vivir/barrios" angle |
| 2 | Encarnación | ciudad | yes | 880 | departamentos encarnacion (390); inmobiliaria encarnacion (90); alquiler temporal encarnación (50) | evergreen `/alquiler/encarnacion/departamentos` exists. Promote `/venta/encarnacion/departamentos` |
| 3 | Ñemby | ciudad | yes | 820 | alquileres en ñemby (260); alquiler de casas baratas en ñemby (140); casa independiente para alquilar en ñemby (70) | promote `/alquiler/nemby/casas` to evergreen; place page `/zonas/nemby` |
| 4 | Lambaré | ciudad | yes | 790 | departamentos lambare (170); casa en venta en lambare (140); alquiler de departamentos en lambaré baratos (90) | evergreens exist for houses (sale and rent) and rented flats |
| 5 | Ciudad del Este | ciudad | yes | 720 | ciudad del este departamento (170); departamentos ciudad del este (140); inmobiliaria ciudad del este (140) | evergreen `/alquiler/ciudad-del-este/departamentos` exists |
| 6 | Villa Elisa | ciudad | yes | 570 | alquileres económicos zona villa elisa (110); alquiler de casa villa elisa (90); casas en venta villa elisa (90) | promote `/alquiler/villa-elisa/casas` |
| 7 | Luque | ciudad | yes | 560 | barrio cerrado la providencia luque (170); barrio cerrado luque (170); barrio cerrado en luque (70) | place page: a "barrios cerrados" zones section. No page per development (a named development is a brand) |
| 8 | San Lorenzo | ciudad | yes | 530 | la paraguaya inmobiliaria san lorenzo (90); inmobiliaria san lorenzo (70); inmobiliaria del este san lorenzo (50) | mostly agency brand names. Place page, plus a link to the agency directory |
| 9 | Barrio Jara (Asunción) | barrio | yes | 350 | alquiler barrio jara (110); alquileres baratos en barrio jara (110); alquiler departamento barrio jara (30) | place page `/zonas/asuncion/barrio-jara`. Promote `/alquiler/asuncion/barrio-jara/departamentos` later |
| 10 | Villa Morra (Asunción) | barrio | yes | 260 | alquileres baratos en villa morra (50); departamentos villa morra (50); alquiler villa morra (40) | place page |
| 11 | Recoleta (Asunción) | barrio | yes | ~440, **noise** | departamentos en pozo recoleta (10); alquiler local recoleta (10); apartamentos recoleta (10) | place page. The real Asunción share is unknown (P-9) |
| 12 | Concepción | ciudad | **no** | 650, **noise** | casas en concepcion (170); departamentos en concepcion (170) | needs a tree entry first (P-8) |
| 13 | Villarrica | ciudad | **no** | 460, **noise** | casas villarrica (40); villarrica terrenos (30); casas en venta villarrica (20) | needs a tree entry first (P-8) |
| 14 | San Antonio | ciudad | yes | ~390, **noise** | casas en san antonio (30); casas en venta san antonio (20) | place page; noise check first (P-9) |
| 15 | Hernandarias | ciudad | yes | 110 | casas hernandarias (110) | place page |

Left out on purpose:
- **Brand or project names:** "tavamay mora cue" (720), "locales en
  multiplaza" (210), "matrisa carmelitas" (90). Per the keyword file's own
  rule, no pages target them.
- **Mostly foreign:** Pilar (330, mostly Pilar in Buenos Aires).
- **No volume in this file:** San Bernardino, Fernando de la Mora, Areguá,
  Mariano Roque Alonso (10), Loma Pytã, Capiatá (20). They already have
  evergreen pages from the earlier keyword export. Whether they still get a
  place page is P-10. `docs/decisions-needed.md` S10 quoted ~210/mo for
  "terrenos en san bernardino" from that earlier export, and this file shows
  0. Both numbers are Keyword Planner's; the discrepancy is recorded, not
  resolved.

**Proposed batches:** 1: Asunción, Encarnación, Ñemby. 2: Lambaré, Ciudad
del Este, Villa Elisa. 3: Luque, San Lorenzo, Barrio Jara. 4: Villa Morra,
Recoleta, Hernandarias. 5: San Antonio, Concepción, Villarrica (after P-8 and
P-9).

---

## 3. The place content file

### 3.1 Location and naming

`src/content/places/<city>.ts` or `src/content/places/<city>--<barrio>.ts`,
with an `en-` prefix for an English peer. They are registered in
`src/content/places/index.ts`. Pure data: no `next/*`, no drizzle.

### 3.2 Type

```ts
export interface PlacePhoto {
  file: string;            // basename under public/img/places/<slug>/ (sizes generated)
  alt: string;             // what it shows and where; no digits
  caption: string;
  credit: string;          // "Foto: Anton Marklund" / photographer / licensor
  licence: "own" | "licensed" | "cc-by" | "cc-by-sa";
  sourceUrl?: string;      // required for cc-*
}

export interface PlacePage {
  city: string;            // slug in location-tree.ts
  barrio?: string;         // slug under that city
  door: VerticalKey;       // owner door (P-2); locale comes from the door
  status: "draft" | "verified";
  verifiedAt?: string;     // ISO date, required when verified
  keyword: string;         // main search from docs/kwp/…
  secondaryKeywords: readonly string[];
  h1: string;
  metaDescription: string; // ≤ 155 chars
  lede: string;
  excerpt: string;         // 40–80 words; shown on every combination page here
  overview: Section;                     // what the place is, why people look there
  zones: { title: string; intro: string; // which areas are which
           items: readonly { name: string; text: string; typicalTypes: readonly PropertyType[] }[] };
  whoItSuits: Section;                   // families, students, retirees, investors, weekend
  access: Section;                       // roads, time to the centre, buses
  services: Section;                     // schools, health, shopping, banks
  buying: Section;                       // title, loteamiento, flooding, ANDE/ESSAP
  renting: Section;                      // contracts, garantía, seasonality
  faq: readonly { q: string; a: string }[]; // 4–6, real questions
  photos: readonly PlacePhoto[];         // 5–8 when verified
  relatedGuides?: readonly string[];     // /guias slugs
  namesWithDigits?: readonly string[];   // proper names only, e.g. "Km 7"; see rule (f)
  claimsToVerify: readonly string[];     // every factual claim above
}
type Section = { title: string; paragraphs: readonly string[] };
```

The outline is the founder's list from the brief §4.2. Section titles are
written per place, never shared (rule (g)).

### 3.3 `verify:seo` rules for place files

(a) `city` exists in `location-tree.ts`, and `barrio`, if set, exists under
    that city. One file per (place, door).
(b) The door serves marketplace pages and is the owner per P-2.
(c) The main keyword is not another place's or an evergreen page's main
    keyword. A secondary keyword is not another page's main keyword.
(d) Words of its own (headings, prose and FAQ, the same way
    `evergreenWordCount` counts) are between 500 and 1000.
(e) 4–6 FAQ entries. `FAQPage` JSON-LD is built from them.
(f) **No digits** in any prose, FAQ, caption, alt, lede, excerpt or meta.
    The only exception: a phrase listed in `namesWithDigits` (a proper name
    such as "Km 7"), which must also appear in `claimsToVerify`.
(g) **No shared paragraph** with any other place file or any evergreen file.
    Section titles are compared too.
(h) **No swapped-name template:** after replacing each file's own place
    names with a token, no two place files share more than 15% of their
    5-word shingles. This catches the doorway pattern that rule (g) misses
    when one word differs per paragraph.
(i) `claimsToVerify` is not empty. `status: "verified"` requires `verifiedAt`
    and 5–8 photos.
(j) Every photo: the file and its generated sizes exist; alt is 1–125
    characters; credit and licence are set; `cc-*` needs `sourceUrl`.
(k) The excerpt is 40–80 words and is not a paragraph of the body.
(l) Meta description ≤ 155 characters; the H1 contains the place name.
(m) No competitor or portal name in prose (a deny list, starting with
    Infocasas, Clasipar, InmoClick and the brand phrases in the keyword
    file).
(n) Indexable on its door if and only if verified. In the sitemap of that
    door only, if and only if verified. hreflang only between two verified
    peers.

---

## 4. Boundary data for the maps

- **Source:** OpenStreetMap, through the Overpass API (`overpass-api.de`).
  Boundary relations (`boundary=administrative`) for the cities and, where
  mapped, the barrios. Water (`natural=water`, `waterway=riverbank`) and
  `highway=trunk|primary` give context. Which `admin_level` Paraguay's
  distritos and Asunción's barrios use is confirmed by the first `--dry`
  run, not assumed here. A place with no polygon gets the centroid circle.
- **Licence:** Open Database License 1.0 (ODbL). The rendered WebP images
  are a *Produced Work*, so the obligation is attribution. The simplified
  GeoJSON in `src/content/places/geo/` is a *Derivative Database*. It is
  used only to render images and is not served publicly, which keeps
  share-alike from applying to it. If it were ever served as data (for
  example to a client-side map), it would have to be offered under ODbL.
  This is a summary, not legal advice; P-5.
- **Credit:** "© OpenStreetMap contributors" linking to
  `https://www.openstreetmap.org/copyright`. It goes visibly under every map
  on the page and small inside the image itself, so a hot-linked or shared
  image keeps it.
- **Alternatives considered:** geoBoundaries (distritos only, no barrios, and
  its licence varies by country source) and DGEEC/INE census cartography
  (its licence is unclear for reuse). OSM is the only source with barrio
  outlines and a clear licence.

---

## 5. What the founder provides, per place

1. **Photos: 5–8.** A landmark or the centre, a typical street, typical
   houses or buildings, an aerial if possible, and something distinctive.
   Landscape, at least 1600 px wide. Per photo: one line saying what it
   shows and where (it becomes the alt and caption), who took it, and the
   licence (yours, or licensed with the source). No AI image that presents
   itself as the place.
2. **Notes, rough is fine.** Which zones are which and where each property
   type is typical, who lives there, how people get to Asunción or the
   centre, the main services, what to check when buying or renting there,
   seasonality, and 4–6 questions people really ask you. **No prices or
   counts are needed**; those come from live data.
3. **Claim checks.** Each draft PR lists `claimsToVerify`. Reply per claim:
   ✓, a correction, or "remove". Nothing becomes indexable until this is
   done.
4. **For new places** (Concepción, Villarrica): the departamento and a
   centroid you trust, then `seed:locations` and `cron:geo` on production
   after the merge.
5. **For the maps (once):** look at the contact sheet from phase 6 and flag
   any outline that does not match the place as people know it.

---

## 6. Subagents

The same-shaped work gets delegated: per-place drafts, photo manifests, and
evergreen promotions later. Each runs on Sonnet 5.5 or Opus 5.5 at medium
effort, **never Fable** (AGENTS.md §6). Each gets a self-contained spec: the
type in §3.2, the rules in §3.3, the founder's notes, the keyword group and
one finished file as the model. The session reviews every file before
committing: it checks claims against the notes, cuts anything invented,
checks digits and shared paragraphs, and runs `verify:seo`. Infrastructure
phases (1–7) are written by the session itself.

## 7. Not verified while writing this plan

- No production URL, log or database was reachable. The §C diagnosis stays
  the report's hypothesis until phase 1's alert names the MySQL error.
- OSM boundary coverage for Paraguay's barrios was not checked: the network
  policy blocked Overpass from this session.
- The barrio volumes are sums over the Part 3 phrases (the top 5,000), not
  the file's own deduplicated place totals, which cover cities only.
