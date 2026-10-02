/**
 * The Node-only half of `instrumentation.ts`, imported there inside an
 * `if (process.env.NEXT_RUNTIME === "nodejs")` block so the edge build never
 * sees it (it reaches the database and Node built-ins).
 */
import { finishOpsRun, startOpsRun } from "@/lib/ops/runs";
import { liveCheckEnabled, runLiveCheck } from "@/lib/ops/live-check";
import { tryOnce, withLock } from "@/lib/ops/process-lock";
import { reportServerError, type ErrorContext } from "@/lib/error-alerts";
import { installProcessLifecycle } from "@/lib/process-lifecycle";

const AFTER_START_MS = 60_000;
const LIVE_CHECK_LOCK_STALE_MS = 10 * 60 * 1000;

/**
 * `check:live` once per BUILD, a minute after the first server of that build
 * starts — i.e. after a deploy. Not once per process: Hostinger's launcher
 * starts extra copies of the app all day (docs/hosting-process-cap.md), and
 * each copy used to run its own check, whose requests to every door could
 * wake still more copies. The lock file is keyed by the build stamp and
 * created atomically, so of copies starting together exactly one runs it.
 */
export function scheduleLiveCheckAfterStart(): void {
  if (process.env.NODE_ENV !== "production" || !liveCheckEnabled()) return;
  const build = process.env.BUILD_TIME || process.env.BUILD_COMMIT || "unknown";
  const timer = setTimeout(() => {
    if (!tryOnce(`live-check-after-start-${build}`)) return;
    // The same lock the daily run takes (cron-tick.ts): never two at once.
    void withLock("live-check", LIVE_CHECK_LOCK_STALE_MS, async () => {
      let id: number | null = null;
      try {
        id = await startOpsRun({ job: "check:live", dry: false, userId: null });
        const result = await runLiveCheck({ dry: false, reason: "tras un deploy" });
        await finishOpsRun(id, { ok: true, result });
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        if (id != null) await finishOpsRun(id, { ok: false, error }).catch(() => {});
        console.warn(`[live-check] after start: ${error}`);
      }
    });
  }, AFTER_START_MS);
  // Never keep a process alive just for this.
  timer.unref?.();
}

export { installProcessLifecycle, reportServerError, type ErrorContext };
