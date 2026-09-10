/**
 * CLI over `runResync()` — pause listings whose source feed has gone quiet. The
 * job lives in `src/lib/ops/resync.ts` (the sweep itself is
 * `src/lib/import/resync.ts`, next to the rest of the intake pipeline).
 *
 *   DATABASE_URL="mysql://..." npm run cron:resync -- --dry
 *   DATABASE_URL="mysql://..." npm run cron:resync -- --days=45
 *
 * `--dry` lists what would be paused and writes nothing — run it first, because
 * the right cutoff depends on how often the agencies actually re-send their
 * spreadsheets, and 30 days is a guess until you have seen one full cycle.
 *
 * Everything a real run does is recorded as an import job and can be reverted
 * from /admin/importar, so a cutoff set too aggressively is one click to undo.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runResync } from "../src/lib/ops/resync";
import { DRY, flagNumber, runCli } from "./ops-cli";

void runCli(() => runResync({ dry: DRY, days: flagNumber("--days") }));
