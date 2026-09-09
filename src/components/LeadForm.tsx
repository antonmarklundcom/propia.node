"use client";

import { useState } from "react";
import { getDictionary, type Locale } from "@/i18n";

export type LeadFormType =
  | "buyer"
  | "renter"
  | "seller"
  | "developer"
  | "agent_signup";

export interface LeadFormReason {
  value: LeadFormType;
  label: string;
}

/**
 * Standalone lead form for the marketing pages (/contacto,
 * /para-inmobiliarias). ContactForm.tsx is the listing-scoped version — it
 * always carries a listingPublicId and hands off to the seller's WhatsApp.
 * These leads have no listing and no counterparty: they come to us, so this
 * one just posts to /api/leads (MySQL first, then GHL) and confirms inline.
 *
 * WhatsApp is required by the API and is the field that actually gets a reply
 * in Paraguay; email is optional.
 *
 * A client component, so its copy comes from `getDictionary(locale)` with the
 * locale as a prop — never `dict()` (that reads `next/headers`). The `locale`
 * prop defaults to Spanish and every string it resolves is byte-identical to
 * what this component used to hard-code, so the two marketplace call sites
 * (`/contacto`, `/para-inmobiliarias`) render unchanged.
 */
export function LeadForm({
  leadType,
  reasons,
  locale = "es",
  submitLabel,
  messagePlaceholder,
  companyField = false,
  successTitle,
  successText,
  source,
}: {
  /** Used when `reasons` is not given, or as the initial selection. */
  leadType: LeadFormType;
  /** Renders a reason selector that switches the lead type. */
  reasons?: LeadFormReason[];
  /** The door's language. Client component, so it arrives as a prop. */
  locale?: Locale;
  submitLabel?: string;
  messagePlaceholder?: string;
  /** Adds an "inmobiliaria / empresa" line, folded into the message. */
  companyField?: boolean;
  successTitle?: string;
  successText?: string;
  /**
   * Marker folded into `utm.source`, so `/admin/leads` can tell which page a
   * lead came from without a `leads.source` column — the same mechanism
   * `VenderForm` uses with `source: "vender"`. The rental service pages pass
   * `rental:<slug>`.
   */
  source?: string;
}) {
  const t = getDictionary(locale).leadForm;
  const [type, setType] = useState<LeadFormType>(leadType);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6) {
      setError(t.invalidPhone);
      return;
    }
    setError(null);
    setSending(true);

    const body = [
      companyField && company ? `${t.companyPrefix}: ${company}` : null,
      message,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leadType: type,
          name: name || undefined,
          email: email || undefined,
          whatsapp: phone.trim(),
          message: body || undefined,
          utm: source ? { ...readUtm(), source } : readUtm(),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSent(true);
    } catch {
      setError(t.sendError);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="lead-form lead-form--done" role="status">
        <div className="lead-form__done-icon" aria-hidden>
          ✅
        </div>
        <h3 className="lead-form__done-title">{successTitle ?? t.successTitle}</h3>
        <p className="lead-form__done-text">{successText ?? t.successText}</p>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={onSubmit}>
      {reasons && reasons.length > 0 && (
        <label className="lead-form__field">
          <span className="lead-form__label">{t.reasonLabel}</span>
          <select
            className="lead-form__input"
            value={type}
            onChange={(e) => setType(e.target.value as LeadFormType)}
          >
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="lead-form__row">
        <label className="lead-form__field">
          <span className="lead-form__label">{t.nameLabel}</span>
          <input
            className="lead-form__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            autoComplete="name"
          />
        </label>
        <label className="lead-form__field">
          <span className="lead-form__label">
            {t.whatsappLabel} <span aria-hidden>*</span>
          </span>
          <input
            className="lead-form__input"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.whatsappPlaceholder}
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="lead-form__row">
        <label className="lead-form__field">
          <span className="lead-form__label">{t.emailLabel}</span>
          <input
            className="lead-form__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            autoComplete="email"
          />
        </label>
        {companyField && (
          <label className="lead-form__field">
            <span className="lead-form__label">{t.companyLabel}</span>
            <input
              className="lead-form__input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t.companyPlaceholder}
              autoComplete="organization"
            />
          </label>
        )}
      </div>

      <label className="lead-form__field">
        <span className="lead-form__label">{t.messageLabel}</span>
        <textarea
          className="lead-form__input lead-form__textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={messagePlaceholder ?? t.messagePlaceholder}
          rows={4}
        />
      </label>

      {error && (
        <p className="lead-form__error" role="alert">
          {error}
        </p>
      )}

      <button className="lead-form__submit" type="submit" disabled={sending}>
        {sending ? t.sending : (submitLabel ?? t.submitLabel)}
      </button>

      <p className="lead-form__fineprint">
        {t.finePrintLead}
        <a href="/terminos">{t.finePrintTerms}</a>
        {t.finePrintMid}
        <a href="/privacidad">{t.finePrintPrivacy}</a>
        {t.finePrintTail}
      </p>
    </form>
  );
}

/** UTM params from the landing URL, if the visitor arrived with any. */
function readUtm(): Record<string, string> | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ]) {
    const v = params.get(key);
    if (v) utm[key] = v;
  }
  return Object.keys(utm).length > 0 ? utm : undefined;
}
