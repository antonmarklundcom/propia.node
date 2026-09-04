# Style guide — realestateinparaguay.com

Standalone brand. Same app and database as the Spanish portal for
management only; nothing about its look is required to match it.

## 1. Who it is for, and what it has to feel like

Foreign investors and people relocating to Paraguay: North American and
European retirees, remote workers, Argentines and Brazilians buying in USD,
people who found Paraguay through a residency or tax article. Most have
never been to the country. Their question is not "is this house nice" but
**"can I trust this portal and this country with a purchase from abroad"**.

So the site is a **guide first and a marketplace second**. It has to read
like a well-edited English-language publication about buying in Paraguay
that happens to carry listings: precise, factual, calm, information-dense.
Not a luxury brochure, not a bank, not a startup.

Tone of voice: plain declarative English, facts before adjectives, numbers
with sources. Never "stunning", "exclusive", "paradise". The brand states
the law, the tax, the fee and the step, then shows the property.

## 2. Palette — "Petrol"

Cool, deep, slightly maritime. Distinct from every navy-and-gold competitor
by hue, and from the green portals of the region.

| Token | Hex | Use |
| --- | --- | --- |
| `--color-primary` | `#0E2A30` | Header, footer, dark sections, hero base. |
| `--color-primary-dark` | `#0A2025` | Footer bottom bar. |
| `--color-primary-soft` | `#143A42` | Search panel, dark cards. |
| `--color-accent` | `#BFA265` | Muted brass. Primary button, hairlines, large numerals, labels on dark (6.16:1 on petrol). On cream it is decorative only (2.2:1): never small text. |
| `--color-accent-hover` | `#D9C48C` | |
| `--color-accent-on-dark` | `#BFA265` | Same as accent; declared so the shared CSS is uniform. |
| `--color-on-accent` | `#0E2A30` | Text on brass buttons (6.16:1). |
| `--color-accent-soft` | `#ECECE4` | Tinted block fill (the facts strip, table headers). |
| `--color-link` | `#7A652F` | Body links (5.06:1). |
| `--color-link-hover` | `#5C4B22` | |
| `--color-ink` | `#131D1F` | |
| `--color-ink-secondary` | `#4E5C5F` | 6.25:1. |
| `--color-ink-muted` | `#77868A` | |
| `--color-background` | `#F3F3EE` | Paper. Less yellow than the Spanish cream; reads "print", not "kitchen". |
| `--color-surface` | `#FFFFFF` | Tables, forms, the contact card. |
| `--color-border` | `rgba(19,29,31,0.12)` | Used a lot: this brand draws its structure with hairlines. |
| `--color-border-accent` | `rgba(191,162,101,0.24)` | |
| `--color-whatsapp` | `#1FAC54` | WhatsApp button only, shown with the international number. |
| `--color-success` / `--color-error` | `#2B7A5B` / `#B04A3A` | |
| Overlays | `rgba(6,18,22, α)` on the existing ramps | |

Rules: petrol and paper are the two backgrounds. Brass never fills a
section. Photos are colour-graded neither warm nor cold; the palette does
the temperature work.

## 3. Typography

**Display: Newsreader** (variable, 400–500, with optical sizes and italic).
A contemporary text serif built for screens with the authority of a
broadsheet; at display size it is confident without being decorative.
**Text: IBM Plex Sans** (400–600). International, neutral, engineered, with
excellent tabular numerals for the price, area and tax tables this site
lives on. It reads "documentation", which is exactly the trust register
a foreign buyer wants.

Self-host via `@fontsource-variable/newsreader` and
`@fontsource/ibm-plex-sans` (400, 500, 600, latin).

| Role | Face | Size (desktop / mobile) | Weight | Tracking | Case |
| --- | --- | --- | --- | --- | --- |
| Hero H1 | Newsreader | 60 / 38 px, line 1.02 | 400 | −0.015em | Sentence |
| H2 section | Newsreader | 38 / 28 px, line 1.08 | 400 | −0.01em | Sentence |
| H3 | Newsreader | 24 / 21 px | 500 | 0 | Sentence |
| Big fact numeral | Newsreader | 44 px | 400 | −0.01em | — |
| Price on card | IBM Plex Sans | 20 px | 600 | 0 | tabular |
| Eyebrow label | IBM Plex Sans | 12 px | 500 | 0.14em | UPPERCASE |
| Body | IBM Plex Sans | 17 / 16 px, line 1.65 | 400 | 0 | — |
| Table / specs | IBM Plex Sans | 14 px | 400/500 | 0 | tabular |
| Button | IBM Plex Sans | 13 px | 600 | 0.08em | UPPERCASE |
| Nav | IBM Plex Sans | 14 px | 500 | 0.02em | Sentence |

Prices are set in the sans, not the serif: on this domain a price is a
data point next to `sq ft` and `US$/m²`, not a headline. Numbers use
`en-US` formatting: `US$ 145,000`, `1,938 sq ft (180 m²)`, `US$ 806/m²`.
Guaraní amounts appear only on the detail page, in a secondary line.

## 4. Shape and surfaces

- **Radius 0** everywhere. This brand is ruled lines and squared blocks.
- Structure is drawn with 1 px `border` hairlines: bordered fact blocks,
  bordered tables, bordered step cards. Shadows do not exist.
- **Listing cards are photo-first but framed**: the photo sits inside a
  hairline box with a 12 px inset, the price and specs row is below the
  photo on paper (never on the scrim), so a screenshot of the card is
  legible in a Telegram chat. The scrim on the photo carries only the
  location line and, if any, the "Verified title" tag.
