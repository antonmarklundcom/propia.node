"use client";

import { Glyph } from "@/components/Glyph";
import { useState } from "react";
import { getDictionary, type Locale } from "@/i18n";
import { waLink, waPhone } from "@/lib/wa";

/**
 * Shared inquiry form; the listing seller card leads with WhatsApp when available.
 * Records the lead through /api/leads (MySQL first, then GHL) and then
 * hands the visitor a WhatsApp link with the same message — a lead is
 * captured even if the visitor never sends the WhatsApp message.
 *
 * Success is only claimed when res.ok. Failed capture with WhatsApp
 * available shows a neutral fallback notice. The
 * WhatsApp continuation is a rendered <a> the visitor taps, not a
 * post-await window.open — popup blockers (iOS Safari especially) eat
 * window.open calls that don't happen synchronously in the tap handler.
 *
 * Two layouts from the same component: "card" (stacked, for the sticky
 * sidebar) and "panel" (two-column, for the full-width bottom section).
 */
export function ContactForm({
  id,
  listingPublicId,
  contactWhatsapp,
  leadType,
  prefillMessage,
  variant = "card",
  locale = "es",
  recipients,
}: {
  id?: string;
  /** Omit for non-listing inquiries (e.g. a project page). */
  listingPublicId?: string;
  contactWhatsapp: string | null;
  leadType: "buyer" | "renter";
  prefillMessage: string;
  variant?: "card" | "panel";
  /** A client component takes its locale as a prop rather than calling
   * dict() — see src/i18n/index.ts's module doc comment. Defaults to "es"
   * for the two existing call sites that don't pass it yet, both of which
   * only ever render on the Spanish door today. */
  locale?: Locale;
  /**
   * Who a lead on this listing can reach, for the "who receives it" line
   * after sending (A3, Seeker 4). Which one applies comes back from
   * /api/leads as `routedTo` — the same decision the row was stored with —
   * so this only supplies the names. Omit it and no line is shown.
   */
  recipients?: { agent: string | null; agency: string | null; brand: string };
}) {
  const d = getDictionary(locale);
  const t = d.contactForm;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(prefillMessage);
  const [questions, setQuestions] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "fallback" | "error">(
    "idle",
  );
  const [routedTo, setRoutedTo] = useState<string | null>(null);

  function toggleQuestion(q: string) {
    setQuestions((prev) => {
      const next = prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q];
      return next;
    });
  }

  const fullMessage =
    questions.length > 0 ? `${message}\n\n${questions.join(" ")}` : message;
  const waHref = waLink(contactWhatsapp, fullMessage);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const whatsappTarget = phone.trim() || contactWhatsapp;
    setState("sending");
    let captured = false;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leadType,
          listingPublicId,
          name: name || undefined,
          email: email || undefined,
          whatsapp: whatsappTarget || "unknown",
          message: fullMessage,
          utm: readUtm(),
        }),
      });
      captured = res.ok;
      if (res.ok) {
        const body = (await res.json().catch(() => null)) as { routedTo?: unknown } | null;
        setRoutedTo(typeof body?.routedTo === "string" ? body.routedTo : null);
      }
    } catch {
      // Network failure — handled below; WhatsApp may still reach the seller.
    }
    // Without a WhatsApp fallback a failed capture means nobody got the
    // message — say so instead of lying with a success state.
    setState(captured ? "sent" : waHref ? "fallback" : "error");
  }

  const fieldsRow = (
    <div className={`contact-form__row${variant === "panel" ? " contact-form__row--split" : ""}`}>
      <label className="contact-form__field">
        <span className="contact-form__label">{t.nameLabel}</span>
        <input
          className="contact-form__input"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
        />
      </label>
      <label className="contact-form__field">
        <span className="contact-form__label">{t.emailLabel}</span>
        <input
          className="contact-form__input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
        />
      </label>
    </div>
  );

  return (
    <form id={id} className={`contact-form contact-form--${variant}`} onSubmit={onSubmit}>
      {fieldsRow}

      <label className="contact-form__field">
        <span className="contact-form__label">{t.phoneLabel}</span>
        <div className="contact-form__phone">
          <span className="contact-form__phone-prefix" aria-hidden>
            <Glyph name="phone" /> +595
          </span>
          <input
            className="contact-form__input contact-form__input--phone"
            type="tel"
            required
            minLength={6}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t.phonePlaceholder}
          />
        </div>
      </label>

      <div className="contact-form__chips">
        {d.common.quickQuestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => toggleQuestion(q)}
            aria-pressed={questions.includes(q)}
            className={`contact-form__chip${questions.includes(q) ? " contact-form__chip--on" : ""}`}
          >
            {q}
          </button>
        ))}
      </div>

      <label className="contact-form__field">
        <span className="contact-form__label">{t.messageLabel}</span>
        <textarea
          className="contact-form__textarea"
          rows={variant === "panel" ? 3 : 4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <button
        className="contact-form__submit"
        type="submit"
        disabled={state === "sending"}
      >
        {state === "sent"
          ? t.submitSent
          : state === "sending"
            ? t.submitSending
            : t.submitIdle}
      </button>

      {state === "fallback" && <p className="contact-form__fallback" role="status">{t.fallbackText}</p>}
      {state === "sent" && recipients && routedTo && (
        <p className="contact-form__recipient" role="status">
          {recipientLine(d.a3.enquiry, routedTo, recipients)}
          {waHref && <> {d.a3.enquiry.waFallback}</>}
        </p>
      )}
      {(state === "sent" || state === "fallback") && waHref && (
        <a
          className="contact-form__submit contact-form__submit--wa"
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Glyph name="whatsapp" /> {t.waContinue}
        </a>
      )}
      {state === "error" && (
        <p className="contact-form__error" role="alert">
          {t.errorText}
        </p>
      )}

      <div className="contact-form__footer">
        {/* Only claim direct delivery when there is a seller channel to
            deliver to. With no contact on the listing the lead lands in the
            operator's inbox instead, and promising otherwise is a lie the
            buyer can't check (audit F4). */}
        {waHref && state !== "fallback" && state !== "error" && (
          <span className="contact-form__note"><Glyph name="check" /> {t.directNote}</span>
        )}
        {waHref && (
          <div className="contact-form__altlinks">
            <a
              className="contact-form__altlink"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Glyph name="whatsapp" /> {t.waLinkLabel}
            </a>
            {waPhone(contactWhatsapp) && (
              <a
                className="contact-form__altlink"
                href={`tel:+${waPhone(contactWhatsapp)}`}
              >
                <Glyph name="phone" /> {t.phoneLinkLabel}
              </a>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

/** The success line for the lane /api/leads chose. No response time: none is promised. */
function recipientLine(
  t: ReturnType<typeof getDictionary>["a3"]["enquiry"],
  routedTo: string,
  who: { agent: string | null; agency: string | null; brand: string },
): string {
  switch (routedTo) {
    case "agent":
      return who.agent ? t.toAgent(who.agent) : t.toAgentUnnamed;
    case "agency":
      return who.agency ? t.toAgency(who.agency) : t.toAgencyUnnamed;
    case "owner":
      return t.toOwner;
    default:
      return t.toInternal(who.brand);
  }
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
