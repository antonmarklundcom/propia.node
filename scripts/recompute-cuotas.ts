/**
 * CLI over `runCuotas()` — the nightly cuota recompute. The job itself, and the
 * reason it exists, live in `src/lib/ops/cuotas.ts`; this file only parses flags.
 *
 *   DATABASE_URL="mysql://..." npm run cron:cuotas -- --dry
 *   DATABASE_URL="mysql://..." npm run cron:cuotas
 *
 * `--dry` counts exactly what a real run would change and names the first ten,
 * writing nothing. Run it first after any financing-rate change: this job decides
 * the monthly payment printed on every venta card.
 *
 * Wire as a Hostinger cron (daily), after `cron:fx`.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runCuotas } from "../src/lib/ops/cuotas";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runCuotas({ dry: DRY }));
