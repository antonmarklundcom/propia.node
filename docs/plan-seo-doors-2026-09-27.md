# Plan — how the domains work together without competing (2026-09-27)

**Status: proposal only. Nothing in this document is implemented.** Which
domain owns which kind of page is the founder's call; the decision table at the
end is what he answers. Everything below was checked against the code on
`main` as of this date and, where it says so, against a local build of it
(MariaDB 11.8, 53 fixture listings, every door fetched with its own `Host`
header). No Google product or API is used or proposed anywhere in this plan.

---

## 1. The short version

- **Today, three kinds of page are published more than once, in the same
  language, on different domains you own.** The biggest one: every land
  category page exists on `terreno.com.py` *and* on `inmobiliaria.com.py`
  (Spanish), and on `landforsaleparaguay.com` *and* `realestateinparaguay.com`
  (English). Each copy tells search engines "I am the original". The same is
  true of the rental grids on `rentparaguay.com` vs `realestateinparaguay.com`,
  and of every guide, price page and project page on the two land doors.
- **Search engines do not add those copies up. They pick one and mostly ignore
  the other** — and the one they pick is not necessarily the one you want.
  Worse, several domains carrying the same listings under near-identical
  templates is the pattern search engines call "doorway" sites; the thin-page
  rule in `src/lib/indexability.ts` was written to stay away from exactly that.
- **Recommendation in one line:** let the two marketplace doors
  (`inmobiliaria.com.py` in Spanish, `realestateinparaguay.com` in English) own
  every listing grid; turn the other doors into owners of *different* pages —
  land guides and land price data on the two land doors, services on
  `rentparaguay.com`, the realtor directory on `inmobiliarios.com.py` (already
  true) — and do not buy a second Spanish rental domain for now. §6 has the
  per-door detail and the one exception worth considering (`rentparaguay.com`
  owning the English rental grids).

---

## 2. Four words, in plain language

- **Canonical tag** — a line in a page's code that says *"if you find this
  content in several places, this URL is the one to rank."* It is how a site
  tells Google (and Bing) which copy is the original. It is a strong hint, not
  an order: if the pages are not really the same, or the "original" looks
  weaker, the search engine may ignore it.
- **noindex** — a line that says *"do not show this page in search results at
  all"* (links on it are still followed). Canonical *merges* two copies into
  one; noindex *removes* one.
- **hreflang** — a line that says *"this page also exists in another language,
  here."* It pairs translations (Spanish ↔ English) so each language's
  visitors get their own version. It is for translations only, never for two
  copies in the same language.
- **Sitemap** — the list of URLs a domain asks search engines to index. It
  must only contain pages that domain claims as the original; listing a page
  whose canonical points elsewhere is a contradiction search engines report as
  an error.

---

## 3. How a category page decides who it is, today

A category page is `/venta/luque`, `/venta/luque/terrenos`,
`/venta/asuncion/recoleta/casas`, `/alquiler/asuncion/departamentos`, …

1. **Its canonical is always the domain that served it.**
   `app/[operacion]/[...segments]/page.tsx:260-263` builds it from
   `siteOrigin()`, and `siteOrigin()` (`src/lib/origin.ts:64`) returns the
   serving host for every enabled door (`isOwnHost()`, `origin.ts:55`). There
   is no category equivalent of `ownsListingDetail` (detail pages,
   `origin.ts:97-134`) or `ownsDirectory` (`origin.ts:158`): every door is the
   "original" of its own category pages.
2. **What it lists is the door's filters ANDed with the path.**
   `verticals.ts` gives `terreno.com.py` and `landforsaleparaguay.com`
   `property_type: ["terreno"]` (lines 108, 272), the rental doors
   `operation: ["alquiler", "alquiler_temporal"]` (141, 165), and
   `realestateinparaguay.com` `foreign_exposure: true` (229).
   `inmobiliaria.com.py` (289) has no filter. `verticalConds()`
   (`src/lib/facet-sql.ts:49`) applies them to the grid, the count and the
   indexability decision alike.
3. **It is indexable from 3 listings** (`MIN_INDEXABLE = 3`,
   `src/lib/indexability.ts:23`), counted on that door's filtered set.
4. **It goes in that door's sitemap** whenever it is indexable:
   `src/lib/sitemap.ts:218-272`, gated only on `servesMarketplace`
   (`sitemap.ts:91`), which is false only for the directory door
   (`marketplacePagesEnabled()`, `src/design/sections.ts:458`).
