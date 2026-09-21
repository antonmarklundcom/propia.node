import { numberLocaleFor } from "@/i18n";
import type { Dictionary } from "@/i18n";
import { dict, currentLocale } from "@/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { ProjectCard } from "@/components/ProjectCard";
import { Glyph } from "@/components/Glyph";
import { listAllProjects } from "@/lib/directory-queries";
import { getFeaturedDevelopers } from "@/lib/queries";
import {
  CtaBand,
  FeatureGrid,
  PageHero,
  Section,
} from "@/components/MarketingUI";
import { safeImageUrl } from "@/lib/external-image";

export const dynamic = "force-dynamic";


export async function generateMetadata(): Promise<Metadata> {
  const c = (await dict()).projectsPage;
  const brand = await brandName();
  return {
    title: c.metaTitle,
    description: c.description,
    alternates: { canonical: `${await siteOrigin()}/proyectos` },
    openGraph: { title: `${c.title} — ${brand}`, description: c.description },
  };
}

const reasons = (c: Dictionary["projectsPage"]) => [
  {
    icon: "money",
    title: c.priceHeading,
    text: c.priceBody,
  },
  {
    icon: "clock",
    title: c.paymentsHeading,
    text: c.paymentsBody,
  },
  {
    icon: "palette",
    title: c.choiceHeading,
    text: c.choiceBody,
  },
  {
    icon: "search",
    title: c.checksHeading,
    text: c.checksBody,
  },
];

export default async function ProyectosPage() {
  const numberLocale = numberLocaleFor(await currentLocale());
  const c = (await dict()).projectsPage;
  const [origin, projects, developers] = await Promise.all([
    siteOrigin(),
    listAllProjects(),
    getFeaturedDevelopers(12),
  ]);

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: c.home, url: "/" },
            { name: c.title, url: "/proyectos" },
          ]),
          ...(projects.length > 0
            ? [
                itemListJsonLd(
                  origin,
                  projects.map((p) => ({
                    title: p.name,
                    url: `/proyecto/${p.slug}`,
                  })),
                ),
              ]
            : []),
        ]}
      />

      <PageHero
        kicker={c.kicker}
        title={c.heading}
        subtitle={c.subtitle}
      />

      <Section>
        {projects.length === 0 ? (
          <div className="mk-empty">
            <p>{c.empty}</p>
            <Link className="mk-btn mk-btn--accent" href="/contacto">
              {c.publish}</Link>
          </div>
        ) : (
          <div className="mk-project-grid">
            {projects.map((p) => (
              <div className="mk-project-item" key={p.id}>
                <ProjectCard card={p} />
                {!p.heroImageUrl && (
                  <div className="mk-project-fallback" aria-hidden>
                    <span><Glyph name="home" size={24} /></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {developers.length > 0 && (
        <Section
          tone="muted"
          title={c.developersHeading}
          subtitle={c.developersSubtitle}
        >
          <div className="mk-devs">
            {developers.map((d) => (
              <div key={d.id} className="mk-dev">
                {safeImageUrl(d.logoUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="mk-dev__logo"
                    src={safeImageUrl(d.logoUrl) ?? undefined}
                    referrerPolicy="no-referrer"
                    alt={d.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="mk-dev__logo mk-dev__logo--fallback" aria-hidden>
                    <Glyph name="building" size={24} />
                  </div>
                )}
                <div className="mk-dev__name">{d.name}</div>
                <div className="mk-dev__count">
                  {d.projectCount.toLocaleString(numberLocale, { useGrouping: false })}{" "}
                  {d.projectCount === 1 ? c.project : c.projects}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title={c.adviceHeading}>
        <FeatureGrid items={reasons(c)} columns={4} />
      </Section>

      <CtaBand
        title={c.ctaHeading}
        text={c.ctaBody}
        primary={{ label: c.publishCta, href: "/contacto" }}
        secondary={{ label: c.plans, href: "/planes" }}
      />
    </main>
  );
}
