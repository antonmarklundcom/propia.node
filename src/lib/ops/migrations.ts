/**
 * What the *database* actually has, versus what the code needs — read-only.
 *
 * This is the half of `npm run db:status` that answers questions rather than
 * prints them: `scripts/check-migrations.ts` formats what this returns and owns
 * the one thing that is not read-only, `--probe` (an `owner`-lane INSERT inside a
 * transaction that is always rolled back). The split exists so O2's health panel
 * can show "3 pending, 2 missing columns" without shelling out to a CLI or
 * re-implementing the comparison — **`--probe` is deliberately not reachable from
 * the UI**, because a button that writes to production to prove it can write to
 * production is not a health check.
 *
 * The migration list answers "did drizzle record running these?". That is a
 * proxy, and it can lie in both directions: README documents pasting a migration
 * into phpMyAdmin as an accepted path, and that path records nothing in
 * `__drizzle_migrations`, while a recorded hash with no matching file means prod
 * ran SQL this checkout does not contain. **The question that actually matters is
 * "does this database have what the deployed code selects"** — because drizzle
 * emits `SELECT` with every column in `schema.ts` named, so one missing column
 * 500s every page that reads that table, not just the feature that added it. That
 * is what `readSchemaDrift()` answers.
 *
 * It opens its own connection rather than using the app pool: the caller may be a
 * CLI pointed at production with a read-only user, and the target has to be
 * printable (redacted) before anything is run.
 */
import "server-only";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import mysql from "mysql2/promise";
import { is } from "drizzle-orm";
import { getTableConfig, MySqlTable } from "drizzle-orm/mysql-core";
import * as appSchema from "@/db/schema";

export interface MigrationEntry {
  idx: number;
  tag: string;
  /** A recorded hash matches this file's contents. */
  applied: boolean;
  /** The journal names a tag whose `.sql` is not in `drizzle/`. */
  fileMissing: boolean;
}

export interface MigrationStatus {
  /** `user@host:port/db` — never the password. */
  target: string;
  serverVersion: string;
  database: string;
  /**
   * Strict mode is the difference between a loud failure and a silent one. With
   * `STRICT_TRANS_TABLES` off, MySQL does not reject an out-of-range ENUM value —
   * it stores `''` and emits a warning nobody reads. That is the shape a "leads
   * vanish quietly" report takes.
   */
  sqlModeStrict: boolean;
  /** Where drizzle's tracking table lives, if anywhere on this server. */
  trackingSchema: string | null;
  entries: MigrationEntry[];
  /** `null` when no tracking table exists — not the same as "0 pending". */
  pending: number | null;
  /** Recorded migrations matching no file here: prod ran SQL this checkout lacks. */
  orphanHashes: number;
}

export interface SchemaDrift {
  declaredTables: number;
  declaredColumns: number;
  missingTables: string[];
  /** `table.column` — the headline: each one 500s every page reading that table. */
  missingColumns: string[];
  /** `table.column is missing 'value'` — reads fine, the INSERT that uses it fails. */
  missingEnumValues: string[];
}

export interface OwnerLaneStatus {
  /** false when there is no `leads.routed_to` column at all. */
  columnFound: boolean;
  columnType: string | null;
  acceptsOwner: boolean;
  /** Rows silently truncated to `''` on a non-strict server. Recoverable. */
  truncatedRows: number;
}

export interface DatabaseStatus {
  migrations: MigrationStatus;
  drift: SchemaDrift;
  ownerLane: OwnerLaneStatus;
}

/** Total number of things `schema.ts` declares that the database does not have. */
export function driftCount(drift: SchemaDrift): number {
  return (
    drift.missingTables.length +
    drift.missingColumns.length +
    drift.missingEnumValues.length
  );
}

type JournalEntry = { idx: number; when: number; tag: string };

