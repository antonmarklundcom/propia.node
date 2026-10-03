/**
 * The pure half of the "Conexiones y procesos" lines in /admin's health box
 * (`src/lib/runtime-health.ts` reads the database and `/proc`; this file only
 * turns text and numbers into records and a verdict). Checked by
 * `npm run verify:admin-insights`. No fs, no `next/*`, no drizzle.
 *
 * Why it exists: "Failed query" errors in production are suspected to be the
 * MySQL user's connection limit, filled by orphaned copies of this app that
 * Hostinger's launcher leaves behind (docs/hosting-process-cap.md). Each copy
 * holds its own pool, so the database's view (connections held by our user)
 * and the host's view (how many copies run, how many have PPID 1) are the two
 * numbers that say whether that is what is happening.
 */

/** One process as `/proc/<pid>/stat` describes it. */
export interface ProcStat {
  pid: number;
  ppid: number;
  /** `num_threads` — what Hostinger's "Max Processes" cap actually counts. */
  threads: number;
}

/**
 * Parse `/proc/<pid>/stat`. The second field (`comm`) is in parentheses and
 * may itself contain spaces and parentheses, so the fields after it are read
 * from the LAST `)` on. Returns null for anything that is not that shape.
 */
export function parseProcStat(text: string): ProcStat | null {
  const open = text.indexOf("(");
  const close = text.lastIndexOf(")");
  if (open < 1 || close < open) return null;
  const pid = Number(text.slice(0, open).trim());
  const rest = text.slice(close + 1).trim().split(/\s+/);
  // rest[0] = state (field 3), rest[1] = ppid (field 4), rest[17] = num_threads (field 20).
  const ppid = Number(rest[1]);
  const threads = Number(rest[17]);
  if (!Number.isInteger(pid) || pid <= 0 || !Number.isInteger(ppid) || ppid < 0) return null;
  return { pid, ppid, threads: Number.isInteger(threads) && threads > 0 ? threads : 0 };
}

/** `/proc/<pid>/cmdline` is NUL-separated argv (with a trailing NUL). */
export function parseCmdline(text: string): string[] {
  return text.split("\0").filter((a) => a.length > 0);
}

/**
 * Whether argv looks like a Next.js production server. `next start` sets its
 * process title to `next-server (vX.Y.Z)`, which on Linux replaces the whole
 * cmdline — that is what `pgrep -f next-server` in docs/hosting-process-cap.md
 * finds. Before the title is set (or if a launcher runs the binary directly)
 * the argv is `node …/next start`, matched too.
 */
export function looksLikeNextServer(argv: string[]): boolean {
  if (argv.length === 0) return false;
  const line = argv.join(" ");
  if (/(^|[\s/])next-server\b/.test(line)) return true;
  const nextIdx = argv.findIndex((a) => a === "next" || /[/\\]next(\.js)?$/.test(a));
  return nextIdx >= 0 && argv[nextIdx + 1] === "start";
}

/** A Next server process found on the host, with the folder it runs from. */
export interface ServerProcess extends ProcStat {
  /** `readlink /proc/<pid>/cwd`; null when it could not be read. */
  cwd: string | null;
}

export interface CopiesSummary {
  /** Next servers running from this process's folder — copies of this app (this one included). */
  copies: number;
  /** Of those, how many have PPID 1: their launcher is gone. */
  orphaned: number;
  /** Threads across the copies — the unit the hosting cap counts. */
  threads: number;
  /** Next servers of this user from any OTHER folder (other apps, older builds). */
  otherServers: number;
}

/**
 * Group what the scan found. A process whose cwd could not be read is counted
 * among the others, never as a copy: "not proven to be ours" must not inflate
 * the number the operator acts on.
 */
export function summarizeCopies(procs: ServerProcess[], ownCwd: string): CopiesSummary {
  const out: CopiesSummary = { copies: 0, orphaned: 0, threads: 0, otherServers: 0 };
  const seen = new Set<number>();
  for (const p of procs) {
    if (seen.has(p.pid)) continue;
    seen.add(p.pid);
    if (p.cwd !== null && p.cwd === ownCwd) {
      out.copies += 1;
      out.threads += p.threads;
      if (p.ppid === 1) out.orphaned += 1;
    } else {
      out.otherServers += 1;
    }
  }
  return out;
}

/** What the database says about connections. Each field is null when its read failed. */
export interface ConnectionNumbers {
  threadsConnected: number | null;
  maxConnections: number | null;
  /** 0 = no per-user limit (MySQL's meaning). */
  maxUserConnections: number | null;
  /** Threads held by this database user (all of this app's copies, plus scripts). */
  userConnections: number | null;
}

export type ConnectionVerdict =
  | { kind: "unknown" }
  | { kind: "ok" }
  | { kind: "user-near-limit"; used: number; max: number }
  | { kind: "server-near-limit"; used: number; max: number };

/** The share of a limit at which the panel starts saying so. */
export const NEAR_LIMIT_RATIO = 0.8;

const near = (used: number | null, max: number | null): max is number =>
  used !== null && max !== null && max > 0 && used >= max * NEAR_LIMIT_RATIO;

/**
 * One plain verdict. The per-user limit wins, because it is the one a shared
 * host sets low and the one this app's copies fill; `max_user_connections = 0`
 * means "no per-user limit", so only the server-wide one is checked then.
 */
export function connectionVerdict(c: ConnectionNumbers): ConnectionVerdict {
  if (near(c.userConnections, c.maxUserConnections)) {
    return { kind: "user-near-limit", used: c.userConnections!, max: c.maxUserConnections };
  }
  if (near(c.threadsConnected, c.maxConnections)) {
    return { kind: "server-near-limit", used: c.threadsConnected!, max: c.maxConnections };
  }
  const userKnown = c.userConnections !== null && c.maxUserConnections !== null;
  const serverKnown = c.threadsConnected !== null && c.maxConnections !== null;
  return userKnown || serverKnown ? { kind: "ok" } : { kind: "unknown" };
}

/** `SHOW … LIKE 'x'` rows are `{ Variable_name, Value }`; the number, or null. */
export function showValue(rows: unknown, name: string): number | null {
  if (!Array.isArray(rows)) return null;
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const row = r as Record<string, unknown>;
    const key = row.Variable_name ?? row.variable_name ?? row.VARIABLE_NAME;
    if (typeof key === "string" && key.toLowerCase() === name.toLowerCase()) {
      const v = Number(row.Value ?? row.value ?? row.VALUE);
      return Number.isFinite(v) && v >= 0 ? v : null;
    }
  }
  return null;
}
