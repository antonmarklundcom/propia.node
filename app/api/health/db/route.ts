/**
 * Does MySQL answer, and how fast?
 *
 * Separate from /api/health on purpose: that one proves the process is alive,
 * this one proves the database is reachable. During the 503 incident the two
 * were indistinguishable, which cost hours.
 *
 * `SELECT 1` only — it takes a pool connection and returns it immediately, so
 * probing this cannot itself contribute to pool starvation. A slow response
 * here means the pool is saturated; a 503 means it timed out, which is now the
 * designed behaviour rather than an infinite wait.
 */
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json(
      { ok: true, dbMs: Date.now() - started },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        dbMs: Date.now() - started,
        // The message names the failure mode (timeout, too many connections,
        // access denied) without leaking the connection string.
        error: err instanceof Error ? err.message.slice(0, 200) : "unknown",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
