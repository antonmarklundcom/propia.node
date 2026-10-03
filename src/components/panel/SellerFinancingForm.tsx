import { esFinancing } from "@/i18n/es-financing";
import { FINANCING_FIELD_MAX } from "@/lib/listing-financing-form";
import type { ListingFinancingRow } from "@/lib/listing-financing";

const FLASH: Record<string, { text: string; error?: boolean }> = {
  financing_saved: { text: esFinancing.saved },
  financing_empty: { text: esFinancing.empty, error: true },
  financing_not_found: { text: esFinancing.notFound, error: true },
};

/**
 * "Financiación propia" on a listing's edit page (plan-admin-next O8). One
 * component for the three panels; each passes its own server action, which
 * re-derives the scope from the session — the listing id here is only a hint.
 */
export function SellerFinancingForm({
  listingId,
  operation,
  financing,
  action,
  msg,
}: {
  listingId: number;
  operation: string;
  financing: ListingFinancingRow | null;
  action: (formData: FormData) => Promise<void>;
  msg?: string;
}) {
  const t = esFinancing;
  const flash = msg ? FLASH[msg] : undefined;
  const text = (
    name: string,
    label: string,
    value: string | null | undefined,
    max: number,
    placeholder?: string,
  ) => (
    <label className="panel-form__field">
      <span className="auth-field__label">{label}</span>
      <input
        className="auth-field__input"
        name={name}
        maxLength={max}
        defaultValue={value ?? ""}
        placeholder={placeholder}
      />
    </label>
  );
  return (
    <article className="panel-card" id="financiacion">
      <h3 className="panel-section__title">{t.title}</h3>
      {flash ? <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p> : null}
      <p className="panel-note">{t.hint}</p>
      {operation !== "venta" ? <p className="panel-note">{t.onlySale}</p> : null}
      <form action={action} className="panel-form">
        <input type="hidden" name="listingId" value={listingId} />
        <label className="panel-form__field panel-form__check">
          <input type="checkbox" name="financingEnabled" defaultChecked={financing?.enabled ?? false} />
          <strong>{t.enabled}</strong>
        </label>
        {text("financingEntity", t.entity, financing?.entity, FINANCING_FIELD_MAX.entity, t.entityPlaceholder)}
        {text("financingRate", t.rate, financing?.rate, FINANCING_FIELD_MAX.rate, t.ratePlaceholder)}
        {text("financingTerm", t.term, financing?.term, FINANCING_FIELD_MAX.term, t.termPlaceholder)}
        {text(
          "financingDownPayment",
          t.downPayment,
          financing?.downPayment,
          FINANCING_FIELD_MAX.downPayment,
          t.downPaymentPlaceholder,
        )}
        <label className="panel-form__field" style={{ flex: "1 1 100%" }}>
          <span className="auth-field__label">{t.notes}</span>
          <textarea
            className="auth-field__input"
            name="financingNotes"
            rows={3}
            maxLength={FINANCING_FIELD_MAX.notes}
            defaultValue={financing?.notes ?? ""}
          />
        </label>
        <p className="panel-note" style={{ flex: "1 1 100%" }}>{t.cuotaNote}</p>
        <button className="panel-btn panel-btn--primary" type="submit">
          {t.save}
        </button>
      </form>
    </article>
  );
}
