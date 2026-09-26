/**
 * The hourly tick (docs/plan-agency-2026-09-26.md batch 4): the Cloudflare
 * Worker's cron trigger POSTs `/api/cron/tick` once an hour, and this runs
 * every scheduled task in order. One request an hour, nothing per visitor —
 * Hostinger's limit is processes, and a timer inside the app would need one
 * alive all the time.
 *
 * Add a task by appending to `TASKS`. Each runs in its own try/catch, so one
 * that throws is reported and the rest still run. A task that is an ops job
 * goes through `recorded()`, which writes the same `ops_runs` row a button on
 * /admin/operaciones does (with no user), so `/admin`'s health box shows when
 * the tick last ran it and whether it failed.
 */
import "server-only";
import { runPartnerReminders } from "@/lib/ops/partner-reminders";
import { finishOpsRun, startOpsRun } from "@/lib/ops/runs";
import type { OpsJob, OpsResult } from "@/lib/ops/types";

interface CronTask {
  name: string;
  run: () => Promise<OpsResult | string>;
}

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

const TASKS: CronTask[] = [
  {
    name: "partner-reminders",
    run: () => recorded("cron:reminders", () => runPartnerReminders({ dry: false })),
  },
];

/** Every task's result, or `"error: …"` for one that threw. Never throws. */
export async function runCronTick(): Promise<Record<string, OpsResult | string>> {
  const out: Record<string, OpsResult | string> = {};
  for (const task of TASKS) {
    try {
      out[task.name] = await task.run();
    } catch (e) {
      out[task.name] = `error: ${e instanceof Error ? e.message : "unknown"}`;
    }
  }
  return out;
}
