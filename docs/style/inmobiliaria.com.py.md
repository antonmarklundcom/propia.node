# Style guide — inmobiliaria.com.py — "Nórdico" (LOCKED 2026-09-04)

Standalone brand. Shares the app and database with the other domains for
management only. Chosen over "Tierra" (warm/rustic) and "Atelier"
(European editorial) on the canvas; both are kept on the canvas for
reference and are not to be built.

## 1. Positioning and what the site is for

**Primary objective: seller leads.** Ads and the home page exist to make a
Paraguayan owner say "quiero vender con estos, no con Remax o Century 21".
Secondary: recruit independent local realtors as partners
(`/para-inmobiliarias`). Tertiary: buyers, including foreign investors,
who reach the Spanish site.

The pitch is **the modern, highest-performing way to sell in Paraguay**:
professional photography and styling, digital marketing, a documented
sales process, market data, and an international buyer network (the
English portal and the site network). Influence: Scandinavian and US
property-tech. White space, one accent, big photography, numbers as proof,
black buttons.

Tone: *vos*, short, confident, specific. No exclamation marks. Proof over
adjectives. Never the words *lujo*, *exclusivo*, *premium*; the design says
it. Every number on the site must be true or be cut; a placeholder number
in a mockup is not a licence to ship it.

Trust is built with specifics, not badges: named process steps, real
response times, real photography examples, the EAS company named in the
legal line, a human face on the seller landing page.

## 2. Palette

| Token | Hex | Use |
| --- | --- | --- |
| `--color-background` | `#FAFAF8` | Page. Near-white, warm-neutral, no yellow. |
| `--color-surface` | `#FFFFFF` | Cards, panels, search bar, forms. |
| `--color-ink` | `#121414` | Headings, body, **primary buttons (black fill, white text)**. |
| `--color-ink-secondary` | `#5F6663` | Secondary text, specs (7.2:1). |
| `--color-ink-muted` | `#9AA09D` | Placeholders, captions only. |
| `--color-accent` | `#2E6B4F` | The one green. Links, tags, a single highlighted numeral, the "Publicado en inglés" pill, step numerals on dark. Never a button fill, never a section background. |
| `--color-accent-hover` | `#245741` | |
| `--color-accent-soft` | `#E8F0EB` | Tint behind pills and tags only. |
| `--color-on-accent` | `#FFFFFF` | (kept for the token set; accent is not a fill here) |
| `--color-primary` | `#121414` | The ONE dark section per page (the sales-process pitch) and the footer top line. |
| `--color-primary-soft` | `#1E2122` | Cards/fields on the dark section. |
| `--color-link` | `#2E6B4F` | |
| `--color-link-hover` | `#245741` | |
| `--color-border` | `rgba(18,20,20,0.10)` | Hairlines. |
| `--color-whatsapp` | `#1FAC54` | WhatsApp button only. |
| `--color-success` / `--color-error` | `#2E6B4F` / `#B8402F` | |
| Overlays | neutral black `rgba(0,0,0,α)` on the existing ramps | Photos carry all remaining colour. |

Rules: two backgrounds per page, near-white and the one black section. No
gradients anywhere except photo scrims.

## 3. Typography — one family

**Manrope** (variable 400–800) for everything. Self-host via
`@fontsource-variable/manrope` (latin). Fallback `system-ui, sans-serif`.

| Role | Size desktop / mobile | Weight | Tracking | Case |
| --- | --- | --- | --- | --- |
| Hero H1 | 64 / 40 px, line 1.0 | 700 | −0.02em | Sentence |
| H2 | 40 / 30 px, line 1.05 | 700 | −0.015em | Sentence |
| H3 | 22 px | 600 | −0.01em | Sentence |
| Big proof numeral | 40 px | 700 | −0.02em | tabular |
| Price on card | 22 px | 700 | 0 | tabular |
| Eyebrow label | 12 px | 600 | 0.08em | UPPERCASE, ink-secondary |
| Body | 17 / 16 px, line 1.55 | 400 | 0 | |
| Specs / meta | 14 px | 500 | 0 | |
| Button | 15 px | 600 | 0 | Sentence |
| Nav | 15 px | 500 | 0 | Sentence |

Numbers: `es-PY` formatting, `font-variant-numeric: tabular-nums` on
prices, specs and proof numerals. `US$ 148.000`, `Gs. 4,1 M/mes`.

## 4. Shape and surfaces

- Radius **10 px** on cards, buttons, fields, pills and photos (photo
  corners rounded too; this is the tech register).
- One shadow only, on the search bar and the floating proof card:
  `0 8px 30px rgba(0,0,0,0.08)`. Nothing else casts a shadow.
- Hairline borders on cards (`--color-border`) rather than shadows.
- Sections `120px` apart (`clamp(80px, 8vw, 120px)`), container 1280,
  grid gap 24.
- Photo scrims are used only where text sits on a photo (hero proof card
  does not need one; it is a white card).

## 5. Components

**Header.** White, 72 px, hairline bottom. Wordmark "Inmobiliaria Paraguay"
Manrope 700 20 px. Nav: Comprar · Alquilar · **Vender** · Proyectos ·
Inmobiliarias. Right: "Ingresar" text link and the black
**Vender mi propiedad** button (links to `/vender`). Mobile: wordmark,
black button, hamburger.

