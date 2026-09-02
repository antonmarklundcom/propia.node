# Phase S1 — docs, ops and build truth. Paste into a fresh SONNET session, after O2's PR is open.

Read `fable/plan.md` FIRST, in full — plus §9 and `fable/KNOWN-ISSUES.md` —
then `CLAUDE.md` (its domain table is the source of truth for every domain you
write). Execute plan §6.1 under the autonomy protocol §4.

Sonnet hard limits (§4.7): no `schema.ts`, no `src/lib/auth/**`, no
`src/db/**`, no `src/lib/crm.ts`, no `src/lib/import/**`, no cache keys. This
phase changes documentation, `package.json:5`, and one dead line in
`next.config.ts` — nothing else in `src/` or `app/`.

Phase rules:
- Reset to `origin/main`, branch `claude/fable-s1-docs-ops`.
- Load skills `propia-dev` and `nextjs-deploy-hostinger` before writing the
  Hostinger sections.
- Never write a placeholder email or `propia.com.py` into any doc, and never
  add a file under `.github/workflows/`.
- The cron list is `package.json`'s `cron:*` scripts, nothing more, nothing
  less, with the two orderings §6.1 names.
- Q1 (package manager) answered in `fable/REVIEW.md` or your prompt → do
  exactly that branch of §6.1; unanswered → leave the pnpm/npm files alone and
  record the question in `fable/KNOWN-ISSUES.md`.
- Re-runnable; minor issues → `fable/KNOWN-ISSUES.md`; stop only per §4.4.

Exit: `npm run verify:local` green; `grep -rn "propia.com.py" README.md
package.json next.config.ts` prints nothing; every `cron:*` script in
`package.json` appears in README; the audit doc's F1 row reads FIXED; PLAN.md's
banner date and CLAUDE.md's safe-fetch bullet are current; PR merged green.

## After this phase — hand off to S2 (fresh session)
Four gates (§4.9): PR merged; exit list passed; pre-handoff audit done; §9
entry committed. Then `create_session`, inherited environment and permission
mode (never `plan`), `model` set explicitly to **Sonnet** (never Fable), prompt
exactly: `Read fable/prompts/sonnet-2-i18n-og.md in this repo and execute it.`
No `create_session`: continue in this window (same model).
