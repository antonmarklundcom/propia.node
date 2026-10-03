/**
 * Exclusive listings (plan-admin-next O1) — the pure half: reading the form
 * and naming the state. Shared by the server module and `verify:exclusive`.
 */
export interface ExclusiveInput {
  on: boolean;
  /** YYYY-MM-DD or null. */
  until: string | null;
  note: string | null;
}

export const EXCLUSIVE_NOTE_MAX = 280;

/** A real calendar day in YYYY-MM-DD, or null. */
export function parseDay(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v ? v : null;
}

export function exclusiveFromForm(get: (name: string) => unknown): ExclusiveInput | { error: "until" } {
  const on = get("exclusive") === "on";
  const rawUntil = typeof get("until") === "string" ? String(get("until")).trim() : "";
  const until = rawUntil ? parseDay(rawUntil) : null;
  if (rawUntil && !until) return { error: "until" };
  const rawNote = typeof get("note") === "string" ? String(get("note")).trim() : "";
  return { on, until, note: rawNote ? rawNote.slice(0, EXCLUSIVE_NOTE_MAX) : null };
}

export type ExclusiveState = "none" | "active" | "expired";

/** `today` is YYYY-MM-DD; a mandate is still on during its last day. */
export function exclusiveState(row: { until: string | null } | null | undefined, today: string): ExclusiveState {
  if (!row) return "none";
  return row.until != null && row.until < today ? "expired" : "active";
}
