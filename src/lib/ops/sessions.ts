/**
 * Purge expired session rows (audit F39): sessions are deleted on logout and
 * lazily when their owner next shows up, so a session that simply goes stale
 * sits in the table forever.
 *
 * Same predicate as `purgeExpiredSessions()` in `src/lib/auth/session.ts`,
 * repeated here because that module is request-scoped (`next/headers`) and this
 * one has to run under `tsx` as well. Uses `idx_expires`.
 *
 * This touches `sessions` and nothing a visitor reads, so there is no cache tag
 * to drop after it.
 */
import "server-only";
import { lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { opsRun, type OpsOptions, type OpsResult } from "./types";

export async function runSessions(opts: OpsOptions): Promise<OpsResult> {
  return opsRun("cron:sessions", opts.dry, async (out) => {
    const now = new Date();

    /**
     * Counted with the same predicate the DELETE uses, so the dry run's number is
     * the number of rows the real run removes (barring a session expiring in the
     * seconds between the two, which is the honest answer either way).
     */
    const [expired] = await db
      .select({ n: sql<number>`count(*)` })
      .from(sessions)
      .where(lt(sessions.expiresAt, now));
    out.count("expiradas", Number(expired?.n ?? 0));

    if (opts.dry) {
      out.note("--dry: nothing deleted.");
      return;
    }

    const [res] = await db.delete(sessions).where(lt(sessions.expiresAt, now));
    out.note(`purged ${res.affectedRows} expired session(s)`);
  });
}
