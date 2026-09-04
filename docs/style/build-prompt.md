# Build prompt for the Sonnet builder

Three PRs, in this order. Each one runs the pre-push gate
(`npm run verify:local`) before pushing. Branch names
`claude/theme-plumbing`, `claude/theme-inmobiliaria`, `claude/theme-en`.

## PR 1 — plumbing (no visible change on any domain)

> Read `CLAUDE.md`, `src/design/themes.ts`, `src/design/tokens.ts` and
> `app/globals.css`. Extend the theme mechanism so a vertical can override
> fonts, overlays, control radius, label tracking, button case and the two
> new colour roles, without changing how any domain renders today.
>
> 1. Add to `EDITORIAL` in `themes.ts` with baseline values:
>    `--overlay-hero`, `--overlay-card`, `--overlay-zone` (copy the ramps
>    from `globals.css`), `--color-border-accent` (`rgba(193,154,77,0.24)`),
>    `--color-on-accent` (`#0E1F17`), `--color-accent-on-dark` (`#C19A4D`),
>    `--font-display`, `--font-sans` (the current stacks),
>    `--radius-control` (`0`), `--label-tracking` (`3px`),
>    `--button-case` (`uppercase`). Mirror them in `tokens.ts` and in
>    `:root` of `globals.css`.
> 2. Make `globals.css` read them: every hard-coded overlay,
>    `rgba(193,154,77,…)`, `color: var(--color-primary)` on an accent
>    fill, `letter-spacing` on `.ds-label` and buttons, `text-transform`
>    on buttons, and `border-radius: 0` on controls. Grep for the
>    literals; leave photo radii at 0.
> 3. Fix `--color-link` to `#8A6626` and `--color-link-hover` to
>    `#6B4F1C` in all three places (the current value is 2.87:1 on cream).
>    Correct the contrast comment in `tokens.ts`.
> 4. Add a per-vertical section registry `src/design/sections.ts`:
>    `homeSections(key)`, `heroVariant(key)`, `cardVariant(key)`,
>    `detailSidebarOrder(key)`, `showCuota(key)`, `secondaryAreaUnit(key)`,
>    all returning the current behaviour for every key. Wire `app/page.tsx`,
>    `ListingCard` and the detail page to read from it. No shared component
>    may branch on the vertical key directly.
> 5. `npm run verify:local` green. Screenshot the home page before and
>    after on `inmobiliaria.com.py` and `terreno.com.py` hosts (use the
>    `Host` header against `npm run dev`) and confirm pixel-identical.

## PR 2 — inmobiliaria.com.py

> Implement `docs/style/inmobiliaria.com.py.md` on top of PR 1. Install
> `@fontsource-variable/lora` and `@fontsource-variable/figtree`, import
> them in `app/layout.tsx`, fill `OVERRIDES.inmobiliaria` in `themes.ts`
> with every token in the guide's §2 and the font/shape tokens from §3–4.
> Then the structural pieces through the registry: dual-intent hero
> (search panel + "Publicá gratis" card), photo card with the cream facts
> strip, home section order from §6, WhatsApp-first sidebar, sticky
> mobile contact bar. New Spanish strings go into `src/i18n/es.ts`
> namespaces with English peers in `en.ts` in the same commit
> (`verify:i18n` enforces it). Cormorant/Jost stay in the repo for terreno.
> Do not touch `realestateinparaguay.com` rendering in this PR.

## PR 3 — realestateinparaguay.com

> Implement `docs/style/realestateinparaguay.com.md` on top of PR 1.
> Install `@fontsource-variable/newsreader` and `@fontsource/ibm-plex-sans`
> (400/500/600). Fill `OVERRIDES.en`. Structural pieces through the
> registry: split hero with the three-fact strap, facts strip, framed
> card variant with `US$/m²` and `sq ft`, `showCuota` false, "Buying this
> property as a foreigner" box, inquiry-form-first sidebar, home section
> order from §6 including "Why Paraguay", "Where to buy", "How buying
> works" with the costs table, and "Relocation". Create the three guide
> pages the home links to, as English `guias` entries if that fits the
> existing model, with honest placeholder copy marked for the founder to
> verify figures (tax rates, fee percentages) before launch. No login,
> newsletter or publicar entry points in this domain's chrome.

## Review checklist for the director

- `OVERRIDES` diff shows only the two keys; `EDITORIAL` values unchanged
  except the link fix.
- No `vertical.key ===` inside `src/components/`.
- `npm run verify:seo` still passes (no change to `verticals.ts` expected).
- English door: no cuota string anywhere in the rendered home or card.
- Every figure in the English guides is either sourced or marked
  "verify before launch".
