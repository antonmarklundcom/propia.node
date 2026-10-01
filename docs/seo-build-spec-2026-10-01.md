# SEO build spec — batches 0–5 (approved 2026-10-01)

The Opus-written brief that Sonnet builders work from. The plan and the
reasoning are in `docs/seo-keyword-plan-2026-10-01.md`; the raw data is
`docs/kwp/real-estate-paraguay-2026-10-01.md` (line numbers below point at
each group's table in Part 3). **A builder reads its group's rows before
writing, and uses the phrases people actually type, not invented ones.**

## Rules every builder follows

1. **Spanish as the site writes it**: Paraguayan voseo (*buscá, publicá,
   calculá*), plain sentences, no keyword stuffing. Use the main keyword in the
   title, H1 and first paragraph, and each variant at most once, where it
   reads naturally.
2. **No invented facts.** No prices, rates, fees, legal periods or tax
   percentages unless the founder has confirmed them. Every legal, tax or cost
   statement is written as "what to ask / what to check", and listed in that
   batch's claims file for the founder to verify.
3. **No other company's name**: no agencies, developments, malls or portals
   (Tavamay, La Providencia, Multiplaza, Clasipar, InfoCasas, Hendyla…).
4. **i18n**: a visitor-facing string goes in `src/i18n/es.ts` (or its
   namespace file) **and** its `en.ts` peer in the same commit. Never inline
   JSX copy. Titles return only their own segment; the layout adds the brand.
5. **Evergreen content files**: no digits in prose (`verify:seo` refuses
   them), 500–900 words, no paragraph shared with another page, claims in
   `claimsToVerify`. Run `npx tsx scripts/check-evergreen-file.ts <file>`
   before registering a file in `src/content/evergreen/index.ts`.
6. **Links** use existing URL helpers (`listingUrl`, `rentalPath`, …) or plain
   paths that already resolve. A guide link points at the slug in this spec.
7. Done means: `npm run verify:local` is green.

## Who builds what

| Session | Model | Owns | Branch |
| --- | --- | --- | --- |
| Content | Sonnet 5.5, medium | batches 0, 1 (not A5), 2, 3 | `claude/seo-content-<date>` |
| Structure | Opus 5.5, high | A5, batch 4, batch 5, places seed | `claude/seo-structure-<date>` |

The two sessions touch `src/i18n/es.ts` / `en.ts` in different places. To keep
merges trivial, **new** strings go in new namespace files
(`src/i18n/es-national.ts` for batch 4, `es-directory-city.ts` for batch 5),
and only existing keys are edited in `es.ts`. Whichever PR merges second
merges `main` in first and re-runs `verify:local`.

## Batch 0 — one report of every unverified claim (Content session, first)

The founder asked for one document to check every unverified fact at once.
Today they are spread over 50 evergreen files (386 `claimsToVerify` entries),
`docs/log/residencia-claims.md`, `evergreen-en-claims.md` and
`evergreen-pr2-claims.md`, with no pointer to where on the page each sits.

- `scripts/claims-report.ts` + `npm run claims:report` → writes
  `docs/claims-to-verify.md`: grouped by **domain + URL**, each claim with the
  **section it is in** (for evergreen pages: the section whose title or
  paragraphs share the most words with the claim, labelled "probably in" when
  unsure) and a checkbox. Pure — no database, no network.
- Sources: `EVERGREEN_PAGES`, `RESIDENCY_PAGES` (read how their claims are
  kept first), and the guide claim files batch 3 adds.
- **Verified claims drop out**: the founder marks them in
  `docs/claims-verified.md` (one exact claim text per line, or "URL: all");
  the report skips those.
- New content from here on writes claims as `{ claim, section }` where the
  type allows it; do not convert the 50 existing files.

## Batch 1 — quick wins on existing pages (Content session; A5 is Structure's)

| # | Page | Where the copy lives | Change |
| --- | --- | --- | --- |
| A1 | `/tasacion` | `esTasacion` in `src/i18n/es.ts` (~l.138) + `en.ts` peer; `app/tasacion/page.tsx` | `title` → "Tasación de inmuebles online gratis"; H1 → "Tasación de inmueble: ¿cuánto vale tu propiedad?"; meta description names *gratis* and *online*; new H2 "Cómo calcular el valor de tu casa" (3 short paragraphs); FAQ of 4 (estimate vs. a registered appraiser's valuation, what moves the value, when an official one is needed, is it free); links → `/precios`, `/vender`, `/guias/titulo-de-propiedad`. Data: KWP l.2978, 4638, 4720 |
| A2 | `/financiamiento` | `TITLE`/`DESCRIPTION` in `app/financiamiento/page.tsx` (move them to i18n while there) | Title "Crédito hipotecario y cuotas en Paraguay"; H1 same idea; H2 "Préstamo hipotecario: qué te pide el banco"; FAQ of 3. **No rate, term or cap stated as fact.** Data: l.5239 |
| A3 | `/proyectos` | `esProjectsPage` (~l.3737) + peer | `metaTitle` → "Departamentos en pozo y obra nueva en Paraguay"; H1 includes *en pozo*; H2 "Qué revisar antes de comprar en pozo" (developer track record, delivery date in the contract, payment plan); links → `/desarrolladoras`, `/financiamiento`, `/guias/invertir-en-inmuebles-en-paraguay`. Data: l.4964, 5963, 6070 |
| A4 | `/venta/luque/casas` | `src/content/evergreen/venta-luque-casas.ts` | Add a barrio item or section "Barrios cerrados en Luque" (what to ask: expensas, reglamento, title of the lot) + one FAQ. No development names. Link → `/proyectos`. Data: l.3546 |
| A5 (**Structure session**) | `terreno.com.py` home + `/venta` hub | home meta in `app/page.tsx` (~l.224, `brandTaglineFor`); hub copy is `esHub.copy.venta` — **shared with the marketplace**, so add a land-door override keyed on the vertical (do not change the marketplace's text) | Hub title/H1 "Terrenos en venta en Paraguay"; H2 "Hectáreas, chacras y campos" (what changes between a lot, a chacra and a campo: access, water, title); link → `/guias/titulo-de-propiedad`. Data: l.3567, 3917, 5663, 5994 |
| A6 | `/alquiler/lambare/departamentos` | its evergreen file | `metaDescription` and `lede` open with the bare "departamentos en Lambaré"; a related-links line to `/venta/lambare/casas`. Data: l.2585 |
| A7 | `/alquiler/ciudad-del-este/departamentos` | its evergreen file | Same for "departamentos en Ciudad del Este" (variant *departamentos CDE*); link → `/venta/ciudad-del-este/casas`. Data: l.2610 |
| A8 | `/alquiler/encarnacion/departamentos` | its evergreen file | Same for "departamentos en Encarnación"; a paragraph on temporary rental in the summer season; link → `/alquiler-temporal`. Data: l.2777, 4614 |
| A9 | `/venta/asuncion/casas` | its evergreen file | One FAQ on more affordable houses (where in Asunción, what trade-offs); link → `/precios/asuncion`. Data: l.2258 |
| A10 | `realestateinparaguay.com` home | `en.ts` home meta (`metaDescription`, the English tagline) | Title/meta carry "Paraguay real estate"; meta mentions buying property in Paraguay. Data: l.5759 |

## Batch 2 — four new evergreen pages (Content session, one subagent per page)

Each is a typed file in `src/content/evergreen/`, shape `EvergreenPage`
(`types.ts`), registered in `index.ts`, door `inmobiliaria.com.py`'s key.

| # | Path | `keyword` | `secondaryKeywords` (from the data) | Data |
| --- | --- | --- | --- | --- |
| C1 | `/alquiler/nemby` (untyped, like `/alquiler/asuncion`) | alquileres en Ñemby | alquiler de casas baratas en Ñemby · casa independiente para alquilar en Ñemby · alquiler de casa en Ñemby · casas en venta Ñemby | l.2448 |
| C1b | `/alquiler/villa-elisa/casas` | alquiler de casa en Villa Elisa | alquileres económicos zona Villa Elisa · casas en Villa Elisa · alquiler casa Villa Elisa dueño directo · casas en venta Villa Elisa | l.3129 |
| C1c | `/alquiler/asuncion/villa-morra/departamentos` | departamentos en Villa Morra | alquileres baratos en Villa Morra · alquiler Villa Morra · alquiler de departamentos en Villa Morra Asunción | l.5387 |
| C1d | `/venta/hernandarias/casas` | casas en Hernandarias | casas en venta Hernandarias | l.1369 (inside the prefab group) |

Ñemby's barrios in the data (Pa'i Ñu, Caaguazú) are fine to describe; check
each barrio exists in `src/lib/ops/location-tree.ts` before linking it.
Before writing C1, confirm `isEvergreenPath()` accepts an untyped non-Asunción
city path; if it does not, use `/alquiler/nemby/casas` and say so.

## Batch 3 — seven Spanish guides (Content session)

Spanish guides are rows in `posts`. Add `scripts/seed-guias-es.ts` +
`npm run seed:guias-es`, a copy of `seed-guias-en.ts`'s pattern
(`--dry`, insert-if-missing by slug, `locale: "es"`, never overwrites a row
the founder edited). The founder runs it on production. Bodies are markdown
rendered by `src/components/Markdown.tsx`; check which syntax it supports
before writing. Claims go to `docs/log/guias-es-claims.md`, one list per guide.

| # | Slug | Title | Main keyword · variants | Outline | Data |
| --- | --- | --- | --- | --- | --- |
| B1 | `contrato-de-alquiler` | Contrato de alquiler en Paraguay: qué tiene que decir | contrato de alquiler · contrato de arrendamiento · modelo de contrato de alquiler · contrato de alquiler de casa · arrendador y arrendatario | What it must contain (parties, property, price and currency, term, deposit, updates, who pays what, ending early); housing vs. local comercial vs. campo; **a model contract for housing** in a copyable block, headed in plain words "Modelo orientativo, no revisado por un escribano ni un abogado: adaptalo y hacelo revisar antes de firmar", then a checklist and tips. Model clauses only for points the legal research (`docs/research/legal-questions-2026-10-01.md`) has answered; where it has not, a blank to fill (`[plazo]`) rather than a guessed rule. Links → B2, B6, `/alquiler`, `/publicar` | l.880, 1534, 2321, 3966, 4765, 4394, 5815 |
| B2 | `garantia-de-alquiler` | Garantía de alquiler: qué te pueden pedir | garantía de alquiler · garantía propietaria · alquiler sin garantía · depósito en garantía | The guarantees used in Paraguay and what each asks of the tenant; renting directly from an owner; what to put in writing. Links → B1, `/alquiler` | l.3030, 5003, 6053 |
| B3 | `consulta-de-catastro` | Consulta de catastro en Paraguay: cómo ver los datos de un inmueble | consulta catastro · consulta catastro nacional · consulta de inmuebles · número de cuenta catastral | What the cuenta catastral is, where to look it up (the official service — link it, verify the URL), why check before buying or renting. **States plainly that this site does not do the lookup.** Links → B4, B5, `/tasacion` | l.478 |
| B4 | `titulo-de-propiedad` | Título de propiedad: qué es y cómo verificarlo | título de propiedad · título de terreno · cómo sacar el título · título y escritura | What it is, how to verify it, title vs. deed, buying land without a title (the risk). Links → B3, B5, terreno.com.py | l.2908, 5854, 5976 |
| B5 | `gastos-de-escritura` | Gastos de escritura e impuesto inmobiliario | gastos de escritura · honorarios del escribano · quién paga la escritura · impuesto inmobiliario | Section 1: what a transfer costs and who usually pays (as questions to the notary). Section 2: the annual property tax, how it is assessed, where it is paid. No amounts. Links → B4, `/financiamiento` | l.3625, 5480 |
| B6 | `alquiler-con-opcion-a-compra` | Alquiler con opción a compra: cómo funciona | alquiler con opción a compra · alquiler con derecho a compra · contrato con opción a compra | How it works, what the contract fixes (price, term, how much rent counts), risks for both sides. Links → B1, `/financiamiento` | l.3155 |
| B7 | `invertir-en-inmuebles-en-paraguay` | Invertir en inmuebles en Paraguay | invertir en inmuebles en Paraguay · inversión inmobiliaria Paraguay · en qué invertir en Paraguay | Rent vs. resale, pozo vs. ready, land; what to compare (yield from `/datos`, not promised). Links → `/proyectos`, `/datos`, `/precios` | l.2478 (real-estate rows only), 5759 |

Each guide is 900–1 500 words, an H1 plus 4–6 H2s, and closes with a FAQ of
3–4 and a call to action that fits it (publish, tasación, search, saved
alert). Each also links to `/guias/consulta-de-catastro` and the others by
topic, so the seven form one cluster.

## Batch 4 — national type pages, decision F-f (Structure session)

Approved: `/alquiler/quintas`, `/alquiler-temporal/quintas`,
`/alquiler/comerciales`, `/alquiler/depositos`, `/venta/casas`. Start from the
F-f proposal in `docs/decisions-needed.md` and record the decision there.

- **Routing**: today the second segment of `/{op}/{x}` is always a city.
  A segment that is a property-type URL slug (`urls.ts`: `casas`, `quintas`,
  `comerciales`, `depositos`, …) becomes a national type page. Prove no city
  or barrio slug equals a type slug, and make `verify:seo` fail if one ever
  does.
- `/{op}?tipo=x` keeps working and canonicalises to the clean URL.
- **Indexability**: the ordinary count rule (`getIndexability()`), or
  evergreen when registered. Register the five above as evergreen with content
  files (Content-style rules: 500–900 words, no digits, claims) so they index
  at any count; write those files yourself or hand them to the Content session
  with this spec's rules.
- **Ownership**: obey `ownsCategories` / `categoryTarget()` — `terreno.com.py`
  and the rental doors do not get duplicates; land stays the land door's.
  hreflang only where a different-locale door has the same page.
- Sitemap (`src/lib/sitemap.ts`), menus (`stockedPathsOrNull()`), hub type
  chips (#178 links to `?tipo=` today → point them at the clean URL),
  `relatedCategoryLinks()`, breadcrumbs, JSON-LD.
- Keywords (KWP): quintas l.798 + l.5308 + l.5716 (per-day goes on
  `/alquiler-temporal/quintas`); comerciales l.2095 + l.2514 (generic rows
  only) + l.2639; depósitos l.2810 + l.4863; `/venta/casas` l.4422 + the
  national rows of l.1369.

## Places — Villarrica, Concepción, Pilar (Structure session)

Add the three Paraguayan cities to `src/lib/ops/location-tree.ts` under their
departments (Guairá, Concepción, Ñeembucú) with coordinates the founder
confirms (list them in the PR). Data only: **no evergreen page** (decision 5).
The founder runs `npm run seed:locations` and `npm run cron:geo` after merge.

## Batch 5 — agencies by city on the directory door (Structure session)

`inmobiliarios.com.py` (`ownsDirectory`, Spanish) gets city pages for the
agency directory. Design before building:

- **URL**: `/inmobiliarias/<ciudad>` (plural, sitting under the existing list
  page; `/inmobiliaria/<slug>` stays the profile). Confirm no agency slug can
  collide with a city slug.
- **Which agencies**: the ones whose agents declare the city in `agents.zones`
  (city slugs), plus agencies whose listings sit in the city. Pick one rule and
  write it down.
- **Indexability**: index at ≥ 3 agencies, else noindex and out of the
  sitemap — the thin-page rule. Canonical and sitemap follow `ownsDirectory`
  (the marketplace doors canonicalise to the directory door, as `/inmobiliarias`
  already does). `verify:seo` gets a check.
- **Copy**: H1 "Inmobiliarias en {Ciudad}"; a short city-specific intro in
  i18n; the directory lead form (`DirectoryLeadForm`, `utm.source:
  "directory:city"`).
- Start with Ciudad del Este, Encarnación and San Lorenzo (KWP l.2610, 4614,
  3752); the rule then covers every city automatically.

## Order and verification

**Content session** (one PR per batch, or one PR for 0–2 and one for 3):
batch 0 → batches 1 and 2 in parallel subagents (each owns its own file) →
batch 3 (seed script first, then the seven bodies in parallel) → run
`npm run claims:report` last so the report includes the new pages.

**Structure session**: places seed (small PR) → batch 4 → A5 → batch 5.

Every PR: `verify:local` green; a `next start` smoke test of each changed or
new URL with the right `Host` header (title, H1, canonical, robots, and
whether it is in that door's sitemap); claims recorded; what was not verified
stated plainly. The founder approved every batch here and asked the agents to
finish them, so a session **merges its own PR once all of the above is green**
— except anything touching auth, payments or `src/db/schema.ts`, which no
batch here should need (if one does, stop and say so).
