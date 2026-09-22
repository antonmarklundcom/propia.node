/**
 * CLI over runDemoSeller(): attach the unowned demo listings to one demo agency
 * with a WhatsApp number, or detach them again.
 *   npm run seed:demo-seller -- --dry --whatsapp 595981123456
 *   npm run seed:demo-seller -- --whatsapp 595981123456
 *   npm run seed:demo-seller -- --dry --remove
 */
import "./db-credential"; // MUST be first: select the credential before the pool
import { runDemoSeller } from "../src/lib/ops/demo-seller";
import { DRY, flagNumber, flagString, hasFlag, runCli } from "./ops-cli";

void runCli(() => runDemoSeller({
  dry: DRY,
  limit: flagNumber("--limit"),
  whatsapp: flagString("--whatsapp"),
  remove: hasFlag("--remove"),
}));
