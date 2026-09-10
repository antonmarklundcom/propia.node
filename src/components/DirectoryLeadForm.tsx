"use client";

import { useState } from "react";
import { getDictionary, type Locale } from "@/i18n";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/property-types";
import type { PropertyType } from "@/lib/import/types";

export interface DirectoryFormCity {
  slug: string;
  name: string;
}

/**
 * The directory door's one form (fable-plan-realtor-terreno-rental.md Stage 1
 * D items 1–2). A property owner says what they have and where; the operator
 * introduces up to three inmobiliarios who work that zone.
 *
 * **It is the existing lead pipeline, not a new one.** Same `/api/leads`
 * endpoint, so the same MySQL-first ordering, the same rate limit and the same
 * same-origin filter as `VenderForm` and `ContactForm` — a second capture path
 * would be a second set of those guarantees to keep in sync.
 *
 * `leadType: "seller"` is an enum member that already exists; the marker is
 * `utm.source`, exactly the pattern `/vender` uses (`"vender"`), because there
 * is no `leads.source` column and D1 adds no schema (§1 item 5). Two markers,
 * so the panel can tell the two directory surfaces apart:
 *
 *   `directory:home`    — this form on the home page
 *   `directory:profile` — the same form on a professional's profile, which
 *                         also passes `agentSlug`; `/api/leads` resolves that
 *                         to `routedTo: "agent"` and stamps the resolved
 *                         agent's name into `utm` (there is no `agent_id`
 *                         column either). An unknown slug is never a 400 — a
 *                         lead must not be lost to a stale link.
 *
 * v1 matching is manual: the lead lands in `/admin/leads` and the founder
 * forwards it with the WhatsApp button that is already there. That is the
 * honest MVP — there is no agent supply to auto-match against yet — and it is
 * what lets this door ship without a migration.
 */
export function DirectoryLeadForm({
  cities,
  idPrefix,
  locale = "es",
  agentSlug,
  source = "directory:home",
}: {
  cities: DirectoryFormCity[];
  /** The form renders more than once per door — distinct field ids keep
   *  `<label htmlFor>` from colliding. */
  idPrefix: string;
  /** A client component takes its locale as a prop rather than calling
   *  `dict()` — see src/i18n/index.ts's module doc comment. */
  locale?: Locale;
  /** Set on a profile page: who the visitor asked for, by slug. */
  agentSlug?: string;
  source?: "directory:home" | "directory:profile";
}) {
  const t = getDictionary(locale).directory;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [operation, setOperation] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorText, setErrorText] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) {
      setErrorText(t.formPhoneError);
      setState("error");
      return;
    }
    setState("sending");

    // The three structured answers ride in the message body: they are what the
    // operator needs to pick the right three professionals, and none of them
    // has a column on `leads` to go in.
    const cityName = cities.find((c) => c.slug === citySlug)?.name;
    const typeLabel = PROPERTY_TYPE_OPTIONS.find(
      (o) => o.value === propertyType,
    )?.label;
    const operationLabel = t.formOperationOptions.find(
      (o) => o.value === operation,
    )?.label;
    const composedMessage = [
      operationLabel ? `${t.formOperationLabel}: ${operationLabel}` : null,
      cityName ? `${t.formCityLabel}: ${cityName}` : null,
      typeLabel ? `${t.formTypeLabel}: ${typeLabel}` : null,
      message.trim() || null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leadType: "seller",
          name: name.trim() || undefined,
          whatsapp: phone.trim(),
          message: composedMessage || undefined,
          agentSlug,
          utm: { ...readUtm(), source },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
    } catch {
      setErrorText(t.formError);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="vd-form vd-form--done" role="status">
        <h3 className="vd-form__done-title">{t.formSuccessTitle}</h3>
        <p className="vd-form__done-text">{t.formSuccessText}</p>
      </div>
    );
  }

  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <form className="vd-form" onSubmit={onSubmit} aria-label={t.formTitle}>
      <label className="vd-form__field" htmlFor={id("operation")}>
        <span className="vd-form__label">{t.formOperationLabel}</span>
        <select
          id={id("operation")}
          className="vd-form__input vd-form__select"
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
        >
          <option value="">{t.formTypePlaceholder}</option>
          {t.formOperationOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="vd-form__field" htmlFor={id("city")}>
        <span className="vd-form__label">{t.formCityLabel}</span>
        <select
          id={id("city")}
          className="vd-form__input vd-form__select"
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
        >
          <option value="">{t.formCityPlaceholder}</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="vd-form__field" htmlFor={id("type")}>
        <span className="vd-form__label">{t.formTypeLabel}</span>
        <select
          id={id("type")}
          className="vd-form__input vd-form__select"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value as PropertyType | "")}
        >
          <option value="">{t.formTypePlaceholder}</option>
          {PROPERTY_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="vd-form__field" htmlFor={id("name")}>
        <span className="vd-form__label">{t.formNameLabel}</span>
        <input
          id={id("name")}
          className="vd-form__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </label>

      <label className="vd-form__field" htmlFor={id("phone")}>
        <span className="vd-form__label">
          {t.formPhoneLabel} <span aria-hidden>*</span>
        </span>
        <input
          id={id("phone")}
          className="vd-form__input"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t.formPhonePlaceholder}
          autoComplete="tel"
        />
      </label>

      <label className="vd-form__field" htmlFor={id("message")}>
        <span className="vd-form__label">{t.formMessageLabel}</span>
        <textarea
          id={id("message")}
          className="vd-form__input vd-form__textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.formMessagePlaceholder}
          rows={3}
        />
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
        {state === "sending" ? t.formSending : t.formSubmit}
      </button>

      <p className="vd-form__note">{t.formNote}</p>

      <p className="vd-form__fineprint">
        {t.formFineprintPrefix} <a href="/terminos">{t.formTerms}</a>{" "}
        {t.formFineprintAnd} <a href="/privacidad">{t.formPrivacy}</a>.
      </p>
    </form>
  );
}

/** Same reader as VenderForm's: campaign params survive into the lead row. */
function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
    const v = p.get(k);
    if (v) utm[k] = v;
  }
  return utm;
}