**Hero (home).** White, split 55/45. Left: eyebrow "Venta y alquiler en
Paraguay", H1 "La forma moderna de vender tu propiedad en Paraguay", strap
"Fotografía profesional, marketing digital y compradores del exterior.
Vos ponés la propiedad, nosotros el proceso.", buttons: black
**Vender mi propiedad** + outline "Buscar propiedades". Right: large
rounded photo (casa moderna, luz de día) with a floating white proof card
bottom-left: "Vendida en N días · US$ X" (a real recent sale, or omit the
card until there is one). Under the hero, the **search bar** as a white
rounded row with the soft shadow: Operación · Ciudad o barrio · Tipo ·
Hasta US$ · black **Buscar**. Labels above values inside each cell.

**Proof row.** White, hairline top and bottom, four cells: a Manrope 700
40 px numeral or short phrase with a 14 px label under it. Only true
figures. Where a number is not yet true, a phrase ("Fotografía profesional
incluida / en cada aviso").

**Listing card.** White, 10 px radius, hairline border, photo 4:3 with
rounded top corners, then 16 px padded block: price 700 22 px, title 600
15 px, specs 14 px secondary, cuota line 13 px secondary
("Cuota est. Gs. 4,1 M/mes", venta only), and a green pill "Publicado en
inglés" when `foreign_exposure` is true. Featured listings: the pill row
gets a second pill "Destacada"; no border colour change.

**Buttons.** Primary black fill/white text. Secondary: ink hairline
outline on white. On the dark section: white fill/black text. WhatsApp:
green fill, white text, only where the action opens WhatsApp.

**Sales-process section (the one dark section).** `#121414`, white text,
centred H2 "Un proceso de venta, no un aviso.", four columns numbered
01–04 in green: Tasación con datos · Fotos y styling · Publicación en
español e inglés · Negociación y cierre, each with one sentence. One
white button "Empezar a vender" → `/vender`.

**Seller landing page `/vender` (new, ads land here).** Long-form, all
white with the one dark band:
1. Hero: H1 "Vendé al mejor precio, con un proceso que se ve." Sub: what
   the seller gets, in three lines. Form on the right, on a white card
   with the soft shadow: Nombre · Teléfono (WhatsApp) · Ciudad/barrio ·
   Tipo · black "Quiero una tasación". Under the form: "Sin costo. Sin
   compromiso. Respondemos en < 24 h" (only if true).
2. Proof row (same component as home).
3. "Qué hacemos distinto" — six cards in a 3×2 grid, each with a small
   stroke icon, an H3 and two lines: Fotografía y video profesional ·
   Home styling · Tasación con datos del mercado · Publicación en
   español e inglés · Marketing digital (Meta, Google, portales) · Red
   de sitios (inmobiliaria.com.py, realestateinparaguay.com,
   terreno.com.py, …).
4. "Compradores del exterior" — split: a screenshot of the English portal
   on a laptop, text on how the listing reaches foreign buyers.
5. The dark sales-process band (same component as home).
6. "Quién está detrás" — the founder's photo and three lines, the EAS
   company named, licence status stated honestly.
7. FAQ for sellers (comisión, plazo, exclusividad, qué pasa si no se
   vende, quién atiende las visitas).
8. Closing CTA with the same form.
Header on this page keeps the nav; the footer is the site footer. No
newsletter.

**Partner page `/para-inmobiliarias` (exists; restyle to this system).**
Same structure as `/vender` with the offer turned to realtors: publish
your inventory, get the English exposure, share leads; form asks for
agency name and RUC.

**Detail page.** White. Gallery as a rounded two-column grid (one large
photo, four small). Left column: price 700 36 px, address, specs as
small rounded chips, description, cuota card (white, hairline, "Cuota
estimada con AFD, sujeto a aprobación"), map, similar listings. Right
sticky white card, 10 px radius, hairline: who is selling, black
**Enviar mensaje** first, green WhatsApp second, short form under. Mobile:
sticky bottom bar with WhatsApp and Llamar.

**Footer.** White, hairline top. Four columns: Comprar (by city), Vender,
Para inmobiliarias, Empresa. Bottom line in muted text: EAS company name
as policy requires, links to Términos and Privacidad, and "English:
realestateinparaguay.com".

## 6. Home page, in order

1. Hero (split) with the search bar under it
2. Proof row
3. Recién publicadas (8 cards, "Ver todas")
4. Sales-process section (dark) → `/vender`
5. Buscar por ciudad (rounded photo tiles with counts)
6. Por qué vender acá (3 columns: Fotografía y styling · Marketing
   digital · Compradores del exterior) with one CTA
7. Para inmobiliarias (one row: short pitch + outline button)
8. FAQ (seller-first)
9. Footer

## 7. Motion

Photo scale 1.0 → 1.03 on hover, 600 ms, the existing ease. Cards lift
nothing. No reveal animations. Respect `prefers-reduced-motion`.

## 8. Notes for the builder

- Theme values go in `OVERRIDES.inmobiliaria` in `src/design/themes.ts`
  after the `ThemeVars` additions in `docs/style/build-prompt.md` PR 1
  (fonts, overlays, radius, tracking, button case, two colour roles).
- Fonts via `@fontsource-variable/manrope`; set `--font-display` and
  `--font-sans` both to Manrope in the override.
- Structural pieces owned by the section registry: split hero with the
  search bar under it, proof row, card variant with the pill row, home
  order above, dark sales-process section, WhatsApp-second sidebar. No
  `vertical.key ===` inside shared components.
- New routes: `/vender` (seller landing). `/para-inmobiliarias` and
  `/tasacion` exist and are restyled, not rebuilt. `/vender`'s form posts
  to the existing lead pipeline as an `internal` lead with a
  `source: "vender"` marker so `/admin/leads` can tell seller leads
  from buyer leads.
- Strings in `src/i18n/es.ts` namespaces with English peers in `en.ts`
  the same commit (`verify:i18n`).
- Verify: `npm run verify:local`.
