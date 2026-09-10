/**
 * Report what the *production database* actually has, versus what the code needs
 * — the migration journal, the columns `src/db/schema.ts` declares, and whether
 * the D8 `owner` lead lane can be written.
 *
 * The reading is `readDatabaseStatus()` in `src/lib/ops/migrations.ts` (shared
 * with O2's health panel, so the two can never disagree); this file formats it
 * and owns the one thing that is not read-only, `--probe`.
 *
 * Why this exists: `drizzle/meta/_journal.json` lists every migration the repo
 * has generated. It says nothing about which of them ran against prod. README
 * documents pasting a migration into phpMyAdmin as an accepted path, and that
 * path does **not** record a row in `__drizzle_migrations`. So the journal and
 * the tracking table can disagree in both directions, and `npm run db:migrate`
 * decides what to run from the tracking table alone. Look before you fire —
 * there is no staging environment.
 *
 *   export DATABASE_URL="mysql://<user>:<pass>@<host>:3306/<db>"   # bash
 *   $env:DATABASE_URL = "mysql://<user>:<pass>@<host>:3306/<db>"   # PowerShell
 *   npm run db:status
 *
 * The read-only user is enough for everything above, and is what an agent gets
 * (see AGENTS.md). With `--probe` it additionally tries one INSERT of a
 * `routed_to = 'owner'` lead inside a transaction and **always rolls it back**,
 * which is the only way to prove the enum accepts the value end to end. That
 * needs write access, so the probe alone reads `DATABASE_URL_RW ?? DATABASE_URL`.
 * The rollback is in a `finally`, so it happens even if the insert throws.
 *
 *   npm run db:status -- --probe
 */
import mysql from "mysql2/promise";
import {
  driftCount,
  readDatabaseStatus,
  type DatabaseStatus,
} from "../src/lib/ops/migrations";

const url = process.env.DATABASE_URL ?? "";
if (!url) {
  console.error(
    "DATABASE_URL is not set.\n" +
      "tsx does not read .env automatically — set it in the shell first:\n" +
      '  PowerShell:  $env:DATABASE_URL = "mysql://user:pass@host:3306/db"\n' +
      '  bash:        export DATABASE_URL="mysql://user:pass@host:3306/db"',
  );
  process.exit(1);
}

const probe = process.argv.includes("--probe");

