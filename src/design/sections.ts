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
  | "faq"
  // Nórdico-only sections (docs/style/inmobiliaria.com.py.md §6). These only
  // ever appear for a vertical whose homeLayout() is "nordico" — see the
  // dedicated component note below.
  | "proof-row"
  | "recientes"
  | "proceso-venta"
  | "buscar-ciudad"
  | "por-que-vender"
  | "para-inmobiliarias-row";

/**
 * Home page sections and their order. `homeLayout()` (below) decides whether
 * `app/page.tsx` renders the default template (which still only reads
 * membership — its JSX order is hard-coded to the default list's order) or
 * a dedicated per-vertical component that renders from this array's actual
 * order (`src/components/home/NordicoHome.tsx` for "nordico"). A layout that
 * needs true reordering of the *default* template's own sections would need
 * to teach `app/page.tsx` to map over this list — not required yet because
 * every non-default layout so far uses its own component instead.
 */
export function homeSections(key: VerticalKey): HomeSectionId[] {
  if (key === "inmobiliaria") {
    return [
      "hero",
      "proof-row",
      "recientes",
      "proceso-venta",
      "buscar-ciudad",
      "por-que-vender",
      "para-inmobiliarias-row",
      "faq",
    ];
  }
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

export type HomeLayout = "default" | "nordico";

/**
 * Which component renders the home page. `app/page.tsx` is the one allowed
 * fork point (it already resolves `vertical` for the page); it renders
 * `NordicoHome` when this returns "nordico" and its own default JSX
 * otherwise. No other file branches on this.
 */
export function homeLayout(key: VerticalKey): HomeLayout {
  return key === "inmobiliaria" ? "nordico" : "default";
}

export type HeroVariant = "split-photo" | "split-search-under";

/**
 * Home hero layout. "split-photo": today's full-bleed photo hero with the
 * search bar on the dark panel. "split-search-under" (guide §5 "Hero
 * (home)"): 55/45 split, white ground, the search bar as its own white
 * rounded row underneath rather than layered on the photo.
 */
export function heroVariant(key: VerticalKey): HeroVariant {
  return key === "inmobiliaria" ? "split-search-under" : "split-photo";
}

export type CardVariant = "photo-scrim" | "framed-pill";

/**
 * Listing card layout. "photo-scrim": today's photo-is-the-card, text over a
 * gradient. "framed-pill" (guide §5 "Listing card"): white framed card,
 * rounded photo, price/title/specs block below it, and a pill row
 * ("Publicado en inglés" when foreign_exposure, "Destacada" when featured).
 */
export function cardVariant(key: VerticalKey): CardVariant {
  return key === "inmobiliaria" ? "framed-pill" : "photo-scrim";
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

/**
 * The href every Nórdico "sell" CTA points at — the header's "Vender mi
 * propiedad" button, the sales-process section's "Empezar a vender", the
 * hero's black button. `/vender` doesn't exist yet (PLAN.md / build-prompt.md
 * PR4); every one of these points at `/publicar` until then.
 *
 * TODO(PR4): repoint to "/vender" once that route ships.
 */
export function sellerCtaHref(_key: VerticalKey): string {
  return "/publicar";
}

/**
 * Whether this vertical wants an extra header nav entry inserted after
 * "Proyectos" (guide §5 "Header": Comprar · Alquilar · Vender · Proyectos ·
 * Inmobiliarias) and, if so, where it points — `sellerCtaHref()` (currently
 * `/publicar`; TODO(PR4): `/vender` once it exists). `SiteHeader` supplies
 * the *label* itself, from `dict().nordico.headerVender`, so the registry
 * never hardcodes a Spanish string outside the i18n dictionary — this
 * function only decides the structural question (does the nav get an extra
 * entry, and where does it lead), never the copy.
 */
export function headerExtraNavHref(key: VerticalKey): string | null {
  return key === "inmobiliaria" ? sellerCtaHref(key) : null;
}

/**
 * Whether the detail page shows a sticky bottom contact bar on mobile
 * (WhatsApp + Llamar, guide §5 "Detail page"). Today only inmobiliaria opts
 * in; the component itself must not branch on the vertical key to decide
 * this — it reads the flag.
 */
export function stickyMobileContactBar(key: VerticalKey): boolean {
  return key === "inmobiliaria";
}

/**
 * Detail-page contact card affordance order: the shared `ContactForm`
 * component's primary submit ("Enviar mensaje") already renders before its
 * post-submit WhatsApp continuation for every vertical — guide §5's
 * "WhatsApp-second sidebar" requirement is already true of the current
 * component and needed no reordering. This flag exists so a future vertical
 * that wants WhatsApp first has a registry entry to flip rather than a
 * conditional inside `ContactForm`.
 */
export function contactPrimaryFirst(_key: VerticalKey): boolean {
  return true;
}