5. **hreflang is emitted only by the door that holds its language's slot.**
   `alternatesFor()` (`src/lib/alternates.ts:176`) picks one door per locale
   per family; the serving host must be one of them or no tags are emitted
   (`alternates.ts:191`, `servingHost` supplied by
   `src/lib/alternates-server.ts:17`). So the land doors emit no hreflang on
   their category pages — correct, but it also means nothing tells a search
   engine how they relate to the marketplace's pages.

---

## 4. Where doors compete today — verified

Each row was confirmed two ways: by reading the code above, and by fetching
the pages from a local production build with each door's `Host` header and
reading back `<link rel="canonical">`, `<meta name="robots">` and the sitemap.

### 4.1 Land, in Spanish — `terreno.com.py` vs `inmobiliaria.com.py`

| URL | Lists | robots | canonical | in sitemap |
| --- | --- | --- | --- | --- |
| `terreno.com.py/venta/luque` | the 5 terrenos in Luque | index | itself | yes |
| `terreno.com.py/venta/luque/terrenos` | **the same 5** | index | itself | yes |
| `inmobiliaria.com.py/venta/luque/terrenos` | **the same 5** | index | itself | yes |

Three indexable, self-canonical URLs for one listing set in one language —
two of them on the same domain. The terreno door's untyped city page and its
`/terrenos` page are always the same set, because the door's filter already
fixes the type (`verticals.ts:108`). The same holds for every city and barrio
with 3+ terrenos, and for the national hubs: `terreno.com.py/venta` is "every
terreno in Paraguay", a set no marketplace page covers today (the marketplace's
`/venta?tipo=terrenos` is noindex by design — `docs/decisions-needed.md`, F-f),
so that one hub is *unique*, not a duplicate.

### 4.2 Land, in English — `landforsaleparaguay.com` vs `realestateinparaguay.com`

`landforsaleparaguay.com/venta/luque` and `/venta/luque/terrenos` (index,
self-canonical, in its sitemap) against `realestateinparaguay.com/venta/luque/terrenos`
(same). The sets differ only by listings whose owner opted out of foreign
exposure: the land door does **not** apply `foreign_exposure`
(`verticals.ts:272` vs `229`). That is a near-duplicate, and it is also a
policy question in its own right — see §4.6.

### 4.3 Rentals, in English — `rentparaguay.com` vs `realestateinparaguay.com` (live today)

`rentparaguay.com/alquiler/asuncion` and every `/alquiler/...` category under
it are index, self-canonical and in its sitemap; so are the same paths on
`realestateinparaguay.com`. Same language, same listings (again except
opted-out rows). **This one is live**: `rentparaguay.com`'s DNS has pointed at
this app since 2026-09-10.

### 4.4 Rentals, in Spanish — `alquiler.com.py` vs `inmobiliaria.com.py` (latent)

`alquiler.com.py/alquiler/asuncion` and `inmobiliaria.com.py/alquiler/asuncion`
list **identical** sets (the rental door's operation filter is implied by the
`/alquiler` path; `inmobiliaria.com.py` has no filter), both self-canonical,
both in their sitemaps. Harmless today only because nobody owns
`alquiler.com.py`, so nothing reaches it.

### 4.5 Not just categories: the land doors copy the whole marketplace

The land doors are `family: "marketplace"`, so their sitemap is
`MARKETPLACE_SITEMAP_PATHS` (`src/config/site-nav.ts:259`, chosen at
`sitemap.ts:144`), plus every `/precios/<ciudad>` (`sitemap.ts:278`), every
`/proyecto/*` (`sitemap.ts:326`) and every guide in the door's language
(`sitemap.ts:357`) — each self-canonical through `siteOrigin()`
(`app/guias/[slug]/page.tsx:50`, `app/financiamiento/page.tsx:30`,
`app/preguntas-frecuentes/page.tsx:20`, `app/proyecto/[slug]/page.tsx:48`).
So `terreno.com.py/guias/<post>` is the same Spanish article as
`inmobiliaria.com.py/guias/<post>`, and `landforsaleparaguay.com/guias/<post>`
the same English article as `realestateinparaguay.com/guias/<post>`. Price
pages are not even narrowed to land: the medians behind `/precios/<ciudad>`
are city-wide. This is a larger duplicate surface than the category pages.
(The rental doors do *not* have it: they submit their own page list,
`rentalSitemapPaths()`.)

