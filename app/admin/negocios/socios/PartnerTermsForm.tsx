import { esLedger } from "@/i18n/es-ledger";
import { PARTNER_TERMS_NOTE_MAX } from "@/lib/deal-form";
import type { PartnerTermsRow } from "@/lib/partner-terms";
import { savePartnerTermsAction } from "../actions";

function when(d: Date): string {
  return new Intl.DateTimeFormat("es-PY", { dateStyle: "short", timeZone: "America/Asuncion" }).format(d);
}

/** One Socio's usual split (plan-admin-next O2): a suggestion, edited by the super-admin. */
export function PartnerTermsForm({
  partnerKey,
  terms,
  back,
}: {
  partnerKey: string;
  terms: PartnerTermsRow | undefined;
  back: "list" | "detail";
}) {
  const t = esLedger;
  const anchor = `reparto-${partnerKey.replace(":", "-")}`;
  return (
    <form action={savePartnerTermsAction} className="panel-form" id={anchor}>
      <input type="hidden" name="partner" value={partnerKey} />
      <input type="hidden" name="back" value={back} />
      <label className="panel-form__field">
        <span className="auth-field__label">{t.commissionPct}</span>
        <input
          className="auth-field__input"
          name="commissionPct"
          type="number"
          min={0}
          max={100}
          step="0.01"
          inputMode="decimal"
          defaultValue={terms?.commissionPct ?? ""}
        />
      </label>
      <label className="panel-form__field">
        <span className="auth-field__label">{t.mySharePct}</span>
        <input
          className="auth-field__input"
          name="mySharePct"
          type="number"
          min={0}
          max={100}
          step="0.01"
          inputMode="decimal"
          defaultValue={terms?.mySharePct ?? ""}
        />
      </label>
      <label className="panel-form__field" style={{ flex: "1 1 260px" }}>
        <span className="auth-field__label">{t.note}</span>
        <input className="auth-field__input" name="note" maxLength={PARTNER_TERMS_NOTE_MAX} defaultValue={terms?.note ?? ""} />
      </label>
      <button className="panel-btn" type="submit">
        {t.save}
      </button>
      {terms ? <p className="panel-card__meta" style={{ flex: "1 1 100%" }}>{t.updated(when(terms.updatedAt))}</p> : null}
    </form>
  );
}
