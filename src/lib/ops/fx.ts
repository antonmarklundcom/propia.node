/**
 * Fetch the USD→PYG exchange rate and record it (backlog #2, 2026-09-05).
 *
 * Run the dry form first: this is the app's only source of truth for `cuota_gs`
 * and every price conversion in the publish wizard once it has run at least once
 * (see `src/lib/fx.ts`). Free tier, no API key: open.er-api.com/v6/latest/USD.
 *
 * Every run inserts a new row rather than updating one in place (`fx_rates` is
 * append-only, see `schema.ts`) — a bad fetch from a flaky day is a row to
 * ignore, never a value overwritten with nothing to fall back to.
 *
 * The free API tier itself only refreshes once every 24 h, so anything more
 * frequent than a daily schedule would just re-record the same number.
 *
 * A failed fetch **throws**. It is the one job whose failure means "the outside
 * world did not answer", and a runner that swallowed that would leave the
 * operator reading "0 rows written" as if nothing needed doing.
 */
import "server-only";
import { db } from "@/db";
import { fxRates } from "@/db/schema";
import { getLatestFxRateRaw } from "@/lib/fx";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

const RATE_API_URL = "https://open.er-api.com/v6/latest/USD";
const QUOTE_CURRENCY = "PYG";
/** The request must not outlive an operator staring at a spinner. */
const FETCH_TIMEOUT_MS = 15_000;

interface RateApiResponse {
  result: string;
  rates?: Record<string, number>;
  "error-type"?: string;
}

export async function runFx(opts: OpsOptions): Promise<OpsResult> {
  return opsRun("cron:fx", opts.dry, async (out) => {
    const res = await fetch(RATE_API_URL, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`open.er-api.com returned HTTP ${res.status}`);

    const body = (await res.json()) as RateApiResponse;
    if (body.result !== "success" || !body.rates) {
      throw new Error(`open.er-api.com error: ${body["error-type"] ?? "unknown"}`);
    }
    const rate = body.rates[QUOTE_CURRENCY];
    if (!rate || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(`no usable ${QUOTE_CURRENCY} rate in response`);
    }

    const previous = await getLatestFxRateRaw(QUOTE_CURRENCY);
    const deltaPct =
      previous != null ? (((rate - previous) / previous) * 100).toFixed(2) : null;

    out.note(
      `USD → ${QUOTE_CURRENCY}: ${rate}` +
        (previous != null
          ? ` (previous ${previous}, ${deltaPct}%)`
          : " (no previous rate on file)"),
    );

    /**
     * Counted in both modes, because `counts` means "what this call changes or
     * would change" — a dry run reporting 0 rows would read as "nothing to do".
     */
    out.count("filas");

    if (opts.dry) {
      out.note("--dry: nothing written.");
      return;
    }

    await db.insert(fxRates).values({
      quoteCurrency: QUOTE_CURRENCY,
      rate: rate.toFixed(4),
      source: "open.er-api.com",
      fetchedAt: new Date(),
    });
  });
}
