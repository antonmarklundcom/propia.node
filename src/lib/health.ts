/**
 * What is wrong with the site right now, computed on demand — the "Salud"
 * section on `/admin` (`fable-plan-ops.md` §1.9).
 *
 * **Computed, never stored.** There is no health table and no writer to forget:
 * every number here is a `count(*)` or a schema read, so the panel cannot show a
 * stale figure from a job that stopped running. The 5-minute `unstable_cache`
 * entry is a cost control, not state — and it deliberately has **no tag**,
 * because nothing in the app "changes the health" in a way a writer could
 * announce. If an operator needs a fresher number they wait five minutes or fix
 * the thing.
 *
 * Every line answers a question that has no other home: nothing else in the app
 * will ever mention a published listing with no map position, a lead whose route
 * was silently truncated, or a nightly cron that quietly stopped firing. That is
 * the whole point — a `Digest:` error page is invisible until somebody visits,
 * and so is a job nobody scheduled.
 *
 * Each finding names the page that fixes it, because a number an operator cannot
 * act on is decoration.
 */
import "server-only";
import { unstable_cache } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { leads, listingImages, listings } from "@/db/schema";
import { countListingsWithoutPosition } from "@/lib/geo";
import {
  driftCount,
  readDatabaseStatus,
  type SchemaDrift,
} from "@/lib/ops/migrations";
import { lastRunByJob, type OpsRunRow } from "@/lib/ops/runs";

/** Long enough that /admin does not pay for it on every click. */
const TTL_SECONDS = 300;

export interface HealthCounts {
  /** Published, but nothing to plot: no coordinate and a location with no centroid. */
  listingsWithoutPosition: number;
  /** Published with no photo — the cards render a type icon instead. */
  listingsWithoutPhoto: number;
  /** Published with no English title, i.e. still falling back to Spanish. */
  listingsWithoutEnglish: number;
  publishedListings: number;
  /**
   * `routed_to = ''` — a lead whose route was silently truncated on a
   * non-strict server, which is the D8 incident's fingerprint. Never expected to
   * be non-zero; if it is, those rows are recoverable.
   */
  leadsWithNoRoute: number;
}

export interface MigrationHealth {
  /** null = unavailable (no tracking table, or `drizzle/` is not on disk here). */
  pending: number | null;
  /** Whether the migration list could be read at all — see `readDatabaseStatus`. */
  journalReadable: boolean;
  drift: SchemaDrift;
  driftTotal: number;
  /** Recorded migrations matching no file here: prod ran SQL this checkout lacks. */
  orphanHashes: number;
  /** MySQL would store a bad enum value as `''` instead of rejecting it. */
  sqlModeStrict: boolean;
  /** Set when the check itself could not run (no DATABASE_URL for a second connection…). */
  error: string | null;
}

export interface DeployInfo {
  /** Short commit of the build, when the build could work it out. */
  commit: string | null;
  /** When `next build` ran, ISO. Inlined at build time by next.config.ts. */
  builtAt: string | null;
}

export interface Health {
  counts: HealthCounts;
  migrations: MigrationHealth;
  /** Last run of every job that has ever run, keyed by `OpsJob`. Absent = never run. */
  lastRuns: Record<string, SerializedRun>;
  deploy: DeployInfo;
}

/**
 * `lastRunByJob()` returns `Date`s and this whole object crosses the
 * `unstable_cache` boundary, where a `Date` comes back as an ISO string and
 * `string > Date` is silently false (`src/lib/cache.ts`). So the dates are turned
 * into strings **here**, on the way in, rather than left to look like Dates and
 * lie to every consumer.
 */
export interface SerializedRun {
  dry: boolean;
  startedAt: string;
  finishedAt: string | null;
  ok: boolean | null;
  /** Present when the run threw; the operator needs the message, not the counts. */
  error: string | null;
}

function serializeRun(r: OpsRunRow): SerializedRun {
  const result = r.result as { error?: string } | null;
  return {
    dry: r.dry,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null,
    ok: r.ok,
    error: typeof result?.error === "string" ? result.error : null,
  };
}

