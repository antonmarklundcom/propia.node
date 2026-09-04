# Visual identity per domain — decision + spec (2026-09-04)

Hand-off spec for the per-host themes. Values go into `OVERRIDES` in
`src/design/themes.ts`; anything marked **plumbing** is a small addition to the
mechanism that the values need and that does not exist yet.

## 1. The decision in one paragraph

Keep the current editorial system (Cormorant Garamond + Jost, zero radius,
photo-led cards, cream, tracked uppercase labels) as the **family** for all
doors, and move each door along one axis: **temperature**. `terreno.com.py`
stays the deep-green/gold baseline. `inmobiliaria.com.py` goes **warm** — umber
primary, terracotta accent, a warmer cream (the "tierra colorada / tejas"
register: local, domestic, unintimidating). `realestateinparaguay.com` goes
**cool** — petrol-blue primary, muted brass accent, a paper-white cream
(international, credible, not a bank). Typography does not change per door;
that is what makes them read as sisters at a glance, and it is also the only
option the current wiring supports without new plumbing (see §5).

## 2. Why none of the three explored directions, honestly

- **A. Meridian** (Fraunces + Inter Tight, mid green, bordered cards). Fails the
  Spanish brief. Fraunces-plus-Inter is the 2023–26 DTC/SaaS default; bordered
  stat cards instead of photo cards throw away the one thing the current system
  does better than every Paraguayan portal (the photo carries the card).
  Reads "climate fintech", not "someone will treat my family home with care".
- **B. Sovereign** (navy + gold, roman numerals). Yes, it reads too cold — but
  the bigger problem is that navy-plus-gold is the single most over-used
  real-estate-portal template on earth (every "luxury" agency, every Sotheby's
  franchisee, and a lot of offshore-property scam sites). For a foreign buyer
  who has never been to Paraguay it pattern-matches to "premium fee" and
  "template", which is the opposite of credibility. For a Paraguayan seller it
  is a bank lobby. It is also not achievable as values-only: the hero/card
  overlays are green-tinted `rgba(9,20,14)` hard-coded in `globals.css`, and a
  navy primary under a green overlay looks muddy.
- **C. Cartera** (Instrument Serif italic + Archivo, off-white `#fafaf7`).
  Closest in hue, but it removes exactly the warmth the brief asks for:
  `#fafaf7` is a neutral off-white, and the cream is what makes the current
  site feel calm rather than clinical. Instrument Serif italic display is the
  current AI-startup house style and will date fastest of the three. "Cleaner
  and more minimal" is a downgrade for a market where sparse pages read as
  "empty site, nobody uses this".

The shared mistake: all three are **replacement systems with a new font
stack**, when the brief is *sister* sites. Two font stacks means two
self-hosted font payloads, a `--font-*` override that `ThemeVars` does not
carry today, and a family resemblance that has to be rebuilt from scratch in
colour alone.

## 3. inmobiliaria.com.py — "Tierra" (Spanish, local, warm)

| Token | Value | Notes |
| --- | --- | --- |
| `--color-primary` | `#26211A` | umber; header, footer, hero base |
| `--color-primary-dark` | `#1C1813` | |
| `--color-primary-soft` | `#322B22` | search bar, dark CTA panels |
| `--color-accent` | `#B0532F` | terracotta; primary button, hairlines, large numerals (4.56:1 on cream) |
| `--color-accent-hover` | `#C9704E` | |
| `--color-accent-on-dark` | `#D98B68` | **new token** — tracked labels and small accent text on primary surfaces (5.97:1 on umber; the base `#B0532F` is only 3.14:1 there, visibly dim on a warm photo) |
| `--color-on-accent` | `#FFFFFF` | **new token** — button text. Umber on terracotta is 3.14:1; white is 5.09:1 |
| `--color-accent-soft` | `#F0E6D8` | the one tint allowed as a block fill |
| `--color-link` | `#94452A` | 5.99:1 on cream |
| `--color-link-hover` | `#6E3320` | |
| `--color-ink` | `#211C17` | warm near-black, 15.1:1 |
| `--color-ink-secondary` | `#5E5750` | 6.37:1 |
| `--color-ink-muted` | `#857D74` | |
| `--color-background` | `#F7F2E8` | cream, half a step warmer/pinker than baseline |
| `--color-border` | `rgba(33,28,23,0.12)` | |
| `--color-border-accent` | `rgba(176,83,47,0.24)` | |
| overlays (`--overlay-hero/card/zone`) | same ramps, base colour `rgba(20,14,10,·)` | warm neutral instead of green-tinted |

