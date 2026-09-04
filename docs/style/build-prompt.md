# Build prompts (locked designs, 2026-09-04)

Spanish site: **Nórdico** (`inmobiliaria.com.py.md`). English site:
**variant A, guide-first** (`realestateinparaguay.com.md`). Four PRs, in
order, each on its own branch, each pushed only after
`npm run verify:local` is green. Branches: `claude/theme-plumbing`,
`claude/theme-inmobiliaria`, `claude/theme-en`, `claude/vender-landing`.

## Which model runs what

- **Builder sessions: Sonnet 5.** Every PR below is a well-specified
  build against a written guide; that is Sonnet's job. Do not run these
  in a Fable session.
- **Review: Opus 5** (or Fable if you want a second opinion on PR 2 only).
  One review pass per PR against the checklist at the end, then merge.
- Never merge on a red pre-push hook. There is no CI; the hook is the
  gate.

## Session opener (paste at the top of every builder session)

> Read `CLAUDE.md` first, then `docs/style/README.md` and the guide named
> below. Work only on the branch named below, created from a fresh
> `git fetch origin main && git reset --hard origin/main`. Commit in small
> steps with clear messages. Before pushing run `npm run verify:local` and
> fix everything it reports. Do not create files under
> `.github/workflows/`. Do not add a shared component branch on the
> vertical key; structural differences go through the section registry.
> When the guide and the code disagree on a value, the guide wins; when
> the guide is silent, keep the current behaviour and note it in the PR
> description. Open the PR when green and list every `[verify]` or
> placeholder you left.

## PR 1 — plumbing (no visible change on any domain)

Branch `claude/theme-plumbing`. Guide: none (this PR is mechanism).

> Extend the theme mechanism so a vertical can override fonts, overlays,
> control radius, label tracking, button case and two colour roles,
> without changing how any domain renders today.
>
> 1. Add to `EDITORIAL` in `src/design/themes.ts`, with the baseline
>    values so terreno does not change: `--overlay-hero`,
>    `--overlay-card`, `--overlay-zone` (copy the ramps from
>    `app/globals.css`), `--color-border-accent`
>    (`rgba(193,154,77,0.24)`), `--color-on-accent` (`#0E1F17`),
>    `--color-accent-on-dark` (`#C19A4D`), `--font-display`,
>    `--font-sans` (the current stacks), `--radius-control` (`0`),
>    `--radius-photo` (`0`), `--label-tracking` (`3px`), `--button-case`
>    (`uppercase`), `--shadow-float` (`none`). Mirror in `tokens.ts` and
>    `:root` of `globals.css`.
> 2. Make `globals.css` read them: every hard-coded overlay,
>    `rgba(193,154,77,…)`, `color: var(--color-primary)` on an accent
>    fill, `letter-spacing` on `.ds-label` and buttons, `text-transform`
>    on buttons, `border-radius: 0` on controls and photo cards. Grep
>    for the literals.
> 3. Fix `--color-link` to `#8A6626` and `--color-link-hover` to
>    `#6B4F1C` in all three places (the current value is 2.87:1 on
>    cream). Correct the contrast comment in `tokens.ts`.
> 4. Add the section registry `src/design/sections.ts`:
>    `homeSections(key)`, `heroVariant(key)`, `cardVariant(key)`,
>    `detailSidebarOrder(key)`, `showCuota(key)`,
>    `secondaryAreaUnit(key)`, `sellerCta(key)`; every function returns
>    the current behaviour for every key. Wire `app/page.tsx`,
>    `ListingCard` and the detail page to read from it.
> 5. Screenshot the home page before and after for the hosts
>    `inmobiliaria.com.py`, `realestateinparaguay.com` and
>    `terreno.com.py` (send the `Host` header to `npm run dev`) and
>    confirm pixel-identical. Attach the screenshots to the PR.

## PR 2 — inmobiliaria.com.py, Nórdico

Branch `claude/theme-inmobiliaria`. Guide: `docs/style/inmobiliaria.com.py.md`.

> Implement the guide on top of PR 1. Install
> `@fontsource-variable/manrope`, import it in `app/layout.tsx`, fill
> `OVERRIDES.inmobiliaria` with every token in §2 and the shape/type
> tokens from §3–4 (`--radius-control: 10px`, `--radius-photo: 10px`,
> `--label-tracking: 0.08em`, `--button-case: none`, `--shadow-float`).
> Through the registry: split hero with the search bar under it, proof
> row, card variant with the pill row, the dark sales-process section,
> home order from §6, WhatsApp-second sidebar, sticky mobile contact
> bar. Restyle `/para-inmobiliarias` and `/tasacion` to the system
> without changing their content. Header nav gains **Vender** → `/vender`
> (the route arrives in PR 4; link to `/publicar` until then and leave a
> TODO in the registry). New strings in `src/i18n/es.ts` with English
> peers in `en.ts`. Cormorant/Jost stay for terreno. Do not touch
> `realestateinparaguay.com` rendering.

## PR 3 — realestateinparaguay.com, variant A

Branch `claude/theme-en`. Guide: `docs/style/realestateinparaguay.com.md`.

> Implement the guide on top of PR 1. Install
> `@fontsource-variable/newsreader` and `@fontsource/ibm-plex-sans`
> (400/500/600). Fill `OVERRIDES.en`. Through the registry: split hero
> with the three-fact strap, facts strip, framed card variant with
> `US$/m²` and `sq ft`, `showCuota` false, "Buying this property as a
> foreigner" box, inquiry-form-first sidebar, home order from §6 (Why
> Paraguay, Where to buy, How buying works with the costs table,
> Relocation). Drop the location line from the photo scrim on the card;
> keep it below the photo only. Create the three guide pages the home
> links to as English `guias` entries with placeholder copy marked
> "verify before launch" on every figure. No login, newsletter or
> publicar entry points in this domain's chrome.

## PR 4 — `/vender` seller landing page

Branch `claude/vender-landing`. Guide: `inmobiliaria.com.py.md` §5
"Seller landing page".

> Build `/vender` on the Spanish door only (the English door 404s it or
> redirects to `/`). Sections 1–8 exactly as the guide lists them. The
> form posts through the existing lead pipeline as an `internal` lead
> with `source: "vender"`; `/admin/leads` shows the source. Section 6
> ("Quién está detrás") uses placeholders for the photo and the licence
> line, marked for the founder. Set the header CTA and the
> sales-process button to `/vender`. Meta: title "Vendé tu propiedad al
> mejor precio", indexable. Add `/vender` to the sitemap for the Spanish
> door only.

## Review checklist (Opus, per PR)

- `OVERRIDES` diff shows only the intended key; `EDITORIAL` unchanged
  except the link fix (PR 1).
- No `vertical.key ===` inside `src/components/`.
- `npm run verify:seo` passes; `verticals.ts` untouched.
- English door renders no cuota string on home, cards or detail.
- Every figure in the proof row and the English guides is real or marked.
- Screenshots in the PR match the locked canvas pages for the domain.
