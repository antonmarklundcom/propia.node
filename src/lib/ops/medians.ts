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
 * Cache: the operations action calls revalidateMarketMedians() after a
 * successful real run. This shared CLI runner stays free of next/cache calls;
 * shell runs rely on the cache TTL.
 */
import "server-only";
import { and, eq } from "drizzle-orm";
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

    await db.transaction(async (tx) => {
      // Lock the period, including other writers' rows: source is deliberately
      // NOT part of the unique key. Never overwrite a blended row on collision.
      const existingQuery = tx
        .select()
        .from(marketMedians)
        .where(eq(marketMedians.period, period));
      // Preview needs only SELECT privileges and takes no write locks.
      const existing = await (opts.dry ? existingQuery : existingQuery.for("update"));
      const groupKey = (r: {
        locationId: number;
        propertyType: string;
        operation: string;
      }) =>
        `${r.locationId}|${r.propertyType}|${r.operation}`;
      const protectedKeys = new Set(
        existing.filter((r) => r.source !== "own").map(groupKey),
      );

      const rows = await tx
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
        const key = groupKey(r);
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

      out.track(
        "grupos", "grupos_visibles", "escritos",
        "reemplazados", "eliminados", "protegidos",
      );
      const fresh: (typeof marketMedians.$inferInsert)[] = [];

      for (const b of buckets.values()) {
        out.count("grupos");
        if (b.prices.length >= RENDER_THRESHOLD) out.count("grupos_visibles");
        if (protectedKeys.has(groupKey(b))) {
          out.count("protegidos");
          continue;
        }

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

        fresh.push(values);
        out.count("escritos");
      }

      for (const row of existing) {
        if (row.source !== "own") continue;
        out.count(buckets.has(groupKey(row)) ? "reemplazados" : "eliminados");
      }

      // Both modes plan the same replacement, even when there are no listings.
      // Plain INSERT ensures an unexpected ownership collision rolls back the
      // entire replacement instead of silently taking over another writer's row.
      if (!opts.dry) {
        await tx.delete(marketMedians).where(
          and(
            eq(marketMedians.period, period),
            eq(marketMedians.source, "own"),
          ),
        );
        for (const values of fresh) {
          await tx.insert(marketMedians).values(values);
        }
      }
    });

    out.note(
      "escritos: fresh own groups; reemplazados: existing own groups refreshed; " +
        "eliminados: empty own groups removed; protegidos: computed groups owned by another writer. " +
        "Counts describe the same plan in dry and real runs.",
    );
    out.note(
      `groups with at least ${RENDER_THRESHOLD} listings are the ones the context ` +
        "module renders; the rest are stored for /precios with a caveat.",
    );
    if (opts.dry) out.note("--dry: nothing written.");
  });
}
