/**
 * CLI over `runLeadDigest()` — the daily digest of internal-lane leads still
 * "Nueva" after 24 hours. The job lives in `src/lib/ops/lead-digest.ts`.
 *
 *   DATABASE_URL="mysql://..." npm run cron:lead-digest -- --dry
 *   DATABASE_URL="mysql://..." npm run cron:lead-digest
 *
 * In production the hourly `/api/cron/tick` runs it once a day. Writes nothing;
 * a real run sends the operator alert through the configured channels (webhook,
 * Telegram, email) and is silent when none is set.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runLeadDigest } from "../src/lib/ops/lead-digest";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runLeadDigest({ dry: DRY }));
