/**
 * CLI over `runSessions()` — purge expired session rows (audit F39). The job
 * lives in `src/lib/ops/sessions.ts`.
 *
 *   DATABASE_URL="mysql://..." npm run cron:sessions -- --dry
 *   DATABASE_URL="mysql://..." npm run cron:sessions
 *
 * Wire as a Hostinger cron (daily) next to cron:cuotas. Uses idx_expires.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runSessions } from "../src/lib/ops/sessions";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runSessions({ dry: DRY }));
