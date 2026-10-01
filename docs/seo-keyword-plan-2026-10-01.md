# SEO keyword plan — Keyword Planner export of 2026-10-01

Source: `real-estate-paraguay-1-oct-keywords-for-ai.md` (Paraguay, Spanish;
7 554 phrases, **43 510 searches/mo deduplicated**, 70 meaning groups; Part 3
holds the top 5 000 searches). Volumes below are the deduplicated group totals
unless a single phrase is quoted. This plan **adds to**
`docs/seo-evergreen-keywords.md` (the 2026-09-27 map behind the 42 evergreen
pages) — it does not replace it.

Status: **Step 1, plan only. Nothing here is built until the founder says OK.**

## 0. What the data says, in four lines

1. The two biggest themes are **not listing searches**: rental contracts
   (~6 300/mo across five groups) and the land registry lookup
   (*consulta catastro*, 4 520). Both are guide pages, and both bring exactly
   the people who rent, let and buy.
2. The biggest **listing** demand we cannot serve today is **rooms**
   (*alquiler de pieza* + *habitaciones*, ~4 250/mo): there is no property
   type for a room.
3. Most commercial and *casa quinta* demand has **no city in it**
   (*casa quinta* 2 900, *local comercial*, *alquiler depósito*). Those need
   national type pages (`/alquiler/quintas`, `/alquiler/comerciales`) —
   founder decision F-f.
4. New places with real volume: **Ñemby** (820), **Villa Elisa** (580),
   **Villarrica** (460), **Hernandarias** (110), and Villa Morra at barrio
   level (270). **Concepción** (650) is mixed with Concepción, Chile — verify
   before building.

## 1. Current pages (Spanish marketplace door, `inmobiliaria.com.py`)

The `title` gets " — Inmobiliaria Paraguay" from the layout template.

| URL | Title | H1 |
| --- | --- | --- |
| `/` | brand home (PremiumHome) | brand tagline |
| `/venta` · `/alquiler` · `/alquiler-temporal` | hub | Propiedades en venta / en alquiler en Paraguay · Alquiler temporal en Paraguay |
| `/{op}/{ciudad}[/{barrio}][/{tipo}]` | `{Tipo} en {op} en {lugar}` | same |
| 42 evergreen pages (`src/content/evergreen/`) | e.g. Casas en venta en Asunción | e.g. Casas en venta en Asunción |
| `/tasacion` | ¿Cuánto vale tu propiedad? | ¿Cuánto vale tu propiedad? |
| `/financiamiento` | Financiamiento y cuotas | Financiamiento y cuotas |
| `/precios`, `/precios/{ciudad}` | Precios de propiedades en Paraguay | same |
| `/proyectos` | Proyectos y obra nueva en Paraguay | — |
| `/desarrolladoras` | Desarrolladoras inmobiliarias en Paraguay | Desarrolladoras que construyen en Paraguay |
| `/datos` | Datos del mercado inmobiliario de Paraguay | — |
| `/guias`, `/guias/{slug}` | Guías y notas sobre el mercado inmobiliario paraguayo | post title (**Spanish guides live in the database**, not in the repo) |
| `/vender` | Vendé tu propiedad al mejor precio | hero |
| `/como-funciona`, `/preguntas-frecuentes`, `/nosotros`, `/contacto` | — | — |
| `/inmobiliarias`, `/agentes` (owned by `inmobiliarios.com.py`) | Directorio de inmobiliarias de Paraguay · Agentes inmobiliarios en Paraguay | — |

Other doors: `terreno.com.py` (land, Spanish), `realestateinparaguay.com`
(English), `rentparaguay.com`, `residenciaenparaguay.es` (14 residency pages).
Property types that already exist: casa, departamento, terreno, duplex,
**comercial** (`comerciales`), **oficina**, **deposito** (`depositos`),
**quinta** (`quintas`). No **habitación** type.

## 2. Mapping of the top groups

Order: quick wins (existing page, change copy) → new pages that need no code
→ pages that need a code change or a founder decision → skipped.

### A. Quick wins — existing pages whose title/H1 misses the keyword

