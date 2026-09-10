/**
 * The shape every operations job answers in — one runner per job, shared by
 * the CLI (`scripts/*.ts`) and, from O2, the buttons on `/admin/operaciones`.
 *
 * This is the `/admin/importar` rule (`planImport` / `commitImport`) applied to
 * every routine job: **a second code path for the UI is forbidden.** The
 * preview is the only reason pressing a button on a production database is
 * safe, and a preview computed by different code from the write is not a
 * preview — it is a guess that agrees most of the time.
 *
 * Deliberately not a barrel: there is no `src/lib/ops/index.ts` re-exporting
 * every runner, because `backfill-images.ts` pulls in `@aws-sdk/client-s3` and
 * `translate.ts` pulls in `@anthropic-ai/sdk`. A page that only needs
 * `runCuotas` must not drag those into its module graph. Import the one file.
 */

/**
 * What a run did — or, when `dry` is true, exactly what the same call with
 * `dry: false` would have done. The two must be computed by the same pass over
 * the same rows; a dry run that reports a different number from the real one is
 * a bug in the job, not a rounding difference.
 *
 * `counts` is free-form on purpose: every job counts different things, and the
 * UI renders whatever keys it finds rather than a fixed set of columns. Keys
 * are lower-case identifiers so they read as a table header unchanged.
 */
export interface OpsResult {
  /** Stable job id — the key `ops_runs.job` stores and `esPanel` describes. */
  job: OpsJob;
  dry: boolean;
  counts: Record<string, number>;
  /** Human lines: warnings, the first N affected rows, why nothing ran. */
  notes: string[];
  durationMs: number;
}

/**
 * Every job that has a runner. The union is the registry: `ops_runs.job` holds
 * one of these strings, and a new job is added here first so the UI, the audit
 * table and the CLI cannot disagree about its name.
 *
 * Spelled as the `package.json` script that runs it, so a line in `ops_runs`
 * and a line in a cron log are recognisably the same thing. Members with no
 * script of their own (`financing.edit`, added by S1) are namespaced with a
 * dot.
 */
export type OpsJob =
  | "cron:cuotas"
  | "cron:medians"
  | "cron:geo"
  | "cron:fx"
  | "cron:resync"
  | "cron:translate"
  | "cron:sessions"
  | "seed:financing"
  | "seed:locations"
  | "import:csv"
  | "backfill:images"
  | "financing.edit";

/**
 * What every runner takes. `dry` is required and never defaulted: a job that
 * writes when the caller forgot to say so is the failure mode this whole layer
 * exists to remove, so the type refuses to let a caller omit it.
 *
 * `limit` is mandatory-by-convention for the long jobs (§1.8: `cron:translate`
 * and `backfill:images` spend money and third-party quota per row), enforced by
 * the UI rather than the type — the CLI is allowed to run them unbounded.
 */
export interface OpsOptions {
  dry: boolean;
  limit?: number;
}

/** Collector handed to a job body so it does not build the result by hand. */
export interface OpsSink {
  /** Add `n` to a counter, creating it at 0 first. Order of first use is the display order. */
  count(key: string, n?: number): void;
  /** Ensure a counter exists (so a zero shows in the table instead of vanishing). */
  track(...keys: string[]): void;
  note(line: string): void;
}

/**
 * Run a job body and stamp the result. Every runner is `return opsRun(job, dry,
 * async (out) => { … })`, so `durationMs`, the `job`/`dry` echo and the counter
 * bookkeeping are written once rather than eleven times.
 *
 * Errors are **not** swallowed: a job that throws must reach the caller, which
 * is the CLI's non-zero exit and, in O2, the `ops_runs` row with `ok = 0`.
 */
export async function opsRun(
  job: OpsJob,
  dry: boolean,
  body: (out: OpsSink) => Promise<void> | void,
): Promise<OpsResult> {
  const started = Date.now();
  const counts: Record<string, number> = {};
  const notes: string[] = [];
  const sink: OpsSink = {
    count(key, n = 1) {
      counts[key] = (counts[key] ?? 0) + n;
    },
    track(...keys) {
      for (const key of keys) if (counts[key] === undefined) counts[key] = 0;
    },
    note(line) {
      notes.push(line);
    },
  };

  await body(sink);

  return { job, dry, counts, notes, durationMs: Date.now() - started };
}
