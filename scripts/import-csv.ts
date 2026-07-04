/**
 * White-glove CSV import CLI (ARCHITECTURE.md §2.4, M2).
 *
 *   npx tsx scripts/import-csv.ts <file.csv> [source]
 *   npm run import:csv -- data/agency-x.csv whiteglove
 *
 * source defaults to 'whiteglove'. Imported listings land in pending_review;
 * approve them in Drizzle Studio (the interim admin). Re-running the same file
 * is safe — the dedup pipeline reports every row as unchanged.
 */
import { readFileSync } from "node:fs";
import { db } from "../src/db";
import { parseCsvRecords, recordToRaw } from "../src/lib/import/csv";
import { importListings } from "../src/lib/import/upsert";
import type { ListingSource, RawListing } from "../src/lib/import/types";

async function main() {
  const file = process.argv[2];
  const source = (process.argv[3] as ListingSource) || "whiteglove";
  if (!file) {
    console.error("usage: tsx scripts/import-csv.ts <file.csv> [source]");
    process.exit(1);
  }

  const records = parseCsvRecords(readFileSync(file, "utf8"));
  const rows: RawListing[] = [];
  const parseErrors: string[] = [];
  records.forEach((rec, i) => {
    try {
      rows.push(recordToRaw(rec, source));
    } catch (e) {
      parseErrors.push(`row ${i + 1}: ${String(e)}`);
    }
  });

  const report = await importListings(db, rows);
  console.log(
    `\nimport '${file}' (source=${source})\n` +
      `  created:   ${report.created}\n` +
      `  updated:   ${report.updated}\n` +
      `  unchanged: ${report.unchanged}\n` +
      `  deduped:   ${report.deduped}\n` +
      `  skipped:   ${report.skipped + parseErrors.length}`,
  );
  for (const e of parseErrors) console.log(`  parse ${e}`);
  for (const e of report.errors) console.log(`  skip  row ${e.row}: ${e.reason}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
