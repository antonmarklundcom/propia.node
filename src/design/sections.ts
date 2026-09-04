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
  | "para-inmobiliarias-row"
  // "Variant A, guide-first" sections (docs/style/realestateinparaguay.com.md
  // §6). These only ever appear for a vertical whose homeLayout() is
  // "guide-en" — see EnHome.tsx.
  | "facts-strip"
  | "new-this-week"
  | "why-paraguay"
  | "where-to-buy"
  | "how-buying-works"
  | "relocation";

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
  if (key === "en") {
    // Guide §6, in order: split hero with the three facts and search · facts
    // strip · new this week · why Paraguay · where to buy · how buying works
    // (with the costs table) · relocation · faq.
    return [
      "hero",
      "facts-strip",
      "new-this-week",
      "why-paraguay",
      "where-to-buy",
      "how-buying-works",
      "relocation",
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

export type HomeLayout = "default" | "nordico" | "guide-en";

/**
 * Which component renders the home page. `app/page.tsx` is the one allowed
 * fork point (it already resolves `vertical` for the page); it renders
 * `NordicoHome` when this returns "nordico", `EnHome` when it returns
 * "guide-en", and its own default JSX otherwise. No other file branches on
 * this.
 */
export function homeLayout(key: VerticalKey): HomeLayout {
  if (key === "inmobiliaria") return "nordico";
  if (key === "en") return "guide-en";
  return "default";
}

export type HeroVariant =
  | "split-photo"
  | "split-search-under"
  | "split-fact-strap";

/**
 * Home hero layout. "split-photo": today's full-bleed photo hero with the
 * search bar on the dark panel. "split-search-under" (Nórdico guide §5 "Hero
 * (home)"): 55/45 split, white ground, the search bar as its own white
 * rounded row underneath rather than layered on the photo. "split-fact-strap"
 * (realestateinparaguay.com guide §5 "Hero"): 55/45 split, left = H1 + the
 * three-fact strap paragraph + search, right = a place photograph.
 */
export function heroVariant(key: VerticalKey): HeroVariant {
  if (key === "inmobiliaria") return "split-search-under";
  if (key === "en") return "split-fact-strap";
  return "split-photo";
}

export type CardVariant = "photo-scrim" | "framed-pill" | "framed-fact";

/**
 * Listing card layout. "photo-scrim": today's photo-is-the-card, text over a
 * gradient. "framed-pill" (Nórdico guide §5 "Listing card"): white framed
 * card, rounded photo, price/title/specs block below it, and a pill row
 * ("Publicado en inglés" when foreign_exposure, "Destacada" when featured).
 * "framed-fact" (realestateinparaguay.com guide §4/§5): a hairline-framed
 * card, price/specs block below the photo on paper (never on the scrim) with
 * `US$/m²` and `sq ft`, and never a cuota line.
 */
export function cardVariant(key: VerticalKey): CardVariant {
  if (key === "inmobiliaria") return "framed-pill";
  if (key === "en") return "framed-fact";
  return "photo-scrim";
}

export type DetailSidebarSlot = "financing" | "contact";

/** Detail-page sidebar module order. Every key gets today's order. */
export function detailSidebarOrder(_key: VerticalKey): DetailSidebarSlot[] {
  return ["financing", "contact"];
}

/**
 * Whether this door's audience is a fit for the AFD/MUVH cuota estimate
 * (Paraguayan residency-linked financing) — every door used to show it
 * unconditionally, which was a known bug for a foreign-exposure door
 * (CLAUDE.md, docs/style/README.md §"cuota finding": "the only active
 * financing programme is a resident first-home scheme and quoting it to a
 * foreign buyer is a false promise", guide §5 "Listing card"). This PR flips
 * it to false for the English door — `ListingCard` and the detail page both
 * already read this gate (PR1), so no cuota string, financing box or cuota
 * chip renders anywhere on realestateinparaguay.com from here on.
 */
export function showCuota(key: VerticalKey): boolean {
  return key !== "en";
}

export type AreaUnit = "m2" | "sqft";

/**
 * Secondary area unit shown alongside m². The English door adds `sq ft`
 * (guide §3/§6: `sqft = Math.round(m2 * 10.7639)`, `en-US` formatted) next to
 * every area figure a foreign buyer sees — the card, the price line and the
 * facts strip on the detail page.
 */
export function secondaryAreaUnit(key: VerticalKey): AreaUnit | null {
  return key === "en" ? "sqft" : null;
}

/**
 * Whether the detail page shows the "Buying this property as a foreigner"
 * box (guide §5 "Detail page"): ownership type, title status if known,
 * estimated closing costs at this price, next step. English door only — a
 * Paraguayan buyer on the Spanish door doesn't need to be told foreigners can
 * own land here.
 */
export function foreignerBox(key: VerticalKey): boolean {
  return key === "en";
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
 * hero's black button. `/vender` (PR4, build-prompt.md) is the Spanish
 * door's own seller landing page, so only `inmobiliaria` repoints to it;
 * every other key keeps `/publicar` — `/vender` 404s/redirects on every
 * other door (`sellerLandingEnabled()` below), so nothing outside the
 * Spanish door should ever link to it.
 */
export function sellerCtaHref(key: VerticalKey): string {
  return key === "inmobiliaria" ? "/vender" : "/publicar";
}

/**
 * Whether `/vender` (docs/style/inmobiliaria.com.py.md §5) renders for this
 * door at all. Spanish door only — build-prompt.md PR4: "Build /vender on
 * the Spanish door only (the English door 404s it or redirects to /)."
 * `terreno.com.py` isn't named explicitly by the guide; treated the same as
 * the English door here (redirect to home) since `/vender` is a Nórdico-
 * branded, Spanish-marketplace-primary page terreno's feeder audience never
 * asked for — see the PR description for the reasoning.
 */
export function sellerLandingEnabled(key: VerticalKey): boolean {
  return key === "inmobiliaria";
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

export type ChromeVariant = "default" | "guide-en";

/**
 * Which header/footer nav content and visibility rules apply. `SiteHeader`
 * and `SiteFooter` read this rather than `vertical.key` directly — the guide
 * text itself (English nav labels, footer columns) lives in the i18n
 * dictionary's `guideEn` namespace, keyed by locale like everything else.
 */
export function chromeVariant(key: VerticalKey): ChromeVariant {
  return key === "en" ? "guide-en" : "default";
}

/**
 * Whether the header/mobile-drawer shows a login link. realestateinparaguay.com
 * guide §5 "Header": "No login in the header on this domain; foreign
 * visitors are buyers." Also build-prompt.md's explicit override: "No login,
 * newsletter or publicar entry points in this domain's chrome."
 */
export function chromeShowLogin(key: VerticalKey): boolean {
  return key !== "en";
}

/**
 * Whether the header/mobile-drawer shows a "publish/sell" CTA that routes
 * into the `/publicar` FSBO wizard. The guide's own §8 "Notes for the
 * builder" is explicit and takes precedence over §5's "'List with us' ghost
 * link" sketch (no such route exists to link it to, and §8 rules the whole
 * publicar flow out of this domain's chrome): "Do not add a login link, a
 * newsletter block, or the publicar flow to this domain's chrome." So the
 * English door's header/footer/mobile-drawer render with no sell-side CTA at
 * all — resolved this way in PR3, noted in its description.
 */
export function chromeShowPublishCta(key: VerticalKey): boolean {
  return key !== "en";
}

/**
 * Whether the home page includes a newsletter signup block. Every door but
 * the English one keeps it — guide §8 / build-prompt.md: "No login,
 * newsletter or publicar entry points in this domain's chrome." (`EnHome`
 * simply never includes "newsletter" in its own section list — this flag
 * exists for any other newsletter entry point a future page might add.)
 */
export function chromeShowNewsletter(key: VerticalKey): boolean {
  return key !== "en";
}
