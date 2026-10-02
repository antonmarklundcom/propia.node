"use client";

import { useActionState } from "react";
import { getDictionary } from "@/i18n";
import {
  WHATSAPP_LEAD_INITIAL,
  type WhatsappLeadState,
} from "@/lib/whatsapp-lead";
import { logWhatsappLeadAction } from "./actions";
import { CONTACT_ROLES } from "@/lib/contact-role";
import { esTriage } from "@/i18n/es-triage";

/**
 * "Registrar consulta de WhatsApp": the operator copies the buyer's number and
 * the "Ref." code from a WhatsApp chat and the enquiry becomes a lead. The
 * server action does every check again (role, number, ref, type, door); this
 * form only keeps what was typed when one of them fails.
 *
 * /admin is Spanish-only, so the copy is the Spanish dictionary's.
 */
export function WhatsappLeadForm({
  sites,
  defaultSite,
  types,
}: {
  sites: { key: string; label: string }[];
  defaultSite: string;
  types: { value: string; label: string }[];
}) {
  const t = getDictionary("es").wa;
  const roles = getDictionary("es").contactRole;
  const [state, action, pending] = useActionState<WhatsappLeadState, FormData>(
    logWhatsappLeadAction,
    WHATSAPP_LEAD_INITIAL,
  );
  const v = state.ok ? undefined : state.values;

  return (
    <details className="panel-card" open={Boolean(state.message) || undefined}>
      <summary>
        <strong>{t.formTitle}</strong>
      </summary>
      <p className="panel-note">{t.formHint}</p>
      {state.message ? (
        <p className={state.ok ? "panel-flash" : "auth-error"} role="status">
          {state.message}
        </p>
      ) : null}
      {/* Remounted per submit so defaultValue picks up `values` after an error
          and the fields clear after a save. */}
      <form key={state.nonce} action={action} className="panel-form">
        <label className="panel-form__field">
          <span className="auth-field__label">{t.whatsappLabel}</span>
          <input
            className="auth-field__input"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            required
            maxLength={40}
            placeholder={t.whatsappPlaceholder}
            defaultValue={v?.whatsapp ?? ""}
          />
        </label>
        <label className="panel-form__field">
          <span className="auth-field__label">{t.nameLabel}</span>
          <input
            className="auth-field__input"
            name="name"
            maxLength={140}
            defaultValue={v?.name ?? ""}
          />
        </label>
        <label className="panel-form__field">
          <span className="auth-field__label">{t.refLabel}</span>
          <input
            className="auth-field__input"
            name="ref"
            maxLength={1000}
            placeholder={t.refPlaceholder}
            autoCapitalize="characters"
            defaultValue={v?.ref ?? ""}
          />
        </label>
        <label className="panel-form__field">
          <span className="auth-field__label">{t.typeLabel}</span>
          <select
            className="auth-field__input"
            name="leadType"
            defaultValue={v?.leadType || "auto"}
          >
            <option value="auto">{t.typeAuto}</option>
            {types.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="panel-form__field">
          <span className="auth-field__label">{esTriage.contactFilterLabel}</span>
          <select
            className="auth-field__input"
            name="contactRole"
            defaultValue={v?.contactRole ?? ""}
          >
            <option value="">{esTriage.contactUnknown}</option>
            {CONTACT_ROLES.map((r) => (
              <option key={r} value={r}>
                {roles.options[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="panel-form__field">
          <span className="auth-field__label">{t.siteLabel}</span>
          <select
            className="auth-field__input"
            name="vertical"
            defaultValue={v?.vertical || defaultSite}
          >
            {sites.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label
          className="panel-form__field"
          style={{ flexBasis: "320px", flexGrow: 1 }}
        >
          <span className="auth-field__label">{t.messageLabel}</span>
          <textarea
            className="auth-field__input"
            name="message"
            rows={2}
            maxLength={2000}
            defaultValue={v?.message ?? ""}
          />
        </label>
        <div className="panel-form__field panel-form__field--action">
          <button
            className="panel-btn panel-btn--primary"
            type="submit"
            disabled={pending}
          >
            {pending ? t.sending : t.submit}
          </button>
        </div>
      </form>
    </details>
  );
}
