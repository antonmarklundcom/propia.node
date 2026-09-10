/**
 * Market medians job (ARCHITECTURE.md §2.6, §4) — powers the "precio mediano en
 * {barrio}" context module and the `/precios` pages. Computes the median price
 * and price/m² per (location × property_type × operation) for the current month
 * from published listings.
 *
 * Median is computed in JS (trivial at this scale, keeps the SQL portable — no
 * MySQL-specific window/percentile functions). The context module only renders a
 * group when `sample_size >= 8`, but every non-empty group is stored so
 * `/precios` can show sparser cells with a caveat.
 *
 * Cache: `market-medians` is the one tag with no writer (`src/lib/cache.ts`
 * explains why) — its TTL is the whole invalidation story, so neither this
 * runner nor a caller of it has a `revalidate*` to call.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listings, marketMedians } from "@/db/schema";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The context module's floor — reported so the dry run says what will be visible. */
const RENDER_THRESHOLD = 8;

interface Bucket {
  locationId: number;
  propertyType: string;
  operation: string;
  prices: number[];
  pricesM2: number[];
}

export async function runMedians(opts: OpsOptions): Promise<OpsResult> {
  return opsRun("cron:medians", opts.dry, async (out) => {
    const period = currentPeriod();
    out.note(`period ${period}`);

    const rows = await db
      .select({
        locationId: listings.locationId,
        propertyType: listings.propertyType,
        operation: listings.operation,
        priceUsd: listings.priceUsd,
        areaM2: listings.areaM2,
        landM2: listings.landM2,
      })
      .from(listings)
      .where(eq(listings.status, "published"));

    out.count("avisos_publicados", rows.length);

    const buckets = new Map<string, Bucket>();
    for (const r of rows) {
      const key = `${r.locationId}|${r.propertyType}|${r.operation}`;
      let b = buckets.get(key);
      if (!b) {
        b = {
          locationId: r.locationId,
          propertyType: r.propertyType,
          operation: r.operation,
          prices: [],
          pricesM2: [],
        };
        buckets.set(key, b);
      }
      const price = Number(r.priceUsd);
      b.prices.push(price);
      // Built area for structures, lot area for terreno; skip when area unknown.
      const area = r.areaM2 != null ? Number(r.areaM2) : Number(r.landM2 ?? 0);
      if (area > 0) b.pricesM2.push(price / area);
    }

    out.track("grupos", "grupos_visibles", "escritos");

    for (const b of buckets.values()) {
      out.count("grupos");
      if (b.prices.length >= RENDER_THRESHOLD) out.count("grupos_visibles");

      const medianPriceUsd = median(b.prices);
      const medianPriceM2Usd = median(b.pricesM2);
      const values = {
        period,
        locationId: b.locationId,
        propertyType: b.propertyType,
        operation: b.operation,
        medianPriceUsd: medianPriceUsd != null ? medianPriceUsd.toFixed(2) : null,
        medianPriceM2Usd:
          medianPriceM2Usd != null ? medianPriceM2Usd.toFixed(2) : null,
        sampleSize: b.prices.length,
        // The m² median's own sample — only listings that had an area. Reusing
        // the price count claimed 40 data points behind a number from 2 (F16).
        sampleSizeM2: b.pricesM2.length,
        source: "own" as const,
      };

      if (!opts.dry) {
        await db
          .insert(marketMedians)
          .values(values)
          .onDuplicateKeyUpdate({
            set: {
              medianPriceUsd: values.medianPriceUsd,
              medianPriceM2Usd: values.medianPriceM2Usd,
              sampleSize: values.sampleSize,
              sampleSizeM2: values.sampleSizeM2,
              source: values.source,
            },
          });
      }
      out.count("escritos");
    }

    out.note(
      `groups with at least ${RENDER_THRESHOLD} listings are the ones the context ` +
        "module renders; the rest are stored for /precios with a caveat.",
    );
    if (opts.dry) out.note("--dry: nothing written.");
  });
}
