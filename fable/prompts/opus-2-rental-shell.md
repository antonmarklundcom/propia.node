# Phase O2 — rental identity: theme, chrome, home shell. OPUS session, ONLY after O1 is merged.

Read `fable/plan-rentparaguay.md` FIRST, in full — plus §9 and
`fable/KNOWN-ISSUES.md` — then `CLAUDE.md` (brand, i18n, caching sections)
and `docs/style/README.md` + `docs/style/inmobiliaria.com.py.md` (the house
style of a guide and the Nórdico tokens you reuse). Execute plan §5.2 under
the autonomy protocol §4. Build nothing outside the plan.

Read before editing: `src/design/themes.ts`, `src/design/sections.ts`,
`src/components/home/NordicoHome.tsx` and `EnHome.tsx` (the two existing
per-vertical shells — copy their shape), `src/components/SiteHeader.tsx`,
`SiteFooter.tsx`, `MobileMenu.tsx`, `app/page.tsx`, `src/i18n/index.ts`,
the `esGuideEn` / `enGuideEn` namespaces (the chrome-from-dictionary
precedent), `docs/rentparaguay-extraction/content/home.md`.

Phase rules:
- Reset to `origin/main` (must contain O1 — check `git log` for it), branch
  `claude/fable-o2-rental-shell`.
- Load skill `propia-dev` before editing.
- One `RENTAL` token set for both keys (plan §1 item 10). Palette from the
  two logo PNGs in `docs/rentparaguay-extraction/images/`; type and shape
  from Nórdico; contrast ratios computed and written in comments as
  `OVERRIDES.en` does. No new font package.
- Structure goes through the registry, never `vertical.key ===` inside
  `src/components/`. Chrome labels come from the new `rental` dictionary
  namespace, never a literal.
- The `rental` namespace is a **skeleton with real strings**: chrome, hero,
  section titles, the seven service card titles/one-liners (from
  `home.md`), footer. Sonnet S2 fills the rest. `es.ts` key ⇒ `en.ts` key
  in the same commit; both assembled in `index.ts`; `index.ts` gains no
  `next/headers` import.
- `recientes` renders nothing when the door's inventory is empty — the
  table has no rental rows today, and an empty rail on the home page reads
  as a broken site.
- Create `src/config/rental-services.ts` (slug, dictionary key, image path
  per plan Appendix B, old URL) — O3 adds `leadType` and the route.
- The `docs/style/rentparaguay.com.md` guide is ≤ 80 lines: tokens, home
  section list, image slots (Appendix B), chrome. It is S1–S3's contract.
- Do not touch `verticals.ts`, `alternates.ts`, `origin.ts`, `schema.ts`,
  `crm.ts`, `src/db/**`.
- Re-runnable; minor issues → `fable/KNOWN-ISSUES.md`; stop only per §4.4.

Exit: `npm run verify:local` green; `curl -H "Host: rentparaguay.com"` and
`-H "Host: alquiler.com.py"` against `npm run start` render the rental
header, hero and footer in the right language with the rental palette; the
three live doors' home `<head>` and header HTML are unchanged (same diff as
O1); `grep -rn "vertical.key ===" src/components` empty; PR merged green.

## After this phase — O3 in this same session
Four gates (§4.9): PR merged; exit list passed; pre-handoff audit done
(re-run `verify:local`, adversarially re-read the merged diff, fix
findings); §9 entry committed. Then reset to `origin/main` and continue with
`fable/prompts/opus-3-rental-pages.md` in this window (same model). Never
hand off with a red build or an unmerged PR.
