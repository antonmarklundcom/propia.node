/**
 * Display formatting — Paraguay conventions (es-PY: '.' thousands, ',' decimal)
 * by default. Prices show in their native currency; USD is the internal
 * filter unit but is never what we show for a PYG-listed property.
 *
 * A `numberLocale` parameter (default "es-PY") lets the English door format
 * the same figures `en-US` style — `US$ 145,000` rather than `US$ 145.000`
 * (docs/style/realestateinparaguay.com.md §3) — without touching the default
 * for every other caller that doesn't pass one.
 */
const nf = (locale: string) =>
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
 */
export function imageThumbUrl(r2Key: string | null): string | null {
  if (!r2Key) return null;
  if (!/\.webp$/.test(r2Key)) return imageUrl(r2Key);
  return imageUrl(r2Key.replace(/\.webp$/, "-thumb.webp"));
}
