/**
 * CLI over `runMedians()` — market medians for the current month. The job lives
 * in `src/lib/ops/medians.ts`.
 *
 *   DATABASE_URL="mysql://..." npm run cron:medians -- --dry
 *   DATABASE_URL="mysql://..." npm run cron:medians
 *
 * Wire as a Hostinger cron (daily/weekly).
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runMedians } from "../src/lib/ops/medians";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runMedians({ dry: DRY }));
