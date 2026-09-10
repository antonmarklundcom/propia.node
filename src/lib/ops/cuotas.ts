/**
 * Nightly cuota recompute (ARCHITECTURE.md §2.6) — caches `listings.cuota_gs`
 * so the listing card renders "Gs 2.1M/mes con AFD Mi Primera Vivienda" at zero
 * query cost. Re-derived from `price_usd` (always populated) so it is
 * currency-agnostic.
 *
 * Only venta listings get a cuota (the financing programs are for purchase).
 * `bestCuota()` returns null when no program fits (e.g. over the cap) → the
 * cached value is cleared and the card omits the line. Every listing is walked,
 * not just venta: a listing flipped venta→alquiler keeps its stale purchase
 * cuota otherwise (audit F15).
 *
 * **Wrong rates are wrong money on every venta card** (CLAUDE.md backlog 6), so
 * the dry run counts exactly what the real run would change and names the first
 * few, rather than reporting a bare "ok".
 *
 * Cache: this runner never calls `revalidateListings()`. Under `tsx` there is no
 * cache handler to call it on, and inside a server action the *action* owns that
 * call — see `src/lib/cache.ts`.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listings, financingPrograms } from "@/db/schema";
import { bestCuota, type FinancingProgram } from "@/lib/cuota";
import { ENV_FALLBACK_USD_TO_PYG, getLatestFxRateRaw } from "@/lib/fx";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

/** How many changed listings the notes name before collapsing to a count. */
const SAMPLE = 10;

export async function runCuotas(opts: OpsOptions): Promise<OpsResult> {
  return opsRun("cron:cuotas", opts.dry, async (out) => {
    /**
     * `cron:fx`'s latest rate (raw, uncached — this runs outside the Next.js
     * data cache when invoked from `tsx`), falling back to the `USD_TO_PYG` env
     * var only when `cron:fx` has never run.
     */
    const fxRate = await getLatestFxRateRaw("PYG");
    const usdToPyg = fxRate ?? ENV_FALLBACK_USD_TO_PYG;
    out.note(
      fxRate != null
        ? `USD → PYG ${usdToPyg} (latest fx_rates row).`
        : `USD → PYG ${usdToPyg} (USD_TO_PYG fallback — cron:fx has never run).`,
    );

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

    const active = programs.filter((p) => p.active);
    out.count("programas_activos", active.length);
    if (active.length === 0) {
      // Keep going: with nothing active every cuota computes to NULL, and the
      // sweep below clears values still cached from a deactivated program.
      out.note(
        "No active financing program — every cached cuota is cleared. That is the " +
          "Che Róga Porã state (CLAUDE.md backlog 7), not an error.",
      );
    }

    const rows = await db
      .select({
        id: listings.id,
        publicId: listings.publicId,
        operation: listings.operation,
        priceUsd: listings.priceUsd,
        cuotaGs: listings.cuotaGs,
      })
      .from(listings);

    out.count("avisos", rows.length);
    out.track("cambian", "sin_cambio", "cuota_borrada");

    let sampled = 0;
    for (const row of rows) {
      let cuotaGs: string | null = null;
      if (row.operation === "venta") {
        const priceGs = Number(row.priceUsd) * usdToPyg;
        const result = bestCuota(priceGs, programs);
        cuotaGs = result ? result.monthlyGs.toString() : null;
      }

      if (cuotaGs === row.cuotaGs) {
        out.count("sin_cambio");
        continue; // already right — skip the write
      }

      out.count("cambian");
      if (cuotaGs === null) out.count("cuota_borrada");
      if (sampled < SAMPLE) {
        sampled++;
        out.note(
          `  ${row.publicId}: ${row.cuotaGs ?? "sin cuota"} → ${cuotaGs ?? "sin cuota"}`,
        );
      }

      if (!opts.dry) {
        await db.update(listings).set({ cuotaGs }).where(eq(listings.id, row.id));
      }
    }

    if (opts.dry) out.note("--dry: nothing written.");
  });
}
