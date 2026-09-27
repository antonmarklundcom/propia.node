/**
 * Load each live door's home, evergreen pages and a sitemap sample, and report
 * every URL that is not a 200 (src/lib/ops/live-check.ts):
 *
 *   npm run check:live -- --dry     # same fetches, no alert
 *   npm run check:live              # alerts the operator on failures
 *
 * Reads the public sites over the network; touches no database.
 */
import { runLiveCheck } from "../src/lib/ops/live-check";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runLiveCheck({ dry: DRY, reason: "a mano" }));
