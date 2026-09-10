/**
 * USD→PYG exchange rate (backlog #2, 2026-09-05). `cron:fx`
 * (scripts/fetch-fx.ts) fetches open.er-api.com and inserts a row into
 * `fx_rates`; this module reads the latest one back. The `USD_TO_PYG` env var
 * is now only a last-resort fallback for a database `cron:fx` hasn't reached
 * yet — never the primary source once it has run at least once.
 *
 * No "server-only" import here on purpose: `scripts/recompute-cuotas.ts`
 * (also outside the Next.js runtime) needs the uncached raw read below, and a
 * "server-only" module cannot be imported from a plain tsx script either.
 */
import { unstable_cache } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { fxRates } from "../db/schema";
import { CACHE_TAGS, CACHE_TTL } from "./cache";

/**
 * Last resort, for a database `cron:fx` has never written to. Exported so a
 * caller that must *say* which source it used (`runCuotas` prints it) does not
 * re-spell the default and drift from it.
 */
export const ENV_FALLBACK_USD_TO_PYG = Number(process.env.USD_TO_PYG ?? 7300);

/**
 * Raw DB read, no cache — for callers outside the Next.js runtime
 * (`scripts/recompute-cuotas.ts`, `scripts/fetch-fx.ts` itself), where
 * `unstable_cache` has no cache handler to read from.
 */
export async function getLatestFxRateRaw(
  quoteCurrency = "PYG",
): Promise<number | null> {
  const [row] = await db
    .select({ rate: fxRates.rate })
    .from(fxRates)
    .where(eq(fxRates.quoteCurrency, quoteCurrency))
    .orderBy(desc(fxRates.fetchedAt))
    .limit(1);
  return row ? Number(row.rate) : null;
}

/**
 * The rate for a batch job: the raw read plus the same env fallback the cached
 * reader uses. Callers outside a request — the `src/lib/ops/` runners, which run
 * under `tsx` as well as in a server action — must use this rather than
 * `getUsdToPygRate()`: `unstable_cache` throws `Invariant: incrementalCache
 * missing` when there is no Next.js cache around it, which is what made
 * `npm run import:csv` fail before it read a single row.
 */
export async function getUsdToPygRateRaw(): Promise<number> {
  return (await getLatestFxRateRaw("PYG")) ?? ENV_FALLBACK_USD_TO_PYG;
}

const cachedFxRate = unstable_cache(
  async (): Promise<number | null> => getLatestFxRateRaw("PYG"),
  ["fx:usdToPyg"],
  { revalidate: CACHE_TTL.fx, tags: [CACHE_TAGS.fx] },
);

/**
 * USD→PYG for the app runtime (publish wizard, listing edit, import
 * writers). Falls back to the `USD_TO_PYG` env var only when `cron:fx` has
 * never written a row.
 */
export async function getUsdToPygRate(): Promise<number> {
  /**
   * Outside a Next.js server there is no incremental cache for
   * `unstable_cache` to read, and calling it throws `Invariant:
   * incrementalCache missing` — which is how `npm run verify:scopes` and
   * `verify:import`'s database half died partway through, and `import:csv`
   * before it read a row: each reaches app code (`updateListing`,
   * `planImport`) that legitimately wants the cached rate in a request.
   *
   * `NEXT_RUNTIME` is set by Next in both its runtimes and by nothing else, so
   * its absence is the discriminator. The fallback is the same read without the
   * cache around it, so the worst case in a request that somehow lacks the flag
   * is one extra query — never a wrong number.
   */
  if (!process.env.NEXT_RUNTIME) return getUsdToPygRateRaw();
  const rate = await cachedFxRate();
  return rate ?? ENV_FALLBACK_USD_TO_PYG;
}
