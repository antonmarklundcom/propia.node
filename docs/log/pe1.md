# PE1 — Premium Editorial home for the marketplace doors

Spec: `docs/prompts/premium-editorial.md` (director: Fable, 2026-09-11).
Imagery contract: `docs/imagery-prompts.md` §2.
Branch: `claude/sleepy-volta-qvrq9q`. One commit, not pushed.

## What landed

`inmobiliaria.com.py` and `realestateinparaguay.com` render one shared home
shell on the repo's editorial token set (deep green / gold / Cormorant over
Jost / zero radius), each in its own language. The two per-door themes and
the two per-door home components they carried since 2026-09-04 are deleted.

- **`src/design/themes.ts`** — `OVERRIDES.inmobiliaria` ("Nórdico") and
  `OVERRIDES.en` ("Petrol") deleted; both keys now fall to `EDITORIAL`.
  `alquiler`, `rent`, `agents` untouched. The `OVERRIDES` docblock says why.
- **`app/layout.tsx`** — the `@fontsource-variable/newsreader` and three
  `@fontsource/ibm-plex-sans` imports removed (nothing selects them any more).
  Manrope, Lora and Public Sans stay; **no package.json change**.
- **`src/design/sections.ts`** — `HomeLayout` gains `"premium"` and loses
  `"nordico"`/`"guide-en"`; `homeLayout()` returns `"premium"` for both
  marketplace keys. `homeSections()` returns
  `hero · destacadas · tipos · nosotros · servicios · zonas · como-funciona ·
  faq-contacto` for both. The eleven Nórdico/guide-en-only `HomeSectionId`
  members are gone (each grepped first; `recientes` is kept — the rental home
  uses it). `cardVariant()` → `"photo-scrim"` for both. `HeroVariant` and
  `heroVariant()` deleted (no consumer).
- **`src/components/home/PremiumHome.tsx`** (new) — the shell. Never reads
  `vertical.key`: only `homeSections()`, `vertical.locale` and its props.
  Carries its own `faqJsonLd` (a dedicated home component has to, or the door
  loses its FAQPage data). Twelve inline line-icons, one WhatsApp glyph.
- **`src/components/Picture.tsx`** (new) — the exact `<picture>` webimg emits
  (AVIF + WebP at 640/1280/1920, 1280 WebP as `<img src>`), addressed by slug
  under `/img/premium`. No `width`/`height`, no `next/image`.
- **`app/page.tsx`** — forks on `homeLayout() === "premium"`; passes
  `faq = vertical.locale === "en" ? [...d.guideEn.faq] : faqHome(brand)` and
  `total`. New `PREMIUM_ZONE_TILES` const (six tiles, webimg slugs).
- **`src/i18n/es.ts` / `en.ts` / `index.ts`** — new `premium` namespace, both
  locales, registered. `imgAlt` is the alt column of `docs/imagery-prompts.md`
  §2 verbatim, in both languages.
- **`app/globals.css`** — a new `ph-*` block; the `eh-*` block and the unused
  half of the `nh-*` block deleted. The `.nh-hero*`, `.nh-proof*` and
  `.nh-process*` rules `/vender`, `<ProofRow>` and `<SalesProcessSection>`
  still reference are kept, and the block's comment now says so.
- **Deleted**: `src/components/home/NordicoHome.tsx`, `EnHome.tsx`.
- **48 placeholder images** in `public/img/premium/` (8 slugs × 3 widths × 2
  formats), converted with webimg from the photographs already in
  `public/img/`. `manifest.json` deleted before committing, as instructed.
- **Docs**: `docs/style/README.md` (both marketplace rows), `CLAUDE.md`
  ("Brand name", one paragraph after the brand table), this file.

## Deviations from the spec, and why

1. **`enPremium.aboutHref` is `/nosotros` and `enPremium.contactHref` is
   `/contacto`, not `/about` and `/contact`.** The spec says "both routes
   exist under `app/`" — they do, but they are the **rental family's** pages
   (R2): `app/about/page.tsx` and `app/contact/page.tsx` both call
   `rentalRouteGate(…, "en")`, which redirects to `/` on every non-rental
   door. `app/about/page.tsx`'s own header comment says it outright: the
   marketplace's about page "realestateinparaguay.com serves in English at
   `/nosotros`". Linking the English marketplace home at `/about` would have
   been a link into a redirect to the home page. Both hrefs are still
   dictionary values, so the two doors can diverge the moment that changes.
