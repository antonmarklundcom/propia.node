/**
 * CLI over `runPriceUsd()` — re-derive `price_usd` for Guaraní listings from
 * the latest USD → PYG rate. The job and why it exists live in
 * `src/lib/ops/price-usd.ts`; this file only parses flags.
 *
 *   DATABASE_URL="mysql://..." npm run cron:price-usd -- --dry
 *   DATABASE_URL="mysql://..." npm run cron:price-usd
 *
 * Order: `cron:fx` → `cron:price-usd` → `cron:cuotas`.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runPriceUsd } from "../src/lib/ops/price-usd";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runPriceUsd({ dry: DRY }));
