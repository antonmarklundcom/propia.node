/**
 * The hourly tick (docs/plan-agency-2026-09-26.md batch 4): the Cloudflare
 * Worker's cron trigger POSTs `/api/cron/tick` once an hour, and this runs
 * every scheduled task in order. One request an hour, nothing per visitor —
 * Hostinger's limit is processes, and a timer inside the app would need one
 * alive all the time. It is also why maintenance jobs belong here rather than in
 * hPanel's cron: every hPanel entry starts a fresh `tsx` Node process against
 * the shared 200-process cap, while the tick runs inside the web process that is
 * already up (docs/log/cron-tick-jobs.md).
 *
 * Add a task by appending to `TASKS`. Each runs in its own try/catch, so one
 * that throws is reported and the rest still run. A task that is an ops job
 * goes through `recorded()`, which writes the same `ops_runs` row a button on
 * /admin/operaciones does (with no user), so `/admin`'s health box shows when
 * the tick last ran it and whether it failed. A task that has nothing it may
 * do (no key, already ran today, already running) returns a `"skipped: …"`
 * string and writes no row — an error row every hour for a feature that is
 * simply switched off would bury the real failures.
 *
 * **Deliberately NOT on the tick** — each needs a person, not a clock:
 * - `cron:fx`: the founder sets a manual USD→PYG rate (6000); an automatic
 *   fetch would overwrite it.
 * - `cron:cuotas`: the AFD rate it multiplies by is a placeholder awaiting a
 *   founder decision (CLAUDE.md backlog 6) — scheduling it spreads wrong money.
 * - `cron:resync`: it pauses listings on its own judgement; run it by hand,
 *   `--dry` first.
 * - `backfill:images`: waits on the R2 bucket (backlog 1 and 5).
 */
import "server-only";
import { runFeaturedReminders } from "@/lib/ops/featured-reminders";
import { runPartnerReminders } from "@/lib/ops/partner-reminders";
import { runAnalytics } from "@/lib/ops/analytics";
import { runGeo } from "@/lib/ops/geo";
import { runLiveCheck } from "@/lib/ops/live-check";
import { runSessions } from "@/lib/ops/sessions";
import { runTranslate } from "@/lib/ops/translate";
import { finishOpsRun, lastSuccessfulRunAt, startOpsRun } from "@/lib/ops/runs";
import type { OpsJob, OpsResult } from "@/lib/ops/types";
import { isEmailConfigured } from "@/lib/email";
import { isTranslationConfigured } from "@/lib/translate";
import { revalidateListings } from "@/lib/cache";

interface CronTask {
  name: string;
  run: () => Promise<OpsResult | string>;
}

/**
 * Translation per tick: at most this many rows attempted (successes and
 * failures alike), and never longer than this budget — the Worker gives the
 * whole tick 60 s, and the other tasks run first. 15 rows an hour is 360 a day,
 * which clears a backlog of a few thousand listings in about a week and then
 * idles at a handful of edits.
 */
const TRANSLATE_PER_TICK = 15;
const TRANSLATE_BUDGET_MS = 35_000;

/** "Once a day" = no successful real run in the last 20 h. */
const DAILY_MS = 20 * 60 * 60 * 1000;

/** Run an ops job with its `ops_runs` audit row, like /admin/operaciones does. */
async function recorded(job: OpsJob, run: () => Promise<OpsResult>): Promise<OpsResult> {
  const id = await startOpsRun({ job, dry: false, userId: null });
  try {
    const result = await run();
    await finishOpsRun(id, { ok: true, result });
    return result;
  } catch (e) {
    await finishOpsRun(id, { ok: false, error: e instanceof Error ? e.message : String(e) }).catch(
      () => {},
    );
    throw e;
  }
}

/**
 * `recorded()`, at most once a day. The state is `ops_runs` itself — the same
 * idea as the analytics rollup, which checks its own table for work — so a
 * restart, a deploy or a second process cannot make it forget. A run that threw
 * does not count, so a failure is retried on the next tick.
 */
