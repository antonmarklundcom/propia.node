"use client";

import { useState } from "react";
import { tokens } from "@/design/tokens";
import { es } from "@/i18n/es";

/**
 * Sticky WhatsApp contact (ARCHITECTURE.md §3). Records the lead through
 * /api/leads (MySQL first, then GHL) and THEN opens WhatsApp — so a lead is
 * captured even if the visitor never sends the message.
 */
export function WhatsAppContact({
  listingPublicId,
  contactWhatsapp,
  leadType,
}: {
  listingPublicId: string;
  contactWhatsapp: string | null;
  leadType: "buyer" | "renter";
}) {
  const [sending, setSending] = useState(false);

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
          message: es.inquiryPrefill,
          utm: readUtm(),
        }),
      });
    } catch {
      // A capture failure must not block the visitor reaching the seller.
    } finally {
      setSending(false);
      if (contactWhatsapp) {
        const phone = contactWhatsapp.replace(/\D/g, "");
        const text = encodeURIComponent(es.inquiryPrefill);
        window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
      }
    }
  }

  return (
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
