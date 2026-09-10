import "server-only";

/**
 * The catalogue of jobs `/admin/operaciones` offers, and the single place that
 * maps a job id to the function that runs it.
 *
 * This is the *only* module that imports every runner, and it is deliberately
 * not in `src/lib/ops/`: `src/lib/ops/types.ts` explains why there is no barrel
 * there — `backfill-images` pulls in `@aws-sdk/client-s3` and `translate` pulls
 * in `@anthropic-ai/sdk`, and the health section on `/admin` must not drag either
 * into its module graph just to read `ops_runs`. This page needs all of them, so
 * this page holds the list.
 *
 * A job is here because an operator has a reason to press it. Two things are
 * deliberately absent:
 *
 * - **`db:migrate` is not a button, and never will be.** Applying DDL to
 *   production is a human decision made after reading `db:status`, on a machine
 *   holding the owner credential — not a click in a browser that a mis-scroll can
 *   reach. Same reasoning excludes `db:status -- --probe`.
 * - **`import:csv` is not here either.** `/admin/importar` already does that
 *   with an upload, a permission attestation and a rollback log, all of which
 *   this page has no way to collect. Its runner exists for the CLI.
 */
import type { OpsJob, OpsResult } from "@/lib/ops/types";
import { isR2Configured } from "@/lib/r2";
import { isTranslationConfigured } from "@/lib/translate";
import { esPanel } from "@/i18n/es";
import { runCuotas } from "@/lib/ops/cuotas";
import { runMedians } from "@/lib/ops/medians";
import { runGeo } from "@/lib/ops/geo";
import { runFx } from "@/lib/ops/fx";
import { runResync } from "@/lib/ops/resync";
import { runTranslate } from "@/lib/ops/translate";
import { runSessions } from "@/lib/ops/sessions";
import { runSeedFinancing } from "@/lib/ops/seed-financing";
import { runSeedLocations } from "@/lib/ops/seed-locations";
import { runBackfillImages } from "@/lib/ops/backfill-images";

/** What a card knows about itself, minus the runner (which never crosses to the client). */
export interface OpsJobMeta {
  job: OpsJob;
  label: string;
  description: string;
  /** Shown under the buttons: what a real run changes, in one line. */
  writes: string;
  /**
   * True for the jobs that spend money or third-party quota per row
   * (`fable-plan-ops.md` §1.8). The UI makes the field mandatory; the CLI is
   * still allowed an unbounded run.
   */
  requiresLimit: boolean;
  /** Suggested value for the limit field. */
  defaultLimit?: number;
  /**
   * Set when the job cannot run in this deployment, with the reason in Spanish.
   * A card in this state still offers **Simular** where the dry run is
   * meaningful — "how much is still hotlinked?" is answerable long before the
   * bucket exists — and never offers Ejecutar.
   */
  disabledReason: string | null;
}

type Runner = (opts: {
  dry: boolean;
  limit?: number;
}) => Promise<OpsResult>;

interface Entry extends OpsJobMeta {
  run: Runner;
}

/**
 * Built per request rather than as a module constant, because two of the
 * `disabledReason`s are env-dependent and this file is evaluated once per server
 * process. A card that says "R2 is not configured" must stop saying it the
 * deploy after the bucket exists.
 */
