# Phase R1 — rentparaguay.com / alquiler.com.py: "Services" header dropdown. SONNET session. Lane 2, runs in parallel with T1. READY NOW.

Read ONLY: this file, `fable-plan-realtor-terreno-rental.md` Stage 1 B + §1,
§4, the i18n section of `CLAUDE.md`, `src/components/SiteHeader.tsx`,
`src/components/MobileMenu.tsx`, `src/config/rental-services.ts`, and the
`rental.chromeNav` + `rental.services` entries in `src/i18n/es.ts`/`en.ts`.

Owns: `src/components/SiteHeader.tsx` (the `rentalNav` construction only),
`src/i18n/es.ts` + `en.ts` (`rental.chromeNav` only, if a label is needed),
a `/* == r1 == */` block appended to `app/globals.css` only if the existing
`.site-header__panel` styles do not already look right under the rental
theme, `docs/log/r1.md`.

Hard limits: no `schema.ts`, no `verticals.ts`, `sections.ts`, `alternates.ts`,
`sitemap.ts`, no client JS for the dropdown (it is pure CSS `:hover` /
`:focus-within` and stays a server component), no new nav entries. Load
skills `propia-dev`.

Budget: one session, ≤ 60 min. Branch `claude/r1-rental-services-menu`.

Build:
- `rentalNav` currently maps every `d.rental.chromeNav` entry to `links: []`.
  For the entry whose `href === "/servicios"` build `links` from
  `RENTAL_SERVICES`: `label = d.rental.services[s.dictKey].title` (check the
  real key name in the dictionary), `href = \`/servicios/${s.slug}\``, `desc`
  = the one-liner if the shape has it and it fits the panel; otherwise omit.
  Match by href, never by array index — `RentalServicesHub.tsx` already
  reads `chromeNav[1]` by index; do not add a second index dependency.
- Verify the caret and panel render on both rental hosts and that
  `MobileMenu` lists the seven services under "Servicios/Services" (it
  already renders `group.links`).
- Keyboard: tab into the group opens the panel (`:focus-within`), Escape is
  not required (pure CSS).

Exit: `npm run verify:local` green; `curl -H "Host: rentparaguay.com" /` and
`Host: alquiler.com.py` both contain seven `site-header__panel-link`s under
the Services group with the correct locale's labels; one screenshot pass
(desktop + 390px, both doors — CI artifact or PR note); PR merged green (UI —
autonomous merge authorised).

## After this phase
Write `docs/log/r1.md` (≤ 12 lines), plan §9 line. Spawn nothing.