| # | Group(s) | /mo | Page | Main keyword | Variants | Changes |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | tasación de inmueble · calcular el valor de mi casa · tasador de inmuebles gratis | 1 360 | `/tasacion` | tasación de inmueble | tasación de inmuebles online gratis · cómo saber cuánto vale mi casa · tasadores de inmuebles en Paraguay · tasación inmobiliaria | Title "Tasación de inmuebles online gratis"; H1 "Tasación de inmueble: ¿cuánto vale tu propiedad?"; meta naming *gratis* + *online*; H2 "Cómo calcular el valor de tu casa"; FAQ (estimación vs. tasación de un tasador matriculado, qué la cambia, cuándo hace falta una oficial); links → `/precios`, `/vender`, guide B5 |
| A2 | crédito hipotecario paraguay | 310 | `/financiamiento` | crédito hipotecario en Paraguay | préstamos hipotecarios Paraguay · hipotecas en Paraguay · préstamo para vivienda | Title "Crédito hipotecario y cuotas en Paraguay"; H1 same idea; H2 "Préstamo hipotecario: qué pide el banco"; FAQ; no rate stated as fact (backlog #6) |
| A3 | departamentos en pozo · edificios en construcción | 430 | `/proyectos` | departamentos en pozo | edificios en construcción · comprar departamento en pozo · inversión en pozo | Title "Departamentos en pozo y obra nueva en Paraguay"; H1 adds *en pozo*; H2 "Qué revisar antes de comprar en pozo"; links → `/desarrolladoras`, `/financiamiento` |
| A4 | barrio cerrado la providencia luque | 560 | `/venta/luque/casas` (evergreen) | barrio cerrado en Luque | barrios cerrados en Luque · casas en barrio cerrado | New H2 "Barrios cerrados en Luque" + one FAQ; **no development names targeted** (they are other companies' projects); link → `/proyectos` |
| A5 | comprar terreno paraguay · terreno 1 hectárea · chacras · estancia en el chaco | 1 230 | `terreno.com.py` home + `/venta` hub | terrenos en venta en Paraguay | comprar terreno en Paraguay · hectáreas en venta · chacra en venta · campos en venta | Hub title/H1 "Terrenos en venta en Paraguay"; H2 "Hectáreas, chacras y campos"; link → guide B4 (título) |
| A6 | departamentos lambare | 790 | `/alquiler/lambare/departamentos` (evergreen) | departamentos en Lambaré | alquiler departamento Lambaré · departamentos baratos en Lambaré | Meta + intro name the bare "departamentos en Lambaré"; links → `/venta/lambare/casas` (casa en venta en Lambaré 140) and land in Lambaré (terreno door) |
| A7 | ciudad del este departamento | 770 | `/alquiler/ciudad-del-este/departamentos` (evergreen) | departamentos en Ciudad del Este | departamentos CDE · casa en Ciudad del Este | Same: meta/intro for the bare form; link → `/venta/ciudad-del-este/casas`. *inmobiliaria ciudad del este* (140) → C3 |
| A8 | departamentos encarnacion | 670 | `/alquiler/encarnacion/departamentos` (evergreen) | departamentos en Encarnación | departamentos en venta Encarnación · alquiler temporal Encarnación | Meta/intro; H2 on temporary rental (season); link → `/venta/encarnacion/casas`. *(concepción rows in this group → C4)* |
| A9 | casa en asuncion venta | 1 020 | `/venta/asuncion/casas` (evergreen) | casas en venta en Asunción | venta de casa en Asunción · casas económicas en Asunción · precios de departamentos en Asunción | Already matches. Add FAQ on *casas económicas*; link → `/precios/asuncion`. *alquiler de oficinas Asunción* (50) → C2 |
| A10 | paraguay real estate | 180 | `realestateinparaguay.com` home | Paraguay real estate | buy property in Paraguay · real estate investment Paraguay | English home title/meta carry "Paraguay real estate" |

### B. New guides (no listing code; Spanish)

Guides live in the `posts` table. The repo pattern is a seed script with
`--dry` that the founder runs (`seed:guias-en` already does this for
English). Every legal or tax statement goes in a claims list for the founder
to check, like `docs/log/residencia-claims.md`.

| # | Group(s) | /mo | Page | Main keyword | Variants | Content |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | contrato de arrendamiento · contrato de alquiler · contrato de alquiler de vivienda · comodato/pdf/para imprimir · contrato casa simple · arrendatarios | ~6 300 | NEW `/guias/contrato-de-alquiler` | contrato de alquiler | contrato de arrendamiento · modelo de contrato de alquiler · contrato de alquiler de casa · arrendador y arrendatario · contrato de alquiler pdf | What a contract must contain, plazo, depósito, actualización, rescisión, local comercial vs. vivienda, campo. **A downloadable model only after an escribano/abogado signs it off** (founder decision); until then, a checklist. Links → B2, B6, `/alquiler`, `/publicar` |
| B2 | garantía de alquiler · alquiler dueño directo sin garantía · garantía propietaria | ~1 000 | NEW `/guias/garantia-de-alquiler` | garantía de alquiler | garantía propietaria · alquiler sin garantía · depósito en garantía | Types of guarantee used in Paraguay, what to ask for, renting without one. Links → B1, `/alquiler` |
| B3 | consulta catastro | 4 520 | NEW `/guias/consulta-de-catastro` | consulta catastro | consulta catastro nacional · consulta de inmuebles · número de cuenta catastral | What the cuenta catastral is, where to look it up (the official service, linked), why to check before buying. **We do not offer the lookup** — the page says so and sends to the official site. Links → B4, B5 |
| B4 | título de propiedad · buscar título · título vs. escritura | 870 | NEW `/guias/titulo-de-propiedad` | título de propiedad | título de terreno · cómo sacar el título · título de propiedad y escritura | What it is, how to get or verify it, title vs. deed. Links → B3, B5, terreno door |
| B5 | colegio de escribanos honorarios · impuesto inmobiliario paraguay | 760 | NEW `/guias/gastos-de-escritura` | gastos de escritura | honorarios del escribano · quién paga la escritura · impuesto inmobiliario | Two sections (two groups). Amounts only as ranges the founder confirms. Links → B4, `/financiamiento` |
| B6 | alquiler con opción a compra | 580 | NEW `/guias/alquiler-con-opcion-a-compra` | alquiler con opción a compra | alquiler con derecho a compra · contrato con opción a compra | How it works, what to put in writing. Links → B1, `/financiamiento` |
| B7 | inversión en Paraguay (real-estate share) · paraguay real estate (es) | ~300 of 810 | NEW `/guias/invertir-en-inmuebles-en-paraguay` | invertir en inmuebles en Paraguay | inversión inmobiliaria Paraguay · en qué invertir en Paraguay | Rental yield by type, pozo vs. ready, land. No promised returns. Links → `/proyectos`, `/datos`, `/precios` |

### C. New category pages and the code or decisions they need

| # | Group(s) | /mo | Page | Main keyword | Variants | Needs |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | alquileres en ñemby | 820 | NEW evergreen `/alquiler/nemby` (+ link to `/venta/nemby/casas`) | alquileres en Ñemby | alquiler de casas baratas en Ñemby · casa independiente para alquilar en Ñemby · casas en venta Ñemby | Content file only (Ñemby is in the location tree) |
| C1b | alquileres económicos zona villa elisa | 580 | NEW evergreen `/alquiler/villa-elisa/casas` | alquiler de casa en Villa Elisa | alquileres económicos Villa Elisa · casas en Villa Elisa · casas en venta Villa Elisa | Content file only |
| C1c | alquileres baratos en villa morra | 270 | NEW evergreen `/alquiler/asuncion/villa-morra/departamentos` | departamentos en Villa Morra | alquileres baratos en Villa Morra · alquiler Villa Morra | Content file only (barrio exists; Loma Pytã set the barrio-level precedent) |
| C1d | casas hernandarias | 110 | NEW evergreen `/venta/hernandarias/casas` | casas en Hernandarias | casas en venta Hernandarias | Content file only |
| C2 | casa quinta · alquiler quinta por día · quinta para pasar el día | 3 760 | NEW national `/alquiler/quintas` (+ `/alquiler-temporal/quintas` for per-day) | casa quinta | casa quinta en venta · alquiler de quinta por día · quinta para pasar el día | **F-f** (clean national type URLs). Today `/alquiler?tipo=quintas` is noindex by design |
| C2b | alquiler de salones comerciales baratos · local comercial · alquiler local | ~2 550 | NEW national `/alquiler/comerciales` | local comercial en alquiler | salón comercial en alquiler · alquiler de locales comerciales · locales en alquiler | **F-f** |
| C2c | alquiler depósito · alquiler casa con galpón | ~1 010 | NEW national `/alquiler/depositos` | alquiler de depósito | depósito en alquiler · alquiler de galpones | **F-f** |
| C2d | venta de casas baratas en paraguay · casa venta paraguay | ~620 | NEW national `/venta/casas` | casas en venta en Paraguay | venta de casas baratas en Paraguay · casas económicas en Paraguay | **F-f** (also unblocks table C2 of the old map) |
| C3 | inmobiliaria ciudad del este · inmobiliaria encarnación · inmobiliaria san lorenzo | ~400 generic (agency brand names excluded) | NEW directory city pages on `inmobiliarios.com.py` | inmobiliarias en Ciudad del Este | inmobiliarias en Encarnación · inmobiliaria en San Lorenzo | New route + `ownsDirectory` rules + `verify:seo` — **Opus** |
| C4 | casas villarrica · casas/departamentos en concepción | 460 · ≤650 | NEW evergreen pages once the places exist | casas en Villarrica | villarrica terrenos · casas en venta Villarrica | **Seed the places** (S10 pattern, founder checks coordinates). Concepción: check how much is Chile first |
| C5 | alquiler de pieza · alquiler de habitaciones (+ barrio jara) | ~4 250 | NEW `/alquiler/asuncion/habitaciones` + national | alquiler de pieza | alquiler de habitaciones · pieza con baño privado · cuartos en alquiler baratos | **New property type `habitacion` = `MIGRATION REQUIRED`** (MySQL enum) + forms, filters, i18n. Biggest unserved listing demand. **Founder decision** |

### D. Skipped, with the reason

| Group | /mo | Why not |
| --- | --- | --- |
| tavamay mora cue · edificio urban carmelitas · la loteadora cde · la paraguaya inmobiliaria · raices real estate · locales en multiplaza (the mall name) | ~1 700 | Names of other companies' developments, agencies or malls. The generic part (*local comercial*) is kept in C2b |
| casas prefabricadas en paraguay | 390 of 1 740 | A product, not property; the rest of that group is in C2d / C4 |
| precio de pared / losa por m² · construcciones famosas · 4100 construcción | ~1 000 | Construction materials and trivia, not property search |
| corredor de bolsa · comprar acciones · inversión (stocks share) | ~800 | Finance, not property |
| alquiler bajo de san isidro · local comercial san josé · arriendos recoleta (Buenos Aires) · alquiler de local en recoleta | ~1 030 | Mostly Argentina / Chile / Spain place names |
| toyota land cruiser | 10 | Off-topic |

## 3. Remove or fix

- **Nothing to remove.** No existing page targets a skipped group.
  Competitor names appear only in import code, never in visitor copy.
- Fix with A6–A8: three rental evergreen pages carry the operation in
  title/H1, while the searches are the bare "departamentos en {lugar}". Add
  the bare form to meta and intro; do not rename the pages.

## 4. Build order (Step 2, after OK)

| Batch | What | Model | Code risk |
| --- | --- | --- | --- |
| 1 | A1–A10 quick wins (copy, meta, FAQ, links) | Sonnet, parallel, one file each | Low — copy only, `es.ts` + `en.ts` peers |
| 2 | C1–C1d: 4 evergreen content files (500–900 words, `check-evergreen-file.ts`, claims listed) | Sonnet, one agent per page | Low |
| 3 | B1–B7 guides as a `seed:guias-es` script (`--dry`, founder runs it) + claims file | Opus writes the script, Sonnet writes the bodies | Low; legal claims wait for the founder |
| 4 | C2–C2d national type pages | Opus (routing, canonicals, hreflang, `verify:seo`) | Medium — **needs F-f approved** |
| 5 | C3 directory city pages | Opus | Medium |
| 6 | C5 rooms type, C4 new places | Opus, PR with `MIGRATION REQUIRED` | High — founder applies the migration |

Batches 1–3 cover about **23 000 searches/mo** (A 7 300 + C1 1 800 + B
14 300) with no founder decision needed (the legal copy itself still waits
for a check). Batches 4–6 add about **13 700**, and each one waits on a
decision. Skipped: about 5 900. Of the 43 510 total, the rest is long tail
spread across these groups.

## 5. Decisions needed from the founder

1. **OK to start batches 1–3.**
2. **F-f**: clean national type URLs (`/alquiler/quintas`, `/alquiler/comerciales`, `/alquiler/depositos`, `/venta/casas`). Proposal already in `docs/decisions-needed.md`.
3. **Rooms**: add a `habitacion` property type (migration)?
4. **Model rental contract**: offer a downloadable model, reviewed by an escribano, or only a checklist?
5. **New places**: Villarrica, Concepción (Paraguay only), Pilar — seed them?
