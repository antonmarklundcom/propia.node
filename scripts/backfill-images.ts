/**
 * CLI over `runBackfillImages()` — pull remote listing photos into R2. The job
 * lives in `src/lib/ops/backfill-images.ts`.
 *
 *   export DATABASE_URL="mysql://..."     # tsx does not auto-load .env
 *   npm run backfill:images -- --dry
 *   npm run backfill:images -- --limit 50
 *   npm run backfill:images -- --include-placeholders
 *
 * Blocked on the bucket, not on code (CLAUDE.md backlog 1): without the `R2_*`
 * env vars a real run refuses. `--dry` works either way and answers "how much of
 * the site is still hotlinking someone else's server?".
 *
 * `--dry-run` is accepted as an alias for `--dry`, since this script documented
 * that spelling first.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runBackfillImages } from "../src/lib/ops/backfill-images";
import { DRY, flagNumber, hasFlag, runCli } from "./ops-cli";

void runCli(() =>
  runBackfillImages({
    dry: DRY,
    limit: flagNumber("--limit"),
    includePlaceholders: hasFlag("--include-placeholders"),
  }),
);
