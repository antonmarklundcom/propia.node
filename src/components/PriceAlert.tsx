"use client";

import { Glyph } from "@/components/Glyph";
import { useState } from "react";
import { getDictionary, type Locale } from "@/i18n";

/**
 * "Avisame si baja" price alert. There's no alerting engine yet, so this is
 * honest about what it does: it captures the request as a lead (leadType
 * buyer/renter, message flags the price alert) so the team can follow up
 * manually — the same channel every other inquiry uses. When a real alert
 * engine ships it reads these same leads.
 */
export function PriceAlert({
  locale,
  listingPublicId,
  listingTitle,
  leadType,
}: {
  locale: Locale;
  listingPublicId: string;
  listingTitle: string;
  leadType: "buyer" | "renter";
}) {
  const d = getDictionary(locale);
  const t = d.priceAlert;
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setState("sending");
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leadType,
          listingPublicId,
          whatsapp: phone.trim(),
          message: t.message(listingTitle),
        }),
      });
      setState("done");
    } catch {
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <span className="price-alert price-alert--done">
        {t.done}
      </span>
    );
  }

  if (!open) {
    return (
      <button className="price-alert" onClick={() => setOpen(true)}>
        <Glyph name="clock" /> {d.common.priceAlert}
      </button>
    );
  }

  return (
    <form className="price-alert__form" onSubmit={onSubmit}>
      <input
        className="price-alert__input"
        type="tel"
        autoFocus
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t.phonePlaceholder}
        aria-label={t.phoneLabel}
      />
      <button
        className="price-alert__submit"
        type="submit"
        disabled={state === "sending"}
      >
        {state === "sending" ? t.sending : t.submit}
      </button>
    </form>
  );
}
