/**
 * Pure checks for plan-admin-next O2 (partner terms → the Negocio prefill) and
 * O8 (seller financing form). No DB, no network. In verify:local and the
 * pre-push hook.
 */
import { parsePartnerTermsForm, splitPrefill } from "../src/lib/deal-form";
import { FINANCING_FIELD_MAX, parseFinancingForm } from "../src/lib/listing-financing-form";

let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    failed++;
    console.error(`FAIL ${name}:\n  got  ${g}\n  want ${w}`);
  }
}
const form = (o: Record<string, string>) => ({ get: (k: string) => (k in o ? o[k] : null) });

// --- O2: the split suggestion only fills what the deal left empty ---
const terms = { commissionPct: "5.00", mySharePct: "50.00" };
eq("no deal: both suggested", splitPrefill(undefined, terms), { commissionPct: "5.00", mySharePct: "50.00", suggested: true });
eq("deal values win", splitPrefill({ commissionPct: "4.00", mySharePct: "40.00" }, terms), { commissionPct: "4.00", mySharePct: "40.00", suggested: false });
eq("only the empty field is filled", splitPrefill({ commissionPct: "4.00", mySharePct: null }, terms), { commissionPct: "4.00", mySharePct: "50.00", suggested: true });
eq("no terms: nothing invented", splitPrefill({ commissionPct: null, mySharePct: null }, null), { commissionPct: null, mySharePct: null, suggested: false });
eq("partial terms", splitPrefill(null, { commissionPct: null, mySharePct: "30" }), { commissionPct: null, mySharePct: "30", suggested: true });

eq("terms: ok", parsePartnerTermsForm(form({ commissionPct: "5", mySharePct: "50.5", note: " contrato 2026 " })), { commissionPct: "5", mySharePct: "50.5", note: "contrato 2026" });
eq("terms: blank = no suggestion", parsePartnerTermsForm(form({ commissionPct: "", mySharePct: " " })), { commissionPct: null, mySharePct: null, note: null });
eq("terms: over 100 refused", parsePartnerTermsForm(form({ commissionPct: "101" })), null);
eq("terms: 3 decimals refused", parsePartnerTermsForm(form({ mySharePct: "5.555" })), null);
eq("terms: negative refused", parsePartnerTermsForm(form({ mySharePct: "-1" })), null);
eq("terms: words refused", parsePartnerTermsForm(form({ commissionPct: "cinco" })), null);
eq("terms: note too long refused", parsePartnerTermsForm(form({ note: "x".repeat(501) })), null);

// --- O8: the publisher's own words, bounded, never computed with ---
const fin = (o: Record<string, string>) => parseFinancingForm((k) => (k in o ? o[k] : null));
eq("off with nothing typed is fine", fin({}), {
  ok: true,
  value: { enabled: false, entity: null, rate: null, term: null, downPayment: null, notes: null },
});
eq("on with nothing typed is refused", fin({ financingEnabled: "on" }), { ok: false, error: "empty" });
eq("on with only the entity is refused", fin({ financingEnabled: "on", financingEntity: "El dueño" }), { ok: false, error: "empty" });
eq("on with a rate is ok", fin({ financingEnabled: "on", financingRate: " 8 % anual " }), {
  ok: true,
  value: { enabled: true, entity: null, rate: "8 % anual", term: null, downPayment: null, notes: null },
});
const long = fin({ financingEnabled: "on", financingTerm: "x".repeat(400), financingNotes: "y".repeat(900) });
eq("fields cut to their columns", long.ok ? [long.value.term?.length, long.value.notes?.length] : null, [FINANCING_FIELD_MAX.term, FINANCING_FIELD_MAX.notes]);
const ctl = fin({ financingEnabled: "on", financingNotes: "a\u0000b\nc\u0007" });
eq("control characters dropped, line breaks kept", ctl.ok ? ctl.value.notes : null, "ab\nc");
eq("off keeps what was typed", fin({ financingRate: "9 %" }).ok, true);
eq("a non-string field is null", fin({ financingEnabled: "on", financingRate: "7%", financingTerm: 3 as unknown as string }), {
  ok: true,
  value: { enabled: true, entity: null, rate: "7%", term: null, downPayment: null, notes: null },
});

if (failed) {
  console.error(`verify:financing — ${failed} failure(s)`);
  process.exit(1);
}
console.log("verify:financing — OK");
