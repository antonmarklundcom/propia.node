"use client";

import { useState } from "react";
import { es } from "@/i18n/es";

/**
 * Full contact form for a listing (ARCHITECTURE.md §3 sticky WhatsApp
 * contact, extended to match the form-first pattern sellers expect).
 * Records the lead through /api/leads (MySQL first, then GHL) and THEN
 * opens WhatsApp with the same message — a lead is captured even if the
 * visitor never sends the WhatsApp message. WhatsApp/phone stay as a
 * one-tap fallback below the form for visitors who just want to chat.
 *
 * Two layouts from the same component: "card" (stacked, for the sticky
 * sidebar) and "panel" (two-column, for the full-width bottom section).
 */
export function ContactForm({
  listingPublicId,
  contactWhatsapp,
  leadType,
  prefillMessage,
  variant = "card",
}: {
  /** Omit for non-listing inquiries (e.g. a project page). */
  listingPublicId?: string;
  contactWhatsapp: string | null;
  leadType: "buyer" | "renter";
  prefillMessage: string;
  variant?: "card" | "panel";
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(prefillMessage);
  const [questions, setQuestions] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function toggleQuestion(q: string) {
    setQuestions((prev) => {
      const next = prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q];
      return next;
    });
  }

  const fullMessage =
    questions.length > 0 ? `${message}\n\n${questions.join(" ")}` : message;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const whatsappTarget = phone.trim() || contactWhatsapp;
    setSending(true);
    try {
      await fetch("/api/leads", {
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
    } catch {
      // A capture failure must not block the visitor reaching the seller.
    } finally {
      setSending(false);
      setSent(true);
      if (contactWhatsapp) {
        const digits = contactWhatsapp.replace(/\D/g, "");
        const text = encodeURIComponent(fullMessage);
        window.open(`https://wa.me/${digits}?text=${text}`, "_blank");
      }
    }
  }

  const fieldsRow = (
    <div className={`contact-form__row${variant === "panel" ? " contact-form__row--split" : ""}`}>
      <label className="contact-form__field">
        <span className="contact-form__label">Nombre</span>
        <input
          className="contact-form__input"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ingresa tu nombre"
        />
      </label>
      <label className="contact-form__field">
        <span className="contact-form__label">Email</span>
        <input
          className="contact-form__input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ingresa tu email"
        />
      </label>
    </div>
  );

  return (
    <form className={`contact-form contact-form--${variant}`} onSubmit={onSubmit}>
      {fieldsRow}

      <label className="contact-form__field">
        <span className="contact-form__label">Teléfono</span>
        <div className="contact-form__phone">
          <span className="contact-form__phone-prefix" aria-hidden>
            🇵🇾 +595
          </span>
          <input
            className="contact-form__input contact-form__input--phone"
            type="tel"
            required
            minLength={6}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="981 234 567"
          />
        </div>
      </label>

      <div className="contact-form__chips">
        {es.quickQuestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => toggleQuestion(q)}
            className={`contact-form__chip${questions.includes(q) ? " contact-form__chip--on" : ""}`}
          >
            {q}
          </button>
        ))}
      </div>

      <label className="contact-form__field">
        <span className="contact-form__label">Mensaje</span>
        <textarea
          className="contact-form__textarea"
          rows={variant === "panel" ? 3 : 4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <button className="contact-form__submit" type="submit" disabled={sending}>
        {sent ? "¡Mensaje enviado!" : sending ? "Enviando…" : "Enviar Mensaje"}
      </button>

      <div className="contact-form__footer">
        <span className="contact-form__note">
          ✓ Tu consulta llega directamente al vendedor
        </span>
        {contactWhatsapp && (
          <div className="contact-form__altlinks">
            <a
              className="contact-form__altlink"
              href={`https://wa.me/${contactWhatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 WhatsApp
            </a>
            <a className="contact-form__altlink" href={`tel:${contactWhatsapp}`}>
              📞 Ver teléfono
            </a>
          </div>
        )}
      </div>
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
