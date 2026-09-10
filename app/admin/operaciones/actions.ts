"use server";

/**
 * The two actions behind every card on `/admin/operaciones`: simulate, then run.
 *
 * **Both go through the same function.** `runOpsJob` takes `dry` and nothing else
 * changes — the preview an operator approves is produced by the code that then
 * writes, which is the `/admin/importar` rule (`fable-plan-ops.md` §1.2) and the
 * only reason a button on a production database is safe.
 *
 * Three things this file guarantees that the runners cannot:
 *
 * 1. **`requireSuperAdmin()` on every call.** A server action is a public
 *    endpoint; the guard is re-invoked here rather than inherited from the page
 *    that rendered the button.
 * 2. **An `ops_runs` row per press, opened before the job starts.** A job that
 *    throws or a process that dies still leaves the row that says who started
 *    what — see `src/lib/ops/runs.ts`.
 * 3. **The cache drop after a real run.** A runner cannot call `revalidateTag`
 *    (under `tsx` there is no cache handler), so the action owes it — otherwise
 *    an operator recalculates every cuota, looks at a listing page, sees the old
 *    number and concludes the button does nothing.
 */
import { revalidatePath } from "next/cache";
import { revalidateListings } from "@/lib/cache";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { finishOpsRun, startOpsRun } from "@/lib/ops/runs";
import type { OpsResult } from "@/lib/ops/types";
import { esPanel } from "@/i18n/es";
import { findOpsJob, JOBS_THAT_CHANGE_LISTINGS } from "./jobs";

const ROUTE = "/admin/operaciones";

export type OpsRunOutcome =
  | { ok: true; result: OpsResult }
  | { ok: false; error: string };

export interface OpsRunInput {
  job: string;
  dry: boolean;
  limit?: number;
}

/**
 * Run one job, dry or for real.
 *
 * The `job` string arrives from the browser and is therefore untrusted: it is
 * looked up in the catalogue rather than used to build anything, so an unknown
 * value is a rejected request, not a surprising call. `limit` is clamped for the
 * same reason — a job that must be bounded must be bounded by the server, not by
 * the form that was supposed to send a number.
 */
export async function runOpsJob(input: OpsRunInput): Promise<OpsRunOutcome> {
  const user = await requireSuperAdmin();

  const entry = findOpsJob(input.job);
  if (!entry) return { ok: false, error: "Ese trabajo no existe." };

  const dry = input.dry !== false;

  if (!dry && entry.disabledReason) {
    return { ok: false, error: entry.disabledReason };
  }

  let limit: number | undefined;
  if (entry.requiresLimit) {
    const n = Number(input.limit);
    if (!Number.isInteger(n) || n < 1) {
      return { ok: false, error: esPanel.opsLimitRequired };
    }
    // Bounded server-side: this is the money guard, and a form field is not one.
    limit = Math.min(n, 500);
  }

  const runId = await startOpsRun({ job: entry.job, dry, userId: user.id });

  try {
    const result = await entry.run({ dry, limit });
    await finishOpsRun(runId, { ok: true, result });

    if (!dry && JOBS_THAT_CHANGE_LISTINGS.has(entry.job)) {
      revalidateListings();
    }
    // The page itself shows "last run", which this press just changed.
    revalidatePath(ROUTE);
    revalidatePath("/admin");

    return { ok: true, result };
  } catch (err) {
    const error = (err as Error).message || esPanel.opsError;
    /**
     * The row is closed with `ok: false` and the message, and the operator is
     * told plainly. What must not happen is the two disagreeing: a failure the
     * screen reports and the audit trail does not is worse than either alone.
     */
    await finishOpsRun(runId, { ok: false, error });
    revalidatePath(ROUTE);
    return { ok: false, error };
  }
}
