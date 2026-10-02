/**
 * Ends a web process nobody can reach any more (`process-lifecycle-policy.ts`
 * has the rule and the why; docs/hosting-process-cap.md has the measurements).
 *
 * Node-only, started once from `instrumentation-node.ts`. Two parts:
 *
 * 1. **Orphan exit.** Every 30 s, compare `process.ppid` with the parent the
 *    server started under; once it has changed and no request has run for
 *    `ORPHAN_EXIT_IDLE_SECONDS`, send ourselves SIGTERM — Next's own handler
 *    closes the server and exits.
 * 2. **SIGTERM backstop.** Next's handler waits for open connections to
 *    close before it exits; a proxy holding a keep-alive connection can make
 *    that wait forever, which looks exactly like "Stop did not stop it". Any
 *    SIGTERM now ends the process within `SIGTERM_GRACE_MS` regardless.
 *
 * Requests are counted through `node:diagnostics_channel`
 * (`http.server.request.start`), so nothing in Next is patched. Both timers
 * are unref'd: neither keeps a process alive.
 */
import "server-only";
import { subscribe } from "node:diagnostics_channel";
import type { ServerResponse } from "node:http";
import { exitReason, policyFromEnv } from "./process-lifecycle-policy";

const CHECK_EVERY_MS = 30_000;
const SIGTERM_GRACE_MS = 10_000;
const INSTALLED = Symbol.for("portal.processLifecycle");

export function installProcessLifecycle(): void {
  if (process.env.NODE_ENV !== "production") return;
  const g = globalThis as Record<symbol, unknown>;
  if (g[INSTALLED]) return;
  g[INSTALLED] = true;

  const policy = policyFromEnv(process.env);
  const ppidAtStart = process.ppid;
  let inFlight = 0;
  let lastActivity = Date.now();

  subscribe("http.server.request.start", (message) => {
    const { response } = message as { response?: ServerResponse };
    inFlight += 1;
    lastActivity = Date.now();
    let done = false;
    response?.once("close", () => {
      if (done) return;
      done = true;
      inFlight = Math.max(0, inFlight - 1);
      lastActivity = Date.now();
    });
  });

  process.on("SIGTERM", () => {
    setTimeout(() => process.exit(0), SIGTERM_GRACE_MS).unref();
  });

  // One line per process start: pid/ppid pairs in console.log are how the
  // founder tells a launcher's copies apart (docs/hosting-process-cap.md).
  console.log(
    `[lifecycle] pid ${process.pid} ppid ${ppidAtStart} orphan-exit ${
      policy.orphanIdleMs === null ? "off" : `${policy.orphanIdleMs / 1000}s`
    } idle-exit ${policy.idleExitMs === null ? "off" : `${policy.idleExitMs / 60_000}min`}`,
  );

  let exiting = false;
  const timer = setInterval(() => {
    if (exiting) return;
    const reason = exitReason(
      { ppidAtStart, ppidNow: process.ppid, inFlight, idleMs: Date.now() - lastActivity },
      policy,
    );
    if (!reason) return;
    exiting = true;
    console.log(`[lifecycle] pid ${process.pid} exiting: ${reason}`);
    process.kill(process.pid, "SIGTERM");
  }, CHECK_EVERY_MS);
  timer.unref();
}
