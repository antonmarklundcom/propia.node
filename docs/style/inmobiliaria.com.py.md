# Style guide — inmobiliaria.com.py

Standalone brand. Shares the app and database with the other domains for
management only; nothing about its look is required to match them.

## 1. Who it is for, and what it has to feel like

Paraguayan sellers listing a property (often the family home, often their
first time doing this online), plus Spanish-speaking buyers in Paraguay and
the wider region. The portal has to feel **local, warm, competent and
unhurried**. The seller's fear is "will they treat this seriously and will
strangers get my number"; the buyer's is "is this listing real". Every
design choice below serves one of those two fears.

Tone of voice: *vos*, second person, short sentences, concrete. No
exclamation marks, no "¡Increíble oportunidad!". The brand never says
*lujo*, *exclusivo* or *premium*. Money is written the way people say it:
`US$ 145.000`, `Gs. 850.000.000`, `Gs. 4,1 millones/mes`.

## 2. Palette — "Tierra"

The register is Paraguay's own materials: red earth, roof tile, unpainted
adobe, dry-season grass. Warm everywhere.

| Token | Hex | Use |
| --- | --- | --- |
| `--color-primary` | `#26211A` | Header, footer, hero base, dark CTA sections. Umber, not black. |
| `--color-primary-dark` | `#1C1813` | Footer bottom bar, hover on primary buttons with dark fill. |
| `--color-primary-soft` | `#322B22` | Search bar panel, cards on dark sections. |
| `--color-accent` | `#B0532F` | Terracotta. The one primary button per block, hairlines, large numerals. 4.56:1 on cream — passes AA at any size. |
| `--color-accent-hover` | `#C9704E` | |
| `--color-accent-on-dark` | `#D98B68` | Tracked labels and small accent text on umber (5.97:1). Never use `#B0532F` for small text on dark. |
| `--color-on-accent` | `#FFFFFF` | Text on terracotta buttons (5.09:1). |
| `--color-accent-soft` | `#F0E6D8` | The one tint allowed as a block fill on cream (alternating sections, the trust strip). |
| `--color-link` | `#94452A` | Body links (5.99:1). |
| `--color-link-hover` | `#6E3320` | |
| `--color-ink` | `#211C17` | Headings and body. |
| `--color-ink-secondary` | `#5E5750` | Secondary text, specs (6.37:1). |
| `--color-ink-muted` | `#857D74` | Placeholders, timestamps only; not for anything the reader must read. |
| `--color-background` | `#F7F2E8` | Page. Warm cream, a half-step pinker than the old `#F6F3EC`. |
| `--color-surface` | `#FFFFFF` | Form fields, the detail-page contact card. |
| `--color-border` | `rgba(33,28,23,0.12)` | |
| `--color-border-accent` | `rgba(176,83,47,0.24)` | |
| `--color-whatsapp` | `#1FAC54` | Floating WhatsApp button and the WhatsApp contact button only. Never repurposed. |
| `--color-success` / `--color-error` | `#2E7D4F` / `#B8402F` | Form states. |
| Overlays | `rgba(20,14,10, α)` on the existing ramps | Hero/card/zone scrims. Warm neutral; never the old green tint. |

Rules: two backgrounds per page, cream and umber. Terracotta is never a
section background. Gold does not exist on this domain.

## 3. Typography

**Display: Lora** (variable, 400–600, plus italic). A warm, wide-bodied
serif that stays readable at 18 px on a phone, where Cormorant thins to
hairlines. It reads "well-made local newspaper", not "boutique hotel".
**Text: Figtree** (variable, 400–600). Friendly geometric sans with open
counters and real tabular numbers, which prices need.

Self-host both via `@fontsource-variable/lora` and
`@fontsource-variable/figtree` (latin subset only, `font-display: swap`),
the same way Cormorant and Jost are hosted today.

