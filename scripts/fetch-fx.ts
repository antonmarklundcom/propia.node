/**
 * CLI over `runFx()` — fetch and record the USD→PYG rate (backlog #2). The job
 * lives in `src/lib/ops/fx.ts`.
 *
 *   npm run cron:fx -- --dry
 *   DATABASE_URL="mysql://..." npm run cron:fx
 *
 * `--dry` prints the fetched rate and its delta against the last recorded one,
 * writing nothing. Run it first: this is the app's only source of truth for
 * `cuota_gs` and every price conversion in the publish wizard.
 *
 * Wire as a daily Hostinger cron — the free API tier itself only refreshes once
 * every 24 h, so anything more frequent would re-record the same number.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runFx } from "../src/lib/ops/fx";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runFx({ dry: DRY }));
