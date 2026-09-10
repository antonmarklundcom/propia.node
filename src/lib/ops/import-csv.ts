/**
 * White-glove CSV import (ARCHITECTURE.md §2.4, M2) as an operations job.
 *
 * The dry run **is** `planImport` and the real run is the same plan handed to
 * `commitImport` — the rule from `/admin/importar`, which is the reason that
 * feature is safe: one planner, so the preview cannot drift from what actually
 * runs. Never add a second validation path here.
 *
 * Takes the CSV *text* rather than a path so the same runner serves the CLI, an
 * upload and (later) a fetch. `/admin/importar` keeps its own action because it
 * additionally records the permission attestation and the rollback log; this
 * runner is the CLI's engine and the operations page's re-import button.
 *
 * **Always pass an agency.** It stamps the listings' owner and scopes the
 * id-space, so two agencies numbering their rows 1, 2, 3 do not collide. Without
 * it the batch is unscoped and the listings belong to nobody, which is how the
 * leads they generate become unattributable.
 *
 * Cache: a committed batch changes what is published, so a non-dry run is
 * followed by `revalidateListings()` **by the caller** (the runner has no cache
 * handler under `tsx`).
 */
import "server-only";
import { db } from "@/db";
import { parseCsvRecords, recordToRaw } from "@/lib/import/csv";
import {
  commitImport,
  planImport,
  reportFromCommitted,
} from "@/lib/import/upsert";
import type { ImportReport, ListingSource, RawListing } from "@/lib/import/types";
import { getUsdToPygRateRaw } from "@/lib/fx";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

export interface ImportCsvOptions extends OpsOptions {
  /** The file's text. */
  csv: string;
  /** Shown in the notes so a run is recognisable in `ops_runs`. */
  filename?: string;
  source?: ListingSource;
  agencyId?: number | null;
  /** Publish immediately instead of `pending_review`. Trusted batches only. */
  publish?: boolean;
}

/** How many skipped rows are named before collapsing to a count. */
const SAMPLE = 25;

export async function runImportCsv(opts: ImportCsvOptions): Promise<OpsResult> {
  const source: ListingSource = opts.source ?? "whiteglove";
  const agencyId = opts.agencyId ?? null;

  return opsRun("import:csv", opts.dry, async (out) => {
    out.note(
      `${opts.filename ?? "(uploaded)"} · source=${source} · ` +
        `${agencyId ? `agency=${agencyId}` : "unscoped"}${opts.publish ? " · published" : ""}`,
    );
    if (agencyId == null) {
      out.note(
        "No agency given: these listings will belong to no agency and share the " +
          "unscoped id-space with every other unscoped import.",
      );
    }

    const records = parseCsvRecords(opts.csv);
    const rows: RawListing[] = [];
    const parseErrors: { row: number; reason: string }[] = [];
    records.forEach((rec, i) => {
      try {
        rows.push(recordToRaw(rec, source));
      } catch (e) {
        parseErrors.push({ row: i + 1, reason: String(e) });
      }
    });

    /**
     * The rate is resolved here and passed in, rather than left to
     * `planImport`'s own default: that default is the `unstable_cache` reader,
     * which throws `Invariant: incrementalCache missing` under `tsx`. Passing it
     * also guarantees the plan and the commit price the batch with the *same*
     * number, which two separate reads would not.
     */
    const usdToPyg = await getUsdToPygRateRaw();
    const importOpts = { publish: opts.publish, agencyId, usdToPyg };
    out.note(`USD → PYG ${usdToPyg}`);

    const plan = await planImport(db, rows, importOpts);

    /**
     * Commit can still downgrade a row to skipped (a race, a constraint), so the
     * real run reports what happened rather than what was planned. The dry run
     * reports the plan, which is the same pass over the same rows.
     */
    const report: ImportReport = opts.dry
      ? plan.report
      : reportFromCommitted(await commitImport(db, plan, importOpts));

    out.count("filas", records.length);
    out.count("creados", report.created);
    out.count("actualizados", report.updated);
    out.count("sin_cambio", report.unchanged);
    out.count("duplicados", report.deduped);
    out.count("descartados", report.skipped + parseErrors.length);

    for (const e of [...parseErrors, ...report.errors].slice(0, SAMPLE)) {
      out.note(`  row ${e.row}: ${e.reason}`);
    }
    const problems = parseErrors.length + report.errors.length;
    if (problems > SAMPLE) out.note(`  … and ${problems - SAMPLE} more`);

    if (opts.dry) out.note("--dry: planned only, nothing written.");
  });
}
