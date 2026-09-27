/**
 * CLI over `runAnalytics()` — roll raw analytics events up into daily totals
 * and prune raw events past the retention setting. The job lives in
 * `src/lib/ops/analytics.ts`; the cron tick and /admin/operaciones run the
 * same function.
 *
 *   DATABASE_URL="mysql://..." npm run cron:analytics -- --dry
 *   DATABASE_URL="mysql://..." npm run cron:analytics
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runAnalytics } from "../src/lib/ops/analytics";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runAnalytics({ dry: DRY }));