### 4.6 Two findings that are not about ownership

- **`rentparaguay.com` declares a Spanish version on a domain nobody owns.**
  Every rental-family page on `rentparaguay.com` emits
  `hreflang="es"` → `https://alquiler.com.py/...` and `x-default` → the same
  (confirmed on `/alquiler/asuncion`, and pinned by `verify:seo` check (b)).
  `alquiler.com.py` is `enabled: true` (`verticals.ts:143`) so it can be
  previewed, but it does not resolve. Search engines drop an hreflang pair
  whose other side never answers, so the practical harm is small, but every
  page of a live domain currently points at a dead one. The fix is one flag
  (`enabled: false` on `alquiler.com.py` until it is bought) plus updating
  `verify:seo` (b), (d), (g); it is listed in the decision table rather than
  done here because it changes the rental family's shape.
- **Opted-out listings appear on English doors.** `listings.foreign_exposure`
  is documented as "opt-in to realestateinparaguay.com"
  (`src/db/schema.ts:136`) and only that door filters on it. The two other
  English doors — `landforsaleparaguay.com` and `rentparaguay.com` — show a
  listing whose owner opted out. Whether the opt-out means "not on
  realestateinparaguay.com" or "not to foreigners" is a founder decision about
  a promise made to sellers; adding `foreign_exposure: true` to those two
  doors' filters is one line each once decided.

---

## 5. The three ways to stop competing

All three keep every page reachable for visitors; they differ in which copy
search engines are told to rank.

### Option 1 — the specialist domain owns its niche

`inmobiliaria.com.py/venta/luque/terrenos` gets a canonical pointing at
`terreno.com.py/venta/luque/terrenos` and leaves `inmobiliaria.com.py`'s
sitemap; `terreno.com.py` owns every terreno grid in Spanish
(`landforsaleparaguay.com` the same in English).

- **For:** a visitor searching "terrenos en venta en Luque" lands on a site
  that is only about land; the domain name matches the search, which helps
  click-through a little.
- **Against:** the marketplace is where every listing's detail page lives
  (`ownsListingDetail`), where the guides and price pages are, and what the
  internal links point at, so it will build authority far faster than a
  land-only door. **Pointing a strong domain's canonical at a weaker one hands
  the ranking to the weaker domain** — if search engines trust
  `terreno.com.py` less, that land query ranks lower than it would have on
  `inmobiliaria.com.py`, and the canonical may simply be ignored. A matching
  domain name is a small signal today, not a large one.
- **Needs:** a real commitment to building `terreno.com.py` up (links, its own
  content) or it is a net loss.

### Option 2 — the marketplace owns everything; the others step back

Every feeder category page canonicalises to the marketplace door that owns it
in the feeder's language, leaves the feeder's sitemap, and the feeders focus
on content the marketplace does not have (guides, calculators, services).

- **For:** one strong domain per language collects every signal; simplest to
  reason about and to verify; the same pattern `ownsListingDetail` already
  uses for detail pages, so it adds no new idea to the code.
- **Against:** the feeders then rank for nothing listing-shaped. They still
  serve visitors who arrive by typing the domain, from ads or links, but they
  stop being search entry points for grids.

### Option 3 — split by intent (recommended)

The marketplace owns **listing grids** (option 2 for categories); each feeder
owns **pages the marketplace does not have and should not have** — pages about
a *topic* rather than a *list*. For the land doors that is land guides, land
price data and the national land hub; for `rentparaguay.com` it is its
services. Nothing is published twice in one language, and every domain has
something only it ranks for.

- **For:** no cannibalisation, no doorway pattern, and the feeders still earn
  search traffic of their own. Reversible: if a feeder grows strong, its
  grids can be handed to it later (option 1) with one flag per door.
- **Against:** the feeders' unique pages have to be written, one by one, with
  real content — which is the point, but it is work.

### What "canonical vs noindex" means for a feeder's grid

Under option 2 or 3 the feeder's grid pages should **canonicalise** to the
owner rather than go noindex: the canonical passes along whatever links the
feeder's page earned, while noindex throws them away. The one exception is a
feeder page with no equivalent on the owner (for example a feeder filtered to
two types where the owner has no two-type page); that page stays noindex on
the feeder.

---

## 6. Recommendation per door

