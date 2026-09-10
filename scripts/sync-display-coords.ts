/**
 * CLI over `runGeo()` — repair every listing's display coordinate (audit F38).
 * The job, and why the coalesce must not go back into a query, live in
 * `src/lib/ops/geo.ts` and `src/lib/geo.ts`.
 *
 *   DATABASE_URL="mysql://..." npm run cron:geo -- --dry
 *   DATABASE_URL="mysql://..." npm run cron:geo
 *
 * Run it after `npm run seed:locations` and after any manual edit of
 * `locations.lat/lng` — a moved centroid is the one staleness no write hook sees.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runGeo } from "../src/lib/ops/geo";
import { DRY, runCli } from "./ops-cli";

void runCli(() => runGeo({ dry: DRY }));
