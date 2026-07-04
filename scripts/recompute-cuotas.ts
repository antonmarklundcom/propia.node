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

// USD→PYG for converting normalized priceUsd into the Gs the programs use.
// Overridable so a treasury feed can drive it later; default is a stable
// mid-market figure — cuota is indicative, not a quote.
const USD_TO_PYG = Number(process.env.USD_TO_PYG ?? 7300);

async function main() {
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
    console.log("no active financing programs — nothing to compute");
    process.exit(0);
  }

  const rows = await db
    .select({ id: listings.id, priceUsd: listings.priceUsd })
    .from(listings)
    .where(eq(listings.operation, "venta"));

  let updated = 0;
  for (const row of rows) {
    const priceGs = Number(row.priceUsd) * USD_TO_PYG;
    const result = bestCuota(priceGs, programs);
    const cuotaGs = result ? result.monthlyGs.toString() : null;
    await db
      .update(listings)
      .set({ cuotaGs })
      .where(eq(listings.id, row.id));
    updated++;
  }

  console.log(`recomputed cuota for ${updated} venta listings`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
