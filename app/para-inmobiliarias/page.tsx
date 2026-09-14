import { numberLocaleFor } from "@/i18n";
import { dict, currentLocale } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { getPortalStats } from "@/lib/directory-queries";
import { LeadForm } from "@/components/LeadForm";
import {
  CtaBand,
  FeatureGrid,
  PageHero,
  Section,
  StatRow,
  StepList,
} from "@/components/MarketingUI";

// Reads live portal counts; the DB isn't reachable at build time on Hostinger.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const c = (await dict()).paraInmobiliarias;

  const brand = await brandName();
  return {
    title: `${c.title}`,
    description: c.description(brand),
    alternates: { canonical: `${await siteOrigin()}/para-inmobiliarias` },
    openGraph: { title: `${c.title} — ${brand}`, description: c.description(brand) },
  };
}

export default async function ParaInmobiliariasPage() {
  const c = (await dict()).paraInmobiliarias;
  const locale = await currentLocale();
  const numberLocale = numberLocaleFor(locale);
  const TITLE = c.title;
  const DESCRIPTION = c.description;

  const BENEFITS = [
    {
      icon: "list",
      title: c.benefitPortfolio,
      text: c.benefitPortfolioBody,
    },
    {
      icon: "chat",
      title: c.benefitDirect,
      text: c.benefitDirectBody,
    },
    {
      icon: "building",
      title: c.benefitProfile,
      text: c.benefitProfileBody,
    },
    {
      icon: "chart",
      title: c.benefitData,
      text: c.benefitDataBody,
    },
    {
      icon: "card",
      title: c.benefitPayment,
      text: c.benefitPaymentBody,
    },
    {
      icon: "users",
      title: c.benefitTeam,
      text: c.benefitTeamBody,
    },
  ];

  const STEPS = [
    {
      title: c.stepAccount,
      text: c.stepAccountBody,
    },
    {
      title: c.stepPortfolio,
      text: c.stepPortfolioBody,
    },
    {
      title: c.stepVerification,
      text: c.stepVerificationBody,
    },
    {
      title: c.stepInquiries,
      text: c.stepInquiriesBody,
    },
  ];

  const FAQ = [
    {
      q: c.faqCost,
      a: c.faqCostBody,
    },
    {
      q: c.faqCommission,
      a: c.faqCommissionBody,
    },
    {
      q: c.faqImport,
      a: c.faqImportBody,
    },
    {
      q: c.faqLeads,
      a: c.faqLeadsBody,
    },
    {
      q: c.faqIndependent,
      a: c.faqIndependentBody,
    },
  ];

  const brand = await brandName();
  const [origin, stats] = await Promise.all([siteOrigin(), getPortalStats()]);

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: c.home, url: "/" },
            { name: c.title, url: "/para-inmobiliarias" },
          ]),
          faqJsonLd(FAQ),
        ]}
      />

      <PageHero
        tone="dark"
        kicker={c.kicker}
        title={c.heading}
        subtitle={c.intro(brand)}
        actions={
          <>
            <Link className="mk-btn mk-btn--accent" href="/registro">
              {c.createAccount}
            </Link>
            <Link className="mk-btn mk-btn--ghost" href="#contacto">
              {c.contact}
            </Link>
          </>
        }
      />

      {(stats.listings > 0 || stats.agencies > 0) && (
        <Section>
          <StatRow
            stats={[
              {
                value: stats.listings.toLocaleString(numberLocale),
                label: c.listings,
              },
              {
                value: stats.cities.toLocaleString(numberLocale),
                label: c.cities,
              },
              {
                value: stats.agencies.toLocaleString(numberLocale),
                label: c.agencies,
              },
              { value: c.zeroCost, label: c.leadCost },
            ]}
          />
        </Section>
      )}

      <Section
        title={c.benefitsHeading}
        subtitle={c.benefitsIntro}
      >
        <FeatureGrid items={BENEFITS} />
      </Section>

      <Section
        tone="muted"
        title={c.stepsHeading}
        subtitle={c.stepsIntro}
      >
        <StepList steps={STEPS} />
      </Section>

      <Section title={c.faqHeading} width="narrow">
        <div className="mk-faq">
          {FAQ.map((f) => (
            <details key={f.q} className="mk-faq__item">
              <summary className="mk-faq__q">{f.q}</summary>
              <p className="mk-faq__a">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section
        id="contacto"
        tone="muted"
        width="narrow"
        title={c.contactHeading}
        subtitle={c.contactIntro}
      >
        <LeadForm
          locale={locale}
          leadType="agent_signup"
          companyField
          submitLabel={c.submitLabel}
          messagePlaceholder={c.messagePlaceholder}
          successTitle={c.successTitle}
          successText={c.successText}
        />
      </Section>

      <CtaBand
        title={c.ctaHeading}
        text={c.ctaBody}
        primary={{ label: c.createAccount, href: "/registro" }}
        secondary={{ label: c.viewPlans, href: "/planes" }}
      />
    </main>
  );
}
