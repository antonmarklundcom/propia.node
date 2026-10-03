/**
 * Live connection and process numbers for /admin's "Salud del sitio" box —
 * the reads behind `src/lib/runtime-health-rules.ts` (which holds every rule
 * and is checked by `npm run verify:admin-insights`).
 *
 * **Never cached, on purpose.** `getHealth()` is a five-minute `unstable_cache`
 * entry, and that cache lives on disk in the build folder every copy of this
 * app shares — so a pid or uptime put through it would describe whichever copy
 * filled it, not the one answering. These reads are cheap (four one-row
 * statements, run one after another so they take one pool connection at a
 * time, and a `/proc` scan) and only a super-admin's /admin render pays them.
 *
 * **Every read degrades on its own.** The production user is read-only and a
 * shared host may deny a `SHOW` or a `PROCESSLIST` read; each failure becomes
 * `null` ("no disponible") and the rest still render. Nothing here throws into
 * the page — it exists to describe the incident where the database is the thing
 * that is unwell, so it must not 500 during it.
 */
import "server-only";
import { readdir, readFile, readlink } from "node:fs/promises";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  connectionVerdict,
  looksLikeNextServer,
  parseCmdline,
  parseProcStat,
  showValue,
  summarizeCopies,
  type ConnectionNumbers,
  type ConnectionVerdict,
  type CopiesSummary,
  type ServerProcess,
} from "@/lib/runtime-health-rules";

export interface RuntimeHealth {
  connections: ConnectionNumbers & {
    /** Of `userConnections`, how many are idle (`Sleep`) — pools holding them open. */
    userIdle: number | null;
  };
  verdict: ConnectionVerdict;
  process: {
    pid: number;
    uptimeSeconds: number;
    /**
     * The live pool's own bounds, read from the mysql2 pool object (never a
     * copied constant, `src/db/index.ts` is not edited). Null when that object
     * does not expose them.
     */
    poolLimit: number | null;
    poolQueueLimit: number | null;
  };
  /** Null off Linux or when `/proc` could not be read. */
  copies: CopiesSummary | null;
}

/** First rows array of a raw mysql2 `db.execute()` (`[rows, fields]`). */
function rowsOf(result: unknown): unknown[] {
  const rows = Array.isArray(result) ? result[0] : null;
  return Array.isArray(rows) ? rows : [];
}

async function show(statement: SQL, name: string): Promise<number | null> {
  try {
    return showValue(rowsOf(await db.execute(statement)), name);
  } catch {
    return null;
  }
}

async function userConnections(): Promise<{ total: number | null; idle: number | null }> {
  try {
    // Without the PROCESS privilege a user sees only its own threads, which is
    // the set this counts anyway; the WHERE keeps it right when it has more.
    const rows = rowsOf(
      await db.execute(sql`
        SELECT COUNT(*) AS n, COALESCE(SUM(COMMAND = 'Sleep'), 0) AS idle
        FROM information_schema.PROCESSLIST
        WHERE USER = SUBSTRING_INDEX(CURRENT_USER(), '@', 1)
      `),
    );
    const row = (rows[0] ?? {}) as Record<string, unknown>;
    const total = Number(row.n);
    const idle = Number(row.idle);
    return {
      total: Number.isFinite(total) ? total : null,
      idle: Number.isFinite(idle) ? idle : null,
    };
  } catch {
    return { total: null, idle: null };
  }
}

/** The mysql2 promise pool wraps a core pool whose `config` holds the options. */
function poolBounds(): { limit: number | null; queue: number | null } {
  try {
    const client = (db as unknown as { $client?: { pool?: { config?: Record<string, unknown> } } }).$client;
    const config = client?.pool?.config;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    return { limit: num(config?.connectionLimit), queue: num(config?.queueLimit) };
  } catch {
    return { limit: null, queue: null };
  }
}

/** Upper bound on `/proc` entries looked at, so a crowded host cannot stall /admin. */
const MAX_PROC_ENTRIES = 5000;
const PROC_BATCH = 64;

async function readServer(pid: number): Promise<ServerProcess | null> {
  try {
    const argv = parseCmdline(await readFile(`/proc/${pid}/cmdline`, "utf8"));
    if (!looksLikeNextServer(argv)) return null;
    const stat = parseProcStat(await readFile(`/proc/${pid}/stat`, "utf8"));
    if (!stat) return null;
    const cwd = await readlink(`/proc/${pid}/cwd`).catch(() => null);
    return { ...stat, cwd };
  } catch {
    // Gone between readdir and read, or not ours to read.
    return null;
  }
}

/** Copies of this app on this host — a thin wrapper over the pure summary. */
async function scanCopies(): Promise<CopiesSummary | null> {
  if (process.platform !== "linux") return null;
  try {
    const ownCwd = await readlink("/proc/self/cwd").catch(() => process.cwd());
    const pids = (await readdir("/proc"))
      .filter((e) => /^\d+$/.test(e))
      .slice(0, MAX_PROC_ENTRIES)
      .map(Number);
    const found: ServerProcess[] = [];
    // In batches: thousands of parallel opens can hit the file-descriptor limit.
    for (let i = 0; i < pids.length; i += PROC_BATCH) {
      const batch = await Promise.all(pids.slice(i, i + PROC_BATCH).map(readServer));
      for (const p of batch) if (p) found.push(p);
    }
    // This process is a copy by definition, whatever title its launcher gave it.
    if (!found.some((p) => p.pid === process.pid)) {
      const self = parseProcStat(await readFile("/proc/self/stat", "utf8").catch(() => ""));
      found.push({
        pid: process.pid,
        ppid: self?.ppid ?? process.ppid,
        threads: self?.threads ?? 0,
        cwd: ownCwd,
      });
    }
    return summarizeCopies(found, ownCwd);
  } catch {
    return null;
  }
}

export async function getRuntimeHealth(): Promise<RuntimeHealth> {
  // One statement at a time: this is the panel for "the pool is full", so it
  // takes one connection, not four.
  const threadsConnected = await show(sql`SHOW GLOBAL STATUS LIKE 'Threads_connected'`, "Threads_connected");
  const maxConnections = await show(sql`SHOW VARIABLES LIKE 'max_connections'`, "max_connections");
  // Session scope on purpose: when the account has its own MAX_USER_CONNECTIONS
  // (what a shared host sets), the session value is that limit.
  const maxUserConnections = await show(sql`SHOW VARIABLES LIKE 'max_user_connections'`, "max_user_connections");
  const user = await userConnections();
  const copies = await scanCopies();

  const connections = {
    threadsConnected,
    maxConnections,
    maxUserConnections,
    userConnections: user.total,
    userIdle: user.idle,
  };
  const bounds = poolBounds();
  return {
    connections,
    verdict: connectionVerdict(connections),
    process: {
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      poolLimit: bounds.limit,
      poolQueueLimit: bounds.queue,
    },
    copies,
  };
}
