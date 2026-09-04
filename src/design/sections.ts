/**
 * Per-vertical structural registry — the shell/component counterpart to
 * `themes.ts`. A theme can only express *values* (a color, a radius); this
 * file is where a vertical is allowed to express *structure*: which sections
 * a page renders and in what order, which layout variant a hero/card uses,
 * whether a figure (cuota) applies to that door's audience at all.
 *
 * Rule for adding a function here (mirrors the rule in themes.ts): a shared
 * component must never branch on `vertical.key` directly. If it needs to
 * differ per vertical, it needs an entry here — never a conditional inline.
 *
 * Every function below returns today's behaviour for every key. That is the
 * point of this PR: the registry exists and pages/components read from it,
 * but no domain's render changes yet. A later PR adds a real branch inside
 * one of these functions for one key — never inside the component.
 */
import type { VerticalKey } from "@/config/verticals";

export type HomeSectionId =
  | "hero"
  | "zonas"
  | "como-funciona"
  | "editorial-vender"
  | "editorial-invertir"
  | "proyectos"
  | "ciudades"
  | "listados"
  | "desarrolladoras"
  | "precios"
  | "valores"
  | "descubre"
  | "profesional"
  | "cta"
  | "newsletter"
  | "faq";

/** Home page section order. Every key gets today's order. */
export function homeSections(_key: VerticalKey): HomeSectionId[] {
  return [
    "hero",
    "zonas",
    "como-funciona",
    "editorial-vender",
    "editorial-invertir",
    "proyectos",
    "ciudades",
    "listados",
    "desarrolladoras",
    "precios",
    "valores",
    "descubre",
    "profesional",
    "cta",
    "newsletter",
    "faq",
  ];
}

export type HeroVariant = "split-photo";

/** Home hero layout. Every key gets the current full-bleed photo hero. */
export function heroVariant(_key: VerticalKey): HeroVariant {
  return "split-photo";
}

export type CardVariant = "photo-scrim";

/** Listing card layout. Every key gets the current photo-with-scrim card. */
export function cardVariant(_key: VerticalKey): CardVariant {
  return "photo-scrim";
}

export type DetailSidebarSlot = "financing" | "contact";

/** Detail-page sidebar module order. Every key gets today's order. */
export function detailSidebarOrder(_key: VerticalKey): DetailSidebarSlot[] {
  return ["financing", "contact"];
}

/**
 * Whether this door's audience is a fit for the AFD/MUVH cuota estimate
 * (Paraguayan residency-linked financing) — today every door shows it
 * unconditionally, which is a known bug for a foreign-exposure door
 * (CLAUDE.md, docs/style/README.md §"cuota finding"). A later PR flips this
 * to false for the English door; this PR only adds the gate.
 */
export function showCuota(_key: VerticalKey): boolean {
  return true;
}

export type AreaUnit = "m2";

/** Secondary area unit shown alongside m². Every key gets none today. */
export function secondaryAreaUnit(_key: VerticalKey): AreaUnit | null {
  return null;
}

export type SellerCta = "publicar";

/**
 * Where the "I want to sell" CTA points. Every key gets `/publicar` today —
 * PR2 adds the Nórdico `/vender` landing page and repoints the Spanish door
 * to it once that route exists (PR4).
 */
export function sellerCta(_key: VerticalKey): SellerCta {
  return "publicar";
}
