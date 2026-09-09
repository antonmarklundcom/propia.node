import type { Dictionary, Locale } from "@/i18n";
import { LeadForm } from "@/components/LeadForm";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/config/contact";
import { waLink } from "@/lib/wa";

/**
 * `/contacto` on the rental doors.
 *
 * The lead goes through `LeadForm` → `/api/leads` and nowhere else: the row in
 * MySQL is the record, `/admin/leads` is where it is read, and an email to the
 * founder is a `LEAD_WEBHOOK_URL` target rather than a second provider inside
 * a request (plan §1 item 6). The three reasons map onto the existing
 * `lead_type` enum — renter / seller / buyer — because the enum is a schema
 * change and the service name already travels in `utm.source`.
 *
 * The phone number and the email address are env, never copy: with neither
 * set, this page shows the form and the address and no dead channels
 * (CLAUDE.md — "there is no portal email, on purpose").
 */
export function RentalContact({ d, locale }: { d: Dictionary; locale: Locale }) {
  const t = d.rental;
  const c = t.contact;
  const whatsapp = CONTACT_WHATSAPP;
  const waHref = waLink(whatsapp);

  return (
    <main className="rental-page">
      <section className="rp-hero">
        <div className="ds-container">
          <p className="ds-label">{c.h1}</p>
          <h1 className="rp-hero__title">{t.ctaTitle}</h1>
          <p className="rp-hero__lead">{c.lead}</p>
        </div>
      </section>

      <section className="ds-section ds-container rp-form">
        <div className="rp-form__copy">
          <h2 className="home-section__title">{c.formTitle}</h2>
          <div className="rh-why__card">
            <h3 className="rh-why__card-title">{c.channelsTitle}</h3>
            <ul className="rp-channels">
              {waHref && (
                <li>
                  <a href={waHref} target="_blank" rel="noopener noreferrer">
                    💬 WhatsApp {whatsapp}
                  </a>
                </li>
              )}
              {CONTACT_EMAIL && (
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`}>✉️ {CONTACT_EMAIL}</a>
                </li>
              )}
              <li>📝 {c.formNote}</li>
            </ul>
          </div>
          <div className="rh-why__card">
            <h3 className="rh-why__card-title">{c.officeTitle}</h3>
            <p className="rh-why__card-text">📍 {c.officeText}</p>
          </div>
        </div>
        <div className="rp-form__form">
          <LeadForm
            leadType="renter"
            locale={locale}
            source="rental:contacto"
            reasons={[
              { value: "renter", label: c.reasonRent },
              { value: "seller", label: c.reasonManage },
              { value: "buyer", label: c.reasonInvest },
            ]}
          />
        </div>
      </section>
    </main>
  );
}
