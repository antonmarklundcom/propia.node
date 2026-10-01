/**
 * Content model for residenciaenparaguay.es (family "residency").
 *
 * Spanish-only editorial content that lives next to the code, like
 * `src/content/evergreen/`: the door serves one language, so there is no
 * `en` peer to keep in step. Every factual claim a visitor could act on is
 * listed in `docs/log/residencia-claims.md` for the founder to verify — the
 * prose itself carries no price, no processing time and no statute number.
 */

export interface ResidencySection {
  h2: string;
  /** Paragraphs, in order. Plain text — no markup. */
  paras: string[];
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[];
}

export interface ResidencyFaq {
  q: string;
  a: string;
}

export interface ResidencyPage {
  /** One flat URL segment: served at `/<slug>`. */
  slug: string;
  /** Absolute <title>, written for the query, ≤ 60 characters. */
  metaTitle: string;
  /** Meta description, ≤ 160 characters. */
  metaDescription: string;
  h1: string;
  lead: string;
  /** Short label for nav, footer and related-link chips. */
  label: string;
  sections: ResidencySection[];
  faq: ResidencyFaq[];
  /** Slugs of related pages, linked at the bottom. */
  related: string[];
}
