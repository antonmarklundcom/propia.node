# Premium Editorial — delta-spec for the inner pages (C3)

Director: Fable, 2026-09-13. Builder: Codex (gpt-6-astra high), one dispatch per
group. Parent spec: `docs/prompts/premium-editorial.md` (PE1) — its §0 decision,
token set and "no token values change" rule apply here unchanged. Findings:
F9, F14, F15, F16, F18 of `fable-plan-site-quality-2026-09-13.md`.

This is a **delta-spec**: keep / change / delete per page group. No new copy
(existing dictionary keys only, except where a line below names a new key), no
layout re-architecture, no new components. CSS goes into blocks appended to
`app/globals.css` as `/* == C3-<group> == */`; existing rules for these pages
are edited in place only where a line below says so. Radius 0 everywhere a
visitor sees these pages; buttons are gold primary (`.ds-btn` / `.ph-btn`
pattern already on the home) or outlined secondary; hairlines use
`--color-border`; headings Cormorant, body Jost, exactly as the home.

## Shared rule: glyphs (all groups)

Every emoji in visitor-facing markup or dictionary strings is replaced by an
inline SVG line glyph (24-box, stroke 1.2, `currentColor`, `aria-hidden`),
the same family `PremiumHome.tsx` already draws inline. Create
`src/components/Glyph.tsx` exporting `<Glyph name="…" />` with the set: `home`,
`bed`, `bath`, `car`, `area`, `land`, `clock`, `pin`, `list`, `doc`, `search`,
`handshake`, `money`, `palette`, `check`, `mail`, `phone`, `whatsapp`,
`building`, `key`. Move the two glyphs `PremiumHome.tsx` draws inline into it
and import them back (no visual change on the home). Find every occurrence
with a Unicode-aware search (`\p{Extended_Pictographic}`) over `app/`,
`src/components/`, `src/i18n/` — excluding `/admin`, `/agencia`, `/mis-avisos`
and `esPanel` (staff surfaces stay as they are). Dictionary strings that carry
an emoji prefix lose the prefix; the component renders the glyph instead.

## Group (a): `/propiedad/[slug]` + `ContactForm`

Keep: the layout (`.listing-detail__layout` two-column, sticky aside), the
breadcrumb, the title, the gallery when photos exist, the map, the details
table, the description, `PriceAlert`, the similar / from-agency sections.

Change:

1. **Empty gallery (F16).** `.detail-gallery__empty` uses the card's
   treatment: the same dark-green photo placeholder image the `ListingCard`
   renders (`listing-card__nophoto` + its background), full width, 16:9 on
   desktop, 4:3 on phone, with the small-caps "FOTO PRÓXIMAMENTE" label
   (`t.galleryEmpty` stays the text). The `TYPE_ICON` emoji is gone; no icon
   in the frame.
2. **Facts row.** `.listing-facts__item` chips become one hairline row: no
   background, no radius, 12 px Jost uppercase tracking 0.08em, glyph 16 px
   before the text, items separated by 20 px, a `--color-border` line under
   the row. The "publicado hace…" item keeps its muted colour.
3. **Price line.** Price in Cormorant 36/1.1, gold (`--color-accent` as used
   on the home cards); the cuota line under it in Jost 13 px secondary ink.
   The `PriceAlert` trigger becomes an outlined secondary button, radius 0.
4. **Section headings** (`.listing-section h2`): Cormorant 24, no emoji, a
   hairline above each section instead of the box look; `.listing-details-grid`
   rows use hairlines, labels 12 px uppercase secondary ink, values Jost 15.
5. **Seller card (F15).** `.seller-card__avatar` never shows initials derived
   from the "Publicado en …" label. When there is no agency logo, render
   `<Glyph name="home" />` in a 44 px square with a hairline border. Initials
   are allowed only when an agency exists and has no logo (its name's
   initials). The card itself: cream background, hairline border, radius 0.
6. **One lead form (F14).** Delete the second `<ContactForm>` mount (the
   `section.contact-panel` after the map). In its place render a short band:
   `h2` = the existing `t.interestedTitle` key (the heading the deleted panel
   used), one sentence = the existing subtitle key, one gold button = the
   existing submit label, `href="#contacto"`. Give the aside form
   `id="contacto"` and `scroll-margin-top: 96px`. On phone (≤ 900 px, where
   the aside already stacks under the content) the band is not rendered — the
   form is right there.
7. **ContactForm.** Inputs: white, hairline border, radius 0, 15 px Jost,
   focus ring gold 1 px. Chips (`.contact-form__chips`): outlined, radius 0,
   12 px uppercase. Submit: gold primary, full width, radius 0; the WhatsApp
   variant is outlined with the `whatsapp` glyph. Labels 12 px uppercase
   tracking 0.08em.
8. **Similar listings**: heading Cormorant 28, the grid uses the same
   `.ph-grid-4` rhythm as the home (4 / 2 / 2 columns).

Delete: the boxed white panel look on the aside and sections (`box-shadow`,
`border-radius`, grey panel backgrounds), every emoji.

## Group (b): hubs `/venta`, `/alquiler` and category `/[operacion]/[...segments]`

Keep: `.hub-hero*` (C1 owns it; do not edit), the search bar's field
structure, the filter bar's fields, the list/map switch, pagination, the
`precios-cta` aside, the empty state.

Change:

