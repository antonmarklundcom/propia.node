/**
 * Nightly cuota recompute (ARCHITECTURE.md §2.6) — caches listings.cuota_gs
 * so the listing card renders "Gs 2.1M/mes con Che Róga Porã" at zero query
 * cost. Re-derived from priceUsd (always populated) so it's currency-agnostic.
 *
 * Only venta listings get a cuota (the financing programs are for purchase).
 * bestCuota() returns null when no program fits (e.g. over the cap) → we
 * clear the cached value and the card omits the line.
 *
 *   npx tsx scripts/recompute-cuotas.ts
 *
 * Wire as a Hostinger cron (daily) once M0 deploy is live.
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { listings, financingPrograms } from "../src/db/schema";
import { bestCuota, type FinancingProgram } from "../src/lib/cuota";
import { getLatestFxRateRaw } from "../src/lib/fx";

async function main() {
  // cron:fx's latest rate (raw, uncached — this script runs outside the
  // Next.js runtime, so unstable_cache has no cache handler to read from),
  // falling back to the USD_TO_PYG env var only when cron:fx has never run.
  const USD_TO_PYG =
    (await getLatestFxRateRaw("PYG")) ?? Number(process.env.USD_TO_PYG ?? 7300);

  const programRows = await db.select().from(financingPrograms);
  const programs: FinancingProgram[] = programRows.map((p) => ({
    code: p.code,
    name: p.name,
    annualRate: Number(p.annualRate),
    maxTermMonths: p.maxTermMonths,
    maxAmountGs: p.maxAmountGs != null ? Number(p.maxAmountGs) : null,
    minDownPct: Number(p.minDownPct),
    active: p.active,
  }));

  if (!programs.some((p) => p.active)) {
    // Keep going: with nothing active every cuota computes to NULL, and the
    // sweep below clears values still cached from a deactivated program.
    console.log("no active financing programs — clearing cached cuotas");
  }

  // Every listing, not just venta: a listing flipped venta→alquiler keeps its
  // stale purchase cuota otherwise (audit F15). Non-venta rows get NULL.
  const rows = await db
    .select({
      id: listings.id,
      operation: listings.operation,
      priceUsd: listings.priceUsd,
      cuotaGs: listings.cuotaGs,
    })
    .from(listings);

  let updated = 0;
  for (const row of rows) {
    let cuotaGs: string | null = null;
    if (row.operation === "venta") {
      const priceGs = Number(row.priceUsd) * USD_TO_PYG;
      const result = bestCuota(priceGs, programs);
      cuotaGs = result ? result.monthlyGs.toString() : null;
    }
    if (cuotaGs === row.cuotaGs) continue; // already right — skip the write
    await db
      .update(listings)
      .set({ cuotaGs })
      .where(eq(listings.id, row.id));
    updated++;
  }

  console.log(`recomputed cuota for ${updated} of ${rows.length} listings`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
