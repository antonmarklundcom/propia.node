import type { Metadata } from "next";
import Link from "next/link";
import { currentLocale, dict } from "@/i18n/server";
import { numberLocaleFor } from "@/i18n";
import { getListingCardsByPublicIds, locationChain } from "@/lib/queries";
import { parseIdsParam } from "@/lib/saved-listings";
import { formatCuota, formatPrice, formatUsd, imageThumbUrl } from "@/lib/format";
import { isPlaceholderPhoto } from "@/lib/photos";
import { listingUrl } from "@/lib/urls";
import { currentVertical } from "@/lib/vertical-context";
import { showCuota } from "@/design/sections";
import { PageHero } from "@/components/MarketingUI";
import { ClearSavedButton, RemoveSavedButton, SavedIdsSync } from "@/components/SavedListings";

/**
 * Compare up to three listings (plan-build-2026-09-26 A3, Seeker 6).
 *
 * Same URL contract as /favoritos: the tray lives in `propia:compare`, the
 * page renders `?ids=`, <SavedIdsSync> keeps them equal. `noindex`, and never
 * in a sitemap.
 *
 * The cuota row appears only where the door shows cuotas at all
 * (`showCuota()` — never the English door or the rental family), the same
 * rule the card and the detail page follow.
 */
type Props = { searchParams: Promise<{ ids?: string | string[] }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = (await dict()).a3.compare;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    robots: { index: false, follow: true },
  };
}

export default async function CompararPage({ searchParams }: Props) {
  const [{ ids: rawIds }, d, locale, vertical] = await Promise.all([
    searchParams,
    dict(),
    currentLocale(),
    currentVertical(),
  ]);
  const t = d.a3.compare;
  const numberLocale = numberLocaleFor(locale);
  const ids = parseIdsParam(rawIds, "compare");
  const cards = await getListingCardsByPublicIds(ids);
  const gone = ids.length - cards.length;
  const withCuota = showCuota(vertical.key);

  // Barrio and city per column — at most three chains, one query each.
  const zones = await Promise.all(
    cards.map(async (c) => {
      const chain = await locationChain(c.locationId);
      const barrio = chain.find((l) => l.level === "barrio");
      const city = chain.find((l) => l.level === "ciudad");
      return [barrio?.name, city?.name].filter(Boolean).join(", ");
    }),
  );

  const area = (n: string | number | null) =>
    n != null && Number(n) > 0 ? d.listing.factArea(Math.round(Number(n))) : t.missing;

  const columns = cards.map((c, i) => {
    // Land is priced on the lot, everything else on built area — the rule
    // the detail page's market context uses. USD/m² only for a USD sale: a
    // monthly rent per m² is not a price, and a Guaraní listing never shows USD.
    const basis = Number(c.propertyType === "terreno" ? (c.landM2 ?? c.areaM2) : (c.areaM2 ?? c.landM2));
    const perM2 =
      c.operation === "venta" && c.priceCurrency === "USD" && Number.isFinite(basis) && basis > 0
        ? formatUsd(Number(c.priceUsd) / basis, numberLocale)
        : t.missing;
    const cuota = withCuota && c.operation === "venta" ? formatCuota(c.cuotaGs) : null;
    return {
      card: c,
      title: locale === "en" ? (c.titleEn ?? c.title) : c.title,
      img: isPlaceholderPhoto(c.coverKey) ? null : imageThumbUrl(c.coverKey),
      price:
        formatPrice(c, numberLocale) + (c.operation !== "venta" ? d.publicUi.perMonth : ""),
      operation: d.card.operationBadge[c.operation],
      type: d.listing.typeSingular[c.propertyType] ?? c.propertyType,
      zone: zones[i] || t.missing,
      area: area(c.areaM2),
      land: area(c.landM2),
      perM2,
      bedrooms: c.bedrooms != null ? String(c.bedrooms) : t.missing,
      bathrooms: c.bathrooms != null ? String(c.bathrooms) : t.missing,
      cuota: cuota ?? t.missing,
    };
  });

  const rows: { label: string; key: keyof (typeof columns)[number] }[] = [
    { label: t.rowPrice, key: "price" },
    { label: t.rowOperation, key: "operation" },
    { label: t.rowType, key: "type" },
    { label: t.rowZone, key: "zone" },
    { label: t.rowArea, key: "area" },
    { label: t.rowLand, key: "land" },
    { label: t.rowUsdM2, key: "perM2" },
    { label: t.rowBedrooms, key: "bedrooms" },
    { label: t.rowBathrooms, key: "bathrooms" },
    ...(withCuota ? [{ label: t.rowCuota, key: "cuota" as const }] : []),
  ];

  return (
    <main className="saved-page">
      <SavedIdsSync list="compare" path="/comparar" urlIds={ids} />
      <PageHero kicker={t.kicker} title={t.title} subtitle={t.intro} />
      <section className="saved-page__body">
        {gone > 0 && <p className="saved-page__note">{t.unavailable(gone)}</p>}
        {columns.length === 0 ? (
          <div className="saved-page__empty">
            <p>{t.empty}</p>
            <Link className="ds-btn ds-btn--primary" href="/">
              {t.emptyCta}
            </Link>
          </div>
        ) : (
          <>
            {columns.length === 1 && <p className="saved-page__note">{t.needMore}</p>}
            <div className="compare-table__scroll">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th scope="col" className="compare-table__corner">
                      <span className="visually-hidden">{t.rowLabel}</span>
                    </th>
                    {columns.map((col) => (
                      <th scope="col" key={col.card.id} className="compare-table__head">
                        <Link href={listingUrl(col.card)} className="compare-table__link">
                          {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized
                              thumb derivative, same as ListingCard. */}
                          <img
                            className="compare-table__img"
                            src={col.img ?? "/img/listing-fallback.webp"}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            width={320}
                            height={240}
                          />
                          <span className="compare-table__title">{col.title}</span>
                        </Link>
                        <span className="compare-table__head-actions">
                          <Link href={listingUrl(col.card)}>{t.view}</Link>
                          <RemoveSavedButton list="compare" publicId={col.card.publicId} label={t.remove} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      {columns.map((col) => (
                        <td key={col.card.id}>{String(col[row.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="saved-page__foot">
              <ClearSavedButton list="compare" label={t.barClear} />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
