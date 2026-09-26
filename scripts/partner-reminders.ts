/**
 * CLI over `runPartnerReminders()` — remind partners of shared leads still
 * unanswered after 4 hours, once, then alert the operator. The job lives in
 * `src/lib/ops/partner-reminders.ts`.
 *
 *   DATABASE_URL="mysql://..." npm run cron:reminders -- --dry
 *   DATABASE_URL="mysql://..." npm run cron:reminders [-- --limit 50]
 *
 * In production it runs hourly from the Cloudflare Worker's cron trigger
 * (`/api/cron/tick`), so this is for a manual look or a one-off catch-up.
 * Sending needs TELEGRAM_BOT_TOKEN in the shell; without it the run still
 * marks and counts, and says no message could be sent.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runPartnerReminders } from "../src/lib/ops/partner-reminders";
import { DRY, flagNumber, runCli } from "./ops-cli";

void runCli(() => runPartnerReminders({ dry: DRY, limit: flagNumber("--limit") }));