function report(status: DatabaseStatus): void {
  const { migrations: m, drift, ownerLane } = status;

  console.log(`\nConnected to ${m.target}`);
  console.log(`MySQL ${m.serverVersion}, database \`${m.database}\``);
  console.log(
    `sql_mode strict: ${
      m.sqlModeStrict
        ? "YES (bad value => error)"
        : "NO  (bad value => stored as '', warning only)"
    }`,
  );

  /* ---------------- migration tracking ---------------- */

  console.log("\n=== migrations ===");
  if (!m.journalReadable) {
    console.log(
      "drizzle/meta/_journal.json is not readable from " + process.cwd() + ".\n" +
        "Run this from the repository root. The drift section below needs no files\n" +
        "and is still authoritative.",
    );
  } else if (m.trackingSchema === null) {
    console.log(
      "No __drizzle_migrations table exists anywhere on this server.\n" +
        "Drizzle has never recorded a migration here. It does NOT follow that the\n" +
        "schema is empty — migrations pasted into phpMyAdmin leave no trace. Compare\n" +
        "the drift section below against drizzle/ before running db:migrate, because\n" +
        "db:migrate would replay every migration from 0000.",
    );
  } else {
    console.log(`tracking table: \`${m.trackingSchema}\`.__drizzle_migrations\n`);
    for (const e of m.entries) {
      console.log(
        `  ${e.applied ? "APPLIED " : "PENDING "} ${String(e.idx).padStart(4, "0")}  ${e.tag}` +
          (e.fileMissing ? "   <-- .sql file missing from drizzle/" : ""),
      );
    }
    /**
     * A recorded hash with no matching file means prod ran something this
     * checkout does not contain — a different branch, or an edited file.
     * db:migrate cannot reconcile that; a human has to.
     */
    if (m.orphanHashes > 0) {
      console.log(
        `\n  WARNING: ${m.orphanHashes} recorded migration(s) match no file in drizzle/.` +
          "\n  Production ran SQL this checkout does not have. Do not run db:migrate; investigate.",
      );
    }
    const pending = m.pending ?? 0;
    console.log(`\n  ${pending} pending, ${m.entries.length - pending} applied.`);
    if (pending > 0) {
      console.log("  `npm run db:migrate` runs ALL of the above PENDING rows, in order.");
    }
  }

  /* ---------------- schema drift ---------------- */

  console.log("\n=== schema drift (src/db/schema.ts vs this database) ===");
  console.log(
    `${drift.declaredTables} tables, ${drift.declaredColumns} columns declared in schema.ts.`,
  );

  if (driftCount(drift) === 0) {
    console.log("Every declared table, column and enum value is present. No drift.");
  }

  if (drift.missingTables.length > 0) {
    console.log(
      `\n  MISSING TABLES (${drift.missingTables.length}) — every query against these fails:`,
    );
    for (const t of drift.missingTables) console.log(`    ${t}`);
  }

  /**
   * The headline, and the reason this section exists. Drizzle names every column
   * of a table in its SELECT, so one column the database does not have is not a
   * broken feature — it is a 500 on every page that reads that table. This is
   * what to look at before merging a schema PR, and again right after running
   * db:migrate.
   */
  if (drift.missingColumns.length > 0) {
    console.log(
      `\n  MISSING COLUMNS (${drift.missingColumns.length}) — deployed code SELECTs these by name,\n` +
        "  so EVERY page that reads the table 500s until the migration runs:",
    );
    for (const col of drift.missingColumns) console.log(`    ${col}`);
  }

  if (drift.missingEnumValues.length > 0) {
    console.log(
      `\n  ENUM VALUES THE DATABASE WILL NOT ACCEPT (${drift.missingEnumValues.length}) — reads are fine;\n` +
        "  an INSERT or UPDATE using one of these fails, or on a non-strict server\n" +
        "  stores '' with a warning nobody reads:",
    );
    for (const v of drift.missingEnumValues) console.log(`    ${v}`);
  }

  /**
   * The two reconciliations that matter, because each means the migration list
   * above is lying and the fix is different in each direction.
   */
  if (m.pending === 0 && driftCount(drift) > 0) {
    console.log(
      "\n  WARNING: the tracking table says nothing is pending, yet the database is\n" +
        "  missing things schema.ts declares. Something applied a migration's row\n" +
        "  without its SQL, or the SQL was rolled back afterwards. `db:migrate` will\n" +
        "  do NOTHING here — this needs a human and hand-written DDL.",
    );
  } else if (m.pending !== null && m.pending > 0 && driftCount(drift) === 0) {
    console.log(
      "\n  Note: migrations are pending but nothing is missing — the schema changes\n" +
        "  were applied by hand (phpMyAdmin) without recording a row. `db:migrate`\n" +
        "  would replay them; read each pending file above before running it.",
    );
  }

  /* ---------------- the actual incident ---------------- */

  console.log("\n=== leads.routed_to (the D8 owner lane) ===");
  if (!ownerLane.columnFound) {
    console.log("No `leads.routed_to` column found. Is this the right database?");
  } else {
    console.log(`  leads.routed_to  ${ownerLane.columnType}`);
    console.log(
      `  accepts 'owner': ${
        ownerLane.acceptsOwner
          ? "YES — migration 0009 is applied"
          : "NO  — migration 0009 is NOT applied; FSBO leads are failing"
      }`,
    );
    /**
     * Only meaningful on a non-strict server, where the failed inserts did not
     * error but landed as ''. On a strict server this is correctly always 0 —
     * those leads never reached the table and are not recoverable from here.
     */
    if (ownerLane.truncatedRows > 0) {
      console.log(
        `\n  ${ownerLane.truncatedRows} lead row(s) have routed_to = '' — silently truncated writes.\n` +
          "  These are recoverable: after 0009 is applied, re-route the ones whose\n" +
          "  listing has no agent and no agency to 'owner'. Review before updating.",
      );
    }
  }
}

/**
 * The one write in this file, and it is undone in a `finally`. Deliberately not
 * reachable from `/admin` (see `src/lib/ops/migrations.ts`): a button that writes
 * to production to prove it can write to production is not a health check.
 */
async function runProbe(): Promise<void> {
  console.log("\n=== probe: INSERT routed_to='owner' (rolled back) ===");
  const c = await mysql.createConnection(process.env.DATABASE_URL_RW ?? url);
  let inserted = false;
  try {
    await c.beginTransaction();
    try {
      await c.query(
        `INSERT INTO leads (lead_type, vertical, whatsapp, name, message, routed_to)
         VALUES ('buyer', 'probe', '+000000000', 'migration probe', 'rolled back', 'owner')`,
      );
      inserted = true;
      const [warns] = (await c.query("SHOW WARNINGS")) as [
        Array<{ Message: string }>,
        unknown,
      ];
      for (const w of warns) console.log(`  warning: ${w.Message}`);
      console.log(
        warns.length === 0
          ? "  INSERT OK, no warnings — the owner lane works."
          : "  INSERT stored a value but MySQL warned; read the warning above.",
      );
    } catch (err) {
      console.log(`  INSERT FAILED: ${(err as Error).message}`);
      console.log("  The enum still does not accept 'owner'.");
    } finally {
      // Always. The probe must never leave a row behind in production.
      await c.rollback();
      if (inserted) console.log("  rolled back.");
    }
  } finally {
    await c.end();
  }
}

async function main() {
  report(await readDatabaseStatus(url));
  if (probe) {
    await runProbe();
  } else {
    console.log("\nRe-run with `-- --probe` to prove an owner-routed insert succeeds (rolled back).");
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
