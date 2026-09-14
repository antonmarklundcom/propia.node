import type { Metadata } from "next";
import Link from "next/link";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { LeadForm } from "@/components/LeadForm";
import { PageHero, Section } from "@/components/MarketingUI";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/config/contact";
import { waLink } from "@/lib/wa";
import { dict } from "@/i18n/server";
import { currentVertical } from "@/lib/vertical-context";
import { rentalPagesEnabled } from "@/design/sections";
import {
  rentalContactMetadata,
  redirectRentalToEnglish,
} from "@/lib/rental-routes";
import { RentalContact } from "@/components/RentalContact";

export const dynamic = "force-dynamic";


export async function generateMetadata(): Promise<Metadata> {
  const c = (await dict()).contactPage;
  const [brand, vertical, d, origin] = await Promise.all([
    brandName(),
    currentVertical(),
    dict(),
    siteOrigin(),
  ]);
  // Same one-line fork as /nosotros: the marketplace's contact copy is about
  // publishing an aviso and inmobiliaria accounts, which is not what a rental
  // door answers.
  // Shared with `/contact`, the English door's URL for this same page (R2).
  if (rentalPagesEnabled(vertical.key)) return rentalContactMetadata();
  return {
    title: `${c.title}`,
    description: c.description(brand),
    alternates: { canonical: `${origin}/contacto` },
    openGraph: { title: `${c.title} — ${brand}`, description: c.description(brand) },
  };
}

/**
 * Contact routing note: this page never handles a question about a specific
 * property. Those go to whoever published the aviso, through the form on the
 * listing page — so the copy sends people there instead of creating a support
 * queue we can't answer.
 */
export default async function ContactoPage() {
  const c = (await dict()).contactPage;
  const vertical = await currentVertical();
  // The English rental door publishes this page at /contact (R2).
  redirectRentalToEnglish(vertical, "contact");
  if (rentalPagesEnabled(vertical.key)) {
    return <RentalContact d={await dict()} locale={vertical.locale} />;
  }
  const brand = await brandName();
  const origin = await siteOrigin();
  const whatsapp = CONTACT_WHATSAPP;
  const waHref = waLink(whatsapp);

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: c.home, url: "/" },
            { name: c.title, url: "/contacto" },
          ]),
          organizationJsonLd(origin, {
            name: brand,
            whatsapp,
            email: CONTACT_EMAIL ?? undefined,
          }),
        ]}
      />

      <PageHero
        kicker={c.kicker}
        title={c.heading}
        subtitle={c.subtitle}
      />

      <Section>
        <div className="mk-contact">
          <div className="mk-contact__form">
            <h2 className="mk-section__title mk-section__title--sub">
              {c.formHeading}</h2>
            <LeadForm
              locale={vertical.locale}
              leadType="seller"
              reasons={[
                { value: "seller", label: c.reasonSeller },
                {
                  value: "agent_signup",
                  label: c.reasonAgent,
                },
                {
                  value: "developer",
                  label: c.reasonDeveloper,
                },
                { value: "buyer", label: c.reasonOther },
              ]}
              companyField
            />
          </div>

          <aside className="mk-contact__aside">
            <div className="mk-card">
              <h3 className="mk-card__title">{c.channelsHeading}</h3>
              <ul className="mk-card__list">
                {waHref && (
                  <li>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {c.whatsapp}{whatsapp}
                    </a>
                  </li>
                )}
                {/* Only shown once a real mailbox is configured — the form on
                    the left is the channel until then. */}
                {CONTACT_EMAIL && (
                  <li>
                    <a href={`mailto:${CONTACT_EMAIL}`}>✉️ {CONTACT_EMAIL}</a>
                  </li>
                )}
                <li>{c.formChannel}</li>
                <li>{c.location}</li>
                <li>{c.hours}</li>
              </ul>
            </div>

            <div className="mk-card">
              <h3 className="mk-card__title">
                {c.propertyHeading}</h3>
              <p className="mk-card__text">
                {c.propertyBody}</p>
              <Link className="mk-card__link" href="/venta/asuncion">
                {c.browse}</Link>
            </div>

            <div className="mk-card">
              <h3 className="mk-card__title">{c.shortcutsHeading}</h3>
              <ul className="mk-card__list">
                <li>
                  <Link href="/publicar">{c.publish}</Link>
                </li>
                <li>
                  <Link href="/para-inmobiliarias">
                    {c.agencyAccount}</Link>
                </li>
                <li>
                  <Link href="/tasacion">{c.valuation}</Link>
                </li>
                <li>
                  <Link href="/preguntas-frecuentes">{c.faq}</Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </main>
  );
}
