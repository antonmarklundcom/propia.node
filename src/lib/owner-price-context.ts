/**
 * "Precio por m² vs. mediana de <zona>" for the owner's own listing
 * (plan-build 2026-09-26, A2 Owner 6).
 *
 * Read from `market_medians` (the nightly `cron:medians` job), latest period,
 * same property type and operation. Two rules keep it honest, the same ones
 * /precios and /tasacion follow:
 *
 *  - **No number below MIN_RELIABLE_SAMPLE**, counted on the m² sample (the
 *    listings that actually had an area — audit F16), so a median derived from
 *    two listings is never shown as "the zone". The listing's own location is
 *    tried first; when its row is too thin the city subtree (city + barrios,
 *    sample-weighted, like the price pages) is the fallback, and the copy
 *    names whichever zone was actually used.
 *  - **A comparison, never advice.** The caller prints the two figures and the
 *    difference; nothing here suggests a price.
 *
 * Uncached on purpose: /mis-avisos is a private, per-owner, low-traffic page,
 * and the listing's own price must reflect the save the owner just made.
 */
import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { listings, marketMedians } from "@/db/schema";
import { listingScopeWhere, type EditScope } from "@/lib/listing-edit";
import { MIN_RELIABLE_SAMPLE, latestPeriod } from "@/lib/precios-queries";
import { citySubtreeIds, locationChain } from "@/lib/queries";

export interface OwnerPriceContext {
  listingPerM2Usd: number;
  medianPerM2Usd: number;
  /** The m² sample behind the median. */
  sample: number;
  /** 'YYYY-MM' — the medians period used. */
  period: string;
  zoneName: string;
  /** The listing is priced in guaraníes; its USD figure is the converted one. */
  converted: boolean;
  /** Rounded percentage difference, positive = above the median. */
  diffPct: number;
}

type MedianRow = {
  medianPriceM2Usd: string | null;
  sampleSize: number;
  sampleSizeM2: number;
};

/** Sample-weighted m² median over rows; rows before sample_size_m2 carry 0. */
function weighted(rows: MedianRow[]): { median: number; sample: number } | null {
  let sum = 0;
  let weight = 0;
  for (const r of rows) {
    if (r.medianPriceM2Usd == null) continue;
    const n = r.sampleSizeM2 > 0 ? r.sampleSizeM2 : r.sampleSize;
    sum += Number(r.medianPriceM2Usd) * n;
    weight += n;
  }
  if (weight < MIN_RELIABLE_SAMPLE) return null;
  return { median: sum / weight, sample: weight };
}

export async function getOwnerPriceContext(
  listingId: number,
  scope: EditScope,
): Promise<OwnerPriceContext | null> {
  const guard = listingScopeWhere(scope);
  const [listing] = await db
    .select({
      locationId: listings.locationId,
      propertyType: listings.propertyType,
      operation: listings.operation,
      priceUsd: listings.priceUsd,
      priceCurrency: listings.priceCurrency,
      areaM2: listings.areaM2,
      landM2: listings.landM2,
    })
    .from(listings)
    .where(guard ? and(eq(listings.id, listingId), guard) : eq(listings.id, listingId))
    .limit(1);
  if (!listing) return null;

  // The same area the medians job divides by (built area, else the lot), so
  // the two per-m² figures are measured the same way.
  const area = Number(listing.areaM2 ?? listing.landM2 ?? 0);
  const priceUsd = Number(listing.priceUsd);
  if (!(area > 0) || !(priceUsd > 0)) return null;

  const period = await latestPeriod();
  if (!period) return null;

  const cols = {
    medianPriceM2Usd: marketMedians.medianPriceM2Usd,
    sampleSize: marketMedians.sampleSize,
    sampleSizeM2: marketMedians.sampleSizeM2,
  };
  const sameBucket = and(
    eq(marketMedians.period, period),
    eq(marketMedians.propertyType, listing.propertyType),
    eq(marketMedians.operation, listing.operation),
  );

  const chain = await locationChain(listing.locationId);
  const own = chain[chain.length - 1];
  if (!own) return null;

  // 1. The listing's own location.
  let found = weighted(
    await db
      .select(cols)
      .from(marketMedians)
      .where(and(sameBucket, eq(marketMedians.locationId, own.id))),
  );
  let zoneName = own.name;

  // 2. Its city, barrios included, when the exact row is too thin.
  if (!found) {
    const city = chain.find((l) => l.level === "ciudad");
    if (city) {
      const ids = await citySubtreeIds(city.id);
      found = weighted(
        await db
          .select(cols)
          .from(marketMedians)
          .where(and(sameBucket, inArray(marketMedians.locationId, ids))),
      );
      zoneName = city.name;
    }
  }
  if (!found) return null;

  const listingPerM2Usd = priceUsd / area;
  return {
    listingPerM2Usd,
    medianPerM2Usd: found.median,
    sample: found.sample,
    period,
    zoneName,
    converted: listing.priceCurrency !== "USD",
    diffPct: Math.round((listingPerM2Usd / found.median - 1) * 100),
  };
}
