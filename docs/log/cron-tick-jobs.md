# Hourly tick runs translate, geo and sessions — 2026-09-27

Stacked on #226 (`src/lib/cron-tick.ts`, `app/api/cron/tick/route.ts`).

## Why

- `cron:translate` has never run on production, so `realestateinparaguay.com`
  shows the Spanish fallback for every listing. A job that needs someone to
  remember it does not run.
- The account hits Hostinger's 200 "Max Processes" cap. Every hPanel cron entry
  starts a new `tsx` Node process; the tick runs inside the web process that is
  already up. Moving routine jobs onto the tick removes processes rather than
  adding them.

## What landed

- **`translate`** on every tick, last in the list: at most **15 rows
  attempted** (failures count against the cap) and a **35 s budget** for the
  whole run (`TranslateOptions.deadlineMs`). When the budget runs out, the call
  in flight is aborted (that row keeps its old hash and is retried next hour)
  and no further candidate is scanned. With neither `GEMINI_API_KEY` nor
  `ANTHROPIC_API_KEY` set the tick returns `"skipped: no key …"` and writes no
  `ops_runs` row — an error row every hour for a switched-off feature would
  bury real failures. Drops the listing caches only when a row was translated.
- **`geo`** and **`sessions`** once a day: skipped while `ops_runs` holds a
  successful real run of that job from the last 20 h (`lastSuccessfulRunAt()`
  in `src/lib/ops/runs.ts`). A failed run does not count, so it retries next
  tick; a button press on `/admin/operaciones` counts, since it did the same
  work. `geo` drops the listing caches only when a position was stale.
- **Overlap guard**: a module-level `Set` of running task names, so a slow tick
  and the next one (or a manual POST) never run the same task at once. One web
  process only — it does not see the CLI, the admin button or a second Node
  process; the jobs tolerate that overlap, as they always had to.
- **Translate deadlines** (process-audit candidate 2): the per-call deadlines
  were already in place (Gemini fetch 30 s, Claude client 45 s with one retry)
  and the cap already counted attempts and stopped scanning; they are now named
  constants, and a caller's `signal` joins both (`AbortSignal.any`) and stops
  the Gemini → Claude fallback once the budget is spent.
- **Not on the tick, on purpose** (comment at the top of `cron-tick.ts`):
  `cron:fx` (would overwrite the founder's manual 6000 rate), `cron:cuotas`
  (placeholder AFD rate), `cron:resync` (pauses listings), `backfill:images`
  (waits on R2).

No schema change; no new env var.

## Verified

- `npm run verify:local` green.
- Local MariaDB 11.8 (`propia_cron`, migrated + `seed:locations`), a throwaway
  tsx script calling `runCronTick()` with no provider key: tick 1 ran geo and
  sessions (purged one planted expired session) and returned
  `translate: "skipped: no key …"`; tick 2 returned
  `"skipped: ran 0 min ago (once a day)"` for both; two concurrent ticks each
  skipped the task the other was running. `ops_runs` had exactly one geo and one
  sessions row and no translate row.
- `runTranslate` with `fetch` stubbed (no provider reached): 20 published
  listings → dry run and real run both stop at 15, a second run does the other
  5; a provider that never answers is aborted at a 2 s budget with one row
  counted under `fallaron` and nothing further scanned — for Gemini and for
  Claude alone.
- `next start` of the production build with the same `fetch` stub preloaded,
  POST `/api/cron/tick` with the bearer: translate ran 15 rows through the
  route, including the cache revalidation.

## Not verified

- No real Gemini or Claude call; no production database.

## Founder steps

1. Set `GEMINI_API_KEY` (and/or `ANTHROPIC_API_KEY`) in hPanel. No rebuild is
   needed for a server-only var, but the app must restart to read it.
2. After the first ticks show `cron:translate` rows in `/admin`'s health box,
   delete the hPanel cron entries for `cron:translate`, `cron:geo` and
   `cron:sessions` (if any exist) — each one is a Node process the tick no
   longer needs.
