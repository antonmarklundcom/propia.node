"use client";

import { useId } from "react";
import { getDictionary, type Locale } from "@/i18n";
import { isContactRole, type ContactRole } from "@/lib/contact-role";

/**
 * The optional "¿Quién sos?" select on the public lead forms, so the
 * operator's `/admin/leads` can tell a private buyer from an owner, an
 * independent agent, an agency or a developer (`src/lib/contact-role.ts`).
 *
 * **Presentational and unopinionated about markup.** Each form owns its own
 * field styling (`lead-form__*`, `contact-form__*`, `vd-form__*`), so the
 * caller passes the three class names and this renders one `<label>` + `<select>`
 * in whatever that form already uses. It is never `required` — a visitor who
 * skips it sends nothing, and the form must then omit the `contactRole` key
 * from the `/api/leads` body (never send `""`).
 *
 * A client component, so copy comes from `getDictionary(locale)` with the
 * locale as a prop — never `dict()`. `roles` is the subset the form offers,
 * in the order it wants them shown.
 */
export function ContactRoleField({
  locale,
  roles,
  value,
  onChange,
  className,
  labelClassName,
  inputClassName,
  id,
  required,
  placeholder,
}: {
  locale: Locale;
  roles: readonly ContactRole[];
  value: ContactRole | "";
  onChange: (v: ContactRole | "") => void;
  /** Class of the wrapping `<label>` (the form's own "field" class). */
  className?: string;
  /** Class of the caption `<span>`. */
  labelClassName?: string;
  /** Class of the `<select>`. */
  inputClassName?: string;
  /** Overrides the generated id, for forms that render the field twice. */
  id?: string;
  /** A form that needs the answer (`/vender`) marks the select required. The
   *  default stays optional, which is what every other form wants. */
  required?: boolean;
  /** Replaces the "(optional)" placeholder; a required field must not say it. */
  placeholder?: string;
}) {
  const t = getDictionary(locale).contactRole;
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <label className={className} htmlFor={selectId}>
      <span className={labelClassName}>{t.label}</span>
      <select
        id={selectId}
        className={inputClassName}
        value={value}
        required={required}
        onChange={(e) => onChange(isContactRole(e.target.value) ? e.target.value : "")}
      >
        <option value="">{placeholder ?? t.placeholder}</option>
        {roles.map((r) => (
          <option key={r} value={r}>
            {t.options[r]}
          </option>
        ))}
      </select>
    </label>
  );
}
