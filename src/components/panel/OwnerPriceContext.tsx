import { esA2 } from "@/i18n/es-a2";
import { formatUsd } from "@/lib/format";
import type { OwnerPriceContext as Context } from "@/lib/owner-price-context";

/** 'YYYY-MM' → "julio de 2026" (a date, not copy: formatted by locale). */
function periodLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return period;
  return new Intl.DateTimeFormat("es-PY", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/**
 * The owner's price per m² next to the zone median (A2 Owner 6). Renders only
 * when getOwnerPriceContext() found a defensible median; worded as a
 * comparison, never as advice.
 */
export function OwnerPriceContext({ context }: { context: Context }) {
  const pct = Math.abs(context.diffPct);
  const verdict =
    pct <= 2
      ? esA2.priceEqual
      : context.diffPct > 0
        ? esA2.priceAbove(pct)
        : esA2.priceBelow(pct);

  return (
    <article className="panel-card owner-price">
      <h3 className="panel-section__title">{esA2.priceTitle}</h3>
      <dl className="owner-price__figures">
        <div>
          <dt className="auth-field__label">{esA2.priceYours}</dt>
          <dd>{formatUsd(context.listingPerM2Usd)}</dd>
        </div>
        <div>
          <dt className="auth-field__label">{esA2.priceMedian(context.zoneName)}</dt>
          <dd>{formatUsd(context.medianPerM2Usd)}</dd>
          <p className="owner-price__meta">
            {esA2.priceSample(context.sample, periodLabel(context.period))}
          </p>
        </div>
      </dl>
      <p>{verdict}</p>
      {context.converted ? (
        <p className="owner-price__meta">{esA2.priceConverted}</p>
      ) : null}
      <p className="owner-price__meta">{esA2.priceDisclaimer}</p>
    </article>
  );
}
