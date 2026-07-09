"use client";

import { useState } from "react";
import { tokens } from "@/design/tokens";
import { es } from "@/i18n/es";

/**
 * Sticky WhatsApp contact (ARCHITECTURE.md §3). Records the lead through
 * /api/leads (MySQL first, then GHL) and THEN opens WhatsApp — so a lead is
 * captured even if the visitor never sends the message.
 *
 * The prefill names the listing and links back to it (built server-side and
 * passed as `message`), and the quick-question chips let the visitor append
 * common questions before opening the chat.
 */
export function WhatsAppContact({
  listingPublicId,
  contactWhatsapp,
  leadType,
  message,
}: {
  listingPublicId: string;
  contactWhatsapp: string | null;
  leadType: "buyer" | "renter";
  message?: string;
}) {
  const [sending, setSending] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);

  const baseMessage = message ?? es.inquiryPrefill;
  const fullMessage =
    questions.length > 0 ? `${baseMessage}\n\n${questions.join(" ")}` : baseMessage;

  function toggleQuestion(q: string) {
    setQuestions((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q],
    );
  }

  async function onContact() {
    setSending(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leadType,
          listingPublicId,
          whatsapp: contactWhatsapp ?? "unknown",
          message: fullMessage,
          utm: readUtm(),
        }),
      });
    } catch {
      // A capture failure must not block the visitor reaching the seller.
    } finally {
      setSending(false);
      if (contactWhatsapp) {
        const phone = contactWhatsapp.replace(/\D/g, "");
        const text = encodeURIComponent(fullMessage);
        window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
      }
    }
  }

  return (
    <div>
      <div className="wa-contact__chips">
        {es.quickQuestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => toggleQuestion(q)}
            className={`wa-contact__chip${questions.includes(q) ? " wa-contact__chip--on" : ""}`}
          >
            {q}
          </button>
        ))}
      </div>
      <button
        onClick={onContact}
        disabled={sending}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "0.9rem 1rem",
          background: tokens.color.whatsapp,
          color: "#fff",
          border: "none",
          borderRadius: tokens.radius.input,
          fontSize: 16,
          fontWeight: 700,
          cursor: sending ? "wait" : "pointer",
        }}
      >
        {es.contactWhatsapp}
      </button>
      <p className="wa-contact__note">
        ✓ Tu consulta llega directamente al vendedor
      </p>
    </div>
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