/** Redact the password so the connection target can be printed safely. */
function describeTarget(raw: string): string {
  try {
    const u = new URL(raw);
    return `${u.username}@${u.hostname}:${u.port || "3306"}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

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

function readJournal(): JournalEntry[] {
  const journal: { entries: JournalEntry[] } = JSON.parse(
    readFileSync(join(process.cwd(), "drizzle", "meta", "_journal.json")).toString(),
  );
  return journal.entries;
}

/**
 * Everything `db:status` reports, minus the probe. One connection, only SELECTs.
 *
 * `url` defaults to `DATABASE_URL`; it is never `DATABASE_URL_RW`. Reading the
 * schema is exactly the job a read-only user exists for (`AGENTS.md`).
 */
export async function readDatabaseStatus(
  url: string = process.env.DATABASE_URL ?? "",
): Promise<DatabaseStatus> {
  if (!url) throw new Error("DATABASE_URL is not set.");

  const c = await mysql.createConnection(url);
  try {
    const [[server]] = (await c.query(
      "SELECT VERSION() AS version, DATABASE() AS db, @@sql_mode AS sql_mode",
    )) as [Array<{ version: string; db: string; sql_mode: string }>, unknown];

    /* ---------------- migration tracking ---------------- */

    const [tracking] = (await c.query(
      `SELECT table_schema FROM information_schema.tables
        WHERE table_name = '__drizzle_migrations'`,
    )) as [Array<{ table_schema: string }>, unknown];

    const journalEntries = readJournal();
    const trackingSchema = tracking[0]?.table_schema ?? null;

    let entries: MigrationEntry[] = journalEntries.map((e) => ({
      idx: e.idx,
      tag: e.tag,
      applied: false,
      fileMissing: hashOf(e.tag) === null,
    }));
    let pending: number | null = null;
    let orphanHashes = 0;

    if (trackingSchema) {
      const [rows] = (await c.query(
        `SELECT hash, created_at FROM \`${trackingSchema}\`.\`__drizzle_migrations\`
          ORDER BY created_at`,
      )) as [Array<{ hash: string; created_at: number | string }>, unknown];
      const recorded = new Set(rows.map((r) => r.hash));

      entries = journalEntries.map((e) => {
        const h = hashOf(e.tag);
        return {
          idx: e.idx,
          tag: e.tag,
          applied: h !== null && recorded.has(h),
          fileMissing: h === null,
        };
      });
      pending = entries.filter((e) => !e.applied).length;

      const known = new Set(
        journalEntries
          .map((e) => hashOf(e.tag))
          .filter((h): h is string => h !== null),
      );
      orphanHashes = rows.filter((r) => !known.has(r.hash)).length;
    }

    /* ---------------- schema drift ---------------- */

    /**
     * What `src/db/schema.ts` declares, flattened. Drizzle's own metadata, so it
     * cannot drift from what the ORM actually emits — the point of reading the
     * schema object rather than parsing the migrations.
     */
    const declared = Object.values(appSchema)
      .filter((v) => is(v, MySqlTable))
      .map((t) => getTableConfig(t as MySqlTable));

    const [liveCols] = (await c.query(
      `SELECT table_name, column_name, column_type FROM information_schema.columns
        WHERE table_schema = DATABASE()`,
    )) as [
      Array<{ table_name: string; column_name: string; column_type: string }>,
      unknown,
    ];

    const liveByTable = new Map<string, Map<string, string>>();
    for (const r of liveCols) {
      // information_schema casing follows the server's lower_case_table_names.
      const table = r.table_name.toLowerCase();
      if (!liveByTable.has(table)) liveByTable.set(table, new Map());
      liveByTable.get(table)!.set(r.column_name.toLowerCase(), r.column_type);
    }

    const drift: SchemaDrift = {
      declaredTables: declared.length,
      declaredColumns: 0,
      missingTables: [],
      missingColumns: [],
      missingEnumValues: [],
    };

    for (const t of declared) {
      drift.declaredColumns += t.columns.length;
      const cols = liveByTable.get(t.name.toLowerCase());
      if (!cols) {
        // Its columns are missing too, but naming 30 of them under a table that
        // does not exist is noise — the table line says it.
        drift.missingTables.push(t.name);
        continue;
      }
      for (const col of t.columns) {
        const liveType = cols.get(col.name.toLowerCase());
        if (liveType === undefined) {
          drift.missingColumns.push(`${t.name}.${col.name}`);
          continue;
        }
        /**
         * An enum the database is missing a value for is the D8 incident
         * generalised: the column exists, every SELECT is fine, and the one
         * INSERT that uses the new value fails (or, on a non-strict server,
         * silently stores '').
         */
        const values = (col as unknown as { enumValues?: string[] }).enumValues;
        if (Array.isArray(values) && liveType.startsWith("enum(")) {
          for (const v of values) {
            if (!liveType.includes(`'${v}'`)) {
              drift.missingEnumValues.push(`${t.name}.${col.name} is missing '${v}'`);
            }
          }
        }
      }
    }

    /* ---------------- the D8 owner lane ---------------- */

    const [routed] = (await c.query(
      `SELECT table_schema, column_type FROM information_schema.columns
        WHERE column_name = 'routed_to' AND table_name = 'leads'
          AND table_schema = DATABASE()`,
    )) as [Array<{ table_schema: string; column_type: string }>, unknown];

    const ownerLane: OwnerLaneStatus = {
      columnFound: routed.length > 0,
      columnType: routed[0]?.column_type ?? null,
      acceptsOwner: routed[0]?.column_type.includes("'owner'") ?? false,
      truncatedRows: 0,
    };

    if (routed[0]) {
      /**
       * Only meaningful on a non-strict server, where the failed inserts did not
       * error but landed as ''. On a strict server this is correctly always 0 —
       * those leads never reached the table and are not recoverable from here.
       */
      const [[bad]] = (await c.query(
        `SELECT COUNT(*) AS n FROM \`${routed[0].table_schema}\`.leads WHERE routed_to = ''`,
      )) as [Array<{ n: number }>, unknown];
      ownerLane.truncatedRows = Number(bad?.n ?? 0);
    }

    return {
      migrations: {
        target: describeTarget(url),
        serverVersion: server.version,
        database: server.db,
        sqlModeStrict: /STRICT_TRANS_TABLES|STRICT_ALL_TABLES/.test(server.sql_mode),
        trackingSchema,
        entries,
        pending,
        orphanHashes,
      },
      drift,
      ownerLane,
    };
  } finally {
    await c.end();
  }
}
