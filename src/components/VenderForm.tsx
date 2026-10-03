"use client";

import { readVisitUtm } from "@/lib/visit-source";

import { useRef, useState } from "react";
import { ContactRoleField } from "@/components/ContactRoleField";
import { getDictionary, type Locale } from "@/i18n";
import type { ContactRole } from "@/lib/contact-role";
import { checkPhone } from "@/lib/wa";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/property-types";
import type { PropertyType } from "@/lib/import/types";

/** Who is selling, for the "I am…" select. */
const SELLER_ROLES: readonly ContactRole[] = ["owner", "agent", "agency"];

/** A message shorter than this is a keystroke, not a description. */
export const VENDER_MESSAGE_MIN = 10;

type FieldKey = "name" | "phone" | "role" | "city" | "type" | "message";

export interface VenderFormCity {
  slug: string;
  name: string;
}

/**
 * The `/vender` lead form (docs/style/inmobiliaria.com.py.md §5 "Seller
 * landing page /vender", section 1 and 8: "the same form" on the hero and
 * the closing CTA). Posts through the existing `/api/leads` pipeline — same
 * endpoint, same MySQL-first/rate-limit/same-origin guarantees as
 * `LeadForm`/`ContactForm` — rather than a parallel capture path.
 *
 * **Every field is required** (founder, 2026-10-03): the seller leaves who
 * they are, how to reach them, what they have and where, so the first reply is
 * about their property rather than a questionnaire. Validation is ours, not
 * the browser's (`noValidate`): one message per field under the field, focus on
 * the first one that fails, and the same rules on both instances of the form.
 * The API still treats `name`/`message` as optional — other forms send none —
 * so a script can skip this check; the form is the contract, not the endpoint.
 *
 * Two variants share the markup because they share the rules:
 * - `seller` — `leadType: "seller"`, `utm.source: "vender"`.
 * - `partner` — the independent realtor's "Quiero ser socio":
 *   `leadType: "agent_signup"`, `utm.source: "vender:socio"`, role fixed to
 *   `agent`, no property type. `/admin/leads` tells them apart by that marker
 *   (there is no `leads.source` column, and none was added).
 *
 * The operator reads `/admin/leads` in Spanish whatever door the visitor used,
 * so the city/type lines folded into the message are always Spanish.
 */
