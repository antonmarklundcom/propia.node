# Phase S1 — images and redirects. Paste into a fresh SONNET session, ONLY after O1–O3 are merged. First of three Sonnet phases in this session.

Read `fable/plan-rentparaguay.md` FIRST, in full — plus §9 and
`fable/KNOWN-ISSUES.md` — then `docs/style/rentparaguay.com.md` (O2's
guide) and `CLAUDE.md` backlog item 1 (R2 is the *listing-photo* pipeline;
these are ordinary static files — do not confuse the two). Execute plan §6.1
under the autonomy protocol §4.

Sonnet hard limits (plan §6): no `schema.ts`, no `src/lib/auth/**`, no
`src/db/**`, no `src/lib/crm.ts`, no `src/lib/import/**`, no cache keys, no
`verticals.ts`, `alternates.ts`, `origin.ts`, `sections.ts`, `themes.ts`.

Owns: `public/img/rental/**`, `next.config.ts` (`redirects()` only),
`docs/style/rentparaguay.com.md` (the provenance table), `fable/KNOWN-ISSUES.md`,
plan §9.

Phase rules:
- Reset to `origin/main`, branch `claude/fable-s1-rental-assets`.
- Load skill `propia-dev`; `webimg-pipeline` only for its naming/alt
  conventions — conversion runs locally with `sharp` (a dependency) in a
  throwaway script that is not committed.
- Plan Appendix B is the whole list: those slots, those sources, nothing
  else. Longest edge 1600 px, WebP ~q80, ≤ 250 KB (`-2` ≤ 180 KB). Nothing
  from the excluded list enters `public/`. Do not generate images.
- The set must match what the code references: `grep -rho
  "/img/rental/[a-z0-9-]*\.webp" src app | sort -u` equals
  `ls public/img/rental`. A slot the code references but the table lacks →
  `fable/KNOWN-ISSUES.md`, not an invented file.
- Provenance table in the guide: `higgsfield` / `paraguay-stock` /
  `generic-stock` per file, decided by looking at the file. The PR body
  repeats the `generic-stock` list as the founder's regenerate-or-keep call.
- Redirects per plan Appendix A: `permanent: true`, host-scoped with `has`
  to `rentparaguay.com` and `www.rentparaguay.com`, trailing slash and not.
  Nothing else in `next.config.ts` changes.
- Verify with `npm run build && npm run start` + `curl -I -H "Host:
  rentparaguay.com" <old>` for every row (3xx to the new path) and one old
  path on `Host: inmobiliaria.com.py` (404).
- Re-runnable; minor issues → `fable/KNOWN-ISSUES.md`; stop only per §4.4.

Exit: `npm run verify:local` green; the grep/ls equality holds; the twelve
curl checks pass and are listed in the PR; PR merged green.

## After this phase — S2 in this same session
Gates: PR merged; exit list passed; pre-handoff audit done (re-run
`verify:local`, adversarially re-read the merged diff, fix findings); §9
entry committed. Then reset to `origin/main` and continue with
`fable/prompts/sonnet-2-rental-copy.md` in this window (same model). Never
hand off with a red build or an unmerged PR.
