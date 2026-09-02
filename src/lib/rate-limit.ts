/**
 * A plain fixed-window counter for public endpoints.
 *
 * Separate from `lib/auth/rate-limit.ts` on purpose: that one has lockout
 * semantics (a failure streak locks a key for a while, and a success clears
 * it), which is the right shape for a login and the wrong shape for a lead
 * form, where every request counts and there is no "success" to forgive.
 *
 * Same trade as the auth limiter: per-process Map, no schema, resets on
 * deploy.
 *
 * **Per-process is not per-app.** `src/db/index.ts` states the truth this file
 * used to contradict: Passenger may run several app processes, each with its
 * own module instance and so its own `buckets` Map. A caller balanced across N
 * processes gets up to N × `max` in a window, and a deploy resets every
 * counter. The numbers here are therefore a ceiling on cheap abuse, not a
 * quota anyone can audit — every caller must stay correct if a few extra
 * requests get through. A shared store is backlog (REVIEW R11); nothing at
 * this scale needs one.
 */
import "server-only";

interface Window {
  count: number;
  start: number;
  /**
   * The window this key was counted under, kept because `buckets` is shared by
   * callers whose windows differ by an order of magnitude (5 min for an import
   * URL fetch, an hour for an OTP request). The sweep below runs on whichever
   * caller happened to trigger it, so expiring entries against *that* caller's
   * window would drop an hour-long bucket five minutes in and silently hand
   * the counted user a fresh allowance.
   */
  windowMs: number;
}

const buckets = new Map<string, Window>();

let lastSweep = Date.now();
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < windowMs) return;
  lastSweep = now;
  for (const [key, w] of buckets) {
    if (now - w.start > w.windowMs) buckets.delete(key);
  }
}

/**
 * Count one hit against `key`. Returns false once the window is full — the
 * caller decides what that means (a 429 here, a silent drop elsewhere).
 */
export function allowRequest(
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  sweep(now, windowMs);
  const w = buckets.get(key);
  if (!w || now - w.start > windowMs) {
    buckets.set(key, { count: 1, start: now, windowMs });
    return true;
  }
  w.count += 1;
  return w.count <= max;
}