async function daily(job: OpsJob, run: () => Promise<OpsResult>): Promise<OpsResult | string> {
  const last = await lastSuccessfulRunAt(job);
  if (last) {
    const ago = Date.now() - last.getTime();
    if (ago >= 0 && ago < DAILY_MS) {
      return `skipped: ran ${Math.round(ago / 60_000)} min ago (once a day)`;
    }
  }
  return recorded(job, run);
}

const TASKS: CronTask[] = [
  {
    name: "partner-reminders",
    run: () => recorded("cron:reminders", () => runPartnerReminders({ dry: false })),
  },
  {
    // Emails the owner of a featured listing whose placement ends within 3
    // days, once per end date. Without email configured the feature is off,
    // not failing, so no ops row is written for it.
    name: "featured-reminders",
    run: async () => {
      if (!isEmailConfigured()) {
        return "skipped: email not configured (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_EMAIL_TOKEN)";
      }
      return daily("cron:featured-reminders", () => runFeaturedReminders({ dry: false }));
    },
  },
  {
    // Rolls yesterday into analytics_daily once, then finds nothing to do for
    // the rest of the day; prunes raw events past the retention setting.
    name: "analytics-rollup",
    run: () => recorded("cron:analytics", () => runAnalytics({ dry: false })),
  },
  {
    // Repairs display coordinates after a centroid moved (CLAUDE.md "Map
    // coordinates"). Drops the listing caches only when something moved.
    name: "geo",
    run: async () => {
      const r = await daily("cron:geo", () => runGeo({ dry: false }));
      if (typeof r !== "string" && (r.counts.posicion_desactualizada ?? 0) > 0) {
        revalidateListings();
      }
      return r;
    },
  },
  {
    // Loads each live door's key pages once a day; alerts the operator when
    // one stops answering 200. The same check also runs after every deploy
    // (instrumentation.ts).
    name: "live-check",
    run: () => daily("check:live", () => runLiveCheck({ dry: false, reason: "revisión diaria" })),
  },
  {
    // Expired `sessions` rows; nothing a visitor reads, so no cache tag.
    name: "sessions",
    run: () => daily("cron:sessions", () => runSessions({ dry: false })),
  },
  {
    // Last, because it is the slow one. Without a key the job would refuse and
    // write an error row every hour; the feature is off, not failing.
    name: "translate",
    run: async () => {
      if (!isTranslationConfigured()) {
        return "skipped: no key (set GEMINI_API_KEY or ANTHROPIC_API_KEY)";
      }
      const r = await recorded("cron:translate", () =>
        runTranslate({
          dry: false,
          limit: TRANSLATE_PER_TICK,
          deadlineMs: TRANSLATE_BUDGET_MS,
        }),
      );
      // The English door reads title_en through the listing caches.
      if ((r.counts.traducidos ?? 0) > 0) revalidateListings();
      return r;
    },
  },
];

/**
 * Tasks running right now, so two overlapping ticks (a slow one and the next
 * hour's, or a manual POST) cannot run the same job twice at once.
 *
 * **One web process only.** This is module state: it does not see a second
 * Node process (if Passenger ever starts one), a CLI run from hPanel, or a
 * button on /admin/operaciones. Those still overlap as they always could; the
 * jobs are written to tolerate it (translate re-checks each row's hash, geo and
 * sessions are idempotent), this just stops the tick piling up on itself.
 */
const running = new Set<string>();

/** Every task's result, or `"error: …"` for one that threw. Never throws. */
export async function runCronTick(): Promise<Record<string, OpsResult | string>> {
  const out: Record<string, OpsResult | string> = {};
  for (const task of TASKS) {
    if (running.has(task.name)) {
      out[task.name] = "skipped: still running from an earlier tick";
      continue;
    }
    running.add(task.name);
    try {
      out[task.name] = await task.run();
    } catch (e) {
      out[task.name] = `error: ${e instanceof Error ? e.message : "unknown"}`;
    } finally {
      running.delete(task.name);
    }
  }
  return out;
}