2. **A new `PREMIUM_ZONE_TILES` const rather than replacing `ZONE_CARDS`.**
   `ZONE_CARDS` is still the default (terreno) home's zone row, where `img` is
   a *path* and the strapline comes from `esHome.zoneCardSub` keyed by slug —
   a map with no entries for `san-lorenzo` or `ciudad-del-este`. Replacing it
   would have silently blanked two straplines and broken the default home's
   `<img src>`. The premium list lives beside it, documented.
3. **`.ph-grid-4 .ds-photo-card { height: 290px }`, not `min-height` alone.**
   `.ds-photo-card` sets `height: clamp(320px, 30vw, 400px)`, so the spec's
   `min-height: 290px` could never take effect. Both are set; the result is
   the 290px the spec asked for.
4. **The about photo bleeds to the container's right edge, not the
   viewport's.** A `100vw`-based full bleed adds a horizontal scrollbar on
   every platform that reserves gutter width — which §6's own review list
   forbids. `margin-right: calc(-1 * var(--container-pad))` gives the same
   result inside the 1440 container and cannot overflow.
5. **Hero `padding-top` is `clamp(24px, 4vh, 56px)`, not clearance for an
   overlaying header.** The spec assumed `SiteHeader` overlays the hero; it is
   `position: sticky` and therefore *in flow* above it. Per the spec's own
   "no header work in this build", the header was left alone and the hero's
   top padding is breathing room only.
6. **`.ph-hero__search`'s `-46px` sits on a wrapper (`.ph-hero__search-wrap`)**
   rather than on the panel itself, so the panel keeps its own padding box.
   Same visual result.
7. **`CardVariant` keeps its `"framed-fact"` member** and `ListingCard`'s
   branch for it, now unreachable. Deleting a card layout was not in scope and
   the type is the registry's vocabulary, not dead JSX in a page.
8. **The `en` door's "Vender o alquilar" service tile points at `/publicar`
   (via `sellerCtaHref`)**, as the spec prescribes, even though
   `chromeShowPublishCta("en")` is false. That flag governs the *chrome*; the
   spec placed the tile in the page body deliberately. Flagging it rather than
   silently dropping it.

## Not verified

- **No database in this sandbox.** Nothing that touches MySQL was run: no
  `db:status`, no `verify:scopes` (nothing in this change touches
  `listingScopeWhere`, `panelScope` or a panel query), no `--dry` script run
  (no script changed). `npm run verify:import` printed
  `DATABASE_URL not set — skipping the database half.`
- **The page was never rendered.** With no `DATABASE_URL`, `next start` 500s
  on the home, so the review of the overlap, the z-index of the search panel
  against the hero scrim, the ink-on-`accent-soft` about section, the
  six-column rows at 400px and the floating button's gate was done by reading
  the JSX and CSS, per §6.4. Two real findings came out of it and are fixed:
  `.ph-hero + *` needed `.premium-home` in front of it to outrank
  `.ds-section`'s `padding-block`, and the `max-width: 900px` type-tile
  hairline rules had to be bounded at `min-width: 521px` or they stripped the
  right border off tile 3 in the two-column phone layout. A third: the about
  section's `.ds-label` reads `--color-accent` (10px gold on a cream tint,
  below AA), so it borrows `--site-notice-label-color`, the token that exists
  for exactly that pairing.
- **Empty listing set.** With no database the home renders with `recent = []`,
  which drops the whole `destacadas` section — that path is exercised by the
  markup (`recent.length > 0`) but has not been seen. Likewise `zones` is
  filtered against the DB's cities, so with no cities the zone row disappears
  entirely; on a seeded database all six slugs should be present.
- **`schema.ts`, `verticals.ts` and `.github/workflows/` are untouched**
  (confirmed with `git diff --stat`).

## Placeholder imagery — upscaling warnings

Expected and left as-is per §3: the sources in `public/img/` are small, so
webimg upscaled to reach the declared widths. Verbatim:

- `casa-premium-asuncion-atardecer` — `⚠ upscaling 1920 from source 1320px`
- every other slug — `⚠ upscaling 1280 from source 720px` and
  `⚠ upscaling 1920 from source 720px`

The founder's real set replaces these by re-running `webimg convert` with the
same `--name`, which overwrites in place and needs no code change — that is
why the slugs were fixed before the photographs existed. Two source images are
reused for three slugs each side of the set (`zona-luque` also stands in for
San Lorenzo, `zona-asuncion` also for Ciudad del Este), exactly as §3 specifies.
