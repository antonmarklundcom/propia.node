# O2 (ops) — the operations page, the health panel, one migration

Phase O2 of `fable-plan-ops.md` (§4.2). Branch `claude/ops-o2-operaciones`.
**PR open, not merged** — this is the one phase a session never merges.

> **Read the runbook at the bottom before merging.** This PR adds a column to
> `posts`, and `src/lib/post-queries.ts` selects every column of that table by
> name. From the moment this code is on `main` and deployed, `/admin/guias` and
> every post read 500 until the migration has run. Merge and migrate in the same
> window, migration first if you can.

## What this phase adds

**`/admin/operaciones`** — the jobs that used to need a terminal, an
IP allowlisted in hPanel Remote MySQL, and the write credential exported in a
shell. Ten cards, each the same two presses:

1. **Simular** runs the real job with `dry: true` and shows the counts, the
   notes and the duration.
2. **Ejecutar** appears only after a simulation of that job, and runs the same
   function with `dry: false` behind a confirm.

Both presses write an `ops_runs` row. Changing a limit clears the simulation —
a preview computed for 25 rows is not a preview of 500, and leaving it next to
an enabled button would be the one lie this design exists to prevent.

Two things are deliberately **not** buttons, and `app/admin/operaciones/jobs.ts`
says so where somebody would go looking:

- **`db:migrate`** (and `db:status -- --probe`). Applying DDL to production is a
  decision made after reading `db:status`, on a machine holding the owner
  credential — not a click a mis-scroll can reach.
- **`import:csv`.** `/admin/importar` already does that with an upload, a
  permission attestation and a rollback log, none of which this page can collect.

**A "Salud del sitio" section at the top of `/admin`**, computed on demand
(`src/lib/health.ts`, `unstable_cache` for five minutes, deliberately untagged —
nothing "changes the health" in a way a writer could announce). It answers the
questions nothing else in the app will ever raise: schema drift and pending
migrations, published listings with no map position / no photo / no English,
leads whose route was silently truncated, when each cron last ran, and which
build is live. Silence is the success state: with nothing wrong it is one line,
so a line appearing means something. Every finding links to the page that fixes
it.

**The migration**, `drizzle/0014_shiny_nehzno.sql` — the only one in this plan:

| Change | Why |
| --- | --- |
| `ops_runs` | The audit trail. Dry runs are recorded too: "who pressed Simular, saw 4 000 cuotas about to change, then pressed Ejecutar" is one story in two rows. `job` is a varchar, not an enum, so a new job never needs a migration to be auditable. |
| `posts.locale` `enum('es','en') NOT NULL DEFAULT 'es'` | `/guias` was the one page type with no language: the three English guides appeared, in English, in the Spanish door's index and sitemap. **O2 only adds the column** — S2 sets it in the editor and filters `/guias` and the sitemap by it. |
| `site_settings` | `key`/`value`/`updated_at`/`updated_by`. Empty until S3. Overrides an env var, never replaces one: no rows = today's behaviour exactly. |

No index churn: `posts` keeps `idx_status_published` untouched, because the
locale filter is an equality on a two-value column over a dozen rows and
dropping/recreating an index on production buys nothing.

## Things worth knowing before reviewing

- **The runners are unchanged.** O2 adds no job logic: `app/admin/operaciones/jobs.ts`
  maps a job id to the `run<Job>` O1 extracted, and the action passes `dry`
  through. That is the point of the split — the preview and the write are the
  same function.
- **The cache drop lives in the action, not the runner** (§4.2 item 4). A runner
  cannot call `revalidateTag` (under `tsx` there is no cache handler), so
  `runOpsJob` calls `revalidateListings()` after a non-dry run of a job in
  `JOBS_THAT_CHANGE_LISTINGS`. `cron:medians` is not in that set on purpose:
  `market-medians` is the one tag with no writer.
- **`requireSuperAdmin()` is re-invoked inside the action.** A server action is a
  public endpoint; the guard is not inherited from the page that rendered the
  button. The `job` string from the browser is looked up in the catalogue rather
  than used to build anything, and `limit` is clamped server-side — a form field
  is not a money guard.
- **`seed:financing` does not chain `cron:cuotas`.** One card is one job and one
  audit row, and a simulated seed cannot honestly preview cuota changes whose
  rates are not written yet. The card says which job to run next instead
  (`FOLLOW_UP_JOB`). S1's editor is the one place that chains, per §1.11.
- **Timestamps are formatted on the server.** Formatting the same instant in Node
  and again in the browser is a hydration mismatch: the two ICU versions disagree
  about the space before "p. m." (U+202F vs U+0020). This was observed as React
  error #418 on the first render after a job had run, and fixed by passing the
  finished string. All panel timestamps are pinned to `America/Asuncion`.
- **`readDatabaseStatus()` tolerates a missing `drizzle/`.** `output: "standalone"`
  copies only what Next can trace, and the journal is read from a runtime path, so
  a deployed server may not have it. The health panel then says the migration list
  is unavailable — never "0 pending" — while the drift diff, which needs no files,
  still runs. **Check on the first deploy which of the two you get.**

## What was verified, and how