export function opsJobs(): Entry[] {
  const r2 = isR2Configured();
  const translation = isTranslationConfigured();

  return [
    {
      job: "cron:fx",
      label: esPanel.opsFxLabel,
      description: esPanel.opsFxDescription,
      writes: esPanel.opsFxWrites,
      requiresLimit: false,
      disabledReason: null,
      run: (o) => runFx(o),
    },
    {
      job: "cron:cuotas",
      label: esPanel.opsCuotasLabel,
      description: esPanel.opsCuotasDescription,
      writes: esPanel.opsCuotasWrites,
      requiresLimit: false,
      disabledReason: null,
      run: (o) => runCuotas(o),
    },
    {
      job: "cron:medians",
      label: esPanel.opsMediansLabel,
      description: esPanel.opsMediansDescription,
      writes: esPanel.opsMediansWrites,
      requiresLimit: false,
      disabledReason: null,
      run: (o) => runMedians(o),
    },
    {
      job: "cron:geo",
      label: esPanel.opsGeoLabel,
      description: esPanel.opsGeoDescription,
      writes: esPanel.opsGeoWrites,
      requiresLimit: false,
      disabledReason: null,
      run: (o) => runGeo(o),
    },
    {
      job: "cron:translate",
      label: esPanel.opsTranslateLabel,
      description: esPanel.opsTranslateDescription,
      writes: esPanel.opsTranslateWrites,
      requiresLimit: true,
      defaultLimit: 25,
      disabledReason: translation ? null : esPanel.opsDisabledTranslate,
      run: (o) => runTranslate(o),
    },
    {
      job: "cron:resync",
      label: esPanel.opsResyncLabel,
      description: esPanel.opsResyncDescription,
      writes: esPanel.opsResyncWrites,
      requiresLimit: false,
      disabledReason: null,
      run: (o) => runResync(o),
    },
    {
      job: "cron:sessions",
      label: esPanel.opsSessionsLabel,
      description: esPanel.opsSessionsDescription,
      writes: esPanel.opsSessionsWrites,
      requiresLimit: false,
      disabledReason: null,
      run: (o) => runSessions(o),
    },
    {
      job: "seed:financing",
      label: esPanel.opsSeedFinancingLabel,
      description: esPanel.opsSeedFinancingDescription,
      writes: esPanel.opsSeedFinancingWrites,
      requiresLimit: false,
      disabledReason: null,
      run: (o) => runSeedFinancing(o),
    },
    {
      job: "seed:locations",
      label: esPanel.opsSeedLocationsLabel,
      description: esPanel.opsSeedLocationsDescription,
      writes: esPanel.opsSeedLocationsWrites,
      requiresLimit: false,
      disabledReason: null,
      run: (o) => runSeedLocations(o),
    },
    {
      job: "backfill:images",
      label: esPanel.opsBackfillImagesLabel,
      description: esPanel.opsBackfillImagesDescription,
      writes: esPanel.opsBackfillImagesWrites,
      requiresLimit: true,
      defaultLimit: 50,
      disabledReason: r2 ? null : esPanel.opsDisabledR2,
      run: (o) => runBackfillImages(o),
    },
  ];
}

/**
 * The metadata half, which is all the client component ever receives. Spelled out
 * field by field rather than destructured, so a runner can never ride across the
 * boundary because somebody added a property to `Entry`.
 */
export function opsJobMeta(): OpsJobMeta[] {
  return opsJobs().map((j) => ({
    job: j.job,
    label: j.label,
    description: j.description,
    writes: j.writes,
    requiresLimit: j.requiresLimit,
    defaultLimit: j.defaultLimit,
    disabledReason: j.disabledReason,
  }));
}

export function findOpsJob(job: string): Entry | undefined {
  return opsJobs().find((j) => j.job === job);
}

/**
 * Jobs whose non-dry run changes what a visitor sees, and therefore need the
 * listing cache dropped afterwards (`fable-plan-ops.md` §4.2 item 4).
 *
 * The runners cannot do this themselves — under `tsx` there is no cache handler
 * to call `revalidateTag` on — so it is the action's job, and this is the list it
 * consults. `cron:medians` is **not** here on purpose: `market-medians` is the
 * one tag with no writer (`src/lib/cache.ts`), TTL-only by design.
 * `cron:sessions` and `cron:fx` change nothing a visitor reads.
 */
export const JOBS_THAT_CHANGE_LISTINGS: ReadonlySet<string> = new Set<OpsJob>([
  // Writes listings.cuota_gs, printed on every venta card.
  "cron:cuotas",
  // Moves map pins (display_lat / display_lng).
  "cron:geo",
  // Writes listings.title_en / description_en, read by the English door.
  "cron:translate",
  // Pauses listings: changes what is published.
  "cron:resync",
  // Rewrites listing_images.r2_key, i.e. every photo URL it touched.
  "backfill:images",
]);

/**
 * Jobs that must be followed by another job, and which one.
 *
 * Not chained behind one button on purpose. A card is one job and one `ops_runs`
 * row, and a dry run has to be able to preview what its own button does — a
 * simulated `seed:financing` cannot honestly preview the cuota changes that
 * follow it, because the rates it would write are not written yet. So the UI says
 * what to press next instead of pressing it for you, and `/admin`'s health
 * section shows when each job last ran.
 *
 * S1's financing editor is the one place that does chain (`fable-plan-ops.md`
 * §1.11): there the operator is changing a rate they typed, and the editor shows
 * the cuota diff before saving.
 */
export const FOLLOW_UP_JOB: Readonly<Partial<Record<OpsJob, OpsJob>>> = {
  // A changed rate leaves every cached cuota quoting the old one.
  "seed:financing": "cron:cuotas",
  // A moved centroid leaves every listing borrowing it at the old spot.
  "seed:locations": "cron:geo",
};
