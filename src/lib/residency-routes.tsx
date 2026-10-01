/**
 * The residency door's pages (residenciaenparaguay.es, family "residency"),
 * once. The route files that serve them — `/`, `/contacto` and the flat
 * `/<slug>` landing pages under `app/[operacion]/page.tsx` — keep their own
 * marketplace halves and call these inside a one-line fork, the pattern
 * `rental-routes.tsx` set. Everything with a decision in it lives here:
 *
 * - **The canonical is the door's own URL**, built from `siteOrigin()`.
 * - **No hreflang**: these pages are unique Spanish content with no
 *   equivalent on another door (a set needs two locales in one family).
 * - **JSON-LD** only describes what the page shows: breadcrumbs, the FAQ
 *   that is rendered, and an Article for the guides.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brandName } from "@/lib/brand-server";
import { siteOrigin } from "@/lib/origin";
import { doorOgImages } from "@/lib/og-urls";
import { currentVertical } from "@/lib/vertical-context";
import { breadcrumbJsonLd, faqJsonLd, organizationJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/JsonLd";
import { CONTACT_WHATSAPP } from "@/config/contact";
import { ResidencyHome } from "@/components/residency/ResidencyHome";
import { ResidencyPageView } from "@/components/residency/ResidencyPageView";
import { ResidencyContact } from "@/components/residency/ResidencyContact";
import { RESIDENCY_BRAND, residencyPageBySlug } from "@/content/residency";

export async function residencyEnabled(): Promise<boolean> {
  return (await currentVertical()).family === "residency";
}

export async function residencyHomeMetadata(): Promise<Metadata> {
  const [brand, origin] = await Promise.all([brandName(), siteOrigin()]);
  return {
    title: { absolute: RESIDENCY_BRAND.homeTitle },
    description: RESIDENCY_BRAND.homeDescription,
    alternates: { canonical: origin },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: brand,
      locale: "es_PY",
      title: RESIDENCY_BRAND.homeTitle,
      description: RESIDENCY_BRAND.homeDescription,
      images: doorOgImages(brand),
    },
  };
}

export async function ResidencyHomeBody() {
  const [brand, origin] = await Promise.all([brandName(), siteOrigin()]);
  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(origin, { name: brand, whatsapp: CONTACT_WHATSAPP }),
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: brand,
            url: origin,
            inLanguage: "es",
          },
        ]}
      />
      <ResidencyHome brand={brand} />
    </>
  );
}

export async function residencyPageMetadata(slug: string): Promise<Metadata> {
  const page = residencyPageBySlug(slug);
  const [brand, origin] = await Promise.all([brandName(), siteOrigin()]);
  if (!page) return { title: brand };
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    alternates: { canonical: `${origin}/${page.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      siteName: brand,
      locale: "es_PY",
      title: page.metaTitle,
      description: page.metaDescription,
      images: doorOgImages(brand),
    },
  };
}

export async function ResidencyPageBody({ slug }: { slug: string }) {
  const page = residencyPageBySlug(slug);
  if (!page) notFound();
  const [brand, origin] = await Promise.all([brandName(), siteOrigin()]);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(origin, [
            { name: "Inicio", url: "/" },
            { name: page.label, url: `/${page.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: page.h1,
            description: page.metaDescription,
            inLanguage: "es",
            mainEntityOfPage: `${origin}/${page.slug}`,
            publisher: { "@type": "Organization", name: brand, url: origin },
          },
          ...(page.faq.length > 0 ? [faqJsonLd([...page.faq])] : []),
        ]}
      />
      <ResidencyPageView page={page} />
    </>
  );
}

export async function residencyContactMetadata(): Promise<Metadata> {
  const [brand, origin] = await Promise.all([brandName(), siteOrigin()]);
  const title = "Consultá tu residencia en Paraguay";
  const description =
    "Escribinos y te orientamos sobre la categoría de residencia que te corresponde y los documentos que necesitás para radicarte en Paraguay.";
  return {
    title: { absolute: `${title} — ${brand}` },
    description,
    alternates: { canonical: `${origin}/contacto` },
    openGraph: { title, description, images: doorOgImages(brand) },
  };
}

export function ResidencyContactBody() {
  return <ResidencyContact />;
}
