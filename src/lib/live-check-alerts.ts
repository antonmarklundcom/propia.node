/**
 * When `check:live` may message the operator. Pure: no database, no network,
 * so `verify:telegram` exercises it.
 *
 * The check runs after every server start and once a day, and Hostinger
 * restarts this app often (several processes, several builds alive at once —
 * docs/hosting-process-cap.md). Without memory the same broken pages were
 * re-sent dozens of times a day. The rule:
 *
 * - a failure set is alerted the first time it is seen;
 * - the same set again is silent, except one reminder every 24 h while it
 *   lasts;
 * - when every page loads again after an alerted failure, one "resolved" line;
 * - a few recent sets are remembered, not just the last, so two builds that
 *   see different sets (one knows a door the other does not) do not alert
 *   each other's set on every restart.
 */

export const LIVE_CHECK_REMIND_MS = 24 * 60 * 60 * 1000;
/** Failure sets remembered at once. */
const MAX_REMEMBERED = 4;

export interface LiveCheckAlertState {
  /** Failure-set fingerprint → when it was last alerted (epoch ms). */
  seen: Record<string, number>;
  /** Whether the last alerted run had failures, so a recovery is announced once. */
  failing: boolean;
}

export const EMPTY_LIVE_CHECK_STATE: LiveCheckAlertState = { seen: {}, failing: false };

/**
 * One string per failure set: order-free, and the same failing URL with the
 * same status is the same failure whatever order the workers finished in.
 */
export function failureFingerprint(failures: ReadonlyArray<{ url: string; why: string }>): string {
  return failures
    .map((f) => `${f.why} ${f.url}`)
    .sort()
    .join("\n");
}

export function parseLiveCheckState(raw: string | undefined | null): LiveCheckAlertState {
  if (!raw) return { ...EMPTY_LIVE_CHECK_STATE, seen: {} };
  try {
    const v = JSON.parse(raw) as Partial<LiveCheckAlertState>;
    const seen: Record<string, number> = {};
    if (v.seen && typeof v.seen === "object") {
      for (const [k, t] of Object.entries(v.seen)) if (typeof t === "number" && Number.isFinite(t)) seen[k] = t;
    }
    return { seen, failing: v.failing === true };
  } catch {
    return { ...EMPTY_LIVE_CHECK_STATE, seen: {} };
  }
}

export type LiveCheckAlertKind = "new" | "reminder" | "resolved" | "none";

/**
 * What this run sends, and the state to store after it. `next` is null when
 * nothing needs writing.
 */
export function planLiveCheckAlert(
  prev: LiveCheckAlertState,
  failures: ReadonlyArray<{ url: string; why: string }>,
  now: number,
): { kind: LiveCheckAlertKind; next: LiveCheckAlertState | null } {
  if (failures.length === 0) {
    if (!prev.failing) return { kind: "none", next: null };
    return { kind: "resolved", next: { seen: {}, failing: false } };
  }
  const fp = failureFingerprint(failures);
  const last = prev.seen[fp];
  if (last !== undefined && now - last < LIVE_CHECK_REMIND_MS) {
    // Silent, but a recovery after this still needs announcing.
    return { kind: "none", next: prev.failing ? null : { ...prev, failing: true } };
  }
  const seen: Record<string, number> = { ...prev.seen, [fp]: now };
  const kept = Object.entries(seen)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_REMEMBERED);
  return {
    kind: last === undefined ? "new" : "reminder",
    next: { seen: Object.fromEntries(kept), failing: true },
  };
}