- Data blocks (costs, taxes, timelines) are real `<table>`s with brass
  header hairlines, not cards with big numbers.
- Section rhythm `clamp(80px, 9vw, 128px)`; container 1280 px; grid gap
  24 px. Text columns cap at 68 ch.

## 5. Components

**Header.** Petrol, 64 px. Wordmark "Real Estate in Paraguay" in
Newsreader 500. Nav: Buy · Rent · Land · New developments · **How it
works** · Guides. Right: "List with us" ghost link and a brass **Search**
button on mobile. No login in the header on this domain; foreign visitors
are buyers.

**Hero.** Split, not full-bleed: left 55 % paper with the H1 and the
search; right 45 % photo (Asunción skyline at dusk from the Costanera, or
a Villa Morra street under lapachos — a *place*, not a house). Eyebrow:
"Property in Paraguay · For international buyers". H1: "Buy property in
Paraguay. Freehold, in US dollars, from abroad." One-paragraph strap with
the three facts that answer the doubt: foreigners can own land and homes
outright; purchases are priced and paid in USD; title passes by public
deed before a notary and is registered nationally. Then the search bar:
City · Type · Max price (USD) · **Search**. Under it: "Or start with the
guide: How buying works →".

**Search bar** (shared, themed): white fields with hairline borders on
paper; on dark sections `primary-soft` fields.

**Listing card.** As in §4. Below-photo block: `US$ 145,000` · `US$
806/m²` on the first line; `3 bed · 2 bath · 1,938 sq ft` on the second;
neighbourhood, city on the third in secondary ink. **No cuota line, ever,
on this domain**: the only active financing programme is a resident
first-home scheme and quoting it to a foreign buyer is a false promise.

**Buttons.** Primary: brass fill, petrol text, uppercase. Secondary: ink
hairline. WhatsApp: green fill, shown as `+595 …` next to it so the visitor
sees it is an international number before tapping.

**Facts strip** (`accent-soft`, hairline top and bottom): four bordered
cells, Newsreader numeral/word + Plex label: *Freehold / foreign ownership
allowed*, *USD / priced and paid*, *≈ 3–5 % / total purchase costs*,
*Public deed / notarised and registered*. Every figure links to the guide
that sources it.

**How buying works** (paper, numbered 01–05 in brass): Choose and verify ·
Offer and reservation · Due diligence on title (Registro Público) · Public
deed before a notary (escribano) · Registration and handover. Each step: a
two-line description, who does it, typical time. Beneath it the **costs
table**: transfer tax, notary fees, registration, agent commission, with
"who pays" and "typical %" columns.

**Detail page.** Gallery. Two columns: left = price line (USD, then
`US$/m²`, then a secondary Gs. line), specs row with both units,
description (English, Spanish original in a collapsible "Ver original"),
**"Buying this property as a foreigner" box** (bordered: ownership type,
title status if known, estimated closing costs at this price, next step),
map and neighbourhood note, similar listings. Right sticky = contact card:
agency or seller, **inquiry form first** (name, email, country, message),
WhatsApp second with the international number, and a line "We reply in
English". Foreign buyers write email; WhatsApp is the follow-up channel.

**Footer.** Petrol, five columns: Buy (by city), Guides (buying, taxes,
residency, banking, moving), Areas, Company, Legal. Bottom bar: legal line
naming the EAS company as policy requires, and a link to the Spanish
portal as "Versión en español" (hreflang handles the rest).

## 6. Home page, in order

1. Split hero with the three facts and search
2. Facts strip
3. New this week (8 framed cards)
4. Why Paraguay — three bordered columns: Ownership (freehold for
   foreigners), Cost of living and taxes (territorial tax system, 10 %
   flat), Residency (temporary → permanent, requirements) — each a short
   paragraph with a "Read the guide" link
5. Where to buy — Asunción (Villa Morra, Carmelitas, Recoleta, Las
   Lomas), San Bernardino, Encarnación, Ciudad del Este, Luque/Aviadores;
   photo tiles with a one-line "why" and the median USD/m²
6. How buying works (five steps + costs table)
7. Relocation — moving, banking, schools, healthcare, one paragraph each,
   links to guides
8. FAQ (foreign-buyer questions: Can foreigners own land? Do I need to be
   there in person? How do I send money? What is a *cédula*?)
9. Footer

## 7. Motion

Minimal. Photo scale 1.0 → 1.03 on hover, 700 ms. Table rows highlight
on hover. No reveal animations on this domain; a guide should not shimmer.

## 8. Notes for the builder

- Theme values go in `OVERRIDES.en` in `src/design/themes.ts`, after the
  `ThemeVars` additions listed in the inmobiliaria guide §8 (same plumbing).
- Fonts via fontsource as above; `--font-display` / `--font-sans` set in
  the override.
- Structural pieces owned by the section registry for this vertical: split
  hero, facts strip, framed card variant, no-cuota rule, `sq ft` secondary
  unit, "Buying as a foreigner" box, inquiry-form-first sidebar, home
  section order. The `copy: "foreign"` field on the vertical already
  exists; the registry should key off the vertical key.
- Unit helper: `sqft = Math.round(m2 * 10.7639)`, formatted `en-US`.
- New content pages this domain needs and the Spanish one does not:
  `/guides/buying-property-in-paraguay`, `/guides/costs-and-taxes`,
  `/guides/residency`. They can start as the English `guias` entries; the
  home links must resolve before launch.
- Do not add a login link, a newsletter block, or the publicar flow to
  this domain's chrome.
- Verify: `npm run typecheck && npm run build && npm run verify:i18n &&
  npm run verify:seo`.
