/**
 * Display formatting — Paraguay conventions (es-PY: '.' thousands, ',' decimal).
 * Prices show in their native currency; USD is the internal filter unit but is
 * never what we show for a PYG-listed property.
 */
const nfInt = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 });

export function formatUsd(amount: number | string): string {
  return `US$ ${nfInt.format(Math.round(Number(amount)))}`;
}

export function formatGs(amount: number | string): string {
  return `Gs ${nfInt.format(Math.round(Number(amount)))}`;
}

/** Native-currency price line for a listing. */
export function formatPrice(l: {
  priceAmount: string | number;
  priceCurrency: "USD" | "PYG";
}): string {
  return l.priceCurrency === "USD"
    ? formatUsd(l.priceAmount)
    : formatGs(l.priceAmount);
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
