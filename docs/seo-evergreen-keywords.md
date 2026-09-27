# Evergreen category pages — keyword map (2026-09-27)

Source: the founder's Google Keyword Planner export (Paraguay, Spanish),
pasted in chat on 2026-09-27 — 440 distinct keywords after removing exact
repeats across the five sheets. Volumes are average monthly searches as
Keyword Planner reports them (it buckets: 10, 20, 30, 40, 50, 70, 90, 110,
140, 170, 210, 260, 320, 390, 590, 1 000, 1 300). "—" = no data.

**Status: PR 1 shipped the pilot (`/venta/luque/casas`). PR 2 ships the other
37 pages of table A plus four pages for the places added under decision S10
(table A2), after the founder's answers of 2026-09-27: land pages on
`terreno.com.py` (S9), `departamento en asuncion` on both Asunción apartment
pages with separate long tails, `casas en remate` dropped.**

## Rules used

1. **Every keyword maps to at most one URL, and that URL is an existing
   category URL** built by `categoryUrl()` in `src/lib/urls.ts`
   (`/{operacion}/{ciudad}[/{barrio}]/{tipo}`), with city and barrio slugs
   from `src/lib/ops/seed-locations.ts`. No new route.
2. **Near-duplicates merge onto one page.** Singular/plural, "en venta" /
   "de venta" / "a la venta" / "venta de", "paraguay" appended, accents,
   "barato(s)" / "económico(s)", "comprar": all the same page. One page per
   search, so no two of our pages compete for it.
3. **Operation is read from the words**: alquiler / alquilar / alquilo /
   alquileres → `/alquiler`; "alquiler temporal" → `/alquiler-temporal`;
   everything else → `/venta`. Three judgement calls, flagged below:
   `departamento en asuncion` (1 300, no operation word) → rental page;
   `monoambientes baratos` and `departamentos amoblados` → rental page
   (furnished and studio searches are overwhelmingly rentals).
