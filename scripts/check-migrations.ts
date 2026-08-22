/**
 * Report what the *production database* actually has, versus what `drizzle/`
 * claims — and whether the D8 `owner` lead lane can be written.
 *
 * Why this exists: `drizzle/meta/_journal.json` lists every migration the repo
 * has generated. It says nothing about which of them ran against prod. README
 * step 2 documents pasting a migration into phpMyAdmin as an accepted path, and
 * that path does **not** record a row in `__drizzle_migrations`. So the journal
 * and the tracking table can disagree in both directions, and `npm run
 * db:migrate` decides what to run from the tracking table alone. Look before
 * you fire — there is no staging environment.
 *
 * Strictly read-only by default: it opens its own connection, runs SELECTs
 * against information_schema, and prints. It never migrates and never writes.
 *
 *   $env:DATABASE_URL = "mysql://<user>:<pass>@<host>:3306/<db>"   # PowerShell
 *   npm run db:status
 *
 * With `--probe` it additionally tries one INSERT of a `routed_to = 'owner'`
 * lead inside a transaction and **always rolls it back**, which is the only
 * way to prove the enum accepts the value end to end. The rollback is in a
 * `finally`, so it happens even if the insert throws.
 *
 *   npm run db:status -- --probe
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import mysql from "mysql2/promise";

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

/** Redact the password so the connection target can be printed safely. */
function describeTarget(raw: string): string {
  try {
    const u = new URL(raw);
    return `${u.username}@${u.hostname}:${u.port || "3306"}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

type JournalEntry = { idx: number; when: number; tag: string };

/**
 * The same hash drizzle-orm's migrator computes: sha256 over the **whole file
 * text**, before it is split on `--> statement-breakpoint`. Matching on this
 * rather than on the tag is what catches a migration file edited after it ran.
 */
function hashOf(tag: string): string | null {
  const path = join(process.cwd(), "drizzle", `${tag}.sql`);
  if (!existsSync(path)) return null;
  return createHash("sha256").update(readFileSync(path).toString()).digest("hex");
}

const journal: { entries: JournalEntry[] } = JSON.parse(
  readFileSync(join(process.cwd(), "drizzle", "meta", "_journal.json")).toString(),
);

async function main() {
  const c = await mysql.createConnection(url);

  try {
    console.log(`\nConnected to ${describeTarget(url)}`);

    const [[server]] = (await c.query(
      "SELECT VERSION() AS version, DATABASE() AS db, @@sql_mode AS sql_mode",
    )) as [Array<{ version: string; db: string; sql_mode: string }>, unknown];
    console.log(`MySQL ${server.version}, database \`${server.db}\``);

    /**
     * Strict mode is the difference between a loud failure and a silent one. With
     * STRICT_TRANS_TABLES off, MySQL does not reject an out-of-range ENUM value —
     * it stores '' and emits a warning nobody reads. That is the shape a "leads
     * vanish quietly" report takes, and it means there may be salvageable rows.
     */
    const strict = /STRICT_TRANS_TABLES|STRICT_ALL_TABLES/.test(server.sql_mode);
    console.log(`sql_mode strict: ${strict ? "YES (bad value => error)" : "NO  (bad value => stored as '', warning only)"}`);

    /* ---------------- migration tracking ---------------- */

    const [tracking] = (await c.query(
      `SELECT table_schema FROM information_schema.tables
        WHERE table_name = '__drizzle_migrations'`,
    )) as [Array<{ table_schema: string }>, unknown];

    console.log("\n=== migrations ===");
    if (tracking.length === 0) {
      console.log(
        "No __drizzle_migrations table exists anywhere on this server.\n" +
          "Drizzle has never recorded a migration here. It does NOT follow that the\n" +
          "schema is empty — migrations pasted into phpMyAdmin leave no trace. Compare\n" +
          "the table list below against drizzle/ before running db:migrate, because\n" +
          "db:migrate would replay every migration from 0000.",
      );
    } else {
      for (const t of tracking) {
        const [rows] = (await c.query(
          `SELECT hash, created_at FROM \`${t.table_schema}\`.\`__drizzle_migrations\`
            ORDER BY created_at`,
        )) as [Array<{ hash: string; created_at: number | string }>, unknown];

        const applied = new Set(rows.map((r) => r.hash));
        console.log(`tracking table: \`${t.table_schema}\`.__drizzle_migrations (${rows.length} rows)\n`);

        let pending = 0;
        for (const e of journal.entries) {
          const h = hashOf(e.tag);
          const known = h !== null && applied.has(h);
          if (!known) pending++;
          console.log(
            `  ${known ? "APPLIED " : "PENDING "} ${String(e.idx).padStart(4, "0")}  ${e.tag}` +
              (h === null ? "   <-- .sql file missing from drizzle/" : ""),
          );
        }

        /**
         * A recorded hash with no matching file means prod ran something this
         * checkout does not contain — a different branch, or an edited file.
         * db:migrate cannot reconcile that; a human has to.
         */
        const known = new Set(
          journal.entries.map((e) => hashOf(e.tag)).filter((h): h is string => h !== null),
        );
        const orphans = rows.filter((r) => !known.has(r.hash));
        if (orphans.length > 0) {
          console.log(
            `\n  WARNING: ${orphans.length} recorded migration(s) match no file in drizzle/.` +
              "\n  Production ran SQL this checkout does not have. Do not run db:migrate; investigate.",
          );
        }
        console.log(`\n  ${pending} pending, ${journal.entries.length - pending} applied.`);
        if (pending > 0) {
          console.log("  `npm run db:migrate` runs ALL of the above PENDING rows, in order.");
        }
      }
    }

    /* ---------------- the actual incident ---------------- */

    console.log("\n=== leads.routed_to (the D8 owner lane) ===");
    const [cols] = (await c.query(
      `SELECT table_schema, column_type, is_nullable FROM information_schema.columns
        WHERE column_name = 'routed_to' AND table_name = 'leads'`,
    )) as [Array<{ table_schema: string; column_type: string; is_nullable: string }>, unknown];

    if (cols.length === 0) {
      console.log("No `leads.routed_to` column found. Is this the right database?");
    }
    for (const col of cols) {
      const ok = col.column_type.includes("'owner'");
      console.log(`  \`${col.table_schema}\`.leads.routed_to  ${col.column_type}`);
      console.log(`  accepts 'owner': ${ok ? "YES — migration 0009 is applied" : "NO  — migration 0009 is NOT applied; FSBO leads are failing"}`);

      /**
       * Only meaningful on a non-strict server, where the failed inserts did not
       * error but landed as ''. On a strict server this is correctly always 0 —
       * those leads never reached the table and are not recoverable from here.
       */
      const [[bad]] = (await c.query(
        `SELECT COUNT(*) AS n FROM \`${col.table_schema}\`.leads WHERE routed_to = ''`,
      )) as [Array<{ n: number }>, unknown];
      if (bad.n > 0) {
        console.log(
          `\n  ${bad.n} lead row(s) have routed_to = '' — silently truncated writes.\n` +
            "  These are recoverable: after 0009 is applied, re-route the ones whose\n" +
            "  listing has no agent and no agency to 'owner'. Review before updating.",
        );
      }
    }

    /* ---------------- optional end-to-end proof ---------------- */

    if (probe) {
      console.log("\n=== probe: INSERT routed_to='owner' (rolled back) ===");
      const db = cols[0]?.table_schema;
      if (!db) {
        console.log("  skipped — no leads table located.");
      } else {
        let inserted = false;
        await c.beginTransaction();
        try {
          await c.query(
            `INSERT INTO \`${db}\`.leads (lead_type, vertical, whatsapp, name, message, routed_to)
             VALUES ('buyer', 'probe', '+000000000', 'migration probe', 'rolled back', 'owner')`,
          );
          inserted = true;
          const [warns] = (await c.query("SHOW WARNINGS")) as [Array<{ Message: string }>, unknown];
          for (const w of warns) console.log(`  warning: ${w.Message}`);
          console.log(warns.length === 0 ? "  INSERT OK, no warnings — the owner lane works." : "  INSERT stored a value but MySQL warned; read the warning above.");
        } catch (err) {
          console.log(`  INSERT FAILED: ${(err as Error).message}`);
          console.log("  The enum still does not accept 'owner'.");
        } finally {
          // Always. The probe must never leave a row behind in production.
          await c.rollback();
          if (inserted) console.log("  rolled back.");
        }
      }
    } else {
      console.log("\nRe-run with `-- --probe` to prove an owner-routed insert succeeds (rolled back).");
    }
  } finally {
    await c.end();
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
