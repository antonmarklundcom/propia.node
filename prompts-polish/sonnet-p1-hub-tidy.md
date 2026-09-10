# Phase P1 — operation hubs look finished, not empty. SONNET session, medium effort. Runs in parallel with P3/P4/P5.

Read ONLY: this file; `fable-plan-polish.md` §1, §4; `app/[operacion]/page.tsx`;
`src/components/SearchBar.tsx`; `esHub` in `src/i18n/es.ts` and `enHub` in
`en.ts`; in `app/globals.css` the `.hub-hero*`, `.hub-grid*`, `.hub-tile*` and
`.search-bar__submit` rules (read, do not rewrite in place). CLAUDE.md i18n
section. Nothing else.

Owns: `app/[operacion]/page.tsx`; `.search-bar__submit`'s two colour lines in
`SearchBar`'s CSS via a P1 block override (append-only); `esHub`/`enHub` keys
(edit/add, same arity); `/* == P1 == */` CSS block at the end of `globals.css`;
`docs/log/p1.md`; one §9 line.

Hard limits: no other files. No new routes, no query changes except reordering
what is already fetched, no `verticals.ts`, no `sections.ts`.

## Why (Anton, from screenshots of /alquiler on both doors)
"Looks low budget": a tall dark hero with a title floating alone, a count
badge in a box, the search bar far below, then one lonely type tile in an
empty row, and the visitor scrolls past two sections before seeing a home.

## Decisions (final)
1. **Hero is compact.** Title, lead, search bar — in that order, tight. Hero
   padding `clamp(40px, 5vw, 64px)` top/bottom, no min-height. Add
   `data-op={op}` on the `<section className="hub-hero">` (P2 hangs a photo
   on it; if P2 landed first and already added it, keep theirs).
2. **Drop the count badge.** Remove `hub-hero__count`. Put the count into the
   latest-listings heading instead: `latestTitle(total)` → "Últimas
   publicaciones · 12 avisos" / "Latest listings · 12 properties" using
   `toLocaleString(numberLocale)`. Remove `count` from both dictionaries.
3. **Order after the hero:** latest listings (cards, first!) · by city ·
   by type · CTA band. Types moves last because it is the thinnest section.
4. **Type section as chips, never one lonely tile.** Render `hub.types` as a
   row of `mk-chip`-style links (existing class) with the count in a small
   badge; **hide the whole section when fewer than 2 types have listings**.
5. **Search button follows the door.** `.search-bar__submit` reads
   `var(--button-primary-bg)` / `var(--button-primary-fg)` and hover
   `var(--button-primary-bg-hover)`, so rentparaguay.com gets its clay button
   and the marketplace keeps its dark one. Override in the P1 CSS block.
6. Copy: vos-form Spanish, `en.ts` peer, no figures other than the real count.

## Exit
`npx tsc --noEmit`; `npm run verify:i18n`, `verify:seo`, `verify:facets`
green; `npm run build` clean (no DB needed). `git merge origin/main` before
opening the PR (main wins in CSS, re-apply your block). Branch `claude/p1-hub-tidy`,
one PR "P1 — operation hubs: compact hero, listings first, chips for types".
Merge it yourself when green (§1 item 3). `docs/log/p1.md` + §9 line in the PR.
