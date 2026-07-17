/**
 * EXPLAIN audit for M4's STOP gate (ARCHITECTURE.md §6: "every combination
 * hits an index"). Runs EXPLAIN against every representative filter shape
 * the app actually issues (src/lib/queries.ts categoryConds/filterConds/
 * bboxConds) and fails if MySQL would do a full table scan (type=ALL) or
 * pick no index (key=NULL) for any of them.
 *
 * Needs a real listings table to be meaningful — run against a DB seeded
 * with realistic volume, not an empty dev DB (an empty/near-empty table
 * often makes the optimizer choose a scan even when an index exists, which
 * isn't the failure mode this audit is checking for).
 *
 *   npx tsx scripts/explain-audit.ts
 */
import { db, pool } from "../src/db";
import { listings, locations } from "../src/db/schema";
import { eq } from "drizzle-orm";
import {
  categoryConds,
  filterConds,
  bboxConds,
  type CategoryQuery,
  type CategoryFilters,
} from "../src/lib/queries";

interface Case {
  name: string;
  build: () => Promise<{ sql: string; params: unknown[] }>;
}

async function firstCityId(): Promise<number> {
  const [row] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.level, "ciudad"))
    .limit(1);
  if (!row) throw new Error("no seeded ciudad location — run scripts/seed-locations.ts first");
  return row.id;
}

async function main() {
  const cityId = await firstCityId();
  const baseQuery: CategoryQuery = { operation: "venta", locationIds: [cityId] };
  const withType: CategoryQuery = { ...baseQuery, type: "casa" };
  const filters: CategoryFilters = { priceMin: 50_000, priceMax: 200_000, minBedrooms: 2 };

  const cases: Case[] = [
    {
      name: "category: city only",
      build: async () =>
        db.select({ id: listings.id }).from(listings).where(categoryConds(baseQuery)).toSQL(),
    },
    {
      name: "category: city + type",
      build: async () =>
        db.select({ id: listings.id }).from(listings).where(categoryConds(withType)).toSQL(),
    },
    {
      name: "category: city + type + price + bedrooms",
      build: async () =>
        db
          .select({ id: listings.id })
          .from(listings)
          .where(filterConds(withType, filters))
          .toSQL(),
    },
    {
      name: "map: bbox + operation + location",
      build: async () =>
        db
          .select({ id: listings.id })
          .from(listings)
          .where(
            bboxConds(
              { minLat: -25.4, maxLat: -25.2, minLng: -57.7, maxLng: -57.5 },
              baseQuery,
            ),
          )
          .toSQL(),
    },
    {
      name: "map: bbox + type + price",
      build: async () =>
        db
          .select({ id: listings.id })
          .from(listings)
          .where(
            bboxConds(
              { minLat: -25.4, maxLat: -25.2, minLng: -57.7, maxLng: -57.5 },
              withType,
              filters,
            ),
          )
          .toSQL(),
    },
  ];

  let failures = 0;
  for (const c of cases) {
    const { sql, params } = await c.build();
    const [rows] = await pool.query(`EXPLAIN ${sql}`, params);
    const plan = rows as Array<{
      table: string;
      type: string;
      possible_keys: string | null;
      key: string | null;
      rows: number;
      Extra: string | null;
    }>;
    const bad = plan.filter((r) => r.key == null || r.type === "ALL");
    if (bad.length > 0) failures++;
    console.log(`\n${bad.length > 0 ? "FAIL" : "ok  "} — ${c.name}`);
    for (const r of plan) {
      console.log(
        `  table=${r.table} type=${r.type} key=${r.key ?? "NULL"} rows=${r.rows} extra=${r.Extra ?? ""}`,
      );
    }
  }

  console.log(
    failures === 0
      ? `\nAll ${cases.length} query shapes hit an index.`
      : `\n${failures}/${cases.length} query shapes failed (full scan or no index) — see FAIL rows above.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit());