Fonts: Cormorant Garamond + Jost, unchanged. Display weight 400 with the
italic used for the emotional half of a headline ("Tu próxima casa *está más
cerca de lo que pensás*"). Register of the copy: *vos*, second person, short.

## 4. realestateinparaguay.com — "Petrol" (English, international, cool)

| Token | Value | Notes |
| --- | --- | --- |
| `--color-primary` | `#0E2A30` | petrol; between the family green and "international" blue, deliberately not navy |
| `--color-primary-dark` | `#0A2025` | |
| `--color-primary-soft` | `#143A42` | |
| `--color-accent` | `#BFA265` | muted brass; 6.16:1 on petrol, so labels on dark need no extra token |
| `--color-accent-hover` | `#D9C48C` | |
| `--color-accent-on-dark` | `#BFA265` | same as accent (new token still declared so the CSS is uniform) |
| `--color-on-accent` | `#0E2A30` | petrol on brass, 6.16:1 |
| `--color-accent-soft` | `#ECECE4` | |
| `--color-link` | `#7A652F` | 5.06:1 on the paper cream |
| `--color-link-hover` | `#5C4B22` | |
| `--color-ink` | `#131D1F` | cool near-black, 15.4:1 |
| `--color-ink-secondary` | `#4E5C5F` | 6.25:1 |
| `--color-ink-muted` | `#77868A` | |
| `--color-background` | `#F3F3EE` | paper; less yellow than the Spanish cream |
| `--color-border` | `rgba(19,29,31,0.12)` | |
| `--color-border-accent` | `rgba(191,162,101,0.24)` | |
| overlays | same ramps, base `rgba(6,18,22,·)` | |

Fonts: unchanged. Display weight 500 (a touch heavier than the Spanish door —
the same face reads more "set" and less "handwritten" a weight up). Register:
plain declarative English, no exclamation marks, facts before adjectives.

## 5. Plumbing the values need (small, but not nothing)

1. **Overlays and `--color-border-accent` are hard-coded** in `globals.css`
   (`rgba(9,20,14,…)`, `rgba(193,154,77,0.24)`) and are not in `ThemeVars`.
   Add `--overlay-hero`, `--overlay-card`, `--overlay-zone` and
   `--color-border-accent` to `EDITORIAL` so a door can override them; the
   baseline values stay as they are for terreno.
2. **Two new tokens**, `--color-on-accent` and `--color-accent-on-dark`, with
   baseline values `#0E1F17` and `#C19A4D` (i.e. no visible change on terreno).
   Button rules currently use `color: var(--color-primary)` on an accent fill;
   switch them to `--color-on-accent`. Tracked labels on dark surfaces switch
   to `--color-accent-on-dark`.
3. **A baseline bug to fix while there:** `--color-link` `#B5893C` is
   **2.87:1** on `#F6F3EC`, not the 4.6:1 the comment in `tokens.ts` claims.
   Body links on every door fail AA today. Use `#8A6626` (4.73:1) as the
   baseline link and `#6B4F1C` as its hover; terreno inherits the fix.
4. Fonts stay out of `ThemeVars` on purpose. Do not add `--font-display`
   overrides for this round.

## 6. Structure: theme-only is slightly underinvesting — three things, not a fork

The instinct to keep one component system is right; a per-domain layout fork
is how the D6 flip becomes two products. But "only colours and copy differ"
leaves three real audience differences on the table, and the codebase already
anticipates the mechanism: `themes.ts` says structure belongs in a
"shell/component registry", and `verticals.ts` already carries
`copy: "ownership" | "foreign"`. Build a small **section registry** keyed on
the vertical (a list of which homepage sections render, in what order), never
a conditional inside a shared component.

1. **Homepage hero intent.** Spanish: dual-intent — search *and* an equally
   weighted "Publicá tu propiedad, gratis" path, because the primary door's
   supply comes from sellers. English: single-intent search plus a one-line
   trust claim ("Foreigners can own property in Paraguay outright, freehold").
   Same hero component; the secondary CTA and the strap line come from the
   registry.
2. **Trust strip content.** Spanish: local signals — free to publish,
   WhatsApp contact, cities covered. English: foreign-buyer signals —
   freehold ownership for foreigners, USD pricing, notarised public deed,
   a "How buying from abroad works" section high on the page (above the
   listing rails, not in the footer). Same strip component, different items.
3. **The cuota line on the English door.** `ListingCard` prints
   `cuota_gs` regardless of locale, and the only active programme is AFD
   *primera vivienda*, a resident first-home scheme. A foreign buyer cannot
   get it, so on `realestateinparaguay.com` the card promises a monthly
   payment that does not exist for that reader. Hide it on `locale === "en"`
   (or label it explicitly as local-resident financing). This is a
   correctness fix as much as a design one. While there: show `sq ft` as a
   secondary unit after m² on the English card only.

Detail page order: Spanish keeps contact (WhatsApp) at the top of the sidebar;
English leads the sidebar with the "buying as a foreigner" summary and puts
contact second. Same components, one ordering flag.

Do **not** build: a different card design, a different search bar, a
different nav. The check render (`docs/visual-identity-check.png`) shows the
two doors already read as different audiences with identical structure.

## 7. terreno.com.py and landforsaleinparaguay.com

Leaving terreno on the baseline is right, and it has a nice side effect: the
green/gold system becomes *the land door* rather than the flagship's
hand-me-down, which is the most defensible use of a green in this family.

`landforsaleinparaguay.com` is **not in `verticals.ts`** — it is not a door
today, so "keep the current design" is a decision about a host that does not
exist in code. When it is added: `key: "landforsale"`, `locale: "en"`,
`filters: { property_type: ["terreno"] }`, `ownsListingDetail: false`
canonicalising `/propiedad` to `realestateinparaguay.com` (`verify:seo`
refuses two English doors that both own detail pages), and **no theme
override** — it inherits the terreno baseline. A green/gold English land site
next to a petrol English homes site is fine; the two are not expected to
look like the same brand any more than terreno and inmobiliaria are.

## 8. Not done in this round

- No canvas iteration beyond one contrast-checked render with the real fonts.
- No hex tuned for dark mode; the app has none.
- The `#B5893C` link-contrast fix is a recommendation, not a commit.