1. `.search-bar` and `.filter-bar` on these pages: no white box, no shadow,
   no radius. One hairline above and below the filter bar; fields separated
   by hairlines; labels 11 px uppercase tracking 0.1em secondary ink; selects
   and inputs transparent with a bottom hairline only; submit = gold primary
   radius 0 (`.search-bar__submit`), filter submit = outlined secondary
   (`.filter-bar__submit`); the "limpiar" link stays a text link.
   `.ph-hero__search .search-bar` on the home is NOT touched (that block is
   the home's overlapping panel and stays as PE1 built it).
2. `.view-switch` (Lista / Mapa): two outlined buttons sharing one border,
   radius 0, active = deep green fill with cream text.
3. Category page title (`h1`) Cormorant 36, count line 13 px secondary ink,
   16 px gap; the grid uses `.ph-grid-4` rhythm; pagination links outlined,
   radius 0.
4. The panel buttons (`.panel-btn`) match the outlined secondary button.

## Group (c): `/nosotros`, `/contacto`, `/proyectos`, `/proyecto/[slug]`, `/tasacion`, `/agentes`, `/inmobiliarias`, `/agente/[slug]`, `/inmobiliaria/[slug]`

These render through `MarketingUI.tsx` (`PageHero`, `Section`, `FeatureGrid`,
`StepList`, `StatRow`, `CtaBand`, `Prose`) and the `mk-*` classes.

Keep: every component, every page structure, all copy.

Change:

1. `PageHero`: eyebrow 11 px uppercase gold tracking 0.14em, `h1` Cormorant
   clamp(36px, 4.5vw, 56px), lead paragraph Jost 18 secondary ink, deep-green
   background with cream text when the page passes `tone="dark"` (add the
   prop, default light/cream); `/nosotros` and `/contacto` use dark.
2. `Section` titles Cormorant 28 with a 40 px hairline under the title
   (the `.ph-h2` treatment from the home); `mk-section__title--sub` Jost 13
   uppercase.
3. `FeatureGrid` / `StepList` / `StatRow` items: glyph instead of emoji
   (the `icon` prop accepts a `Glyph` name string; callers pass names), no
   card boxes — hairline top per item, radius 0. Step numbers in Cormorant
   gold, like the home's "cómo funciona".
4. `CtaBand`: deep green, cream text, gold primary button, radius 0.
5. `mk-card`, `mk-dev`, `mk-project-grid` items (agent / agency / project /
   developer cards): cream, hairline border, radius 0, logo box 56 px square
   with a hairline, fallback = `building` glyph (agency) / `home` glyph
   (project), never initials from a label.
6. `mk-contact__form` reuses the restyled `ContactForm` from group (a) — no
   separate styling; `mk-contact__aside` rows carry glyphs (`pin`, `clock`,
   `mail`, `whatsapp`) and hairlines.

## Group (d): hub chips and /precios

Keep: the hub markup and editorial Por ciudad `.hub-tile` grid, all price
queries, JsonLd, metadata, dictionary strings and empty state text. Leave
`app/precios/[ciudad]/page.tsx` and `MarketingUI.tsx` unchanged.

Change:

1. **Por tipo chips.** Edit `.hub-chip*` rules in place: inline-flex links,
   full 1 px `--color-border` hairline, radius 0, padding 10px 16px, Jost
   12 px uppercase tracking 0.1em primary ink. Count: Cormorant 16 px gold
   (`--color-accent`), no background pill or padding. Hover changes the
   border to `--color-primary`, with no transform. Leave `.mk-chip` shared
   styling alone when the hub rule can supply the override.
2. **Price index hero.** `app/precios/page.tsx` uses `PageHero` from
   `MarketingUI`, `tone="light"`, the request-scoped brand as eyebrow,
   `t.indexTitle` as h1 and `t.indexSubtitle(brand)` as lead.
3. **City list.** Wrap the existing list / empty state in a narrow `Section`.
   Each row is a hairline-separated link, city name Cormorant 24 px, sample
   count Jost 12 px uppercase secondary ink on the right. New `.precios-*`
   rules are scoped to the index so the city detail page is unaffected.
4. **Method.** A narrow muted `Section` uses `t.methodTitle` with the shared
   Section title treatment and the unchanged `t.methodBody(brand)` paragraph.

Delete: every inline style object in the price index, the hub count's gold
pill and hover movement. Keep unused `numberLocale` variables unless a
typecheck or lint diagnostic requires their removal.

Files: this spec, `app/precios/page.tsx`, `app/globals.css` (hub chip rules
and new `.precios-*` rules only), `docs/log/c4b.md` (landed, not verified,
deviations). Run typecheck, verify:i18n and a Unicode-aware emoji search
over these four files; report failures. No git commands or build for this task.

Follow-up C4c: `/precios/[ciudad]` follows the same light PageHero and narrow Section treatment, with a scoped editorial medians table and muted method / thin-sample notes.

## Definition of done (per group)

- `npm run typecheck`, `npm run verify:i18n` green in the sandbox; the director
  runs `verify:local` and renders.
- A Unicode-aware emoji search over the group's files returns nothing.
- No horizontal overflow at 390 / 768 / 1024 / 1440 / 1920 on the group's
  pages, both doors (director-measured).
- Group (a): exactly one `<ContactForm>` in the detail page's server output.
- Nothing outside the group's file list changed (`git status --short`).
- `docs/log/c3<group>.md` written: what landed, what was not verified,
  deviations.
