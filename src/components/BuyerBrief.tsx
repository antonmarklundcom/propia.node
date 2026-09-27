"use client";

import { useState } from "react";
import { Glyph } from "@/components/Glyph";
import { getDictionary, type Locale } from "@/i18n";
import type { Operation, PropertyType } from "@/lib/import/types";
import {
  BRIEF_BEDROOMS,
  BRIEF_TIMELINES,
  briefLeadType,
  type BriefChoices,
  type BriefCurrency,
  type BriefPayload,
  type BriefPrefill,
  type BriefSurface,
  type BriefTimeline,
} from "@/lib/buyer-brief";

/**
 * "Tell us what you're looking for" — the buyer brief shown where a search
 * found nothing or very little (`src/lib/buyer-brief.ts` has the why).
 *
 * Same endpoint and same look as `LeadForm`: it posts to `/api/leads` (MySQL
 * first, the same rate limit, routing, CRM copy and operator alert) and wears
 * the `lead-form` classes, so it is native on every door's theme. The
 * structured answers travel as `brief`; the route turns them into the lead's
 * message and stamps `utm.source: "brief"` — the client never writes either.
 *
 * A client component, so its copy comes from `getDictionary(locale)` with the
 * locale as a prop. Name / WhatsApp / email / consent come from `leadForm`, so
 * this form promises exactly what the other lead forms promise.
 */