4. **A page needs a main keyword of ≥ 20 searches/month** (competitor-brand
   searches don't count toward that). Keywords under ~20 are secondary
   phrases on the page they map to; if that URL has no bigger keyword, it
   stays a normal category page under the old count rule (table B).
5. **Volumes are not added up.** Keyword Planner gives close variants the
   *same* figure (e.g. three spellings of "casas en venta asuncion" each show
   390); summing them would triple-count. Pages are ranked by their main
   keyword.
6. **Competitor-brand searches** (clasipar, hendyla, infocasas; marked †) are
   folded into the page for the underlying search, but no page ever names a
   competitor. They are navigational — the searcher wants that site — and
   will convert poorly.
7. **Neighbourhood words with no seeded barrio** (Luque's "4to barrio",
   "zona conmebol", "Palma Loma"; Fernando's "zona norte/sur"; Lambaré's
   "canal 13") are secondary phrases on the city page — the content's barrio
   section is where they get covered, as text, not as separate URLs.

## A. Evergreen pages, ranked

Door = where the page is indexable at any stock (the owner). Land pages wait
on decision **S9** in `docs/decisions-needed.md` — see "Domains" below.

| # | URL | Main keyword | Vol | Secondary phrases (vol) | Door | Ships in |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `/alquiler/asuncion` | alquiler en asuncion | 1300 | alquileres en asunción baratos (390); alquileres en asuncion paraguay (40); alquiler amoblado asuncion (20); alquiler de casas y departamentos en asuncion paraguay (10) | inmobiliaria.com.py | PR 2 |
| 2 | `/alquiler/asuncion/departamentos` | departamentos en alquiler asuncion | 1000 | departamento en asuncion (1300); departamentos en asunción alquiler (1000); alquiler de departamentos asunción (590); alquiler departamento 1 dormitorio asunción baratos (260); alquiler departamento 1 dormitorio asunción (170); monoambientes baratos en asunción (140); alquiler de departamentos de 2 dormitorios en asunción (140); departamentos amoblados en asuncion (90); departamentos para alquilar en asuncion (90); clasipar alquiler de departamentos economicos en asunción (70)†; departamentos amoblados baratos en asunción (50); alquiler de departamentos en asunción baratos (50); alquiler de monoambiente en asuncion (40); departamentos amoblados para alquilar en asunción (30); alquiler de departamentos asunción centro (20); alquiler departamento amoblado asuncion (20); alquiler departamento asuncion centro (20); alquiler de departamentos en asunción económicos (10); alquiler apartamento asuncion paraguay (10); alquiler de departamento en asuncion paraguay (10); alquiler de departamentos amoblados en asuncion (10); alquiler de departamentos amoblados en asunción (10); alquiler de departamentos baratos en asuncion (10); alquiler de departamentos baratos en asunción (10); alquiler de departamentos centro de asuncion (10); alquiler de departamentos economicos en asuncion (10); alquiler de departamentos en asuncion centro (10); alquiler de departamentos en asuncion economicos (10); alquiler de departamentos en asunción barrio obrero (10); alquiler de departamentos en asunción clasipar (10)†; alquiler de departamentos en el centro de asuncion (10); alquiler de departamentos en paraguay asuncion (10); alquiler de departamentos zona centro asuncion (10); alquiler de departamentos zona municipalidad de asuncion (10); alquiler de dptos en asuncion (10); alquiler departamento asuncion paraguay (10); alquiler de departamentos de un ambiente en asunción (0); alquiler de departamentos zona ciudad nueva asuncion (0) | inmobiliaria.com.py | PR 2 |
| 3 | `/alquiler/asuncion/casas` | casas en alquiler asuncion | 590 | alquiler casa asunción (590); alquiler de casa asuncion (320); alquiler de casa independiente en asunción (170); alquiler de casas en asunción baratos (170); alquiler de casa en asunción 3 dormitorios (70); alquiler casa asuncion paraguay (20); alquiler casa en asuncion paraguay (20); alquiler casa barrio pinoza asunción (10); alquiler casa con piscina asuncion (10); alquiler de casa con piscina en asuncion (10); alquiler de casa en asuncion paraguay (10); alquiler de casa en barrio ciudad nueva asuncion (10); alquiler de casa en barrio santa maria asuncion (10); alquiler de casa zona barrio obrero asuncion (10); alquiler de casas asuncion clasipar (10)†; alquiler de casas baratas asunción (10); alquiler de casas baratas en asuncion (10); alquiler de casas baratas en asunción (10); alquiler de casas economicas en asuncion (10); alquiler de casas economicas en asunción (10); alquiler de casas en asuncion paraguay (10) | inmobiliaria.com.py | PR 2 |
| 4 | `/venta/asuncion/casas` | casas en venta asuncion | 390 | casa en asuncion venta (390); casa en venta en asuncion (390); clasipar casas baratas en asunción (90)†; venta de casas economicas en asunción paraguay (50); ~~casas en remate en asunción (30)~~ dropped; casa en venta en asunción paraguay (20); casas en asuncion paraguay (20); casa asuncion venta (10); casa en venta en paraguay asuncion (10); casas a la venta en asuncion (10); casas a la venta en asuncion paraguay (10); casas baratas en asunción (10); casas en asuncion venta clasipar (10)†; casas en venta asuncion paraguay (10); casas en venta asunción paraguay (10); casas en venta paraguay asuncion (10); clasipar venta de casas en asuncion (10)† | inmobiliaria.com.py | PR 2 |
| 5 | `/alquiler/san-lorenzo/casas` | alquiler de casa en san lorenzo | 260 | casa en alquiler san lorenzo (210); casas en alquiler san lorenzo (210); alquiler de casas en san lorenzo baratos (140); alquiler de casa en san lorenzo barato (140); alquiler de casas baratas en san lorenzo (10); casa alquiler san lorenzo ruta 2 (10); alquiler de casa con piscina en san lorenzo (10); alquiler de casa en calle i san lorenzo (10); alquiler de casa en san lorenzo zona sinalco (10); alquiler de casa independiente en san lorenzo (10); alquiler de casa zona san lorenzo (10) | inmobiliaria.com.py | PR 2 |
| 6 | `/venta/asuncion/departamentos` | departamentos en venta asuncion | 260 | departamento en asuncion (1300, shared with #2 — sale long tail here); venta de departamentos baratos en asunción paraguay (110); venta de departamentos en asuncion (90); departamentos en pozo asuncion (90); venta de departamentos usados en asunción (50); departamentos baratos en asuncion (40); departamentos en venta en asuncion paraguay (30); comprar departamentos en asuncion (30); comprar departamento en asuncion paraguay (30); venta de departamentos en asuncion paraguay (20); venta de departamentos baratos en asunción (10); venta de departamentos en asunción financiados (10); precio de departamentos en asuncion (10) | inmobiliaria.com.py | PR 2 |
| 7 | `/venta/luque/departamentos` | departamentos en luque | 260 | — | inmobiliaria.com.py | PR 2 |
| 8 | `/alquiler/luque/casas` | casas en alquiler luque | 170 | alquiler de casa en luque (170); alquiler de casa en 4to barrio luque (110); alquiler de casa en luque barato (90); alquiler de casas en luque zona conmebol (30); alquiler de casa en luque palma loma (20); alquiler de casa con piscina en luque (10); alquiler de casa en barrio molino luque (10); alquiler de casa en bella vista luque (10); alquiler de casa en isla bogado luque (10); alquiler de casa en luque centro (10); alquiler de casa en mora cue luque (10); alquiler de casa en villa adela luque (10); alquiler de casa zona luque (10); alquiler de casas baratas en luque (10); alquiler de casas economicas en luque (10) | inmobiliaria.com.py | PR 2 |
| 9 | `/alquiler/ciudad-del-este/casas` | alquiler de casas baratas en ciudad del este | 170 | alquiler de casas cde km 7 (140); alquiler de casa ciudad del este (70); alquiler de casa cde (50); alquiler casa ciudad del este (20); alquiler de casa en cde (20); casas en alquiler ciudad del este (10); alquiler de casa en cde barato (10); alquiler de casa en ciudad del este paraguay (10) | inmobiliaria.com.py | PR 2 |
| 10 | `/alquiler/lambare/casas` | alquiler de casa en lambare | 170 | casas en alquiler lambare (40); alquiler de casa 3 dormitorios lambaré (40); alquiler de casas baratas en lambaré (40); alquiler de casa en lambaré (20); casas para alquilar en lambare (10); alquiler de casa con piscina en lambaré (10); alquiler de casa independiente en lambare (10); alquiler de casas economicas en lambare (10) | inmobiliaria.com.py | PR 2 |
| 11 | `/venta/luque/casas` | casas en venta luque | 170 | casas en venta en luque paraguay 80 millones (40); casas en luque (30); casas baratas en luque (20); casa en venta en luque paraguay (10); casas en luque venta (10); casas en venta en luque paraguay (10); casas en venta luque paraguay (10); chalet en luque (10); casas economicas en luque (10) | inmobiliaria.com.py | **PR 1 pilot** |
| 12 | `/venta/lambare/casas` | casas en venta lambare | 140 | casa venta lambare (140); casa en venta en lambare (140); casas en venta en lambare zona canal 13 (10); clasipar casas economicas en lambaré (10)† | inmobiliaria.com.py | PR 2 |
| 13 | `/alquiler/fernando-de-la-mora/casas` | alquiler de casa en fernando de la mora | 140 | casas en alquiler fernando de la mora (70); alquiler de casa fernando de la mora (70); alquiler casa fernando de la mora (50); alquiler de casa con piscina en fernando dela mora (10); alquiler de casas baratas en fernando dela mora paraguay (10); alquiler de casas economicas en fernando dela mora zona norte (10); alquiler de casas economicas en fernando dela mora zona sur (10); alquiler de casas economicas fernando de la mora (10); alquiler de casa en fernando dela mora (0); alquiler de casa independiente en fernando dela mora (0) | inmobiliaria.com.py | PR 2 |
| 14 | `/alquiler/ciudad-del-este/departamentos` | alquiler departamento ciudad del este | 110 | alquiler de departamento en cde (50); alquiler de departamentos cde (50); alquiler de departamento en ciudad del este (30); alquiler de departamentos ciudad del este (20); departamentos en alquiler ciudad del este (10); alquiler de apartamentos en ciudad del este (10) | inmobiliaria.com.py | PR 2 |
| 15 | `/venta/aregua/terrenos` | terreno en aregua | 110 | terreno aregua (50); terrenos a cuotas sin entrega en areguá (20); loteamientos en areguá (10); terreno en areguá con vista al lago (10); terrenos a cuotas en aregua (10); terrenos a cuotas en areguá (10); terrenos baratos en aregua (10); terrenos baratos en areguá (10); terrenos en aregua a cuotas (10); terrenos en areguá (10); terrenos en caacupemi aregua (10); terrenos en venta aregua (—) | terreno.com.py | PR 2 |
| 16 | `/venta/san-lorenzo/casas` | casas en venta san lorenzo | 110 | casa venta san lorenzo (50); clasipar venta de casas en san lorenzo (20)†; casa de venta en san lorenzo (10); casas baratas en san lorenzo (10); casas de venta en san lorenzo (10); casas en venta san lorenzo listado nuevo (10); chalet san lorenzo (10); comprar casa san lorenzo (10); casa en venta en san lorenzo paraguay (10); casas en venta san lorenzo paraguay (10); compra de casas en san lorenzo (0); clasificados venta de casas en san lorenzo (—) | inmobiliaria.com.py | PR 2 |
| 17 | `/alquiler/san-lorenzo/departamentos` | departamentos en alquiler san lorenzo | 110 | alquiler de departamento en san lorenzo (90); alquiler de apartamentos en san lorenzo (10); alquiler de departamento en san lorenzo económicos (10) | inmobiliaria.com.py | PR 2 |
| 18 | `/alquiler/lambare/departamentos` | alquiler de departamentos en lambaré baratos | 90 | departamentos en alquiler lambare (70); alquiler de departamento en lambare (30); alquiler de departamentos baratos en lambare (10); alquiler de departamentos en lambare baratos (10) | inmobiliaria.com.py | PR 2 |
| 19 | `/alquiler/luque/departamentos` | alquiler de departamento en luque | 90 | departamentos en alquiler luque (70); alquiler de departamento en luque económicos (40) | inmobiliaria.com.py | PR 2 |
| 20 | `/alquiler/mariano-roque-alonso/casas` | alquiler de casa en mariano roque alonso | 90 | alquiler de casa en mariano roque alonso barato (50); casas en alquiler mariano roque alonso (20); alquiler de casa en roque alonso (10); alquiler de casas baratas en mariano roque alonso (10) | inmobiliaria.com.py | PR 2 |
| 21 | `/venta/luque/terrenos` | terrenos en venta luque | 70 | terrenos a cuotas en luque (50); hendyla terrenos en luque (40)†; venta de terreno en luque (20); venta de terrenos en luque a cuotas (20); clasipar terrenos en luque (10)†; clasipar terrenos luque (10)†; lotes a cuotas en luque (10); terreno barato en luque (10); terreno en luque zona aeropuerto (10); terrenos a cuotas luque (10); terrenos baratos en luque (10); terrenos en luque 4to barrio (10); terrenos en luque clasipar (10)†; terrenos en luque paraguay (10); terrenos en venta en luque (10); terrenos en venta en luque paraguay (10); terrenos en yukyry luque (10); terrenos en zarate isla luque (10); vendo terreno en luque (10); vendo terreno en luque laurelty (10); venta de terrenos en luque paraguay (10); clasipar terrenos a cuotas en luque (0)† | terreno.com.py | PR 2 |
| 22 | `/alquiler/fernando-de-la-mora/departamentos` | alquiler departamento fernando de la mora | 70 | alquiler de departamento en fernando de la mora (50); alquiler de departamentos fernando de la mora (50); departamentos en alquiler fernando de la mora (30); alquiler de departamentos baratos en fernando de la mora (10); alquiler de departamentos en fernando de la mora zona norte (10); alquiler de departamentos en fernando dela mora zona sur (10); alquiler de departamentos en fernando zona sur clasipar (10)†; alquiler de departamentos fernando de la mora zona norte (10) | inmobiliaria.com.py | PR 2 |
| 23 | `/alquiler/encarnacion/departamentos` | alquiler de departamentos en encarnación | 70 | departamentos en alquiler encarnacion (40); alquiler departamento encarnacion (40); alquiler de departamentos encarnacion (20); alquiler de departamento en encarnacion (10); alquiler de departamentos en encarnacion (10); alquiler de departamentos en encarnacion paraguay (10); alquiler departamento en encarnacion paraguay (10) | inmobiliaria.com.py | PR 2 |
| 24 | `/venta/fernando-de-la-mora/casas` | casas en venta fernando de la mora | 70 | casas en fernando de la mora zona norte (30); casa en venta en fernando de la mora (20); casas en venta en fernando de la mora zona sur (10); clasipar venta de casas en fernando dela mora zona norte (10)†; clasipar venta de casas en fernando dela mora zona sur (10)†; casas en venta en fernando dela mora (0) | inmobiliaria.com.py | PR 2 |
| 25 | `/venta/mariano-roque-alonso/casas` | casas en venta mariano roque alonso | 70 | casa en venta en mariano roque alonso (70) | inmobiliaria.com.py | PR 2 |
| 26 | `/venta/ciudad-del-este/casas` | casas ciudad del este | 70 | casa en venta en ciudad del este paraguay (10); casas baratas en venta en ciudad del este paraguay (10); casas en venta ciudad del este paraguay (10); casas en venta en ciudad del este paraguay (10) | inmobiliaria.com.py | PR 2 |
| 27 | `/alquiler/encarnacion/casas` | casas en alquiler encarnacion | 70 | — | inmobiliaria.com.py | PR 2 |
| 28 | `/alquiler/luque/duplex` | duplex en alquiler luque | 50 | alquiler de duplex en luque (30); alquiler duplex económicos en luque (10); alquilo duplex en luque (10) | inmobiliaria.com.py | PR 2 |
| 29 | `/venta/ciudad-del-este/terrenos` | terrenos en venta cde | 50 | terrenos en venta ciudad del este (10); loteamientos en ciudad del este (10); venta de terreno en ciudad del este (10); venta terrenos ciudad del este (10) | terreno.com.py | PR 2 |
| 30 | `/venta/itaugua/terrenos` | terreno en itaugua | 50 | lotes en itaugua (20); terrenos en venta itaugua (—) | terreno.com.py | PR 2 |
| 31 | `/venta/luque/duplex` | duplex en venta luque | 50 | — | inmobiliaria.com.py | PR 2 |
| 32 | `/venta/encarnacion/casas` | casas en venta encarnacion | 40 | casas en venta en encarnación paraguay (30); casa en venta en encarnacion paraguay (10); casas economicas en encarnación (10); casas en encarnacion paraguay (10); casas en venta encarnacion paraguay (10) | inmobiliaria.com.py | PR 2 |
| 33 | `/alquiler-temporal/asuncion` | alquiler temporal asuncion | 40 | — | inmobiliaria.com.py | PR 2 |
| 34 | `/venta/ypacarai/terrenos` | terreno en ypacarai | 30 | terrenos con vista al lago ypacarai (10); terrenos en venta ypacarai (—) | terreno.com.py | PR 2 |
| 35 | `/venta/limpio/terrenos` | terrenos en venta limpio | 20 | terrenos a cuotas en limpio (10); terrenos a cuotas limpio (10); terrenos en limpio paraguay (10); venta de terreno en limpio (10) | terreno.com.py | PR 2 |
| 36 | `/venta/encarnacion/terrenos` | terrenos en venta encarnacion | 20 | terrenos en venta en encarnacion paraguay (10); terrenos en venta encarnacion paraguay (10); venta de terrenos en encarnacion paraguay (10) | terreno.com.py | PR 2 |
| 37 | `/venta/limpio/casas` | casas en venta limpio | 20 | casa en venta en limpio paraguay (10); casas en venta en limpio hendyla (0)† | inmobiliaria.com.py | PR 2 |
| 38 | `/venta/capiata/terrenos` | terrenos en venta capiata | 20 | terrenos baratos en capiata ruta 2 (10) | terreno.com.py | PR 2 |

**38 pages: 30 on `inmobiliaria.com.py` + 8 land pages on `terreno.com.py` (S9).**

### A2. Pages for the places added by decision S10

| URL | Main keyword | Vol | Door |
| --- | --- | --- | --- |
| `/venta/san-bernardino/terrenos` | terrenos en san bernardino | 210 | terreno.com.py |
| `/venta/san-bernardino/casas` | casas en venta en san bernardino paraguay | 30 | inmobiliaria.com.py |
| `/alquiler/asuncion/loma-pyta/casas` | alquiler de casas baratas en loma pyta | 90 | inmobiliaria.com.py |
| `/alquiler/asuncion/loma-pyta/departamentos` | alquiler de departamento en loma pyta | 30 | inmobiliaria.com.py |

Secondaries are the matching rows of table C1.

Judgement calls (answered by the founder 2026-09-27 — kept for the record):

- **#2 `departamento en asuncion` (1 300)** has no operation word. It sits on
  the rental page because every other Asunción apartment cluster is rental
  (1 000 + 590 + 260 + 170 + 140 …) against 260 for sale. The venta page (#6)
  links to it and back. If the founder's own experience says buyers type it,
  swap it to #6 — one line in this table and the two content files.
- **#1 `/alquiler/asuncion`** is an *untyped* city page (all rentals in
  Asunción). It is the only evergreen page without a type.
- **`departamentos en pozo asuncion` (90)** is on #6 as a secondary phrase;
  the section that answers it links to `/proyectos` rather than promising
  pre-construction units the grid may not have.
- **`casas en remate en asunción` (30)** is on #4 but the portal has no
  foreclosure listings; the page must not imply it does. Candidate to drop.

## B. Keywords that map to a URL too small to be evergreen

These URLs keep the old rule (≥ 3 listings indexable, 1–2 noindex, 0 → 404 or
redirect). They are listed so no keyword is silently dropped.

| URL | Keywords (vol) |
| --- | --- |
| `/alquiler/asuncion/quintas` | alquiler de casa quinta en asuncion paraguay (10) |
| `/alquiler/asuncion/sajonia/casas` | alquiler de casa en sajonia clasipar (50)† |
| `/alquiler/asuncion/sajonia/departamentos` | alquiler de departamentos en barrio sajonia asuncion (10) |
| `/alquiler/asuncion/san-vicente/casas` | alquiler de casa barrio san vicente asuncion (10) |
| `/alquiler/asuncion/villa-morra/casas` | alquiler casa villa morra (10) |
| `/alquiler/asuncion/villa-morra/departamentos` | alquiler de departamentos en villa morra (10); alquiler de departamentos en villa morra asuncion (10) |
| `/alquiler/fernando-de-la-mora/quintas` | casa quinta para alquilar en fernando dela mora (10) |
| `/venta/aregua/casas` | casas economicas en areguá (10); casas en venta aregua paraguay (10) |
| `/venta/caacupe/casas` | casas baratas en caacupé (10) |
| `/venta/capiata/casas` | casas en venta en capiata paraguay (10) |
| `/venta/ciudad-del-este` | venta de casas y terrenos en ciudad del este paraguay (10) |
| `/venta/fernando-de-la-mora/duplex` | clasipar venta de duplex en fernando dela mora zona norte (10)† |
| `/venta/fernando-de-la-mora/terrenos` | terreno barato fernando de la mora (10) |
| `/venta/hernandarias/casas` | casas en venta en hernandarias paraguay (10) |
| `/venta/lambare/terrenos` | terreno en lambare baratos (10) |
| `/venta/luque` | infocasas luque (30)† |
| `/venta/mariano-roque-alonso/terrenos` | terreno barato en mariano roque alonso (10); terrenos baratos en mariano roque alonso (10) |
| `/venta/nemby/casas` | casa barata en ñemby (10) |
| `/venta/pedro-juan-caballero/casas` | casas en venta en pedro juan caballero (10) |
| `/venta/villa-elisa/casas` | clasipar casas en villa elisa (20)†; casas a cuotas en villa elisa (10); casas en venta en villa elisa paraguay (10) |

## C. Keywords with no category URL today

### C1. The place is not in `locations` (needs a seed entry first)

| Place | Keywords (vol) |
| --- | --- |
| san bernardino | terrenos en san bernardino (210); loteamientos en san bernardino (40); terrenos en venta san bernardino (30); terrenos en venta en san bernardino (30); casas en venta en san bernardino paraguay (30); venta de terreno en san bernardino (20); casas en san bernardino paraguay (20); terrenos de venta en san bernardino (10); lotes en venta en san bernardino (10); san bernardino terrenos (10); terrenos baratos en san bernardino (10); venta de lotes en san bernardino (10); casas en venta san bernardino paraguay (10) |
| loma pyta | alquiler de casas baratas en loma pyta (90); alquiler de departamento en loma pyta (30); alquiler de casa en loma pyta (30); alquiler de casa pequeña en loma pyta (20); terrenos baratos en loma pyta (10); alquiler de casa en loma pytá (10); alquiler barato en loma pyta (10); alquiler barato en loma pytá (10); alquiler de casa en loma pyta barato (10); alquiler de casa pequeña en loma pytá (10); alquiler de casa en loma pytá barato (0) |
| villarrica | casas y terrenos en venta en villarrica paraguay (20); casa en venta en villarrica paraguay (10) |
| surubi | casa en venta en surubi i (10) |
| san bernabe | casa en venta san bernabe (10) |
| emboscada | terreno barato en emboscada (10); terrenos baratos en emboscada (10) |
| caaguazu | casa en venta en caaguazu paraguay (10); casas en venta en caaguazu paraguay (10) |
| coronel oviedo | casa en venta en coronel oviedo paraguay (10) |
| atyra | casas en venta en atyra paraguay (10) |
| concepcion | casas en venta en concepcion paraguay (10) |

**San Bernardino is the biggest land search in the export (210 + variants)
and has no URL**, because the location tree (`seed-locations.ts`) does not
include it. Loma Pytã (an Asunción barrio, ~90 for cheap house rentals) is
the same. Adding them is a small code change plus `npm run seed:locations`
and `npm run cron:geo` on production — listed as decision S10, since the
coordinates and the department are facts someone should check.

### C2. National searches (no city) — blocked on decision F-f

`/venta?tipo=casas` is noindex by design and a clean `/venta/casas` URL is
the open founder decision F-f in `docs/decisions-needed.md`. Until that is
decided these have no indexable page:

casas en paraguay (210); venta de casas baratas en paraguay (170); terrenos baratos en paraguay (140); casas en venta paraguay (90); casa venta paraguay (90); venta de casas en paraguay (70); casa economica en paraguay (70); casas de venta en paraguay (70); casas economicas en paraguay (70); terrenos baratos a cuotas en paraguay (40); venta de departamentos financiados en paraguay (20); casas baratas en paraguay (20); casas de remate en paraguay (20); lotes baratos en paraguay (10); terrenos en venta baratos paraguay (10); departamentos en paraguay venta (10); casa de campo en venta en paraguay (10); casa quinta en venta paraguay (10); casas a la venta en paraguay (10); casas financiadas en paraguay (10); casas lujosas en paraguay (10); casas para comprar en paraguay (10); clasipar paraguay venta de casas (10); casas en venta en paraguay financiados (0)

`terrenos baratos en paraguay` (140) and the other national land searches fit
`terreno.com.py/venta` — the one land page the SEO-doors plan already
identifies as unique to that door.

### C3. Out of scope (not a listing search we can serve)

- alquiler de pieza en loma pyta barato (30) — room rental — no property type for it
- alquiler de pieza zona villa morra (20) — room rental — no property type for it
- inmobiliaria en luque (70) — agency search — directory door (inmobiliarios.com.py), not a category
- inmobiliaria en asuncion (260) — agency search — directory door (inmobiliarios.com.py), not a category
- asunción inversiones y administraciones inmobiliarias (10) — agency search — directory door (inmobiliarios.com.py), not a category
- atalaya de inmuebles asuncion (10) — agency search — directory door (inmobiliarios.com.py), not a category
- barrio cerrado paraguay (90) — no gated-community facet
- casas prefabricadas en paraguay (390) — product (prefab houses), not a listing search
- casas prefabricadas paraguay precios (40) — product (prefab houses), not a listing search
The two agency searches (`inmobiliaria en asuncion` 260, `inmobiliaria en
luque` 70) belong to the directory door, `inmobiliarios.com.py/inmobiliarias`
— worth a follow-up there, not a category page.

### C4. Foreign places or no measurable volume (ignored)

Mostly San Lorenzo in Mexico, Spain, Argentina and Puerto Rico, and San
Bernardino (Texcoco, Mexico):

valle san lorenzo condominio (—); alquiler en valle san lorenzo (—); casa en san jose insurgentes (—); casa en venta cañada san lorenzo (—); casa en venta en san lorenzo santa fe (10); casa en venta san lorenzo la cebada (—); casa en venta san lorenzo tepaltitlan (—); casa en venta san lorenzo tezonco (—); casa en venta urbanizacion hacienda florida san lorenzo (0); casas en san lorenzo de la parrilla (—); casas en san lorenzo santa fe (—); casas en san lorenzo tepaltitlan (—); casas en venta bosque llano en san lorenzo (—); casas en venta en altos de san lorenzo la plata (—); casas en venta en salta san lorenzo (—); casas en venta en san lorenzo almecatla puebla (—); casas en venta en san lorenzo de calatrava (—); casas en venta en san lorenzo de la parrilla (—); casas en venta en san lorenzo tepaltitlan (—); casas en venta en val de san lorenzo (—); casas en venta en valle de san lorenzo tezonco (—); casas en venta san lorenzo almecatla (—); casas en venta san lorenzo las palmas (—); casas en venta san lorenzo pr (—); casas en venta san lorenzo puerto rico (—); casas reposeidas en praderas de san lorenzo (—); casas san lorenzo las palmas (—); casas san lorenzo santa marta (—); casas san lorenzo tepaltitlan (—); terrenos en san bernardino texcoco (—); venta de terrenos en san bernardino texcoco (0); alquiler de departamentos en san lorenzo santa fe (0); alquiler casa terrera valle san lorenzo (—); alquiler de casa en praderas de san lorenzo (—); alquiler de casa en san lorenzo pr (—)

## Domains — can two of our domains hold two spots for one search?

Short answer: **yes, but only with two genuinely different pages — never with
the same listing grid twice.**

- Google shows several domains from one owner for the same query when each
  page is independently useful (the Zillow / Trulia pattern: one company, two
  brands, both on page one). It filters the second copy out when two pages
  carry the same listings under the same template, and it treats a set of
  near-identical sites funnelling to one business as a *doorway* pattern —
  that is a ranking penalty, not just a lost spot.
- So the two spots come from **two intents**, not two copies. For
  "terrenos en venta luque": spot 1 is a listing page (the evergreen page
  with the grid, the chips and the brief); spot 2 is a *land* page that
  answers what a land buyer needs and a generic portal doesn't — lots in
  cuotas vs. contado, what a loteamiento is, titles and servicios, price per
  m² from our own rows. Different content, different reason to rank.
- Today `terreno.com.py/venta/luque/terrenos` and
  `inmobiliaria.com.py/venta/luque/terrenos` are the *same* grid, both
  self-canonical (`docs/plan-seo-doors-2026-09-27.md` §4.1). That is the
  situation that costs a spot instead of adding one.

**Recommendation (decision S9):** make `terreno.com.py` the land specialist
in Spanish — the 8 land pages in table A are written *for that door* (its
`door` in the registry is one line), with land-only content, and
`inmobiliaria.com.py` keeps its city pages and the non-land evergreen pages.
Then `inmobiliaria.com.py`'s `/venta/<city>/terrenos` grids should point
their canonical at `terreno.com.py` (the `ownsCategories` flag, plan §7 /
decision S8), so the two doors stop competing for the same grid and each
holds its own kind of page. This reverses the SEO-doors plan's recommendation
S1(a) on purpose: you have said land is `terreno.com.py`'s job, every door is
at zero authority at launch so there is no "stronger domain" to protect yet,
an exact-match domain helps click-through in a low-competition market, and
it is reversible with the same flag. The alternative (plan S1(a)) is equally
buildable: land evergreen pages on `inmobiliaria.com.py`, and
`terreno.com.py` owns land guides and the national land hub instead.

The evergreen mechanism supports either answer without code changes: each
registry entry names its owner door, and a path is evergreen **only** on
that door.

## Claims to verify

Every factual claim in a content file is listed in its `claimsToVerify`
field and copied into the PR that adds it. Numbers on the page (counts,
lowest/highest asking price, the price-band chips) are never in the content
files — they are counted from the door's own rows at request time
(`getCategoryInventory()` and one grouped band count).
