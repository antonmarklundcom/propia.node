"use client";

/**
 * "Reportar este aviso" (plan-build-2026-09-26 A3, Seeker 7). A collapsed
 * <details> on the detail page that posts to /api/leads with `report`: the
 * server stores it as a `question` lead, `routed_to: internal`,
 * `utm.source: "report:listing"`, under the same per-IP rate limit as every
 * other lead. Nothing is sent to the publisher.
 */
import { useState } from "react";
import { getDictionary, type Locale } from "@/i18n";
import { REPORT_REASONS, type ReportReason } from "@/i18n/es-a3";

export function ReportListing({
  listingPublicId,
  locale,
}: {
  listingPublicId: string;
  locale: Locale;
}) {
  const d = getDictionary(locale);
  const t = d.a3.report;
  const [reason, setReason] = useState<ReportReason>("sold");
  const [detail, setDetail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leadType: "question",
          listingPublicId,
          whatsapp: phone.trim(),
          message: `${t.reasons[reason]}${detail.trim() ? `\n\n${detail.trim()}` : ""}`,
          report: { reason },
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <details className="report-listing">
      <summary className="report-listing__summary">{t.open}</summary>
      {state === "sent" ? (
        <p className="report-listing__done" role="status">{t.sent}</p>
      ) : (
        <form className="report-listing__form" onSubmit={onSubmit}>
          <p className="report-listing__intro">{t.intro}</p>
          <fieldset className="report-listing__reasons">
            <legend className="contact-form__label">{t.reasonLabel}</legend>
            {REPORT_REASONS.map((r) => (
              <label key={r} className="report-listing__reason">
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                {t.reasons[r]}
              </label>
            ))}
          </fieldset>
          <label className="contact-form__field">
            <span className="contact-form__label">{t.detailLabel}</span>
            <textarea
              className="contact-form__textarea"
              rows={3}
              maxLength={1500}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </label>
          <label className="contact-form__field">
            <span className="contact-form__label">{t.phoneLabel}</span>
            <input
              className="contact-form__input"
              type="tel"
              required
              minLength={6}
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={d.publicUi.phonePlaceholder}
            />
            <span className="report-listing__hint">{t.phoneHint}</span>
          </label>
          <button className="panel-btn" type="submit" disabled={state === "sending"}>
            {state === "sending" ? t.sending : t.submit}
          </button>
          {state === "error" && (
            <p className="contact-form__error" role="alert">{t.error}</p>
          )}
        </form>
      )}
    </details>
  );
}