export function BuyerBrief({
  locale,
  surface,
  prefill,
  choices,
  idPrefix,
  collapsible = false,
}: {
  locale: Locale;
  surface: BriefSurface;
  prefill: BriefPrefill;
  choices: BriefChoices;
  /** Distinct `<label htmlFor>` ids if the form ever renders twice on a page. */
  idPrefix: string;
  /** Thin results: start as one line and a button, not a whole form. */
  collapsible?: boolean;
}) {
  const dict = getDictionary(locale);
  const t = dict.brief;
  const lf = dict.leadForm;
  const initialOperation =
    prefill.operation && choices.operations.includes(prefill.operation)
      ? prefill.operation
      : choices.operations[0];
  const initialType =
    prefill.propertyType && choices.propertyTypes.includes(prefill.propertyType)
      ? prefill.propertyType
      : choices.propertyTypes.length === 1
        ? choices.propertyTypes[0]
        : "";

  const [open, setOpen] = useState(!collapsible);
  const [operation, setOperation] = useState<Operation>(initialOperation);
  const [propertyType, setPropertyType] = useState<PropertyType | "">(initialType);
  const [where, setWhere] = useState(prefill.where ?? "");
  // The category price filter is in USD (`price_usd`), so a prefilled budget is.
  const [budget, setBudget] = useState(
    prefill.budgetMaxUsd ? String(Math.round(prefill.budgetMaxUsd)) : "",
  );
  const [currency, setCurrency] = useState<BriefCurrency>(
    prefill.budgetMaxUsd || initialOperation === "venta" ? "USD" : "PYG",
  );
  const [bedrooms, setBedrooms] = useState(
    prefill.bedrooms && prefill.bedrooms >= 1
      ? String(Math.min(Math.round(prefill.bedrooms), 4))
      : "",
  );
  const [timeline, setTimeline] = useState<BriefTimeline | "">("");
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = surface === "few" ? t.titleFew : t.titleEmpty;
  const id = (field: string) => `${idPrefix}-${field}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 6) {
      setError(lf.invalidPhone);
      return;
    }
    // Visitors type "150.000" or "150,000"; only the digits are the number.
    const budgetDigits = budget.replace(/[.,\s]/g, "");
    if (budgetDigits && !/^\d{1,13}$/.test(budgetDigits)) {
      setError(t.invalidBudget);
      return;
    }
    setError(null);
    setSending(true);

    const brief: BriefPayload = {
      surface,
      operation,
      propertyType: propertyType || undefined,
      where: where.trim().slice(0, 140) || undefined,
      budgetMax: budgetDigits && Number(budgetDigits) > 0 ? Number(budgetDigits) : undefined,
      currency: budgetDigits ? currency : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      timeline: timeline || undefined,
      note: note.trim().slice(0, 500) || undefined,
      path: `${window.location.pathname}${window.location.search}`.slice(0, 300),
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leadType: briefLeadType(operation),
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          whatsapp: phone.trim(),
          utm: readUtm(),
          brief,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSent(true);
    } catch {
      setError(lf.sendError);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <section className="buyer-brief" aria-label={title}>
        <div className="lead-form lead-form--done" role="status">
          <div className="lead-form__done-icon" aria-hidden>
            <Glyph name="check" />
          </div>
          <h3 className="lead-form__done-title">{lf.successTitle}</h3>
          <p className="lead-form__done-text">{lf.successText}</p>
        </div>
      </section>
    );
  }

  if (!open) {
    return (
      <section className="buyer-brief buyer-brief--collapsed" aria-label={title}>
        <p className="buyer-brief__title">{title}</p>
        <button
          type="button"
          className="buyer-brief__open"
          onClick={() => setOpen(true)}
          aria-expanded={false}
        >
          {t.open}
        </button>
      </section>
    );
  }

  return (
    <section className="buyer-brief" aria-labelledby={id("title")}>
      <h2 className="buyer-brief__title" id={id("title")}>{title}</h2>
      <p className="buyer-brief__intro">{t.intro}</p>
      <form className="lead-form" id={id("form")} onSubmit={onSubmit}>
        <div className="lead-form__row">
          {choices.operations.length > 1 && (
            <label className="lead-form__field" htmlFor={id("operation")}>
              <span className="lead-form__label">{t.operationLabel}</span>
              <select
                id={id("operation")}
                className="lead-form__input"
                value={operation}
                onChange={(e) => setOperation(e.target.value as Operation)}
              >
                {choices.operations.map((o) => (
                  <option key={o} value={o}>{t.operation[o]}</option>
                ))}
              </select>
            </label>
          )}
          <label className="lead-form__field" htmlFor={id("type")}>
            <span className="lead-form__label">{t.typeLabel}</span>
            <select
              id={id("type")}
              className="lead-form__input"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType | "")}
            >
              {choices.propertyTypes.length > 1 && <option value="">{t.typeAny}</option>}
              {choices.propertyTypes.map((p) => (
                <option key={p} value={p}>{dict.category.typeLabel[p]}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="lead-form__field" htmlFor={id("where")}>
          <span className="lead-form__label">{t.whereLabel}</span>
          <input
            id={id("where")}
            className="lead-form__input"
            value={where}
            maxLength={140}
            onChange={(e) => setWhere(e.target.value)}
            placeholder={t.wherePlaceholder}
          />
        </label>

        <div className="lead-form__row">
          <label className="lead-form__field" htmlFor={id("budget")}>
            <span className="lead-form__label">{t.budgetLabel}</span>
            <input
              id={id("budget")}
              className="lead-form__input"
              inputMode="numeric"
              value={budget}
              maxLength={20}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={t.budgetPlaceholder}
            />
          </label>
          <label className="lead-form__field" htmlFor={id("currency")}>
            <span className="lead-form__label">{t.currencyLabel}</span>
            <select
              id={id("currency")}
              className="lead-form__input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as BriefCurrency)}
            >
              {(["USD", "PYG"] as const).map((c) => (
                <option key={c} value={c}>{t.currency[c]}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="lead-form__row">
          <label className="lead-form__field" htmlFor={id("bedrooms")}>
            <span className="lead-form__label">{t.bedroomsLabel}</span>
            <select
              id={id("bedrooms")}
              className="lead-form__input"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
            >
              <option value="">{t.bedroomsAny}</option>
              {BRIEF_BEDROOMS.map((n) => (
                <option key={n} value={String(n)}>{t.bedroomsOption(n)}</option>
              ))}
            </select>
          </label>
          <label className="lead-form__field" htmlFor={id("timeline")}>
            <span className="lead-form__label">{t.timelineLabel}</span>
            <select
              id={id("timeline")}
              className="lead-form__input"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value as BriefTimeline | "")}
            >
              <option value="">{t.timelinePlaceholder}</option>
              {BRIEF_TIMELINES.map((v) => (
                <option key={v} value={v}>{t.timeline[v]}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="lead-form__field" htmlFor={id("note")}>
          <span className="lead-form__label">{t.noteLabel}</span>
          <textarea
            id={id("note")}
            className="lead-form__input lead-form__textarea buyer-brief__note"
            value={note}
            maxLength={500}
            rows={2}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePlaceholder}
          />
        </label>

        <div className="lead-form__row">
          <label className="lead-form__field" htmlFor={id("name")}>
            <span className="lead-form__label">{lf.nameLabel}</span>
            <input
              id={id("name")}
              className="lead-form__input"
              value={name}
              maxLength={140}
              onChange={(e) => setName(e.target.value)}
              placeholder={lf.namePlaceholder}
              autoComplete="name"
            />
          </label>
          <label className="lead-form__field" htmlFor={id("phone")}>
            <span className="lead-form__label">
              {lf.whatsappLabel} <span aria-hidden>*</span>
            </span>
            <input
              id={id("phone")}
              className="lead-form__input"
              type="tel"
              required
              value={phone}
              maxLength={30}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={lf.whatsappPlaceholder}
              autoComplete="tel"
            />
          </label>
        </div>

        <label className="lead-form__field" htmlFor={id("email")}>
          <span className="lead-form__label">{lf.emailLabel}</span>
          <input
            id={id("email")}
            className="lead-form__input"
            type="email"
            value={email}
            maxLength={190}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={lf.emailPlaceholder}
            autoComplete="email"
          />
        </label>

        {error && (
          <p className="lead-form__error" role="alert">
            {error}
          </p>
        )}

        <button className="lead-form__submit" type="submit" disabled={sending}>
          {sending ? lf.sending : t.submit}
        </button>

        <p className="lead-form__fineprint">
          {lf.finePrintLead}
          <a href="/terminos">{lf.finePrintTerms}</a>
          {lf.finePrintMid}
          <a href="/privacidad">{lf.finePrintPrivacy}</a>
          {lf.finePrintTail}
        </p>
      </form>
    </section>
  );
}

/** Campaign params from the landing URL, same reader as `LeadForm`'s. */
function readUtm(): Record<string, string> | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = params.get(key);
    if (v) utm[key] = v;
  }
  return Object.keys(utm).length > 0 ? utm : undefined;
}
