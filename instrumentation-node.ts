/**
 * The Node-only half of `instrumentation.ts`, imported there inside an
 * `if (process.env.NEXT_RUNTIME === "nodejs")` block so the edge build never
 * sees it (it reaches the database and Node built-ins).
 */
import { finishOpsRun, startOpsRun } from "@/lib/ops/runs";
import { runLiveCheck } from "@/lib/ops/live-check";
import { reportServerError, type ErrorContext } from "@/lib/error-alerts";

const AFTER_START_MS = 60_000;

/** `check:live` once, a minute after the server starts — i.e. after a deploy. */
export function scheduleLiveCheckAfterStart(): void {
  if (process.env.NODE_ENV !== "production" || process.env.LIVE_CHECK === "0") return;
  const timer = setTimeout(() => {
    void (async () => {
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
    })();
  }, AFTER_START_MS);
  // Never keep a process alive just for this.
  timer.unref?.();
}

export { reportServerError, type ErrorContext };
