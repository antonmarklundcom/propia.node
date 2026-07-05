"use client";

import { useState } from "react";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/Button";

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
    <Button variant="whatsapp" block size="lg" onClick={onContact} disabled={sending}>
      {/* Full label fits the desktop sidebar card; the compact mobile bar
          (see .listing-detail__aside in globals.css) only has room for the
          short one once the price sits next to it. */}
      <span className="wa-cta__full">{es.contactWhatsapp}</span>
      <span className="wa-cta__short">Contactar</span>
    </Button>
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