| Door | Language | Owns (recommended) | Its category grids | Its other copies (§4.5) |
| --- | --- | --- | --- | --- |
| `inmobiliaria.com.py` | es | every Spanish listing grid, detail, price, guide and project page | self-canonical (as today) | the originals |
| `realestateinparaguay.com` | en | every English listing grid, detail, guide | self-canonical, hreflang-paired with the above (as today) | the originals |
| `terreno.com.py` | es | its national land hub (`/venta`), land guides, land price data, a land seller funnel | canonical → `inmobiliaria.com.py/<op>/<ciudad>/terrenos` (and the untyped city page to the same typed URL), out of its sitemap | guides/price/project/static marketplace pages canonical → `inmobiliaria.com.py`, out of its sitemap |
| `landforsaleparaguay.com` | en | "land for sale in Paraguay" (home + `/venta` hub), English land guides, land price data | canonical → `realestateinparaguay.com/<op>/<ciudad>/terrenos`, out of its sitemap | canonical → `realestateinparaguay.com`, out of its sitemap |
| `rentparaguay.com` | en | the rental-services business: services, about, contact (already its own pages) | **default:** canonical → `realestateinparaguay.com` (same path), out of its sitemap. **Exception:** see below | n/a — it already submits only its own pages |
| `alquiler.com.py` | es | not bought — see below | would be canonical → `inmobiliaria.com.py` | n/a |
| `inmobiliarios.com.py` | es | the directory (already, `ownsDirectory`) | none (308s to the marketplace) | none |

**The `rentparaguay.com` exception.** The domain had a WordPress site before
this app (backlog item 10(b) — its old redirects still need checking), so it
may carry search history for English rental queries that
`realestateinparaguay.com` does not. If the founder's old hosting stats or
analytics show that `rentparaguay.com` really did get rental search traffic,
reverse the direction for rentals only: `rentparaguay.com` owns the English
`/alquiler` and `/alquiler-temporal` grids and `realestateinparaguay.com`'s
rental grids canonicalise to it. The cost: those grids lose their Spanish ↔
English hreflang pair (hreflang never crosses families, `alternates.ts`), so
`inmobiliaria.com.py/alquiler/...` would have no declared English version. If
there is no evidence of old traffic, keep the default.

**Is a second Spanish rental domain worth buying?** Honestly, not for search,
and not now:

- Its listing grids would be identical to `inmobiliaria.com.py`'s `/alquiler`
  pages (§4.4), so under any option one of the two gets canonicalised away —
  and it would be the new, weaker domain.
- What it could own uniquely is the rental-services business in Spanish
  (property management and Airbnb management for Paraguayan landlords). That
  audience can be served from `inmobiliaria.com.py` pages (for example a
  landlord-services section) without a new domain to build up from zero, or
  left to `rentparaguay.com` if the business is mainly for foreign owners.
- The case *for* buying is brand, not search: if the founder wants a Spanish
  name for the management business to put on signs, cards and WhatsApp, a
  short exact-match domain helps recall. `alquiler.com.py` is not available
  today; `alquileres.com.py` is the named fallback in CLAUDE.md.
- Until a decision, set `alquiler.com.py` to `enabled: false` so
  `rentparaguay.com` stops declaring a Spanish version on a dead domain (§4.6).

**If the founder prefers option 1 for land after all:** do it with the same
mechanism in §7, pointing the other way (`inmobiliaria.com.py`'s terreno grids
→ `terreno.com.py`), and commit to building `terreno.com.py`'s authority
first. Revisit with six months of data (§9) rather than on day one.

---

## 7. Design — an `ownsCategories` flag, like `ownsListingDetail`

Same shape as the two ownership flags that exist, so it adds no new concept.

### 7.1 The flag

```ts
// src/config/verticals.ts, on VerticalConfig
/**
 * Whether this door's category pages (/{op}/{ciudad}[/{barrio}]/{tipo}) are
 * canonical here. A door that does not own them canonicalises each one to the
 * EQUIVALENT page — the same listing set — on the door that owns categories
 * in its own language, and leaves them out of its sitemap. Unset = true, so
 * adding the field changes nothing until a door opts out.
 */
ownsCategories?: boolean;
```

### 7.2 "Equivalent page" is a pure function

A feeder's page and the owner's page are equivalent when they list the same
rows. The feeder's filters have to be folded into the owner's path:

