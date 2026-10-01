/**
 * CLI over `runSavedSearches()` — email confirmed saved searches the listings
 * published since their last alert. The job lives in `src/lib/ops/saved-searches.ts`.
 *
 *   DATABASE_URL="mysql://..." npm run cron:saved-searches -- --dry
 *   CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_EMAIL_TOKEN=… DATABASE_URL="mysql://..." npm run cron:saved-searches
 *
 * In production the hourly `/api/cron/tick` runs it once a day. A real run
 * needs the two Cloudflare email variables in the shell; without them it does
 * nothing and says so.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runSavedSearches } from "../src/lib/ops/saved-searches";
import { DRY, flagNumber, runCli } from "./ops-cli";

void runCli(() => runSavedSearches({ dry: DRY, limit: flagNumber("--limit") }));
