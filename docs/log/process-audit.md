# Process audit — 2026-09-13

Read-only inspection of checkout `dc60f4c`. Only this report was written. No jobs, DB calls, build, tests, install, or Git mutations were run. Findings describe this checkout, not a verified production process tree.

The leading hypothesis is overlapping or unfinished cron runs, not completed jobs retained by MySQL: all seven cron wrappers call `runCli`, which explicitly calls `process.exit()` on success and failure (`scripts/ops-cli.ts:105–111`). This is forced termination, not graceful pool shutdown, but it prevents the suspected post-completion accumulation. Processes still awaiting work are live/stuck processes, not OS zombies.

## Candidates

1. **Overlapping cron invocations and launcher overhead — high, conditional on hPanel timing.** `package.json:21–27` defines `cron:cuotas`, `cron:medians`, `cron:resync`, `cron:geo`, `cron:translate`, `cron:sessions`, and `cron:fx`, each as a separate `tsx` invocation. There is no scheduler, lock, or whole-job deadline in `scripts/ops-cli.ts:93–112` or `src/lib/ops/types.ts:92–114`. Every job can overlap itself if its next scheduled invocation arrives before completion. Each invocation adds a Node runtime and launcher overhead; tsx/esbuild can add helper processes/threads (installed `node_modules/tsx/dist/cli.mjs:2`, `node_modules/esbuild/lib/main.js:2268,2440`). Exact live counts are unknown. Docs propose nightly jobs (`fable-plan-ops.md:226`) and daily FX (`README.md:204`), not an enforceable schedule.

2. **Translation can stay unfinished for a long time — high if scheduled with pending rows.** DeepL and Gemini fetches lack explicit abort deadlines (`src/lib/translate.ts:158–172,299–312`); Claude creates a client per row without explicit timeout/retry settings (`src/lib/translate.ts:359–365`). Provider fallback is sequential (`src/lib/translate.ts:434–436`). The CLI permits an unlimited batch (`src/lib/ops/translate.ts:120`); its limit counts successes, so failures can attempt the entire candidate set (`:145–168`), and it keeps scanning after the limit (`:131–135`). This retains the cron runtime and its pool while awaiting work; it does not spawn a process per row. SDK/transport defaults may eventually fail a call, but the application supplies no total run bound.

3. **Sharp native threads during uploads/backfill — medium, workload dependent.** `src/lib/images.ts:18,63,81–84` invokes Sharp and processes full/thumb derivatives concurrently, without setting Sharp concurrency. Libvips threads and libuv workers are real thread demand (installed `node_modules/sharp/lib/index.d.ts:105–111`). Backfill is sequential per image (`src/lib/ops/backfill-images.ts:106–119`), but simultaneous uploads/backfills multiply work. Callers include `src/lib/listing-images.ts:152` and `app/admin/guias/actions.ts:143`. This is thread pressure, not a child process per image; whether the hosting quota counts these threads needs verification.

4. **Unbounded image backfill and R2 waits — medium if configured/running.** `src/lib/ops/backfill-images.ts:73–89` loads all image rows and defaults to all pending images. Downloads have a 20-second abort (`:49–56`), but Sharp and the two R2 uploads have no application-level deadline (`:108–112`; `src/lib/r2.ts:57–64,87–95`). The cached S3 client retains reusable networking resources during the run. There is no per-row DB connection/process creation or transaction held across downloads. Explicit CLI exit still ends completed runs.

5. **Admin jobs overlap and hold requests open — medium when used.** `app/admin/operaciones/actions.ts:75–79` awaits the runner inside the web process; it does not launch tsx. `jobs.ts:128,174` wires translation/backfill directly to their runners. The 500-row UI ceiling (`actions.ts:72`) is not a time bound. `src/lib/ops/runs.ts:39–45` inserts an audit row, not a lock; multiple clients and cron can overlap. O1 (`docs/log/o1-ops.md:9–11`) and O2 (`docs/log/o2-ops.md:60–67`) describe this shared-function design. Under the stated single `next start` deployment, another request does not itself create another OS process; it adds in-flight work and possibly native image threads.

6. **DB waits and retained sockets amplify unfinished runs — medium for duration, low as a direct process source.** `src/db/index.ts:22–45` creates one pool per module instance: six connections, six max-idle, 30-second idle timeout, queue of 24, eight-second connection-establishment timeout. Neither queue waiting nor query execution has an explicit deadline here. The installed mysql2 implementation starts idle eviction only when `maxIdle < connectionLimit` (`node_modules/mysql2/lib/base/pool.js:50–52`), so the configured 30 seconds does not establish actual eviction with 6/6. The pool is not ended/exported, but completed CLIs explicitly exit. Six DB sockets are not six local OS processes; separate cron runtimes each have their own pool. Pool comments about Passenger/per-request processes are not proof of the founder's current deployment topology.

