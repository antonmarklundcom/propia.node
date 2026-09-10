# Ops build — S1, S2, S3. Paste into ONE fresh SONNET session, only after
# O2 is merged and Anton has confirmed `npm run db:status` prints `No drift`.

Read `fable-plan-ops.md` in full FIRST (its §9 must show O1 merged and O2
merged + migrated; if not, stop and say so), then `CLAUDE.md`, then
`AGENTS.md`, then `docs/log/o2-ops.md`. Execute plan §5.1, §5.2, §5.3 in
order, one PR each, each merged green before the next branch is cut.

Sonnet hard limits: no `src/db/schema.ts`, no `drizzle/**`, no
`src/lib/auth/**`, no `src/db/**`, no `src/lib/crm.ts`, no
`src/lib/import/**` beyond what §5 names, no new cache keys without a
`revalidate*` writer. If a phase seems to need a column, stop and write the
question to `docs/decisions-needed.md`.

Session rules:
- Reset to `origin/main` before each branch: `claude/ops-s1-financiamiento`,
  `claude/ops-s2-guias-locale`, `claude/ops-s3-configuracion`.
- `npm install`, `npm run hooks:install`, `npm run verify:local` before every
  push; `verify:seo` must stay green in S2. Never `--no-verify`.
- Staff-surface copy goes in `esPanel` only; anything a visitor sees (S2's
  guide pages, S3's footer) goes through the dictionary in `es.ts` AND
  `en.ts` in the same commit.
- Financing edits must call `runCuotas({ dry: false })` in the same action
  (plan §1.11). Settings read through `getSetting` with the env fallback
  (plan §1.10); never delete an env constant.
- Never invent a rate, a fee or a number. Never write `propia.com.py`.
- Each phase ends with `docs/log/s<N>-ops.md` and a §9 entry in
  `fable-plan-ops.md`. After S3: STOP, report the three PR links and what
  was not verified.
