# Empty category pages and place content: brief for a planning session (2026-10-03)

The founder wants every category page (`/venta/<ciudad>[/<barrio>]/<tipo>`,
`/alquiler/…`) up 100% of the time. When it has no listings it should not
404 or redirect, and it should carry unique text, a CTA and related links. The
goal behind that is to **rank in Google for these searches**. This document is
the brief for a planning session. Background: `docs/report-telegram-alerts-2026-10-03.md`
§E.

## 1. Decisions taken (founder, 2026-10-03: "use all 4")

| # | Decision |
|---|---|
| E-1 | A valid but empty category page renders **200** with an empty-state page. The redirect to the parent (`?tipo_vacio=`) and the 404 both go away for valid combinations. An unknown city or barrio slug still 404s. |
| E-2 | An empty page without its own written content is **`noindex,follow` and stays out of the sitemap**. It becomes indexable when it has stock (the existing count rule) **or** its own content (evergreen, and the new place content in §3). The founder's goal is ranking, and §2 explains why indexing empty template pages works against that. |
| E-3 | Place text is written as an AI draft, and the founder checks it against a `claimsToVerify` list per place. This is the same workflow as evergreen pages. |
| E-4 | CTA order on an empty page: 1. BuyerBrief ("contanos qué buscás"), 2. WhatsApp (when `NEXT_PUBLIC_CONTACT_WHATSAPP` is set), 3. SaveSearch email alert (when email is configured). |

## 2. How to win these searches (the SEO advice)

Google ranks a category page for "casas en venta en San Bernardino" when the
page **satisfies the searcher better than Infocasas, Clasipar or an
agency's page**. In order of weight:

1. **Real listings.** Inventory is the strongest signal and the reason people
   click. An empty page can rank for a while on content, but it will not hold a
   position against pages with stock. Every listing added helps every page it
   appears on.
2. **Unique, useful content about the place**, written for a buyer or renter,
   not for a keyword. Cover what the zones are like, who lives there, access,
   services, what kinds of property exist, what to check before buying or
   renting there, and an FAQ. It must come from real knowledge and real
   photos. Text that is a template with the city name swapped is the
   **doorway / scaled-content pattern Google penalises site-wide**, not only on
   that page. That is why `verify:seo` already refuses shared paragraphs.
3. **Live data on the page.** Show the count, median price per type, the price
   bands, nearest listings, and the date last updated. These come from the
   database (`getCategoryInventory()`, `getPriceBandCounts()`,
   `cityPricesFor()`). They differ for every page **and are true**, and they
   make thin template pages look different without inventing anything.
4. **Internal links:** place hub ↔ its type pages ↔ its barrios ↔ related guides
   ↔ listings. Every indexable page should be reachable in a few clicks from
   the home page and listed in the sitemap.
5. **Matching titles and H1s** to the real query: "Casas en venta en San
   Bernardino". The keyword data is in `docs/kwp/real-estate-paraguay-2026-10-01.md`,
   which has a places section and search volumes. **Only build place pages
   where that file shows volume.**
6. **Structured data:** `BreadcrumbList` and `ItemList` exist; add `FAQPage` for
   the place FAQ and `Place` with geo for the place hub.
7. **Crawl hygiene:** keep Google on the pages that matter. Today
   `robots.txt` allows every `?vista=mapa&precio_max=…&barrio=…` combination,
   which makes an unbounded crawl space across six domains. Disallow the facet
   and map parameters and keep clean URLs crawlable. This also cuts bot load on
   the server (see §6).
8. **Off-site:** Google Business Profile and a few local links (agencies,
   developers, municipal or tourism sites linking to a place page).

**Do not** index thousands of empty combinations hoping some rank. That makes
Google rate the whole domain lower. Index few, strong pages, and add more as
stock and content arrive. `/admin/google` (Search Console) shows which pages
start getting impressions; promote those first.

## 3. The content model: write per PLACE, not per combination

Cities × barrios × 9 types × 3 operations makes thousands of combinations.
Writing 500–1000 unique words for each is impossible, and if forced it would
become the doorway pattern. Instead:

| Level | Content | Words | Indexable at 0 listings? |
|---|---|---|---|
| **Place page** (`/zonas/<ciudad>` or `/zonas/<ciudad>/<barrio>`; URL to decide) | The full place guide: 5–8 photos, 500–1000 words, FAQ, map, the place's live market box (counts and medians per type), links to every stocked type page and to evergreen pages | 500–1000 | **Yes**, once its content file exists |
| **Evergreen combination** (the existing 50+ in `src/content/evergreen/`) | Its own 500–900 words, as today | 500–900 | Yes (unchanged) |
| **Any other combination** (`/alquiler/san-bernardino/departamentos`) | Grid or empty state, the live data box, a **short excerpt of the place guide** with a link to the place page, nearest stock, and the CTAs | data plus excerpt | **No**: noindex until stock ≥ 3 (current rule) |

So what a place needs is **written once**, and every combination for that place
borrows it. Combinations with proven search volume get promoted to evergreen
with their own text.

