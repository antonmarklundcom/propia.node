/**
 * CLI over `runSeedLocations()` — seed the locations hierarchy. The tree itself
 * lives in `src/lib/ops/seed-locations.ts`; add a city by editing it there.
 *
 *   DATABASE_URL="mysql://..." npm run seed:locations -- --dry
 *   DATABASE_URL="mysql://..." npm run seed:locations && npm run cron:geo
 *
 * Follow a real run with `cron:geo`: every listing borrowing a centroid that
 * moved is still plotted at the old spot until display_lat/display_lng are
 * recomputed.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runSeedLocations } from "../src/lib/ops/seed-locations";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runSeedLocations({ dry: DRY }));
