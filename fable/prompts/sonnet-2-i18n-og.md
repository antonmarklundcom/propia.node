# Phase S2 — i18n and OG on profile, project and category pages. Paste into a fresh SONNET session, ONLY after S1 is merged.

Read `fable/plan.md` FIRST, in full — plus §9 and `fable/KNOWN-ISSUES.md` —
then the i18n section of `CLAUDE.md`. Execute plan §6.2 under the autonomy
protocol §4. `fable/REVIEW.md` R7 and R8 are the findings with file:line.

Sonnet hard limits (§4.7): no `schema.ts`, no `src/lib/auth/**`, no
`src/db/**`, no `src/lib/crm.ts`, no `src/lib/import/**`, no cache keys.

Phase rules:
- Reset to `origin/main`, branch `claude/fable-s2-i18n-og`.
- Load skill `propia-dev` before editing.
- Every Spanish string stays byte-identical; English is translated for
  foreign buyers the way `en.ts` already does, never invented facts.
- `es.ts` key ⇒ `en.ts` key in the same commit. Read through `dict()`; never
  import a namespace into a page. `src/i18n/index.ts` must not gain a
  `next/headers` import, directly or transitively.
- Prove `verify:i18n` sees the new namespaces: remove one `en` key, watch it
  fail, restore it. Say so in the PR.
- Do not put the brand into a page `title` (the layout template adds it);
  do put it into `openGraph.title`.
- Re-runnable; minor issues → `fable/KNOWN-ISSUES.md`; stop only per §4.4.

Exit: `npm run verify:local` green; the three greps in plan §6.2 are empty;
the category template's `generateMetadata` returns an `openGraph` block; PR
merged green.

## After this phase — STOP and report (last phase)
Gates: PR merged; exit list passed; pre-handoff audit done; §9 entry committed.
Do not spawn anything. Closing report to Anton: the four PR links and their
state (O2 still awaiting his merge); `fable/KNOWN-ISSUES.md` contents; the
`fable/plan.md` §7 items still open, numbered as manual steps — starting with
`npm run db:status -- --probe` against production and the O2 merge decision.
