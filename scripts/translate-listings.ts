/**
 * CLI over `runTranslate()` — fill `listings.title_en` / `description_en` from
 * the Spanish source (PLAN.md D6). The job, the provider order and the
 * `translation_hash` rule live in `src/lib/ops/translate.ts` and
 * `src/lib/translate.ts`.
 *
 *   DATABASE_URL="mysql://..." GEMINI_API_KEY="AQ...." npm run cron:translate -- --limit 25
 *   ... ANTHROPIC_API_KEY="sk-..." npm run cron:translate     # or Claude alone
 *   ... npm run cron:translate -- --dry            # what would run, no API calls
 *   ... npm run cron:translate -- --id 1234        # one listing, ignores the hash
 *   ... npm run cron:translate -- --force          # re-translate everything
 *
 * **Use `--limit`.** Every row is a paid API call — run it bounded and watch
 * usage in the provider's dashboard rather than wide open.
 *
 * Exits 1 if any row failed, having printed the whole report: a cron that mails
 * its output then says something went wrong without pretending the batch died.
 */
import "./db-credential"; // MUST be first: it picks the credential before src/db builds its pool
import { runTranslate } from "../src/lib/ops/translate";
import { DRY, flagNumber, hasFlag, runCli } from "./ops-cli";

void runCli(
  () =>
    runTranslate({
      dry: DRY,
      limit: flagNumber("--limit"),
      id: flagNumber("--id"),
      force: hasFlag("--force"),
    }),
  { failWhen: (r) => (r.counts.fallaron ?? 0) > 0 },
);
