/**
 * Display formatting — Paraguay conventions (es-PY: '.' thousands, ',' decimal)
 * by default. Prices show in their native currency; USD is the internal
 * filter unit and, on the Spanish doors, never what we show for a PYG-listed
 * property. The English marketplace doors are the one exception: a foreign
 * buyer thinks in dollars, so `displayPrice()` leads with the `price_usd`
 * equivalent, marked approximate, and keeps the Guaraní price beside it
 * (`usdFirstPrice()` in src/design/sections.ts decides which doors).
 *
 * A `numberLocale` parameter (default "es-PY") lets the English door format
 * the same figures `en-US` style — `US$ 145,000` rather than `US$ 145.000`
 * (docs/style/realestateinparaguay.com.md §3) — without touching the default
 * for every other caller that doesn't pass one.
 */
import { isSamplePhoto } from "./photos";

const nf =(locale: string) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

export function formatUsd(
  amount: number | string,
  numberLocale = "es-PY",
): string {
  return `US$ ${nf(numberLocale).format(Math.round(Number(amount)))}`;
}

export function formatGs(
  amount: number | string,
  numberLocale = "es-PY",
): string {
  return `Gs ${nf(numberLocale).format(Math.round(Number(amount)))}`;
}

/** Native-currency price line for a listing. */
export function formatPrice(
  l: {
    priceAmount: string | number;
    priceCurrency: "USD" | "PYG";
  },
  numberLocale = "es-PY",
): string {
  return l.priceCurrency === "USD"
    ? formatUsd(l.priceAmount, numberLocale)
    : formatGs(l.priceAmount, numberLocale);
}

/**
 * EUR per 1 USD from `USD_EUR_RATE` (hPanel, server-side, read at runtime).
 * A plain decimal in 0.5–1.5; anything else — unset, empty, "0,92", "1e0",
 * out of range — is `null`, and a `null` rate means no EUR option anywhere.
 * The rate is updated by hand, so every EUR figure is shown as approximate.
 */
export const USD_EUR_MIN = 0.5;
export const USD_EUR_MAX = 1.5;

export function parseUsdEurRate(raw: string | null | undefined): number | null {
  const s = raw?.trim();
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= USD_EUR_MIN && n <= USD_EUR_MAX ? n : null;
}

/**
 * EUR rounding for an approximate figure: to the nearest €1,000 from
 * €100,000, to the nearest €100 from €10,000, to the nearest €10 below that
 * (a monthly rent included). Precision the conversion does not have would
 * read as a quote.
 */
export function roundEur(eur: number): number {
  const a = Math.abs(eur);
  const step = a >= 100_000 ? 1_000 : a >= 10_000 ? 100 : 10;
  return Math.round(eur / step) * step;
}

export function formatEur(eur: number, numberLocale = "en-US"): string {
  return `€${nf(numberLocale).format(roundEur(eur))}`;
}

export interface DoorPrice {
  /** The headline figure, e.g. "US$ 145,000", "≈ US$ 68,500" or "Gs 500.000.000". */
  main: string;
  /** The currency tag beside it. */
  currency: "USD" | "PYG";
  /** The listed price for a second line when `main` is a conversion (Guaraní listings). */
  listed: string | null;
  /** The EUR alternative, when the door leads with US$ and a rate is configured. */
  eur: { main: string; listed: string } | null;
}

/**
 * The price a door shows for a listing.
 *
 * `usdFirst` false (every Spanish door): exactly `formatPrice()`, no EUR.
 * `usdFirst` true (the English marketplace doors): a USD listing is unchanged;
 * a Guaraní listing leads with its `price_usd` — the normalised figure the
 * filters already run on — passed through `approx` (the dictionary's "≈"), and
 * returns the listed Guaraní price as `listed` for a second line. A Guaraní
 * listing with no usable `price_usd` falls back to Guaraníes alone rather than
 * inventing a conversion.
 *
 * `price_usd` of a Guaraní listing was derived at the exchange rate stored when
 * it was written (`cron:price-usd` re-derives it), which is why it is only ever
 * shown as an approximation and never without the listed price next to it.
 *
 * With `eurRate` (from `USD_EUR_RATE`, `usdFirst` doors only) the same US$
 * figure also comes back in euros — always approximate, always rounded
 * (`roundEur()`), `en-US` formatted — with the listed price, in its own
 * currency, as its second line.
 */
