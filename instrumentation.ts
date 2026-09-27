/**
 * Next.js instrumentation: runs once when the server starts, and on every
 * request that throws. Both halves live in `instrumentation-node.ts` and are
 * imported only under `NEXT_RUNTIME === "nodejs"`, the pattern Next documents
 * for keeping Node-only code out of the edge build (middleware).
 *
 * - `register()` — a minute after a (re)start, which on Hostinger means after
 *   every deploy, run `check:live` once (`src/lib/ops/live-check.ts`): load
 *   each live door's key pages and alert the operator when one is not a 200.
 *   A one-shot timer in a process that is running anyway, not a loop. Off
 *   with `LIVE_CHECK=0`, and outside production.
 * - `onRequestError()` — a server error goes to the operator's Telegram and
 *   inbox, throttled (`src/lib/error-alerts.ts`).
 */
import type { Instrumentation } from "next";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { scheduleLiveCheckAfterStart } = await import("./instrumentation-node");
    scheduleLiveCheckAfterStart();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportServerError } = await import("./instrumentation-node");
    const host = request.headers["x-forwarded-host"] ?? request.headers.host;
    await reportServerError(err, {
      path: request.path,
      method: request.method,
      host: (Array.isArray(host) ? host[0] : host)?.split(",")[0].trim() ?? null,
      routeType: context.routeType,
    });
  }
};
