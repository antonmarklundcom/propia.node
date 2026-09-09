# Phase S2 — copy: home, services hub, about, contact. SONNET session, ONLY after S1 is merged.

Read `fable/plan-rentparaguay.md` FIRST, in full — plus §9 and
`fable/KNOWN-ISSUES.md` — then the i18n and brand sections of `CLAUDE.md`,
`docs/style/rentparaguay.com.md`, and the four source files
`docs/rentparaguay-extraction/content/{home,services,about-us,contact}.md`
(with `site-content.json` for the structured version and
`SITE-SUMMARY.md` §"What NOT to carry forward"). Execute plan §6.2 under
the autonomy protocol §4.

Sonnet hard limits (plan §6): no `schema.ts`, no `src/lib/auth/**`, no
`src/db/**`, no `src/lib/crm.ts`, no `src/lib/import/**`, no cache keys, no
`verticals.ts`, `alternates.ts`, `origin.ts`, `sections.ts`, `themes.ts`.

Owns: the `rental` namespace in `src/i18n/es.ts` + `en.ts`;
`src/components/home/RentalHome.tsx`, `src/components/RentalServicesHub.tsx`,
`RentalAbout.tsx`, `RentalContact.tsx` (markup completion only — no new
sections, no registry change); `fable/KNOWN-ISSUES.md`; plan §9.

Phase rules:
- Reset to `origin/main`, branch `claude/fable-s2-rental-copy`.
- Load skill `propia-dev` before editing.
- English is the source language: clean it per plan §1 item 13 (no demo
  listings, no team, no testimonials, no "altora", no zero counters, no
  "400+ agents"), fix "adress", replace theme headings ("Questions? You Need
  Answer") with plain English. Then write the Spanish as a translation of
  intent for a Paraguayan reader, vos-form like the rest of `es.ts` — never
  a fact the English does not state.
- Figures: a claim of a measured result ("within 48 hours", "first attempt")
  becomes a statement of the service. No invented numbers, no
  "(verificar)" in copy.
- `es.ts` key ⇒ `en.ts` key in the same commit; read through `dict()`;
  never import a namespace into a page; `index.ts` gains no `next/headers`.
- Brand-naming copy takes the brand as an argument (`(brand) => …`), never
  a literal "Rent Paraguay" — `alquiler.com.py` renders the same component.
- Phone number and email are env, never copy. "Edificio Skytower, Asunción"
  is fine as copy.
- Prove `verify:i18n` covers `rental`: remove one `en` key, watch it fail,
  restore, say so in the PR.
- Re-runnable; minor issues → `fable/KNOWN-ISSUES.md`; stop only per §4.4.

Exit: `npm run verify:local` green; `grep -n -i "todo\|lorem\|verify before\|altora\|verificar" src/i18n/es.ts src/i18n/en.ts` returns nothing inside the
`rental` namespace; `curl -H "Host: rentparaguay.com"` and
`-H "Host: alquiler.com.py"` show full copy on `/`, `/servicios`,
`/nosotros`, `/contacto` in the right language; PR merged green.

## After this phase — S3 in this same session
Gates: PR merged; exit list passed; pre-handoff audit done; §9 entry
committed. Then reset to `origin/main` and continue with
`fable/prompts/sonnet-3-rental-services.md` in this window (same model).