async function readCounts(): Promise<HealthCounts> {
  const [[withoutPhoto], [withoutEnglish], [published], [badRoute], noPosition] =
    await Promise.all([
      /**
       * A published listing with no row in `listing_images`. `isNull` on the
       * joined id is the left-join form of "not exists" and reads better in
       * EXPLAIN than a correlated subquery at this size.
       */
      db
        .select({ n: sql<number>`count(*)` })
        .from(listings)
        .leftJoin(listingImages, eq(listingImages.listingId, listings.id))
        .where(and(eq(listings.status, "published"), isNull(listingImages.id))),
      db
        .select({ n: sql<number>`count(*)` })
        .from(listings)
        .where(and(eq(listings.status, "published"), isNull(listings.titleEn))),
      db
        .select({ n: sql<number>`count(*)` })
        .from(listings)
        .where(eq(listings.status, "published")),
      /**
       * Raw SQL because `''` is not a member of the `routed_to` enum in
       * TypeScript — which is exactly why the rows are interesting: only a
       * database that accepted a value the type system forbids can hold them.
       */
      db
        .select({ n: sql<number>`count(*)` })
        .from(leads)
        .where(sql`${leads.routedTo} = ''`),
      countListingsWithoutPosition(db),
    ]);

  return {
    listingsWithoutPosition: noPosition,
    listingsWithoutPhoto: Number(withoutPhoto?.n ?? 0),
    listingsWithoutEnglish: Number(withoutEnglish?.n ?? 0),
    publishedListings: Number(published?.n ?? 0),
    leadsWithNoRoute: Number(badRoute?.n ?? 0),
  };
}

/**
 * The one part of this module that does not use the app pool: `readDatabaseStatus()`
 * opens its own short-lived connection (it has to be usable from a CLI pointed at
 * production). That is one extra connection per cache miss — once per five
 * minutes per process, closed in a `finally` — against a pool deliberately capped
 * at 6. Worth watching if this is ever called from anywhere but `/admin`.
 */
async function readMigrationHealth(): Promise<MigrationHealth> {
  const empty: SchemaDrift = {
    declaredTables: 0,
    declaredColumns: 0,
    missingTables: [],
    missingColumns: [],
    missingEnumValues: [],
  };
  try {
    const status = await readDatabaseStatus();
    return {
      pending: status.migrations.pending,
      journalReadable: status.migrations.journalReadable,
      drift: status.drift,
      driftTotal: driftCount(status.drift),
      orphanHashes: status.migrations.orphanHashes,
      sqlModeStrict: status.migrations.sqlModeStrict,
      error: null,
    };
  } catch (err) {
    /**
     * Never fatal. This opens a second connection and reads files from disk, and
     * on a deploy where either is unavailable the *rest* of the health section is
     * still worth rendering — same reasoning as `app/not-found.tsx` catching
     * `listCities()`: the panel must not 500 during the incident it exists to
     * describe.
     */
    return {
      pending: null,
      journalReadable: false,
      drift: empty,
      driftTotal: 0,
      orphanHashes: 0,
      sqlModeStrict: true,
      error: (err as Error).message,
    };
  }
}

/**
 * Inlined at build time by `next.config.ts` (`env`), so it describes the build
 * that is running rather than the checkout the server happens to sit in. Both
 * halves are best-effort: a build with no git available reports nulls, which the
 * panel renders as "unknown" rather than pretending.
 */
function readDeployInfo(): DeployInfo {
  return {
    commit: process.env.BUILD_COMMIT || null,
    builtAt: process.env.BUILD_TIME || null,
  };
}

const cachedHealth = unstable_cache(
  async (): Promise<Health> => {
    const [counts, migrations, runs] = await Promise.all([
      readCounts(),
      readMigrationHealth(),
      lastRunByJob(),
    ]);
    const lastRuns: Record<string, SerializedRun> = {};
    for (const [job, row] of runs) lastRuns[job] = serializeRun(row);
    return { counts, migrations, lastRuns, deploy: readDeployInfo() };
  },
  ["admin:health"],
  { revalidate: TTL_SECONDS },
);

export async function getHealth(): Promise<Health> {
  return cachedHealth();
}
