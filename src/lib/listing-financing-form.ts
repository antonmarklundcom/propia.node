/**
 * The seller-financing form (plan-admin-next O8) — pure, shared by the three
 * edit pages' server actions and `npm run verify:financing`.
 *
 * Every field is free text the publisher types, kept as typed (trimmed, cut to
 * the column). Nothing here parses a rate into a number or computes a payment:
 * the portal only shows what the publisher said, labelled as theirs.
 */

export const FINANCING_FIELD_MAX = {
  entity: 120,
  rate: 120,
  term: 120,
  downPayment: 120,
  notes: 500,
} as const;

export type FinancingField = keyof typeof FINANCING_FIELD_MAX;
export const FINANCING_FIELDS = Object.keys(FINANCING_FIELD_MAX) as FinancingField[];

export interface FinancingInput {
  enabled: boolean;
  entity: string | null;
  rate: string | null;
  term: string | null;
  downPayment: string | null;
  notes: string | null;
}

export type FinancingFormResult =
  | { ok: true; value: FinancingInput }
  | { ok: false; error: "empty" };

function clean(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  // Collapse control characters and runs of whitespace: this is shown on a
  // public page, one line per field (notes keep their line breaks).
  const t = v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim();
  return t === "" ? null : t.slice(0, max);
}

/**
 * Switched on with nothing typed is refused: a "financing available" box with
 * no terms would tell a visitor less than the cuota it replaces. Switched off,
 * whatever was typed is kept (so turning it back on restores it).
 */
export function parseFinancingForm(get: (name: string) => unknown): FinancingFormResult {
  const value: FinancingInput = {
    enabled: get("financingEnabled") === "on",
    entity: clean(get("financingEntity"), FINANCING_FIELD_MAX.entity),
    rate: clean(get("financingRate"), FINANCING_FIELD_MAX.rate),
    term: clean(get("financingTerm"), FINANCING_FIELD_MAX.term),
    downPayment: clean(get("financingDownPayment"), FINANCING_FIELD_MAX.downPayment),
    notes: clean(get("financingNotes"), FINANCING_FIELD_MAX.notes),
  };
  const anyTerm = value.rate || value.term || value.downPayment || value.notes;
  if (value.enabled && !anyTerm) return { ok: false, error: "empty" };
  return { ok: true, value };
}
