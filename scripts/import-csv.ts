/**
 * CLI over `runImportCsv()` — white-glove CSV import (ARCHITECTURE.md §2.4, M2).
 * The job lives in `src/lib/ops/import-csv.ts`; the pipeline it drives is
 * `src/lib/import/`.
 *
 *   npm run import:csv -- data/agency-x.csv whiteglove --agency=12 --dry
 *   npm run import:csv -- data/agency-x.csv whiteglove --agency=12 --publish
 *
 * `--dry` is `planImport` — the same planner the real run commits, so the preview
 * cannot drift from what happens. source defaults to 'whiteglove'. Without
 * `--publish`, imported listings land in pending_review.
 *
 * `--agency` is worth passing every time: it stamps the listings' owner and
 * scopes the id-space, so two agencies numbering their rows 1, 2, 3 do not
 * collide. Without it the batch is unscoped and the listings belong to nobody,
 * which is how the leads they generate become unattributable.
 *
 * /admin/importar does the same thing with a preview, a permission record and an
 * undo button; prefer it unless the file is too big for an upload.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { readFileSync } from "node:fs";
import { runImportCsv } from "../src/lib/ops/import-csv";
import type { ListingSource } from "../src/lib/import/types";
import { DRY, flagNumber, hasFlag, positionals, runCli } from "./ops-cli";

const args = positionals(["--agency", "--limit"]);
const file = args[0];
const source = (args[1] as ListingSource) || "whiteglove";

if (!file) {
  console.error(
    "usage: npm run import:csv -- <file.csv> [source] [--agency=<id>] [--publish] [--dry]",
  );
  process.exit(1);
}

const agencyId = flagNumber("--agency") ?? null;
if (agencyId !== null && (!Number.isInteger(agencyId) || agencyId <= 0)) {
  console.error(`invalid --agency value '${agencyId}'`);
  process.exit(1);
}

void runCli(() =>
  runImportCsv({
    dry: DRY,
    csv: readFileSync(file, "utf8"),
    filename: file,
    source,
    agencyId,
    publish: hasFlag("--publish"),
  }),
);
