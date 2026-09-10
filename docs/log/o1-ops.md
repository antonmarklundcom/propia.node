# O1 (ops) — guardrails, `AGENTS.md`, and one runner per job

Phase O1 of `fable-plan-ops.md` (§4.1). Branch `claude/ops-o1-guardrails`.
Landed 2026-09-10.

## What this phase actually changed

Three things, in order of how much they matter.

**1. Every routine job now has one runner, and every writing job has `--dry`.**
`src/lib/ops/<job>.ts` exports `run<Job>(opts): Promise<OpsResult>`; the
`scripts/*.ts` file is a thin CLI over it. Eleven jobs moved:

| Job | Runner | `--dry` before | `--dry` now |
| --- | --- | --- | --- |
| `cron:cuotas` | `src/lib/ops/cuotas.ts` | no | counts what would change, names the first 10 |
| `cron:medians` | `src/lib/ops/medians.ts` | no | groups, and how many clear the 8-listing render floor |
| `cron:geo` | `src/lib/ops/geo.ts` | yes | unchanged shape |
| `cron:fx` | `src/lib/ops/fx.ts` | yes | unchanged shape |
| `cron:resync` | `src/lib/ops/resync.ts` | yes | unchanged shape (the sweep itself stays in `src/lib/import/resync.ts`) |
| `cron:translate` | `src/lib/ops/translate.ts` | yes | unchanged shape |
| `cron:sessions` | `src/lib/ops/sessions.ts` | no | counts expired rows with the DELETE's own predicate |
| `seed:financing` | `src/lib/ops/seed-financing.ts` | no | field-by-field rate diff per programme |
| `seed:locations` | `src/lib/ops/seed-locations.ts` | no | new / renamed / **centroid moved**, per node |
| `import:csv` | `src/lib/ops/import-csv.ts` | no | **is** `planImport` — the planner the real run commits |
| `backfill:images` | `src/lib/ops/backfill-images.ts` | `--dry-run` | `--dry`, with `--dry-run` still accepted |

`seed:guias-en` got `--dry` in place, with no runner, because S2 replaces that
script with `posts:upsert` over markdown files (`fable-plan-ops.md` §5.2) — the
flag is there so no writing script in the repo lacks one, not as a foundation.
`db:status`'s read-only half moved to `src/lib/ops/migrations.ts` as
`readDatabaseStatus()`, which is what O2's health panel reads; `--probe` stayed
in the script and is deliberately not reachable from the UI.

The `OpsResult` shape (`src/lib/ops/types.ts`) is
`{ job, dry, counts: Record<string, number>, notes: string[], durationMs }`, and
the invariant that makes it worth anything is that **`counts` means the same
thing in both modes**: a dry run reports the number a real run would change, not
zero. `scripts/ops-cli.ts` prints it in one shape for every job, so a cron mail
is readable across jobs.

There is deliberately **no `src/lib/ops/index.ts`**. A barrel would drag
`@aws-sdk/client-s3` (backfill) and `@anthropic-ai/sdk` (translate) into the
module graph of any page that wanted `runCuotas`.

**2. `AGENTS.md` is now the rules file.** Self-contained, at the repo root, so
Codex reads it natively with no other file: the domain and brand facts, the git
and merge gates, the two database credentials, the conventions that are
load-bearing (i18n, facets, caching, geo, SEO ownership, import), a
before-you-claim-done checklist, and the stop-and-ask list. `CLAUDE.md`'s
"Working agreements with the founder" section is now `@AGENTS.md` plus one
sentence saying why. `CLAUDE.md` keeps everything else — it is the state of the
world, `AGENTS.md` is the rules.

**3. The credential split is real, not just documented.** `DATABASE_URL` is the
read-only user an agent gets; `DATABASE_URL_RW` is the owner user that never
leaves Anton's machine. A writing CLI run picks `DATABASE_URL_RW ?? DATABASE_URL`
via `scripts/db-credential.ts`, imported **first** in every writing script —
`src/db/index.ts` builds its pool at module load and that file is off-limits, so
the choice has to be made before it is evaluated, and ES modules are evaluated in
the order their imports are declared. Moving that import below the runner import
silently restores the old behaviour; the comment in the file says so.