```ts
// src/lib/category-owner.ts — pure, no next/*, drivable by verify:seo
export function equivalentCategoryPath(
  feeder: VerticalConfig,
  shape: CategoryShape,     // from parseCategorySegments()
  operation: Operation,
): string | null {
  const types = feeder.filters?.property_type ?? [];
  // A single-type door's untyped page IS that type's page.
  const type = shape.kind === "city" ? (types.length === 1 ? types[0] : undefined) : shape.type;
  if (types.length > 1 && shape.kind === "city") return null; // no single equivalent → noindex
  const ops = feeder.filters?.operation;
  if (ops && !ops.includes(operation)) return null;            // the page is empty on this door anyway
  return categoryUrl({ operation, citySlug: shape.citySlug,
    barrioSlug: shape.kind === "barrio-type" ? shape.barrioSlug : undefined, type });
}
```

`foreign_exposure` is deliberately not part of the path: an owner that shows
*more* rows than the feeder (or fewer, by opted-out listings) is a
near-duplicate, which is what a canonical is for.

Then `categoryCanonicalOrigin()` / `hostOwnsCategories()` in `origin.ts`,
mirroring `listingCanonicalOrigin()` / `hostOwnsListingDetail()`; the category
page builds its canonical from those two; `buildSitemapEntries()` takes
`includeCategories` exactly like `includeListingDetail`; `alternatesFor()` gets
a `"category"` scope that only lists owners, like `"listing"`. The same flag
(or a sibling `ownsSitePages`) covers §4.5's guides/price/project pages, with a
same-path equivalence.

### 7.3 The `verify:seo` invariant — one owner per (locale, page type, listing set)

```ts
// scripts/verify-seo.ts — sketch
const SHAPES = every operation × {city, city-type for each type, barrio-type for each type};
for (const locale of ["es", "en"]) {
  const owners = new Map<string, string>(); // listing-set signature → host
  for (const door of servedDoors(CANONICAL_HOST).filter(d => d.config.locale === locale
         && marketplacePagesEnabled(d.config.key))) {
    for (const s of SHAPES) {
      const sig = listingSetSignature(door.config, s);   // ops ∩ path, types ∩ path, ignoring foreign_exposure
      if (sig === EMPTY) continue;                        // the page 404s/redirects on this door
      if (ownsCategories(door)) {
        check(`one owner for ${locale} ${sig}`, !owners.has(sig) || owners.get(sig) === door.host, …);
        owners.set(sig, door.host);
      } else {
        const target = equivalentCategoryPath(door.config, s);
        check(`${door.host} ${s} delegates to a page an owner serves`,
              target === null || ownerServes(locale, target), …);
      }
    }
  }
}
```

Note that the **same host** can fail it too: `terreno.com.py`'s `/venta/luque`
and `/venta/luque/terrenos` have the same signature, which is exactly the
within-door duplicate in §4.1 — the invariant forces one of them (the untyped
one, by `equivalentCategoryPath`) to canonicalise to the other.

The check runs in the pre-push hook with the rest of `verify:seo`, so a door
added later cannot quietly reintroduce the duplicate.

### 7.4 What stays exactly as it is

The listing detail rule, the directory rule, `MIN_INDEXABLE`, the rental
family's own pages, and every URL. Nothing redirects: every page still renders
on every door for visitors who reach it; only the canonical, the robots
directive for non-equivalent pages, the sitemap and hreflang change.

---

## 8. Landing pages per door — what each domain targets

Every page below must pass the same honesty rule the new category intro
follows (PR "Category pages: data-driven intro…"): built from real rows, no
invented facts, nothing published below a real threshold, and no
city × keyword spinning — twenty pages that differ only in the city name are
the doorway pattern this whole plan is avoiding.

| Door | Target searches (examples) | Page types it should own |
| --- | --- | --- |
| `inmobiliaria.com.py` | casas en venta en {ciudad}; departamentos en alquiler en {barrio}; propiedades en venta en Paraguay; precio del m² en {ciudad} | category grids (with the new intro and related links), `/precios/{ciudad}`, Spanish guides, national type pages once F-f is decided |
| `realestateinparaguay.com` | real estate in Paraguay; houses / apartments for sale in Asunción; buying property in Paraguay as a foreigner | English grids, English guides |
| `terreno.com.py` | terrenos en venta en Paraguay (its `/venta` hub — unique today); cómo comprar un terreno en Paraguay; lotes en cuotas; precio del terreno por m² en {ciudad}; vender mi terreno | national land hub, land guides (títulos, loteamientos, cuotas), a land price-per-m² page per city built from `market_medians` filtered to `terreno` and shown only above `MIN_RELIABLE_SAMPLE`, a seller form |
| `landforsaleparaguay.com` | land for sale in Paraguay; buying land in Paraguay as a foreigner; price of land per m² in {city} | home + national hub, English land guides, the English land price pages |
| `rentparaguay.com` | property management Asunción; Airbnb management Paraguay; Paraguay residency; virtual address Paraguay (and English rental grids only under the §6 exception) | the seven service pages it already has, `/about`, `/contact` |
| `inmobiliarios.com.py` | inmobiliarias en {ciudad}; agentes inmobiliarios en {ciudad} | the directory it already owns |

