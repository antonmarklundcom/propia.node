/**
 * The `ops_runs` audit trail — written by `/admin/operaciones`, read by the
 * health section on `/admin` and (from S3) by the run history.
 *
 * **A row is written before the job starts, not after it finishes.** A job that
 * throws, or a process that dies mid-run, still leaves the row that says
 * somebody started it: `finished_at IS NULL` is the shape of "this never came
 * back", and a table written only on success cannot represent it. `finishOpsRun`
 * closes the row either way.
 *
 * Dry runs are recorded too. "Who pressed Simular, saw 4 000 cuotas about to
 * change, and then pressed Ejecutar" is one story in two rows.
 */
import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { opsRuns } from "@/db/schema";
import type { OpsJob, OpsResult } from "./types";

export interface OpsRunRow {
  id: number;
  job: string;
  dry: boolean;
  startedByUserId: number | null;
  startedAt: Date;
  finishedAt: Date | null;
  /** null = never finished (still running, or the process died). */
  ok: boolean | null;
  /** The `OpsResult`, or `{ error }` when the job threw. Display-only. */
  result: OpsResult | { error: string } | null;
}

/**
 * How long an unfinished row still counts as "running" (`isJobRunning`).
 *
 * A row stuck at `finishedAt: null` is either a job genuinely still working or
 * one whose process died without closing its row (a crash, an OOM kill, a
 * Hostinger process-cap eviction — the exact failure mode this lock exists to
 * prevent doesn't stop happening just because the lock exists). Past this
 * window a stuck row is assumed dead rather than a permanent lock nothing can
 * clear: two hours is generously past every job's observed runtime today
 * (`cron:translate`'s own cap, C4d, bounds it to 50 rows with per-provider
 * deadlines) while still well under "somebody has to go delete a database row
 * to unstick tomorrow's cron".
 */
const STALE_RUN_MS = 2 * 60 * 60 * 1000;

/**
 * Whether a job is already running (or looks like it is), the advisory lock
 * behind `startOpsRun`. Reads the same `ops_runs` table rather than a second
 * lock table: no schema change, and a row already exists for exactly this
 * question — "did this job start and not yet finish" — for every caller that
 * goes through `startOpsRun` (docs/log/process-audit.md, candidates 1 and 5:
 * neither cron-vs-cron nor cron-vs-admin-panel overlap was excluded before
 * this).
 */
export async function isJobRunning(job: OpsJob): Promise<boolean> {
  const [row] = await db
    .select({ id: opsRuns.id })
    .from(opsRuns)
    .where(
      and(
        eq(opsRuns.job, job),
        sql`${opsRuns.finishedAt} is null`,
        sql`${opsRuns.startedAt} > (now() - interval ${sql.raw(String(STALE_RUN_MS / 1000))} second)`,
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Open a run. Returns the row id to hand to `finishOpsRun`. */
export async function startOpsRun(input: {
  job: OpsJob;
  dry: boolean;
  userId: number | null;
}): Promise<number> {
  const [res] = await db.insert(opsRuns).values({
    job: input.job,
    dry: input.dry,
    startedByUserId: input.userId ?? undefined,
    startedAt: new Date(),
  });
  return Number((res as unknown as { insertId: number }).insertId);
}

/** Close a run, with the result or the error it threw. */
export async function finishOpsRun(
  id: number,
  outcome: { ok: true; result: OpsResult } | { ok: false; error: string },
): Promise<void> {
  await db
    .update(opsRuns)
    .set({
      finishedAt: new Date(),
      ok: outcome.ok,
      resultJson: outcome.ok ? outcome.result : { error: outcome.error },
    })
    .where(eq(opsRuns.id, id));
}

/**
 * The most recent run of every job that has ever run, keyed by job.
 *
 * `id in (select max(id) … group by job)` rather than a window function: `id` is
 * an autoincrement, so the newest row per job is the largest id, and this stays
 * portable (ARCHITECTURE.md keeps the Postgres escape hatch open). It is also
 * one query instead of one per job, which matters because the health section
 * asks for all of them on every `/admin` render.
 *
 * A job with no row is **absent from the map**, and the caller must render that
 * as "never run" rather than as a zero — a cron that was never scheduled and a
 * cron that ran clean look nothing alike to an operator.
 */
export async function lastRunByJob(): Promise<Map<string, OpsRunRow>> {
  const rows = await db
    .select()
    .from(opsRuns)
    .where(
      sql`${opsRuns.id} in (select max(id) from ${opsRuns} group by job)`,
    );

  const out = new Map<string, OpsRunRow>();
  for (const r of rows) out.set(r.job, toRow(r));
  return out;
}

/** Newest first, optionally filtered — the history view (S3). */
export async function listOpsRuns(opts: {
  job?: string;
  userId?: number;
  limit?: number;
  offset?: number;
} = {}): Promise<OpsRunRow[]> {
  const rows = await db
    .select()
    .from(opsRuns)
    .where(
      and(
        opts.job ? eq(opsRuns.job, opts.job) : undefined,
        opts.userId ? eq(opsRuns.startedByUserId, opts.userId) : undefined,
      ),
    )
    .orderBy(desc(opsRuns.startedAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  return rows.map(toRow);
}

/**
 * Rows are read straight from the pool, never through `unstable_cache`, so the
 * dates are real `Date`s and no revive step is needed. Keep it that way: a
 * cached `ops_runs` read would show an operator a stale "last run" seconds after
 * they pressed the button, which is exactly the moment they are looking.
 */
function toRow(r: typeof opsRuns.$inferSelect): OpsRunRow {
  return {
    id: r.id,
    job: r.job,
    dry: r.dry,
    startedByUserId: r.startedByUserId ?? null,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt ?? null,
    ok: r.ok ?? null,
    result: (r.resultJson as OpsRunRow["result"]) ?? null,
  };
}