export function VenderForm({
  cities,
  idPrefix,
  locale = "es",
  variant = "seller",
}: {
  cities: VenderFormCity[];
  /** Two instances render on this page (hero + closing CTA) — distinct
   *  field ids keep <label htmlFor> from colliding. */
  idPrefix: string;
  /** A client component takes its locale as a prop rather than calling
   * dict() — see src/i18n/index.ts's module doc comment. */
  locale?: Locale;
  variant?: "seller" | "partner";
}) {
  const dictionary = getDictionary(locale);
  const t = dictionary.vender;
  const operator = getDictionary("es").vender;
  const partner = variant === "partner";
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [message, setMessage] = useState("");
  const [contactRole, setContactRole] = useState<ContactRole | "">("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [errorText, setErrorText] = useState<string | null>(null);

  const id = (field: string) => `${idPrefix}-${field}`;
  const copy = partner
    ? {
        title: t.partnerFormTitle,
        messageLabel: t.partnerMessageLabel,
        messagePlaceholder: t.partnerMessagePlaceholder,
        submit: t.partnerSubmit,
        note: t.partnerFormNote,
        successTitle: t.partnerSuccessTitle,
        successText: t.partnerSuccessText,
      }
    : {
        title: t.formTitle,
        messageLabel: t.formMessageLabel,
        messagePlaceholder: t.formMessagePlaceholder,
        submit: t.formSubmit,
        note: t.formNote,
        successTitle: t.formSuccessTitle,
        successText: t.formSuccessText,
      };

  function validate(): Partial<Record<FieldKey, string>> {
    const found: Partial<Record<FieldKey, string>> = {};
    if (!name.trim()) found.name = t.formRequired;
    if (!phone.trim()) found.phone = t.formRequired;
    else {
      const pc = checkPhone(phone);
      if (!pc.ok) found.phone = dictionary.phoneCheck[pc.reason];
    }
    if (!partner && !contactRole) found.role = t.formSelectRequired;
    if (!citySlug) found.city = t.formSelectRequired;
    if (!partner && !propertyType) found.type = t.formSelectRequired;
    if (!message.trim()) found.message = t.formRequired;
    else if (message.trim().length < VENDER_MESSAGE_MIN)
      found.message = t.formMessageTooShort(VENDER_MESSAGE_MIN);
    return found;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;

    const found = validate();
    setErrors(found);
    setErrorText(null);
    const firstInvalid = (
      ["name", "phone", "role", "city", "type", "message"] as FieldKey[]
    ).find((k) => found[k]);
    if (firstInvalid) {
      setState("idle");
      formRef.current?.querySelector<HTMLElement>(`#${id(firstInvalid)}`)?.focus();
      return;
    }

    setState("sending");
    const cityName = cities.find((c) => c.slug === citySlug)?.name;
    const typeLabel = PROPERTY_TYPE_OPTIONS.find(
      (o) => o.value === propertyType,
    )?.label;
    const composedMessage = [
      cityName ? `${operator.formCityLabel}: ${cityName}` : null,
      typeLabel ? `${operator.formTypeLabel}: ${typeLabel}` : null,
      message.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leadType: partner ? "agent_signup" : "seller",
          name: name.trim(),
          whatsapp: phone.trim(),
          message: composedMessage,
          utm: { ...readVisitUtm(), source: partner ? "vender:socio" : "vender" },
          contactRole: partner ? "agent" : contactRole,
        }),
      });
      if (res.ok) {
        setState("sent");
        return;
      }
      // Say what actually went wrong: a number the server refuses belongs on
      // the phone field, and a rate limit is not "try again" in a loop.
      if (res.status === 400) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
          reason?: "short" | "doubled" | "long";
        } | null;
        if (body?.error === "invalid_phone" && body.reason) {
          setErrors({ phone: dictionary.phoneCheck[body.reason] });
          setState("error");
          return;
        }
      }
      setErrorText(res.status === 429 ? t.formRateLimited : t.formError);
      setState("error");
    } catch {
      setErrorText(t.formError);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="vd-form vd-form--done" role="status">
        <h3 className="vd-form__done-title">{copy.successTitle}</h3>
        <p className="vd-form__done-text">{copy.successText}</p>
      </div>
    );
  }

  const fieldError = (key: FieldKey) =>
    errors[key] ? (
      <span className="vd-form__field-error" id={id(`${key}-error`)} role="alert">
        {errors[key]}
      </span>
    ) : null;
  const aria = (key: FieldKey) => ({
    required: true,
    "aria-invalid": errors[key] ? (true as const) : undefined,
    "aria-describedby": errors[key] ? id(`${key}-error`) : undefined,
  });
  const star = (
    <span className="vd-form__star" aria-hidden>
      {" "}
      *
    </span>
  );

  return (
    <form
      ref={formRef}
      className="vd-form"
      onSubmit={onSubmit}
      aria-label={copy.title}
      noValidate
    >
      <label className="vd-form__field" htmlFor={id("name")}>
        <span className="vd-form__label">
          {t.formNameLabel}
          {star}
        </span>
        <input
          id={id("name")}
          className="vd-form__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={140}
          {...aria("name")}
        />
        {fieldError("name")}
      </label>

      <label className="vd-form__field" htmlFor={id("phone")}>
        <span className="vd-form__label">
          {t.formPhoneLabel}
          {star}
        </span>
        <input
          id={id("phone")}
          className="vd-form__input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+595 981 234 567"
          autoComplete="tel"
          maxLength={30}
          {...aria("phone")}
        />
        {fieldError("phone")}
      </label>

      {!partner && (
        <div>
          <ContactRoleField
            id={id("role")}
            locale={locale}
            roles={SELLER_ROLES}
            value={contactRole}
            onChange={setContactRole}
            required
            placeholder={t.formSelectPlaceholder}
            className="vd-form__field"
            labelClassName="vd-form__label"
            inputClassName="vd-form__input vd-form__select"
          />
          {fieldError("role")}
        </div>
      )}

      <label className="vd-form__field" htmlFor={id("city")}>
        <span className="vd-form__label">
          {partner ? t.partnerCityLabel : t.formCityLabel}
          {star}
        </span>
        <select
          id={id("city")}
          className="vd-form__input vd-form__select"
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
          {...aria("city")}
        >
          <option value="">{t.formCityPlaceholder}</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        {fieldError("city")}
      </label>

      {!partner && (
        <label className="vd-form__field" htmlFor={id("type")}>
          <span className="vd-form__label">
            {t.formTypeLabel}
            {star}
          </span>
          <select
            id={id("type")}
            className="vd-form__input vd-form__select"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as PropertyType | "")}
            {...aria("type")}
          >
            <option value="">{t.formTypePlaceholder}</option>
            {PROPERTY_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {fieldError("type")}
        </label>
      )}

      <label className="vd-form__field" htmlFor={id("message")}>
        <span className="vd-form__label">
          {copy.messageLabel}
          {star}
        </span>
        <textarea
          id={id("message")}
          className="vd-form__input vd-form__textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={copy.messagePlaceholder}
          rows={3}
          maxLength={1500}
          {...aria("message")}
        />
        {fieldError("message")}
      </label>

      {state === "error" && errorText && (
        <p className="vd-form__error" role="alert">
          {errorText}
        </p>
      )}

      <button
        className="ds-btn ds-btn--primary vd-form__submit"
        type="submit"
        disabled={state === "sending"}
      >
        {state === "sending" ? t.formSending : copy.submit}
      </button>

      <p className="vd-form__note">{copy.note}</p>
      <p className="vd-form__note vd-form__note--required">{t.formRequiredNote}</p>

      <p className="vd-form__fineprint">
        {t.formFineprintPrefix} <a href="/terminos">{t.formTerms}</a>{" "}
        {t.formFineprintAnd} <a href="/privacidad">{t.formPrivacy}</a>.
      </p>
    </form>
  );
}