| Role | Face | Size (desktop / mobile) | Weight | Tracking | Case |
| --- | --- | --- | --- | --- | --- |
| Hero H1 | Lora | 56 / 36 px, line 1.05 | 500 | −0.01em | Sentence |
| H2 section | Lora | 36 / 28 px, line 1.1 | 500 | 0 | Sentence |
| H3 card / panel | Lora | 22 / 20 px | 500 | 0 | Sentence |
| Price on card | Lora | 24 px | 600 | 0 | — |
| Eyebrow label | Figtree | 12 px | 600 | 0.12em | UPPERCASE |
| Body | Figtree | 17 / 16 px, line 1.6 | 400 | 0 | — |
| Specs / meta | Figtree | 14 px | 500 | 0.01em | — |
| Button | Figtree | 14 px | 600 | 0.04em | Sentence ("Buscar", "Publicar gratis") |
| Nav | Figtree | 15 px | 500 | 0 | Sentence |

Italic Lora is used for one emphasised phrase in a headline at most
("Tu próxima casa *está más cerca de lo que pensás*"). Eyebrows lose the
old 3–4 px tracking; 0.12em is the ceiling. Uppercase buttons are gone —
sentence case reads friendlier and is what Paraguayan sites use.

Numbers: `es-PY` formatting, tabular figures (`font-variant-numeric:
tabular-nums`) on every price and spec.

## 4. Shape and surfaces

- **Radius 4 px** on buttons, fields, chips and the contact card; **0** on
  photos and photo cards. A small radius is the single cheapest signal of
  "friendly, not intimidating"; a big one reads as an app.
- Borders over shadows. One shadow exists: the sticky mobile contact bar
  (`0 -6px 24px rgba(33,28,23,0.10)`).
- **Listing cards stay photo-first**: image, warm scrim from the bottom,
  price and title in white on it. Under the photo a 44 px cream strip with
  the specs row in ink and a small terracotta "Particular" or agency-name
  tag. The strip is what distinguishes this card from the other domains:
  the reader gets the facts off the photo.
- Section rhythm: `clamp(72px, 8vw, 112px)` between sections; container
  1320 px; grid gap 20 px.

## 5. Components

**Header.** Umber bar, 68 px. Wordmark "Inmobiliaria Paraguay" in Lora 500,
cream. Nav: Comprar · Alquilar · Terrenos · Proyectos · Inmobiliarias. Right
side: a terracotta **Publicar gratis** button and a ghost "Ingresar". On
mobile the Publicar button survives, the nav collapses.

**Hero.** Full-bleed photo of an ordinary good Paraguayan house (tile roof,
garden, late light), never a tower render. Scrim from the left. Eyebrow in
`accent-on-dark`: "Casas, departamentos y terrenos en todo el Paraguay".
H1: "Tu próxima casa está más cerca de lo que pensás". Under it the search
bar on a `primary-soft` panel: Operación (Comprar/Alquilar) · Ciudad o
barrio · Tipo · Hasta US$ · **Buscar**. Below the panel, one line of popular
searches as links. **Right of the search panel on desktop (below on
mobile): a second, equally weighted card**: "¿Vendés o alquilás? Publicá
gratis, sin comisión del portal, con contacto directo por WhatsApp." with a
terracotta button. Supply comes from sellers; the hero has two jobs.

**Search bar** (shared component, themed): fields `surface` white with 4 px
radius on cream, `primary-soft` with cream borders on dark. Labels above
fields, not placeholders alone.

**Listing card.** As in §4. Specs row: `3 dorm · 2 baños · 180 m²`, then
the cuota line in terracotta when present: `Cuota est. Gs. 4,1 M/mes`.
Featured listings get a thin terracotta top border, not a badge.

**Buttons.** Primary: terracotta fill, white text. Secondary: ink outline
on cream / cream outline on dark. WhatsApp: `#1FAC54` fill, white text,
WhatsApp glyph, used only where the action is literally opening WhatsApp.

