/**
 * Verify when a web process ends itself (`src/lib/process-lifecycle-policy.ts`)
 * — pure, no database, no network. docs/hosting-process-cap.md has the why.
 *
 *   1. A process whose launcher is still its parent never exits by default.
 *   2. An orphan exits only once idle for the configured time, never with a
 *      request in flight.
 *   3. A process born with PPID 1 is not an orphan (only the opt-in idle rule
 *      may end it).
 *   4. Env parsing: defaults, `0` = off, garbage = default.
 *
 * Run: npm run verify:lifecycle   (also part of npm run verify:local)
 */
import {
  DEFAULT_ORPHAN_IDLE_MS,
  exitReason,
  policyFromEnv,
} from "../src/lib/process-lifecycle-policy";

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}`);
  if (!ok) failures += 1;
}

const MIN = 60_000;
const def = policyFromEnv({});
const base = { ppidAtStart: 4242, ppidNow: 4242, inFlight: 0, idleMs: 0 };

check("defaults: orphan exit 120 s, idle exit off", def.orphanIdleMs === DEFAULT_ORPHAN_IDLE_MS && def.idleExitMs === null);
check("parent alive, idle an hour → stays", exitReason({ ...base, idleMs: 60 * MIN }, def) === null);
check("orphaned, idle 1 min → stays", exitReason({ ...base, ppidNow: 1, idleMs: MIN }, def) === null);
check("orphaned, idle 2 min → exits", exitReason({ ...base, ppidNow: 1, idleMs: 2 * MIN }, def) !== null);
check("orphaned to a subreaper (not 1) → exits", exitReason({ ...base, ppidNow: 77, idleMs: 3 * MIN }, def) !== null);
check("orphaned with a request in flight → stays", exitReason({ ...base, ppidNow: 1, inFlight: 1, idleMs: 30 * MIN }, def) === null);
check("born with PPID 1 → not an orphan", exitReason({ ...base, ppidAtStart: 1, ppidNow: 1, idleMs: 60 * MIN }, def) === null);

const off = policyFromEnv({ ORPHAN_EXIT_IDLE_SECONDS: "0" });
check("ORPHAN_EXIT_IDLE_SECONDS=0 → never on orphaning", off.orphanIdleMs === null && exitReason({ ...base, ppidNow: 1, idleMs: 60 * MIN }, off) === null);

const idle = policyFromEnv({ IDLE_EXIT_MINUTES: "20" });
check("IDLE_EXIT_MINUTES=20 → 20 min", idle.idleExitMs === 20 * MIN);
check("idle rule: 19 min stays, 20 min exits", exitReason({ ...base, idleMs: 19 * MIN }, idle) === null && exitReason({ ...base, idleMs: 20 * MIN }, idle) !== null);
check("idle rule also ends a PPID-1-born process", exitReason({ ...base, ppidAtStart: 1, ppidNow: 1, idleMs: 25 * MIN }, idle) !== null);
check("idle rule never with a request in flight", exitReason({ ...base, inFlight: 2, idleMs: 99 * MIN }, idle) === null);

const junk = policyFromEnv({ ORPHAN_EXIT_IDLE_SECONDS: "abc", IDLE_EXIT_MINUTES: "-5" });
check("garbage env → defaults", junk.orphanIdleMs === DEFAULT_ORPHAN_IDLE_MS && junk.idleExitMs === null);

if (failures > 0) {
  console.log(`\nverify:lifecycle — ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nverify:lifecycle — OK");
