import type { ResidencyPage } from "./types";
import { PAGES_A } from "./pages-a";
import { PAGES_B } from "./pages-b";

export type { ResidencyPage, ResidencyFaq, ResidencySection } from "./types";

/** Every landing page on residenciaenparaguay.es — the only list of them. */
export const RESIDENCY_PAGES: readonly ResidencyPage[] = [...PAGES_A, ...PAGES_B];

export function residencyPageBySlug(slug: string): ResidencyPage | null {
  return RESIDENCY_PAGES.find((p) => p.slug === slug) ?? null;
}

/** Sitemap paths for the residency door: home, contact, legal, every page. */
export function residencySitemapPaths(): string[] {
  return [
    "/",
    ...RESIDENCY_PAGES.map((p) => `/${p.slug}`),
    "/contacto",
    "/terminos",
    "/privacidad",
  ];
}

/** The pages featured in the header and footer, in order. */
export const RESIDENCY_NAV_SLUGS = [
  "residencia-paraguay",
  "requisitos-residencia-paraguay",
  "residencia-temporal-paraguay",
  "residencia-permanente-paraguay",
  "residencia-paraguay-para-espanoles",
  "cuanto-cuesta-residencia-paraguay",
] as const;

export const RESIDENCY_BRAND = {
  tagline: "Residencia legal en Paraguay, paso a paso",
  homeTitle: "Residencia en Paraguay: requisitos, costos y trámite paso a paso",
  homeDescription:
    "Todo para sacar la residencia en Paraguay: requisitos, documentos, costos, residencia temporal y permanente, Mercosur y cédula. Acompañamiento para extranjeros desde España y Latinoamérica.",
} as const;