**Trust strip** (`accent-soft` fill): three items with a Lora numeral or
word and a Figtree label — *Gratis / publicar tu aviso*, *WhatsApp /
contacto directo, sin intermediarios*, *Asunción y todo el país*. Numbers
(listings, agencies) only when they are real and above a few hundred.

**"Vendé tu propiedad" section** (dark, umber): three steps in a row —
Cargá los datos y fotos · Revisamos el aviso · Recibís contactos por
WhatsApp. One CTA. Short paragraph: what the portal does and does not do
(does not charge sellers, does not call them, does not sell their number).

**Detail page.** Gallery full width. Then two columns: left = price
(Lora 600, 32 px), address line, specs row, description, cuota box
(cream, terracotta hairline, "Cuota estimada con AFD, sujeto a
aprobación"), map, similar listings. Right sticky = contact card on white:
who is selling (photo, name, "Particular" or agency), **WhatsApp button
first**, then the lead form (nombre, teléfono, mensaje pre-filled). On
mobile the WhatsApp + Llamar bar is sticky at the bottom.

**Footer.** Umber. Four columns: Comprar (by city), Alquilar, Para
vendedores, Empresa (Nosotros, Contacto, Términos, Privacidad). Bottom bar
in `primary-dark`: legal line with the EAS company name as required by
policy and nothing more. No newsletter block on this domain.

## 6. Home page, in order

1. Hero with dual intent (search + publicar card)
2. Recién publicadas (8 cards, "Ver todas")
3. Buscar por ciudad — Asunción, Luque, San Lorenzo, Fernando de la Mora,
   Lambaré, Ciudad del Este, Encarnación, San Bernardino; photo tiles with
   the count
4. Vendé tu propiedad (dark section, three steps)
5. Operación hubs — Comprar / Alquilar / Terrenos / Departamentos en pozo
6. Financiación — one calm paragraph on AFD cuotas and a link to
   `/financiamiento`
7. Inmobiliarias y agentes (logo/name row, link to the directory)
8. Preguntas frecuentes (seller-first questions)
9. Footer

## 7. Motion

Photo scale 1.0 → 1.04 on hover over 900 ms with the existing ease; content
reveals fade-up 12 px once. Nothing else moves. Respect
`prefers-reduced-motion`.

## 8. Notes for the builder

- Theme values go in `OVERRIDES.inmobiliaria` in `src/design/themes.ts`.
  `ThemeVars` needs these added to `EDITORIAL` first, with baseline values
  so terreno does not change: `--overlay-hero`, `--overlay-card`,
  `--overlay-zone`, `--color-border-accent`, `--color-on-accent`
  (`#0E1F17`), `--color-accent-on-dark` (`#C19A4D`), `--font-display`,
  `--font-sans`, `--radius-control` (`0`), `--label-tracking` (`3px`),
  `--button-case` (`uppercase`).
- `globals.css` rules that hard-code the overlays, `rgba(193,154,77,…)`,
  `color: var(--color-primary)` on accent fills, `letter-spacing: 2px–3.6px`
  on labels and `text-transform: uppercase` on buttons must read the new
  tokens instead. Grep for each literal.
- Fonts: install the two fontsource packages, import their CSS in
  `app/layout.tsx` next to the existing `@font-face` rules, and set
  `--font-display` / `--font-sans` in the override. Do not remove the
  Cormorant/Jost files; terreno still uses them.
- Structural pieces (the hero publicar card, the card facts strip, the
  home section order, the sidebar order) belong in a per-vertical section
  registry, not in `if (vertical === "inmobiliaria")` inside shared
  components. `src/design/themes.ts`'s header comment already prescribes
  this.
- Baseline link fix that ships with this: `--color-link` in `EDITORIAL`
  and `globals.css` becomes `#8A6626` (the old value is 2.87:1 on cream).
- Verify: `npm run typecheck && npm run build && npm run verify:i18n &&
  npm run verify:seo`.
