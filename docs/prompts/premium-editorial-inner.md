# Premium Editorial — delta-spec for the inner pages (PF3)

Director: Fable session, 2026-09-12. Builders: Opus, one per group below.
Read first: `AGENTS.md`, `CLAUDE.md` "i18n" and "Brand name",
`docs/prompts/premium-editorial.md` §0–§1 (the token set, the "no radius,
photo-carried, gold on deep green" decision), `fable-plan-premium-fix.md` F9,
and `docs/log/pf1.md` (what the home now looks like — the inner pages must
read as pages of the same site).

## 0. The decision

PE1 restyled the home. Every other public page still wears the previous
design: emoji used as icons, rounded chips, black submit buttons, boxed white
panels with shadows. The chrome (header, footer, cards) is already editorial.
PF3 makes the *bodies* match, without changing any copy, URL, data flow,
component tree or form behaviour. This is CSS plus the smallest JSX edits that
CSS alone cannot do (an emoji literal replaced by an SVG glyph; a class name).

Not in scope: new sections, new copy, `/admin`, `/agencia`, `/mis-avisos`,
`/login`, `/registro`, the rental doors (`RentalAbout`, `RentalContact`,
`RentalServicePage`, `RentalServicesHub` — they have their own look), the
directory door's own home. No `schema.ts`, no `verticals.ts`, no auth.

## 1. One glyph library — `src/components/Glyph.tsx` (group G1, first)

Move `LineIcon` and the glyph paths out of `PremiumHome.tsx` into
`src/components/Glyph.tsx`, exporting `Glyph({ name, size = 18, className })`
and the `GlyphName` union. `PremiumHome.tsx` imports from it (no visual
change there). Add the names the inner pages need, all as 24-box, 1.2 stroke,
`currentColor`, round caps, `aria-hidden`:

`search, handshake, ruler, map, coins, calendar, layers, pin, city, hammer,
tree, car, bed, bath, clock, card, check, bell, globe, mail, phone, whatsapp,
document, chart, home, bank, key`.

Then strip every emoji from the dictionaries and pages and replace it with a
glyph:

- `src/i18n/es.ts` / `en.ts`: every `icon: "🔎"`-style field becomes a
  `GlyphName` string (`icon: "search"`); the `waContinue`, `waLinkLabel`,
  `phoneLinkLabel`, `directNote`, `verifiedBadge`, `projectsTitle`,
  `pricesTitle`, `whatsappLink` and the 🌎 foreign-exposure note lose their
  leading emoji — the component that renders them puts the glyph before the
  text. **Staff copy in `esPanel` (`adminReviewEmpty` 🎉, the admin
  onboarding lines) is left alone.** `npm run verify:i18n` stays green (both
  files change in the same commit).
- `src/components/SiteFooter.tsx` (all four branches), `app/contacto/page.tsx`
  channel list, `src/components/PriceAlert.tsx`, `RecentlyViewed.tsx`,
  `app/agentes/page.tsx` + `app/inmobiliarias/page.tsx` verified ✓,
  `src/components/LeadForm.tsx` ✅ done-state: glyph, not emoji.

After G1 there is no emoji in any public-page file:
`grep -rP "[\x{1F300}-\x{1FAFF}]|[\x{2600}-\x{27BF}]" app src/components src/i18n --include=*.tsx --include=*.ts` returns only `esPanel` lines.

## 2. Group G2 — listing detail (`app/propiedad/[slug]/page.tsx`, `LeadForm.tsx`, `ContactForm.tsx` if it is the same form, CSS blocks "Listing detail page", "Seller card", "Contact form", "Mobile contact bar", "Detail page: foreigner box")

- Facts row (`.listing-facts`): one hairline-separated line, glyph + value,
  13.5 px Jost 300, no pill backgrounds, no radius.
- Price (`.listing-price__amount`): Cormorant 400, `clamp(32px, 3.4vw, 44px)`,
  `--color-ink`; the cuota chip: hairline outline, no fill, radius 0.
- Section titles (`.listing-section__title`): Cormorant 400 22 px, gold
  10 px uppercase tracked label above only where the page already has one —
  do not add labels.
- Details grid: hairline rows, label `--color-ink-secondary`, glyph 16 px.
- Lead form (sidebar card and bottom panel): card = hairline border, no
  shadow, cream fill; inputs radius 0, hairline, 14 px; quick-reply chips
  outlined radius 0; submit = `.mk-btn.mk-btn--accent` look (gold, uppercase
  tracked 11 px); "WhatsApp" / "Ver teléfono" links get their glyphs.
- Seller card: same card treatment; avatar square.
- Mobile CTA bar: primary gold, secondary outlined, radius 0.
- Similar listings: nothing (ListingCard is already editorial).
- Foreigner box: hairline, gold label, no fill.

## 3. Group G3 — hubs and category (`app/[operacion]/page.tsx`, `app/[operacion]/[...segments]/page.tsx`, `SearchBar.tsx`, `CategoryFilterBar.tsx`, CSS blocks "Hero search bar", "Category filter bar", "Operation hubs", "Category pagination", `.view-switch`, `.mk-chip`, `.hub-tile`)

- `SearchBar` is shared with the home's dark panel. Style it once so it looks
  like the home's panel everywhere: labels 10 px uppercase tracked, fields
  radius 0 hairline, button gold uppercase. Where it sits on a white/cream
  page (hub, category) the panel is cream with a hairline, not a floating
  white box with a shadow.
- Filter bar: same field treatment; "Filtrar" outlined, not black.
- View switch (`Lista | Mapa`): two outlined segments, active = gold fill.
- Hub tiles and chips: radius 0, hairline, count in gold; `.hub-chips` wraps.
- Pagination: hairline, uppercase tracked links.
- Category empty state / redirect notice: hairline box, no fill.

## 4. Group G4 — marketing pages (`src/components/MarketingUI.tsx`, `app/nosotros/page.tsx`, `app/proyectos/page.tsx`, `app/tasacion/page.tsx` + `ValuationTool.tsx`, `app/agentes/page.tsx` + `app/inmobiliarias/page.tsx` cards, CSS blocks "Feature grid", "Steps", "Stats", "CTA band", "Prose", "Directory", "Contact layout + cards", `.mk-btn*`, `.mk-page-hero*`)

- `FeatureGrid` items take `icon: GlyphName` (G1 changed the data); each item
  = hairline top rule, glyph 22 px gold, Cormorant title 20 px, no box.
- `StatRow`: numbers Cormorant 400 40 px gold, label 10 px uppercase tracked;
  no boxes, hairline between.
- `CtaBand`: primary gold, secondary outlined-on-dark (`--color-accent`
  border), radius 0.
- `PageHero`: keep; label already gold uppercase.
- Directory cards: hairline card, square avatar, ✓ badge = glyph in a gold
  circle-less badge (text + glyph), chips radius 0.
- Valuation form: same field treatment as G3; "Calcular" gold.

## 5. Rules for every group

- Append CSS under a `/* == PF3-G<n> == */` banner at the end of
  `app/globals.css` **or** edit inside the named blocks only — never both
  groups in one block. G2/G3/G4 run in parallel in separate worktrees; each
  touches only its files. Conflicts are resolved by the director.
- No new copy. No new dictionary keys except a glyph name replacing an emoji.
- `border-radius: 0` on anything you touch; `--shadow-float` is `none` on
  these doors, so drop any `box-shadow` you meet.
- Fonts: `--font-display` for headings ≥ 20 px, `--font-sans` for the rest.
- Verify: `npm run verify:local`; render each page you touched at 1440 and
  390 on both hosts with the harness (`fable-plan-premium-fix.md` names it),
  assert no horizontal overflow, no 404, and look at the screenshots.
- Commit per page group; `docs/log/pf3-g<n>.md`; do not push.
