/**
 * Seed `financing_programs` with the Che Róga Porã / AFD terms. Idempotent
 * (upsert by `code`) — safe to re-run.
 *
 * **RATES ARE PLACEHOLDERS** (CLAUDE.md backlog 6). They feed `cron:cuotas`,
 * which caches `listings.cuota_gs`, which is printed on every venta card: wrong
 * rates are wrong money sitewide. Verifying them against published AFD/MUVH
 * terms is a research task, not a code task.
 *
 * Applying a change to a live database is two commands, in this order — the seed
 * writes the terms, the cron clears every cuota that was quoting the old ones:
 *
 *     npm run seed:financing && npm run cron:cuotas
 *
 * Skipping the second leaves stale `cuota_gs` values cached on listings, which is
 * worse than either state on its own: the card keeps printing a monthly payment
 * that nothing can reproduce. From O2 the operations page runs them as one action
 * for the same reason.
 */
import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { financingPrograms } from "@/db/schema";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

/**
 * The seeded terms. Editing this array and re-running is the intended way to
 * change a rate until S1 puts an editor on `/admin/financiamiento`.
 */
const PROGRAMS = [
  {
    code: "che_roga_pora",
    name: "Che Róga Porã",
    annualRate: "6.50",
    maxTermMonths: 360,
    maxAmountGs: "900000000",
    minDownPct: "0.00",
    /**
     * OFF BY DEFAULT (founder decision, 2026-08-16). Che Róga Porã is approved
     * per development, not per portal: quoting it on every venta listing implies
     * an eligibility the seller has not established. With this false,
     * `bestCuota()` skips it entirely and listings quote AFD or no cuota at all —
     * see `src/lib/cuota.ts`.
     *
     * The rate below stays because it is the programme's real term, not because
     * it is in use; it is still a PLACEHOLDER pending verification against
     * MUVH/AFD published terms. Re-enabling it site-wide by flipping this to true
     * is NOT the intended path — the intended path is per-project opt-in.
     */
    active: false,
  },
  {
    code: "afd_primera_vivienda",
    name: "AFD Mi Primera Vivienda",
    annualRate: "9.00",
    maxTermMonths: 300,
    maxAmountGs: "700000000",
    minDownPct: "10.00",
    active: true,
  },
];

export async function runSeedFinancing(opts: OpsOptions): Promise<OpsResult> {
  return opsRun("seed:financing", opts.dry, async (out) => {
    const existing = await db
      .select()
      .from(financingPrograms)
      .where(
        inArray(
          financingPrograms.code,
          PROGRAMS.map((p) => p.code),
        ),
      );
    const byCode = new Map(existing.map((r) => [r.code, r]));

    out.track("nuevos", "actualizados", "sin_cambio");

    for (const p of PROGRAMS) {
      const live = byCode.get(p.code);
      if (!live) {
        out.count("nuevos");
        out.note(`  ${p.code}: new (${p.annualRate}%, ${p.active ? "activo" : "inactivo"})`);
      } else {
        /**
         * Compared field by field rather than trusting the upsert's row count:
         * MySQL reports 2 affected rows for an update and 1 for an insert even
         * when every value is identical, so "did anything change?" cannot be read
         * off the write. The operator needs to know whether pressing this button
         * changes a rate — that is the difference between a no-op and every venta
         * card moving.
         */
        // Decimals are compared numerically: MySQL hands back a string padded to
        // the column's scale, so "900000000" and "900000000.00" are the same
        // number and a string compare would report a change on every run.
        const sameNumber = (a: string | null, b: string | null) =>
          a === b || (a != null && b != null && Number(a) === Number(b));

        const diffs: string[] = [];
        if (!sameNumber(live.annualRate, p.annualRate))
          diffs.push(`tasa ${live.annualRate}% → ${p.annualRate}%`);
        if (live.maxTermMonths !== p.maxTermMonths)
          diffs.push(`plazo ${live.maxTermMonths} → ${p.maxTermMonths}`);
        if (!sameNumber(live.maxAmountGs, p.maxAmountGs))
          diffs.push(`tope ${live.maxAmountGs ?? "sin tope"} → ${p.maxAmountGs}`);
        if (!sameNumber(live.minDownPct, p.minDownPct))
          diffs.push(`entrega ${live.minDownPct}% → ${p.minDownPct}%`);
        if (live.active !== p.active)
          diffs.push(`${live.active ? "activo" : "inactivo"} → ${p.active ? "activo" : "inactivo"}`);
        if (live.name !== p.name) diffs.push(`nombre "${live.name}" → "${p.name}"`);

        if (diffs.length === 0) {
          out.count("sin_cambio");
        } else {
          out.count("actualizados");
          out.note(`  ${p.code}: ${diffs.join(", ")}`);
        }
      }

      if (!opts.dry) {
        const now = new Date();
        await db
          .insert(financingPrograms)
          .values({ ...p, updatedAt: now })
          .onDuplicateKeyUpdate({ set: { ...p, updatedAt: now } });
      }
    }

    if (opts.dry) {
      out.note("--dry: nothing written.");
    } else {
      out.note(
        "Run cron:cuotas next — a changed rate leaves every cached cuota quoting the old one.",
      );
    }
  });
}