**Where the content lives:** use typed content files in the repo
(`src/content/places/<ciudad>[--<barrio>].ts`), not the unused
`locations.guide_content_es/en` columns. Files are reviewed in a PR, and
`verify:seo` can check them: word count, no shared paragraphs, no digits in
prose, `claimsToVerify` present, every image with alt text. Delete or keep the
columns separately; that is a schema change, so leave them.

## 4. What the founder needs to provide, per place

Priority order: the places with volume in `docs/kwp/…` (Asunción and its
barrios, Luque, San Lorenzo, Lambaré, Fernando de la Mora, Mariano Roque
Alonso, Ciudad del Este, Encarnación, San Bernardino, Areguá, …). The planning
session produces the exact list.

1. **Photos: 5–8 per place.** Include a landmark or centre, a typical street,
   typical houses or buildings, an aerial view if possible, and something
   distinctive (the lake, the cathedral, a shopping centre).
   - **Your own photos or ones you hold a licence for.** Write down the source
     or credit for each.
   - Landscape, at least 1600 px wide. The pipeline converts to WebP and
     resizes.
   - For each photo, one line saying what it shows and where. This becomes the
     alt text and caption.
   - Until R2 is configured they live in `public/img/places/<slug>/`, the same
     as hub photos today.
2. **Text: 500–1000 words per place, in Spanish.** Use this outline so pages are
   complete without being the same:
   - Overview: what the place is and why people look there.
   - Zones and barrios: which areas are which, and where each property type is
     typical.
   - Who it suits: families, students, retirees, investors, weekend houses.
   - Access and transport: main roads, time to Asunción or the centre, buses.
   - Services: schools, health, shopping, banks.
   - Buying here: what to check. For example title and *loteamiento* status
     for land, flooding zones, *ANDE*/*ESSAP* connections.
   - Renting here: typical contract terms, seasonality (San Bernardino in
     summer).
   - An FAQ with 4–6 real questions people ask.
   - **No prices or counts in the prose.** Those come from live data.
   - **A list of every factual claim** for verification (`claimsToVerify`).
3. **English versions** only for the places foreign buyers search
   (Asunción, San Bernardino, Encarnación, …). They are written as a peer
   translation, not word for word.

You can send rough notes and photos. The session drafts the text in the
outline and you confirm the claims.

## 5. Build phases (for the plan)

1. **Empty state (E-1, E-2, E-4).**
   - In `app/[operacion]/[...segments]/page.tsx`, replace the `gone` branch
     (redirect or `notFound()`) with a 200 empty-state render for valid
     combinations.
   - `getIndexability()` keeps returning noindex for them. `state: "gone"`
     becomes noindex-at-zero, and `verify:seo` and the sitemap agree.
   - The empty state shows:
     - an honest "no hay … en este momento" line;
     - the CTAs (E-4);
     - nearest stock: the same type in the city or nearby barrios, the other
       operation, and other types here;
     - the related evergreen and guide links;
     - the place excerpt once §3 exists.
   - Remove `emptyRedirectTarget()` and the `?tipo_vacio` notice, or keep the
     notice only for old links.
   - Check `withoutEmptyCategoryLinks()` and `stockedPathsOrNull()`: menus may
     still hide empty links, which is fine, since the page existing does not
     mean it is promoted.
   - Keep `app/not-found.tsx` for unknown slugs and add a "did you mean"
     suggestion.
2. **Place content model and place page.**
   - Add the `src/content/places/` registry, the content type, and the place
     page route and template.
   - Add `verify:seo` checks for place files.
   - Wire the excerpt and link into every combination page for that place.
   - Add `FAQPage` and `Place` JSON-LD.
3. **Live market box:** a pure function from inventory, medians and bands to
   a few data sentences ("N casas en venta, mediana US$ X"). Numbers are
   rendered from data, never written in content files.
4. **Crawl hygiene:**
   - `robots.txt` disallows the facet and map query parameters
     (`vista`, `precio_min`, `precio_max`, `dormitorios`, `orden`, `page`
     beyond 1?). Decide this carefully: a disallowed URL's noindex is never
     seen, so only parameters that are never canonical.
   - Check `check:live` and the sitemap after the change.
5. **Content production loop:**
   - Take the priority list from `docs/kwp/`.
   - The founder supplies photos and notes, the session drafts the text, the
     founder verifies the claims, and the files are merged.
   - Promote a combination to evergreen when Search Console shows impressions.

## 6. Related: does the map cause the "Max Processes" problem?

Probably **not directly**. `docs/hosting-process-cap.md` measured that the
launcher starts copies **per hostname requested**, and that this app never forks.
But every request to a door can wake a copy. Bots crawling the unbounded
`?vista=mapa&precio_max=…` space on six domains keep every door's copies busy
and multiply database connections (6 per copy). That is the likely source of
the `Failed query` errors. Phase 4's robots change and caching
`resolveCity()`/`resolveBarrio()` (report §C) reduce that load. Confirm by
counting requests with `vista=` in the access log.
