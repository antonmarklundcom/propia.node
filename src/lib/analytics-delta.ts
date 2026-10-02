/**
 * Change against the previous period of equal length, for the headline
 * numbers on /admin/analitica. Pure.
 */
export type DeltaKind = "up" | "down" | "flat" | "fresh" | "none";

export interface Delta {
  kind: DeltaKind;
  /** Whole-number percentage, absolute value; "" for flat / fresh / none. */
  pct: string;
}

export function deltaOf(current: number, previous: number): Delta {
  if (previous === 0) {
    // Nothing to compare with: a first appearance, or nothing at all.
    return current > 0 ? { kind: "fresh", pct: "" } : { kind: "none", pct: "" };
  }
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(change));
  if (rounded === 0) return { kind: "flat", pct: "" };
  return { kind: change > 0 ? "up" : "down", pct: String(rounded) };
}
