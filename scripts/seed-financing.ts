/**
 * Seed financing_programs with current Che Róga Porã / AFD terms.
 * Idempotent (upsert by code) — safe to re-run from cron or by hand:
 *   npx tsx scripts/seed-financing.ts
 *
 * RATES ARE PLACEHOLDERS — verify against AFD/MUVH published terms before
 * launch and whenever they change; the nightly cuota cron reads this table.
 */
import { db } from "../src/db";
import { financingPrograms } from "../src/db/schema";

const PROGRAMS = [
  {
    code: "che_roga_pora",
    name: "Che Róga Porã",
    annualRate: "6.50",
    maxTermMonths: 360,
    maxAmountGs: "900000000",
    minDownPct: "0.00",
    active: true,
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

async function main() {
  for (const p of PROGRAMS) {
    await db
      .insert(financingPrograms)
      .values({ ...p, updatedAt: new Date() })
      .onDuplicateKeyUpdate({
        set: { ...p, updatedAt: new Date() },
      });
    console.log(`upserted ${p.code}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