export function displayPrice(
  l: {
    priceAmount: string | number;
    priceCurrency: "USD" | "PYG";
    priceUsd: string | number | null;
  },
  opts: {
    usdFirst: boolean;
    numberLocale: string;
    approx: (amount: string) => string;
    eurRate?: number | null;
  },
): DoorPrice {
  const usd =
    l.priceCurrency === "USD"
      ? Number(l.priceAmount)
      : l.priceUsd == null
        ? NaN
        : Number(l.priceUsd);
  const hasUsd = Number.isFinite(usd) && usd > 0;
  const eur =
    opts.usdFirst && hasUsd && opts.eurRate != null
      ? {
          main: opts.approx(formatEur(usd * opts.eurRate, "en-US")),
          listed: formatPrice(l, opts.numberLocale),
        }
      : null;
  if (opts.usdFirst && l.priceCurrency === "PYG" && hasUsd) {
    return {
      main: opts.approx(formatUsd(usd, opts.numberLocale)),
      currency: "USD",
      listed: formatGs(l.priceAmount, opts.numberLocale),
      eur,
    };
  }
  return { main: formatPrice(l, opts.numberLocale), currency: l.priceCurrency, listed: null, eur };
}

/**
 * m² → sq ft, English door only (docs/style/realestateinparaguay.com.md §3/§8):
 * `sqft = Math.round(m2 * 10.7639)`, `en-US` formatted.
 */
export function toSqft(m2: number): number {
  return Math.round(m2 * 10.7639);
}

export function formatSqft(m2: number): string {
  return `${nf("en-US").format(toSqft(m2))} sq ft`;
}

/** Compact cuota, e.g. "Gs 2,1 M/mes". Null-safe for missing cuota. */
export function formatCuota(cuotaGs: string | number | null): string | null {
  if (cuotaGs == null) return null;
  const n = Number(cuotaGs);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 1_000_000) {
    const millions = (n / 1_000_000).toFixed(1).replace(".", ",");
    return `Gs ${millions} M/mes`;
  }
  return `${formatGs(n)}/mes`;
}

/** Public R2 URL for a stored image key (empty base → key passthrough). */
export function imageUrl(r2Key: string | null): string | null {
  if (!r2Key) return null;
  if (/^https?:\/\//i.test(r2Key)) return r2Key;
  const base = process.env.R2_PUBLIC_BASE_URL ?? "";
  return base ? `${base.replace(/\/$/, "")}/${r2Key}` : r2Key;
}

/**
 * Card-sized derivative of a stored key (~480px). Mirrors `thumbKey()` in
 * lib/images.ts — the two must agree, since one writes the object and the
 * other addresses it.
 *
 * Only keys we uploaded have a thumb: imported placeholders are still remote
 * URLs, so those fall back to the original rather than 404ing a grid of cards.
 * The one absolute URL that does have a thumb is a sample photo
 * (`seed:sample-photos` stores `<base>/img/sample/listings/<file>.webp`), and
 * every file there ships with its `-thumb.webp` (~45 KB instead of ~230 KB).
 */
export function imageThumbUrl(r2Key: string | null): string | null {
  if (!r2Key) return null;
  if (/^https?:\/\//i.test(r2Key)) {
    return isSamplePhoto(r2Key) ? r2Key.replace(/(?<!-thumb)\.webp$/, "-thumb.webp") : r2Key;
  }
  if (!/\.webp$/.test(r2Key)) return imageUrl(r2Key);
  return imageUrl(r2Key.replace(/\.webp$/, "-thumb.webp"));
}
