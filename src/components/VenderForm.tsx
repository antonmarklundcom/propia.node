"use client";

import { useState } from "react";
import { getDictionary, type Locale } from "@/i18n";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/property-types";
import type { PropertyType } from "@/lib/import/types";

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
 * Field set differs from `LeadForm` (Ciudad/barrio + Tipo instead of
 * email/company — guide §5.1 is explicit about the four fields), so this is
 * its own component rather than a reskin of `LeadForm`. `leadType: "seller"`
 * is the same enum member `/contacto`'s "Quiero publicar una propiedad"
 * reason already uses; `utm.source: "vender"` is the marker that lets
 * `/admin/leads` tell this landing page's leads apart from `/contacto`'s
 * (src/lib/panel-queries.ts selects `utm`, the admin page reads
 * `utm.source`) — there is no dedicated `leads.source` column, and adding
 * one is a schema change this PR did not need to make.
 */
export function VenderForm({
  cities,
  idPrefix,
  locale = "es",
}: {
  cities: VenderFormCity[];
  /** Two instances render on this page (hero + closing CTA) — distinct
   *  field ids keep <label htmlFor> from colliding. */
  idPrefix: string;
  /** A client component takes its locale as a prop rather than calling
   * dict() — see src/i18n/index.ts's module doc comment. `/vender` only
   * ever renders on the Spanish door (sellerLandingEnabled()), so this
   * defaults to "es" the same way ContactForm's two pre-locale call sites
   * do. */
  locale?: Locale;
}) {
  const t = getDictionary(locale).vender;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [citySlug, setCitySlug] = useState("");
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

    const cityName = cities.find((c) => c.slug === citySlug)?.name;
    const typeLabel = PROPERTY_TYPE_OPTIONS.find(
      (o) => o.value === propertyType,
    )?.label;
    const composedMessage = [
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
          utm: { ...readUtm(), source: "vender" },
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
    <form className="vd-form" onSubmit={onSubmit}>
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
          placeholder="+595 981 234 567"
          autoComplete="tel"
        />
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
