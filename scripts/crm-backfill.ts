/**
 * CLI over runCrmBackfill(): copy leads already in MySQL into VenderCRM.
 * Needs VENDERCRM_BASE_URL and the VENDERCRM_KEY_<DOOR> keys exported in the
 * shell (tsx does not read .env). Idempotent by lead id, so re-running is safe.
 *   npm run crm:backfill -- --dry
 *   npm run crm:backfill -- --limit 10
 *   npm run crm:backfill -- --from-id 120
 */
import "./db-credential"; // MUST be first: select the credential before the pool
import { runCrmBackfill } from "../src/lib/ops/crm-backfill";
import { DRY, flagNumber, runCli } from "./ops-cli";

void runCli(() => runCrmBackfill({
  dry: DRY,
  limit: flagNumber("--limit"),
  fromId: flagNumber("--from-id"),
}));