`db:push` is gone from `package.json`. `grep -rn "db:push"` now finds it only in
the plan text that asked for its removal.

## Three bugs found by actually running the scripts

None of these was in the plan. All three were pre-existing on `main`, and all
three had the same cause: **app code wrapped in `unstable_cache` throws
`Invariant: incrementalCache missing` when there is no Next.js runtime around
it**, and three documented commands reach such code.

1. **`npm run import:csv` failed before reading a single row.** `planImport`
   defaults its rate to `getUsdToPygRate()` (cached). Fixed twice over: the ops
   runner passes `usdToPyg` explicitly (which also guarantees the plan and the
   commit price a batch with the *same* number), and `getUsdToPygRate()` now
   falls back to the uncached read when `NEXT_RUNTIME` is unset.
2. **`npm run verify:import`'s database half died on its first plan.** Same
   cause. It now passes the rate explicitly, and its comment says why.
3. **`npm run verify:scopes` died partway through, at `updateListing`.** This is
   the one that matters most: it is the repo's only automated scope check, it is
   documented as *the* thing to run on any panel-query change, and it has been
   broken since the fx cache landed (2026-09-05) — for four days nobody could
   have run it to the end. Fixed by the `NEXT_RUNTIME` fallback in
   `src/lib/fx.ts`. It is now green end to end.

The fallback direction is safe: in a request that somehow lacked the flag, the
cost is one extra query, never a wrong number.

## What was verified, and how

A local database **was** available, but not the one `docker compose` describes.
Docker Hub blob fetches are blocked in this sandbox (`403 Forbidden` from the
registry CDN), so `mysql:8.4` could not be pulled; a **MariaDB 10.11** server was
installed locally instead and migrated with `npm run db:migrate`. Read every
result below with that substitution in mind.

- `npm run verify:local` — **green** (typecheck, build, `verify:import` pure half,
  `verify:facets`, `verify:i18n`, `verify:seo`).
- `npm run verify:scopes` — **green**, all checks, on the local database.
- `npm run db:status` — correct against the local database: 14 applied, 0 pending,
  `No drift`, and `leads.routed_to` reported as accepting `'owner'`.
  `db:status -- --probe` inserted and rolled back cleanly.