The local database is **MariaDB 10.11**, not MySQL 8 — Docker Hub blob fetches
are blocked in this sandbox, so `mysql:8.4` could not be pulled. Read the results
with that substitution in mind.

- `npm run verify:local` — green.
- `npm run verify:scopes` — green, all checks.
- `npm run db:migrate` applied `0014` cleanly on top of 0000–0013;
  `npm run db:status` then reported **15 applied, 0 pending, `No drift`**.
- **The page was driven in a real browser** (headless Chromium, logged in as a
  super-admin), not just typechecked:

  | Check | Result |
  | --- | --- |
  | "Ejecutar" before any simulation | disabled |
  | after "Simular" | enabled |
  | dry counts vs. real counts, `cron:cuotas` | identical (`avisos 4 · cambian 0 · sin cambio 4`) |
  | after the real run | disabled again — a new simulation is required |
  | `cron:translate` with the limit field emptied | refused server-side: "Poné un máximo para esta corrida." |
  | `cron:fx`, whose API this sandbox blocks | card showed `open.er-api.com returned HTTP 403`; the card's own "última corrida" line then read **falló** |
  | `backfill:images` with no R2 configured | reason shown, Ejecutar unavailable, Simular still offered |
  | hydration errors on `/admin`, `/admin/importar`, `/admin/propiedades`, `/admin/operaciones` | clean (after the timestamp fix above) |

- **The `ops_runs` rows were read back from the database afterwards** and are what
  they should be: one row per press, the user id on every row, `dry` 1 and 0,
  `ok = 1` for the successes and `ok = 0` with `{"error":"open.er-api.com
  returned HTTP 403"}` for the failure.
- The health section rendered real findings against the local data (3 published
  listings with no photo, 4 of 4 with no English copy), the last-run line per job,
  and the deployed build — which correctly showed O1's merge commit and the build
  timestamp.

### Not verified

- **Nothing was run against production**, by design: an agent holds a read-only
  credential and cannot reach Hostinger's MySQL at all.
- **`cron:fx`'s success path** — the sandbox blocks `open.er-api.com`, so only its
  failure path was exercised (which was useful in its own right).
- **The deployed-build stamp on Hostinger.** `next.config.ts` reads
  `HOSTINGER_GIT_COMMIT ?? GIT_COMMIT ?? VERCEL_GIT_COMMIT_SHA`, then falls back to
  `git rev-parse`, then to null. Locally the git fallback works. If Hostinger's
  build has neither a commit env var nor `.git`, the panel will say
  "desconocido" — which is the intended degradation, not a bug, but worth a
  glance on the first deploy.
- **Whether `drizzle/` survives into the standalone output on Hostinger** — see
  above. Either outcome is handled; only one of them shows migration numbers.

---

## The runbook — Anton, in this order

This is the whole of it. Nothing else in this PR needs a manual step.

**Before merging**, run `db:status` against production and read it:

```bash
export DATABASE_URL="mysql://<prod-user>:<pass>@<host>:3306/<db>"   # bash
$env:DATABASE_URL = "mysql://<prod-user>:<pass>@<host>:3306/<db>"   # PowerShell

npm run db:status -- --probe
```

You are looking for two things:

1. **The pending list.** `0012` (`fx_rates`) and `0013` (`lead_matches` + four
   `agents` columns) are on `main` and nobody has ever recorded whether they are
   applied. If they are pending, `db:migrate` will apply them **along with**
   0014 — read them first (they are additive, one new table each plus four
   nullable columns).
2. **`No drift`.** If the drift section names a missing column *before* this
   merge, that column is already 500ing a page tree in production and is more
   urgent than this PR.

**Then merge, and migrate in the same window:**

```bash
npm run db:migrate     # applies 0014 (and anything else still pending), in order
npm run db:status      # must print: No drift
```

**Why the window matters, concretely.** `src/lib/post-queries.ts` uses
`db.select().from(posts)`, which names every column in `schema.ts` — including
`locale`. On a database without that column, `/admin/guias` and every post read
throw. The same standing hazard as 0010 and 0011 before them: deployed code
selects every column, so a database behind on migrations is a 500 on a page
tree, not a missing feature.

`0014` itself is two `CREATE TABLE`s, one additive `ALTER TABLE … ADD` with a
`NOT NULL DEFAULT 'es'`, and two `CREATE INDEX` on the table it just created. No
data is touched, nothing is dropped, and re-running it is safe (drizzle skips
what it has recorded).

**After `No drift` prints, and only then**, the Sonnet phases may start: paste
`prompts-ops/sonnet-ops.md` into a fresh Sonnet session. S1–S3 branch from a
`main` that contains this PR *and* on which you have confirmed `No drift` —
S1 writes `financing_programs` and calls `runCuotas`, S2 sets `posts.locale`,
S3 writes `site_settings`, and all three assume 0014 is applied.

Also still open, unchanged by this phase:
`NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py` on Hostinger + rebuild
(`CLAUDE.md` backlog 2), the read-only MySQL user (`fable-plan-ops.md` §7), and
the hPanel cron schedule — which is now worth doing precisely because a missed
cron shows up on `/admin` as a stale "última corrida" instead of being invisible.
