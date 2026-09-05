/**
 * Fetch the USD→PYG exchange rate and record it (backlog #2, 2026-09-05).
 *
 *   npm run cron:fx -- --dry
 *   npm run cron:fx
 *
 * `--dry` prints the fetched rate and writes nothing — run it first, since
 * this is the app's only source of truth for `cuota_gs` and every price
 * conversion in the publish wizard once it has run at least once (see
 * `src/lib/fx.ts`). Free tier, no API key: open.er-api.com/v6/latest/USD.
 *
 * Every run inserts a new row rather than updating one in place (`fx_rates`
 * is append-only, see schema.ts) — a bad fetch from a flaky day is a row to
 * ignore, never a value overwritten with nothing to fall back to.
 *
 * Wire as a daily Hostinger cron once this is reviewed and merged — the free
 * API tier itself only refreshes once every 24h, so anything more frequent
 * would just re-record the same number.
 */
import { db } from "../src/db";
import { fxRates } from "../src/db/schema";
import { getLatestFxRateRaw } from "../src/lib/fx";

const RATE_API_URL = "https://open.er-api.com/v6/latest/USD";
const QUOTE_CURRENCY = "PYG";

interface RateApiResponse {
  result: string;
  rates?: Record<string, number>;
  "error-type"?: string;
}

async function main() {
  const dryRun = process.argv.includes("--dry");

  const res = await fetch(RATE_API_URL);
  if (!res.ok) {
    console.error(`open.er-api.com returned HTTP ${res.status}`);
    process.exit(1);
  }
  const body = (await res.json()) as RateApiResponse;
  if (body.result !== "success" || !body.rates) {
    console.error(`open.er-api.com error: ${body["error-type"] ?? "unknown"}`);
    process.exit(1);
  }
  const rate = body.rates[QUOTE_CURRENCY];
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    console.error(`no usable ${QUOTE_CURRENCY} rate in response`);
    process.exit(1);
  }

  const previous = await getLatestFxRateRaw(QUOTE_CURRENCY);
  const deltaPct =
    previous != null ? (((rate - previous) / previous) * 100).toFixed(2) : null;

  console.log(
    `USD → ${QUOTE_CURRENCY}: ${rate}` +
      (previous != null ? ` (previous ${previous}, ${deltaPct}%)` : " (no previous rate on file)") +
      (dryRun ? "  [DRY RUN — not written]" : ""),
  );

  if (dryRun) {
    process.exit(0);
  }

  await db.insert(fxRates).values({
    quoteCurrency: QUOTE_CURRENCY,
    rate: rate.toFixed(4),
    source: "open.er-api.com",
    fetchedAt: new Date(),
  });

  console.log("recorded 1 fx_rates row");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