7. **Config-time Git subprocess — low.** `next.config.ts:30–32,46` executes `git rev-parse` through a shell when commit environment metadata is absent. Config evaluation can occur at server startup as well as build time. Normally this is a brief shell/Git invocation, not recurring per-request work; it has no explicit timeout.

## Smallest fix per candidate

1. In hPanel, stagger jobs and use a nonblocking per-job lock plus a whole-process-tree runtime limit, if supported. Preserve the FX-before-cuotas order; use bounded translation/image batches.
2. Add fetch abort deadlines and explicit SDK timeout/retry bounds; count attempted rows toward the limit and stop processing at the bound. Require a finite CLI batch limit.
3. Set `sharp.concurrency(1)` once in the image module and await the two derivatives sequentially. Measure actual hosting thread counts before changing global thread settings.
4. Supply `--limit` now; add an abort deadline to R2 sends and a processing deadline for Sharp. Page the initial query if scanning dominates measured duration.
5. Add a shared per-job exclusion mechanism covering both CLI and UI, released in `finally`; reduce long-job UI batches. An in-memory flag alone cannot exclude separate cron processes.
6. Leave `src/db/index.ts` unchanged. Start with the external cron runtime bound; if DB waiting is confirmed, scope cancellable query/acquire deadlines to the affected job. Do not merely race a promise and leave its query running.
7. Supply existing commit metadata in the environment, or add a short timeout to the Git fallback.

## Not the cause

- **Completed cron pools accumulating Node processes:** all seven cron wrappers and image backfill use explicit success/error exits; no missing-exit path after settled jobs was found (`scripts/ops-cli.ts:105–111`).
- **Other DB CLIs:** `check-migrations.ts:246–250`, `create-user.ts:75–80`, and `seed-guias-en.ts:166–171` explicitly exit; migration-reader connections close in `finally` (`src/lib/ops/migrations.ts:317–318`).
- **Custom process farms/watchers:** no child-process, worker-thread, server-listener, watcher, or recurring timer implementation was found in app job/script source; the Git config fallback and dependency launchers are separated above.
- **Development servers in production start:** `package.json:10–17` separates `next dev` and `db:studio` from `start: next start`; no production chaining to them.
- **Experimental worker/output configuration:** `next.config.ts:57–68` sets standalone packaging and an 8 MB server-action body limit, not extra runtime workers or a second server.
- **MapLibre:** browser-only dynamic imports use `ssr: false` (`src/components/ListingMapLazy.tsx:11–12`, `CategoryMapLazy.tsx:10–12`); map workers run on the visitor's device.
- **Playwright/Puppeteer:** no application/script runtime use or direct package dependency found; O2's headless-browser mention describes historical testing.
- **Recurring browser timer:** `src/components/publish/PublishWizard.tsx:203` is a client cooldown interval with cleanup, not a hosting timer.
- **Middleware:** `middleware.ts:18–69,72–80` only computes redirects/headers; no I/O, pool, scheduler, or spawn. No Node runtime override is declared (default Edge middleware), not a separately configured deployment.
- **Normal public image rendering:** no `next/image` import found; cards use direct image URLs (`src/components/ListingCard.tsx:80`). Next's image optimizer remains configured/reachable, so unsolicited `/_next/image` traffic is not ruled out.
- **FX fetch:** already aborts after 15 seconds (`src/lib/ops/fx.ts:28,38–39`); subsequent DB work remains subject to candidate 6.

## Flagged or not done

- hPanel cron expressions, commands, working directory, duplicate entries, locks, timeout support, process/thread counts, quota accounting (processes versus entry processes), and live runtimes were not inspected. Confirm whether old command paths or deployments differ from this checkout.
- README's `npx tsx scripts/<job>.ts` example (`README.md:171–174`) omits the scripts tsconfig used by npm commands; that config supplies the `server-only` shim. Verify actual hPanel commands use the package scripts' configuration.
- `ops_runs` is written by admin actions, not `runCli`; UI history alone cannot establish cron completion or frequency despite the docs' broader claims.
- No production access, credential reads, process sampling, network research, runtime experiments, typecheck, or build. Installed dependency code supports the implementation observations; deployed versions/platform may differ.
- `prompts-site-quality/NEXT-SESSION.md` appeared untracked during inspection and was left untouched. No commit, push, PR, branch switch, or reset; only this report was created.
