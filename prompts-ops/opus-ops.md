# Ops build — O1 then O2. Paste into ONE fresh OPUS session.

Read `fable-plan-ops.md` in full FIRST, then `CLAUDE.md` (its domain table
and the i18n, caching, facets, geo and migrations sections are law), then
`fable/plan.md` §4 (autonomy protocol). You execute plan §4.1 (O1) and then
§4.2 (O2). Fable is not involved; do not spawn Fable for anything.

Session rules:
- `git fetch origin main && git reset --hard origin/main` before each phase.
  O1 branch `claude/ops-o1-guardrails`; O2 branch `claude/ops-o2-operaciones`
  from the main that contains merged O1.
- `npm install`, `npm run hooks:install`, and `npm run verify:local` before
  every push. Never `--no-verify`. Never create `.github/workflows/`.
- If Docker is available: `docker compose up -d && npm run db:migrate` and
  run every script's `--dry` form against it, plus `verify:scopes` in O2. If
  not, say so in the phase log; do not claim a run you did not do.
- Never write `propia.com.py`, a placeholder email, or an invented number.
- `AGENTS.md` must be readable by Codex with no other file: self-contained
  rules, pointers to `CLAUDE.md` sections by heading for history only.

O1 (plan §4.1): guardrails, `AGENTS.md`, `src/lib/ops/` runners, `--dry` on
every writing script, `db:push` removed, `.env.example` and `README.md`
corrected. No `src/db/**`, no schema. Autonomous merge when green
(docs + script flags). Write `docs/log/o1-ops.md` and the §9 entry.

O2 (plan §4.2): ONE migration (`ops_runs`, `posts.locale`, `site_settings`),
`/admin/operaciones`, the health section on `/admin`, `esPanel` keys, cache
revalidation after non-dry runs. PR title starts `MIGRATION REQUIRED —`.
**Open the PR and stop. Never merge it.** Write `docs/log/o2-ops.md` with
the exact runbook for Anton (`db:status --probe` → `db:migrate` →
`db:status`) and note in the PR body that the Sonnet prompt
(`prompts-ops/sonnet-ops.md`) must only start after that runbook is done.

Exit report to Anton, in the chat: O1 PR link (merged), O2 PR link (open),
what was verified locally and what was not, and the §7 checklist items that
are now due.
