/**
 * The USD→EUR rate for the English marketplace doors' EUR option.
 *
 * `USD_EUR_RATE` is a server-side env var (EUR per 1 USD, e.g. `0.92`), read
 * per request — deliberately not `NEXT_PUBLIC_*`, which is inlined at build
 * time: changing it in hPanel then needs only a restart, not a rebuild. It is
 * set by hand now and then, which is why every EUR figure is shown as an
 * approximation. Unset or invalid (`parseUsdEurRate()`) ⇒ `null` ⇒ no EUR
 * switch and no EUR amount anywhere.
 */
import "server-only";
import { parseUsdEurRate } from "./format";

export function usdEurRate(): number | null {
  return parseUsdEurRate(process.env.USD_EUR_RATE);
}
