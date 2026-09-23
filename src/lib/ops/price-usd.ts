/**
 * Re-derive `listings.price_usd` for Guaraní-priced listings from the current
 * USD → PYG rate.
 *
 * `price_usd` is the normalized column every price filter, the sort, the
 * medians and the cuota read (`toPriceUsd()` in `src/lib/import/normalize.ts`).
 * For a PYG listing it is computed once, at write time, with whatever rate was
 * current then, and nothing ever moved it again. So when the rate changes (the
 * founder set 1 USD = 6000 Gs on 2026-09-22 with `cron:fx -- --rate 6000`, while
 * the demo rows were written at 7300), two things go quietly wrong:
 *
 * - **The cuota.** `cron:cuotas` rebuilds the Gs price as `price_usd × rate`,
 *   so a row stored at 7300 and read back at 6000 quotes a monthly payment on
 *   82% of its real price.
 * - **The filters.** "Hasta US$ 100.000" includes or excludes a Gs listing by a
 *   dollar figure from an old rate.
 *
 * The rule this applies is the plan's (`docs/plan-next-work-2026-09-22.md` §4):
 * the stored USD of a Guaraní listing follows `fx_rates`. USD-priced rows are
 * never touched: their `price_usd` is their own price.
 *
 * Order: `cron:fx` → **`cron:price-usd`** → `cron:cuotas`.
 *
 * The write is a raw UPDATE of the one column, like `cron:geo`: `updatedAt`
 * carries a JS-side `$onUpdate`, and a re-derivation the seller did not make
 * must not move a listing's sitemap `lastmod`. The runner never calls
 * `revalidateListings()` (see `cuotas.ts`); the `/admin` action owns that.
 */
import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { ENV_FALLBACK_USD_TO_PYG, getLatestFxRateRaw } from "@/lib/fx";
import { toPriceUsd } from "@/lib/import/normalize";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

/** How many changed listings the notes name before collapsing to a count. */
const SAMPLE = 10;

export async function runPriceUsd(opts: OpsOptions): Promise<OpsResult> {
  return opsRun("cron:price-usd", opts.dry, async (out) => {
    // The same rate cron:cuotas reads, the same way: raw (no Next.js data
    // cache under tsx), env fallback only when cron:fx has never run.
    const fxRate = await getLatestFxRateRaw("PYG");
    const usdToPyg = fxRate ?? ENV_FALLBACK_USD_TO_PYG;
    out.note(
      fxRate != null
        ? `USD → PYG ${usdToPyg} (latest fx_rates row).`
        : `USD → PYG ${usdToPyg} (USD_TO_PYG fallback — cron:fx has never run).`,
    );

    const rows = await db
      .select({
        id: listings.id,
        publicId: listings.publicId,
        priceAmount: listings.priceAmount,
        priceUsd: listings.priceUsd,
      })
      .from(listings)
      .where(eq(listings.priceCurrency, "PYG"));

    out.count("avisos_en_guaranies", rows.length);
    out.track("cambian", "sin_cambio");

    let sampled = 0;
    for (const row of rows) {
      const next = toPriceUsd(Number(row.priceAmount), "PYG", usdToPyg).toFixed(2);
      if (Number(next) === Number(row.priceUsd)) {
        out.count("sin_cambio");
        continue;
      }

      out.count("cambian");
      if (sampled < SAMPLE) {
        sampled++;
        out.note(`  ${row.publicId}: US$ ${row.priceUsd} → US$ ${next}`);
      }

      if (!opts.dry) {
        await db.execute(
          sql`update listings set price_usd = ${next} where id = ${row.id}`,
        );
      }
    }

    if (opts.dry) out.note("--dry: nothing written.");
    else out.note("Next: npm run cron:cuotas — cuotas are derived from price_usd.");
  });
}
