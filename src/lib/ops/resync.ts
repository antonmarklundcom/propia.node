/**
 * Pause listings whose source feed has gone quiet — the operations-layer wrapper
 * over the sweep itself, which lives in `src/lib/import/resync.ts` next to the
 * rest of the intake pipeline (it writes an `import_jobs` row, so `/admin/importar`
 * can revert it like any batch).
 *
 * This file adds nothing to the sweep and must not: it maps the sweep's own
 * result onto `OpsResult` so a button and the CLI report the same numbers. The
 * cutoff is a judgement call — 30 days is a guess until one full cycle of agency
 * re-uploads has been observed — which is why the dry form lists the candidates
 * by name.
 *
 * Cache: pausing a listing changes what is published, so the *caller* follows a
 * non-dry run with `revalidateListings()`. The runner cannot (no cache handler
 * under `tsx`).
 */
import "server-only";
import {
  DEFAULT_STALE_DAYS,
  runResync as sweepStaleListings,
} from "@/lib/import/resync";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

export { DEFAULT_STALE_DAYS };

/** How many stale listings the notes name before collapsing to a count. */
const SAMPLE = 50;

export interface ResyncOptions extends OpsOptions {
  /** Days without a sighting before a listing is paused. */
  days?: number;
  /** Recorded on the `import_jobs` row so the sweep is attributable. */
  userId?: number | null;
}

export async function runResync(opts: ResyncOptions): Promise<OpsResult> {
  const staleDays =
    opts.days ?? Number(process.env.RESYNC_STALE_DAYS ?? DEFAULT_STALE_DAYS);
  if (!Number.isFinite(staleDays) || staleDays < 1) {
    throw new Error(`invalid stale-days value '${staleDays}'`);
  }

  return opsRun("cron:resync", opts.dry, async (out) => {
    const result = await sweepStaleListings(staleDays, {
      dryRun: opts.dry,
      userId: opts.userId ?? null,
    });

    out.note(`cutoff ${staleDays} days`);
    out.count("candidatas", result.candidates.length);
    /**
     * In a dry run the sweep pauses nothing and returns `paused: 0`, so the
     * candidate count is what a real run would pause — reported under the same
     * key in both modes rather than letting the dry number read as "0 affected".
     */
    out.count("pausadas", opts.dry ? result.candidates.length : result.paused);
    if (result.jobId) out.note(`import job #${result.jobId} — revertible from /admin/importar`);

    for (const c of result.candidates.slice(0, SAMPLE)) {
      out.note(
        `  #${c.listingId} ${c.title} (last seen ${c.lastSeenAt.toISOString().slice(0, 10)})`,
      );
    }
    if (result.candidates.length > SAMPLE) {
      out.note(`  … and ${result.candidates.length - SAMPLE} more`);
    }

    if (opts.dry) out.note("--dry: nothing paused.");
  });
}
