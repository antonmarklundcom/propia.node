/**
 * Writes the fixture the sort specs need: 60 published venta listings in one
 * barrio, so the category page has a second page (PAGE_SIZE is 48) and prices
 * repeat (three listings per price) so an unstable ORDER BY shows up as a
 * duplicated or missing card across pages.
 *
 * Goes through the real importer, so it is idempotent: a second run reports
 * `sin_cambio`. It WRITES, so it refuses any database that is not localhost.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const FIXTURE_PATH = "/venta/asuncion";
export const FIXTURE_COUNT = 60;

const HEADER =
  "operation,property_type,title,description_es,price_amount,price_currency,bedrooms,bathrooms,parking,area_m2,land_m2,property_state,location_full_slug,location_name,address_text,lat,lng,contact_phone,source_external_id,source_url,image_urls";

function fixtureCsv(): string {
  const rows = [HEADER];
  for (let i = 0; i < FIXTURE_COUNT; i++) {
    const n = String(i + 1).padStart(2, "0");
    // 20 distinct prices, each used by three listings.
    const price = 50000 + (i % 20) * 1500;
    rows.push(
      [
        "venta",
        "casa",
        `Sort fixture ${n}`,
        "Aviso de prueba para el orden por precio.",
        price,
        "USD",
        3,
        2,
        1,
        100 + i,
        "",
        "usado",
        "asuncion/villa-morra",
        "",
        "",
        "",
        "",
        `0981${String(200000 + i)}`,
        `SORTFX-${n}`,
        "",
        "",
      ].join(","),
    );
  }
  return rows.join("\n") + "\n";
}

export default function globalSetup() {
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // fall through to the refusal below
  }
  if (host !== "localhost" && host !== "127.0.0.1") {
    throw new Error(
      "e2e global setup writes fixture listings and only runs against a local database. " +
        "Set DATABASE_URL to a localhost MySQL (see playwright.config.ts).",
    );
  }

  const dir = mkdtempSync(join(tmpdir(), "propia-e2e-"));
  const file = join(dir, "sort-fixture.csv");
  writeFileSync(file, fixtureCsv(), "utf8");

  const res = spawnSync(
    "npm",
    ["run", "import:csv", "--", file, "whiteglove", "--publish"],
    { encoding: "utf8", shell: true, env: process.env },
  );
  if (res.status !== 0) {
    throw new Error(`fixture import failed:\n${res.stdout}\n${res.stderr}`);
  }
  console.log(`[e2e] fixture import:\n${res.stdout}`);
}
