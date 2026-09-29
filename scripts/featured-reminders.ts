/**
 * CLI over `runFeaturedReminders()` — email the owner of each featured listing
 * whose placement ends within the next 3 days, once per end date. The job lives
 * in `src/lib/ops/featured-reminders.ts`.
 *
 *   DATABASE_URL="mysql://..." npm run cron:featured-reminders -- --dry
 *   DATABASE_URL="mysql://..." CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_EMAIL_TOKEN=... \
 *     npm run cron:featured-reminders [-- --limit 50]
 *
 * In production it runs once a day from the hourly tick (`/api/cron/tick`), so
 * this is for a manual look. A real run writes `admin_events` rows, so it needs
 * a credential that can write; without the Cloudflare pair it sends nothing and
 * says so.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runFeaturedReminders } from "../src/lib/ops/featured-reminders";
import { DRY, flagNumber, runCli } from "./ops-cli";

void runCli(() => runFeaturedReminders({ dry: DRY, limit: flagNumber("--limit") }));
