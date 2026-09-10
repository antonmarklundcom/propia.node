/**
 * CLI over `runSeedFinancing()` — seed `financing_programs`. The terms
 * themselves, and the standing warning that **the rates are placeholders**, live
 * in `src/lib/ops/seed-financing.ts`; edit that array to change a rate.
 *
 *   DATABASE_URL="mysql://..." npm run seed:financing -- --dry
 *   DATABASE_URL="mysql://..." npm run seed:financing && npm run cron:cuotas
 *
 * The second command is not optional: the seed writes the terms, the cron clears
 * every cuota still quoting the old ones.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runSeedFinancing } from "../src/lib/ops/seed-financing";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runSeedFinancing({ dry: DRY }));
