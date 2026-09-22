/**
 * CLI over runSamplePhotos(); use an absolute base URL for hosted demo photos.
 *   npm run seed:sample-photos -- --dry --base https://inmobiliaria.com.py
 *   npm run seed:sample-photos -- --base https://inmobiliaria.com.py --limit 10 --replace-placeholders
 */
import "./db-credential"; // MUST be first: select the credential before the pool
import { runSamplePhotos } from "../src/lib/ops/sample-photos";
import { DRY, flagNumber, flagString, hasFlag, runCli } from "./ops-cli";

void runCli(() => runSamplePhotos({
  dry: DRY,
  limit: flagNumber("--limit"),
  baseUrl: flagString("--base") ?? "",
  replacePlaceholders: hasFlag("--replace-placeholders"),
}));