Finding the searches without Google tools:

- the site's own evidence — which categories get leads, what visitors type in
  the lead form and WhatsApp, what filters they use most;
- Bing Webmaster Tools (free) for impressions and keyword research, and
  IndexNow for fast (re)indexing on Bing and Yandex;
- how established Paraguayan portals title their pages (a manual look, not a
  scraper);
- the founder's own knowledge of how clients phrase things ("lote", "terreno
  en cuotas", "casa quinta").

---

## 9. Rollout (after the founder decides)

1. `verify:seo` invariant first (§7.3), written to *report* today's
   duplicates — it fails on `main` as it stands, which is the point.
2. The flag and the pure `equivalentCategoryPath()`, unset everywhere — no
   behaviour change, the invariant still reports.
3. Flip one door at a time, smallest first: `landforsaleparaguay.com`
   (newest, least to lose), then `terreno.com.py`, then the rental decision.
   Each flip is one line in `verticals.ts` plus the matching `verify:seo`
   expectation, in its own PR.
4. §4.5's site pages on the land doors, same mechanism.
5. The feeders' unique pages (§8), one PR per page type, each with its
   threshold and its own sitemap entry on its own door only.
6. Measure with what the site already sees, not with Google: search-engine
   referrers per host in the server logs (and in the analytics table planned
   in `docs/plan-agency-2026-09-26.md` batch 2, once it is on `main`), and Bing
   Webmaster Tools. Six months is a fair first read; canonical changes take
   weeks to settle.

---

## 10. Decisions for the founder

| # | Question | Options | Recommendation |
| --- | --- | --- | --- |
| S1 | Who ranks for land listings ("terrenos en venta en Luque")? | (a) `inmobiliaria.com.py`; `terreno.com.py` owns land guides and data instead · (b) `terreno.com.py` owns terreno grids; the marketplace points its terreno grids there · (c) leave as today (both compete) | **(a)** — the marketplace is already the stronger site; revisit (b) after six months if `terreno.com.py` has grown |
| S2 | Same question in English (`landforsaleparaguay.com` vs `realestateinparaguay.com`) | same three | **(a)**, and do it first (least to lose) |
| S3 | Who ranks for English rentals ("apartments for rent in Asunción")? | (a) `realestateinparaguay.com`; `rentparaguay.com` focuses on its services · (b) `rentparaguay.com`, if its old WordPress site had rental search traffic | **(a)**, unless you have evidence for (b) — check old hosting stats/analytics |
| S4 | The land doors' copies of guides, price and project pages (§4.5) | (a) canonical to the marketplace and out of their sitemaps · (b) leave as today | **(a)** |
| S5 | Buy a Spanish rental domain (`alquiler.com.py` / `alquileres.com.py`)? | (a) no — serve Spanish rentals from `inmobiliaria.com.py` · (b) yes, as a brand for the management business, not for search | **(a)** for now |
| S6 | Until S5 is decided, stop `rentparaguay.com` pointing hreflang at `alquiler.com.py` (a domain that does not resolve) | (a) set `alquiler.com.py` to `enabled: false` · (b) leave | **(a)** — one line plus three `verify:seo` expectations |
| S7 | Does "no foreign exposure" on a listing also keep it off `landforsaleparaguay.com` and `rentparaguay.com`? | (a) yes — add `foreign_exposure: true` to both doors · (b) no — it only means `realestateinparaguay.com` | your call: it is a promise made to sellers (§4.6) |
| S8 | Build the `ownsCategories` flag and the `verify:seo` invariant (§7) | (a) yes, before any flip · (b) no | **(a)** — needed for S1–S4 whatever you choose, and it stops the problem coming back |
