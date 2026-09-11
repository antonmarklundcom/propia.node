# Quality build — Q-O1, Q-O2, Q-O3. Paste into ONE fresh OPUS session.

Read `fable-plan-quality.md` in full FIRST (Part 1 is the report; §1, §3, §4
and the phase table are what you execute), then `AGENTS.md` (every rule in it
is binding), then `CLAUDE.md`'s "CI", "i18n", "Caching" and "Import pipeline"
sections. You execute plan §4.1 (Q-O1), then §4.2 (Q-O2), then §4.3 (Q-O3).
Fable is not involved; never spawn Fable for anything.

Session rules:
- `git fetch origin main && git reset --hard origin/main` before each phase.
  Branches: `claude/q-o1-test-lint-gate`, `claude/q-o2-lead-loop`,
  `claude/q-o3-d10-manual-edit`, each cut from the main that contains the
  previous merged phase.
- `npm install`, `npm run hooks:install`, `npm run verify:local` before every
  push. Never `--no-verify`. Never create `.github/workflows/`.
- Tests are pure (`node:test` via `tsx --tsconfig scripts/tsconfig.json
  --test`, plan §1.2); inject `now` rather than faking `Date` (§1.3). No new
  test framework, no database in `tests/`.
- ESLint per §1.4: a rule flagging more than ~30 sites becomes `warn` with a
  counted comment; nothing is disabled silently; no `--fix` sweep past what a
  rule flagged.
- Never write `propia.com.py`, a placeholder email, an invented number, or a
  log line that pretends a message was delivered.
- If Docker is available, run every DB-touching check against it; if not, say
  so in the phase log and the PR. Never describe a run you did not do.
- Stop-and-ask = append to `docs/decisions-needed.md`, commit, push, end.

Q-O1 (plan §4.1): `tests/**` with the nine test files named, `verify:unit`
and `lint` wired into `verify:local` and `.githooks/pre-push`, `AGENTS.md` §2
and `CLAUDE.md` "CI" updated. Tooling only — no schema, no auth. **Merge when
green.** Write `docs/log/q-o1.md` and the §9 line.

Q-O2 (plan §4.2): `alertOwner()` on the existing webhook inside the lead
route's `after()`; `tasacion` push moved into `after()`; honeypot in the five
forms + route; `/mis-avisos` new-leads badge; `routedTo` extracted to
`src/lib/lead-routing.ts` and tested. Request path, not auth. **Merge when
green.** Write `docs/log/q-o2.md` and the §9 line.

Q-O3 (plan §4.3): `listings.manually_edited_at`, one migration, the
`kept_manual` branch shared by `planImport` and `commitImport`, panel writers
stamp it, one pure case + one DB round trip in `verify-import.ts`. PR title
starts `MIGRATION REQUIRED — Q-O3 (D10)`. **Open the PR and stop. Never merge
it.** The body carries the runbook (`db:status --probe` → `db:migrate` →
`db:status`, same sitting as the merge). Write `docs/log/q-o3.md` and the §9
line.

Exit report to Anton, in the chat: the three PR links (two merged, one
open), what was verified locally and what was not, and that the Sonnet
session (`prompts-quality/sonnet-quality.md`) may start now — it does not
wait for Q-O3's migration.
