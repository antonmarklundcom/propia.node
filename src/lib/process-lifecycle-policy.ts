/**
 * When a web process should end itself — the pure half of
 * `process-lifecycle.ts`, checked by `npm run verify:lifecycle`.
 *
 * Why this exists (docs/hosting-process-cap.md): on Hostinger the account's
 * "Max Processes" cap counts every thread of every process, and extra copies
 * of this app pile up with PPID 1 — their launcher is gone, nothing will ever
 * route a request to them again, and Node never exits on its own while a
 * server is listening. A copy whose parent has died, and that has served
 * nothing for a while, ends itself. The launcher starts a fresh one on the next
 * request, exactly as it does after its own idle timeout.
 *
 * Never with a request in flight. Never while the original parent is alive
 * (that process is the launcher's to manage). An optional plain idle exit
 * (`idleExitMs`) is off by default: it would also end the copy the launcher
 * still routes to, costing the next visitor a cold start.
 */

export interface LifecycleState {
  /** `process.ppid` when the server started. */
  ppidAtStart: number;
  /** `process.ppid` now (Node reads it live). */
  ppidNow: number;
  /** Requests started and not yet closed. */
  inFlight: number;
  /** Milliseconds since the last request closed (or since start). */
  idleMs: number;
}

export interface LifecyclePolicy {
  /** Orphaned and idle this long → exit. `null` = never on orphaning. */
  orphanIdleMs: number | null;
  /** Idle this long → exit, orphaned or not. `null` = off (the default). */
  idleExitMs: number | null;
}

export const DEFAULT_ORPHAN_IDLE_MS = 2 * 60_000;

/** The reason to exit now, or `null` to keep serving. */
export function exitReason(s: LifecycleState, p: LifecyclePolicy): string | null {
  if (s.inFlight > 0) return null;
  // A process started already detached (PPID 1 from birth) is not one whose
  // parent died: only the explicit idle rule may end it.
  const orphaned = s.ppidNow !== s.ppidAtStart && s.ppidAtStart !== 1;
  if (orphaned && p.orphanIdleMs !== null && s.idleMs >= p.orphanIdleMs) {
    return `orphaned (parent ${s.ppidAtStart} gone, now ${s.ppidNow}) and idle ${Math.round(s.idleMs / 1000)} s`;
  }
  if (p.idleExitMs !== null && s.idleMs >= p.idleExitMs) {
    return `idle ${Math.round(s.idleMs / 1000)} s (IDLE_EXIT_MINUTES)`;
  }
  return null;
}

/** Positive number of `unit`-ms from an env string; `0` = off; garbage = fallback. */
function envMs(raw: string | undefined, unit: number, fallback: number | null): number | null {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n === 0 ? null : Math.round(n * unit);
}

/**
 * `ORPHAN_EXIT_IDLE_SECONDS` (default 120, `0` = off) and
 * `IDLE_EXIT_MINUTES` (default off).
 */
export function policyFromEnv(env: Record<string, string | undefined>): LifecyclePolicy {
  return {
    orphanIdleMs: envMs(env.ORPHAN_EXIT_IDLE_SECONDS, 1000, DEFAULT_ORPHAN_IDLE_MS),
    idleExitMs: envMs(env.IDLE_EXIT_MINUTES, 60_000, null),
  };
}
