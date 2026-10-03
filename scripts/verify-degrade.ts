/**
 * Pure checks for the load-shedding helpers (src/lib/degrade.ts) and the
 * in-memory location lookups (src/lib/location-lookup.ts) — report
 * 2026-10-03 §C-2/§C-3. No DB, no network. In verify:local and the pre-push
 * hook.
 */
import { isPoolPressureError, loadAsides, settleLimited } from "../src/lib/degrade";
import { findBarrio, findCity, type LookupRow } from "../src/lib/location-lookup";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) {
    failed++;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  } else {
    console.log(`  ok    ${name}`);
  }
}

// Shaped like a Drizzle "Failed query" around a mysql2 error.
const pressure = () =>
  Object.assign(new Error("Failed query: select 1"), { cause: { code: "ER_CON_COUNT_ERROR", message: "Too many connections" } });
const sqlBug = () =>
  Object.assign(new Error("Failed query: select nope"), { cause: { code: "ER_BAD_FIELD_ERROR", message: "Unknown column" } });

async function main() {
  // Location lookups.
  const rows: LookupRow[] = [
    { id: 1, parentId: null, level: "ciudad", slug: "asuncion" },
    { id: 2, parentId: 1, level: "barrio", slug: "recoleta" },
    { id: 3, parentId: null, level: "ciudad", slug: "luque" },
    { id: 4, parentId: 3, level: "barrio", slug: "centro" },
    { id: 5, parentId: null, level: "departamento", slug: "central" },
    { id: 9, parentId: null, level: "ciudad", slug: "asuncion" },
  ];
  check("findCity: a ciudad by slug", findCity(rows, "luque")?.id === 3);
  check("findCity: a departamento slug is not a city", findCity(rows, "central") === null);
  check("findCity: an unknown slug is null", findCity(rows, "nowhere") === null);
  check("findCity: a duplicated slug resolves to the lowest id", findCity(rows, "asuncion")?.id === 1);
  check("findBarrio: a barrio under its city", findBarrio(rows, 1, "recoleta")?.id === 2);
  check("findBarrio: another city's barrio is not found", findBarrio(rows, 1, "centro") === null);
  check("findBarrio: a city slug is not a barrio", findBarrio(rows, 1, "luque") === null);

  // Classifying errors.
  check("a connection cap under a Drizzle wrapper is pool pressure", isPoolPressureError(pressure()));
  check("a SQL error is not pool pressure", !isPoolPressureError(sqlBug()));

  // Bounded concurrency.
  let running = 0;
  let peak = 0;
  const task = () => async () => {
    running++;
    peak = Math.max(peak, running);
    await new Promise((r) => setTimeout(r, 5));
    running--;
    return 1;
  };
  await settleLimited([task(), task(), task(), task(), task()], 2);
  check("settleLimited never runs more than its limit at once", peak === 2, String(peak));

  // Asides: partial, all-failed and hard failure.
  const fallback = { a: "fa", b: "fb", c: "fc" };
  const partial = await loadAsides("t", {
    a: async () => "A",
    b: async () => { throw pressure(); },
    c: async () => "C",
  }, fallback, 2);
  check("loadAsides: one section under pressure takes its fallback, the rest load", JSON.stringify(partial) === JSON.stringify({ a: "A", b: "fb", c: "C" }), JSON.stringify(partial));
  const allDown = await loadAsides("t", {
    a: async () => { throw pressure(); },
    b: async () => { throw pressure(); },
    c: async () => { throw pressure(); },
  }, fallback, 2);
  check("loadAsides: every section under pressure is the fallback, not a throw", JSON.stringify(allDown) === JSON.stringify(fallback));
  let threw = false;
  try {
    await loadAsides("t", { a: async () => "A", b: async () => { throw sqlBug(); }, c: async () => "C" }, fallback, 2);
  } catch {
    threw = true;
  }
  check("loadAsides: a real bug still throws", threw);

  if (failed) {
    console.error(`verify:degrade — ${failed} failure(s)`);
    process.exit(1);
  }
  console.log("verify:degrade — OK");
}

void main();
