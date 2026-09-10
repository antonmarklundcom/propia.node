# Phase R2 — English URLs for the rental business's own pages on rentparaguay.com. OPUS session. Lane 1. GATED: run only after Anton answers plan question 5 with "go" and R1 is merged.

Read ONLY: this file, `fable-plan-realtor-terreno-rental.md` Stage 1 C2, §1,
§2, §4, §5.1; `docs/log/r1.md`; `src/config/rental-services.ts`;
`src/lib/alternates.ts` (whole file); `src/lib/sitemap.ts`; `src/lib/origin.ts`;
the S1 redirect block in `next.config.ts`; `scripts/verify-seo.ts` families
block; `fable/plan-rentparaguay.md` §1 item 8 and Appendix A.

Owns: `src/config/rental-services.ts`, `src/lib/alternates.ts`,
`src/lib/sitemap.ts`, `next.config.ts` (rental redirects only),
`app/services/**` (new), `app/about/page.tsx`, `app/contact/page.tsx` (new,
thin re-exports gated to EN rental doors), `app/servicios/**`, `app/nosotros`,
`app/contacto` (locale redirects only), `src/design/sections.ts` (a
`rentalPath()` helper), `scripts/verify-seo.ts`, `src/i18n/*` (`chromeNav`
hrefs and footer links via the helper), `docs/log/r2.md`, `CLAUDE.md` rows.

Hard limits: no `schema.ts`; `/propiedad/*` is not touched on any door; no
change to the marketplace family's paths or alternates; `verify:seo` must
still prove the marketplace pairs unchanged. Load skills `propia-dev`.

Budget: one session, ≤ 90 min. Branch `claude/r2-rental-english-paths`.

Build per plan §5.1: `slugEn` per service; pure `rentalPath(locale, key)`;
`languageAlternates()` gains an optional per-locale `paths` map (default =
same path, so every existing caller is unchanged); per-locale sitemap list;
EN door 301s Spanish rental paths → English and the ES door the reverse; the
WordPress-era redirect map targets English slugs on the EN door. Keep the
Spanish slugs as the `dictKey` anchors — only the URL segment changes.

Traps: `verify:seo` drives alternates against a synthetic table — extend the
spec, do not weaken the checks. `RentalServicesHub`, footer and the R1
dropdown build hrefs — route every one through the helper. Redirect loops:
prove with `curl -I` on both hosts before opening the PR.

Exit: `verify:local` green; seven `/services/<en>` URLs 200 on
`Host: rentparaguay.com`, their `/servicios/<es>` twins 301 there; the reverse
on `alquiler.com.py`; `<head>` on both shows the es/en/x-default trio with
the *different* paths; sitemap per host lists only its own language's
paths; **PR open, not merged** — founder merges (canonical/hreflang contract).

## After this phase
`docs/log/r2.md`, plan §9 line. Stop with the report. Spawn nothing.