- **Every job's `--dry` form, run against the local database**, and for the four
  jobs where it is meaningful the real run too, then the dry form again to prove
  the preview matched:
  - `seed:financing` → dry said 2 new; real created 2; dry again said 2
    unchanged, 0 changes.
  - `seed:locations` → dry said 45 new; real created 45 with the parent chain
    intact (7 roots, children pointing at their parent's id); dry again said 45
    unchanged, 0 centroids moved.
  - `import:csv data/sample-listings.csv --agency=12` → dry planned
    4 created / 1 deduped / 1 skipped; the commit reported exactly that; a third
    dry run reported 5 unchanged.
  - `cron:cuotas` → dry said 2 of 4 listings change, and named them; the real run
    changed those 2; dry again said 0 change, 4 unchanged.
  - `cron:medians`, `cron:geo`, `cron:sessions`, `cron:resync`,
    `cron:translate --dry --limit 2`, `backfill:images --dry`,
    `seed:guias-en --dry` — all ran and reported sensibly.
- **`npm run cron:fx -- --dry` was NOT verified end to end.** Outbound HTTPS to
  `open.er-api.com` is blocked in this sandbox (403 from the proxy), so the job
  was only observed reaching the fetch and failing on it. Its DB half is
  unchanged from the code that has been running.
- **`verify:import`'s DB half has one failure, and it is the sandbox.** "rollback
  restored the old prices" fails on MariaDB because MariaDB stores `json` as
  `longtext`, so `mysql2` returns `previous_json` as a string and the rollback
  spreads a string instead of an object. On MySQL 8 the column is native JSON and
  `mysql2` parses it. Confirmed by inspecting the column type and the value's
  runtime type; recorded in `fable/KNOWN-ISSUES.md`, deliberately not "fixed".

## Deviations from the plan

- **`src/lib/fx.ts` was touched**, which §4.1's file list does not name. Two
  additive exports (`ENV_FALLBACK_USD_TO_PYG`, `getUsdToPygRateRaw()`) and the
  `NEXT_RUNTIME` fallback inside `getUsdToPygRate()`. Without it `verify:scopes`
  cannot finish, and O1's own exit criterion — every script's `--dry` runs —
  cannot be met for `import:csv`. No behaviour inside a request changes.
- **`scripts/verify-import.ts` was touched** beyond a `--dry` flag, for the same
  reason: it passes `usdToPyg` into its plan/commit calls.
- **`seed:guias-en` got no runner**, only the flag — see above.
- **`create-user.ts` got the credential import** although it is not in the job
  list: it always writes, so under a read-only `DATABASE_URL` it would fail
  confusingly.
- `src/lib/ops/migrations.ts` scopes its `leads.routed_to` lookup to the
  connection's own database (`table_schema = DATABASE()`), where
  `check-migrations.ts` searched every schema on the server and could report a
  different database's column. The printed output is otherwise the same.

## Anton's turn

Nothing in this PR needs a migration, an env var or a restart. Two items from
`fable-plan-ops.md` §7 are now due, and O2 wants the first one:

1. **Run `npm run db:status` against production and paste the output into the O2
   PR.** `drizzle/0012` (`fx_rates`) and `drizzle/0013` (`lead_matches` + four
   `agents` columns) are on `main` and **nobody has recorded whether they are
   applied.** If 0013 is not applied and the code is live, `/agente/*` and
   `/inmobiliaria/*` are 500ing right now, because drizzle names every column of
   `agents` in its SELECT. This is a two-minute read-only command and it is the
   one thing O2 needs before it can be merged safely.

   ```bash
   export DATABASE_URL="mysql://<prod-user>:<pass>@<host>:3306/<db>"
   npm run db:status
   ```

2. **Create a read-only MySQL user** in hPanel (SELECT on the production
   database), allowlist your PC's IP for it, and use it as `DATABASE_URL` when
   handing a connection to an agent. Keep the owner user as `DATABASE_URL_RW` on
   your machine only. Everything an agent needs — `db:status` and every `--dry`
   run — works with the read-only user, and with it there is no way for an agent
   to change a production row at all.

Still open from before this phase, unchanged by it:
`NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py` on Hostinger + rebuild
(`CLAUDE.md` backlog 2), and the hPanel cron schedule for the `cron:*` jobs —
which is now worth doing, because after O2 the same jobs are buttons and a
missed cron becomes visible on `/admin` instead of invisible.

## Where O2 looks first

- `src/lib/ops/types.ts` — `OpsJob` is the registry. `ops_runs.job` stores one of
  those strings; add `financing.edit` to it in S1 rather than inventing a name.
- `src/lib/ops/migrations.ts` — `readDatabaseStatus()` and `driftCount()` are the
  health panel's pending/drift numbers, already computed. It reads
  `drizzle/meta/_journal.json` and `drizzle/*.sql` from `process.cwd()`, so
  confirm those files exist on the Hostinger deploy before the panel depends on
  them.
- `src/lib/ops/backfill-images.ts` and `translate.ts` — the two jobs §1.8 says
  must take a mandatory `limit` in the UI. Both accept `limit` and both report
  what a run would spend before it spends it.
- The runners never call `revalidateListings()` and must not: under `tsx` there is
  no cache handler. Every runner's doc comment names the tag its caller owes after
  a non-dry run. That is O2 §4.2 item 4.
