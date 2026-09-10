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
 * Every function below returns today's behaviour for every key that is live.
 * That was the point of the PR that introduced this file — the registry
 * exists and pages/components read from it, but no domain's render changes —
 * and it is how a new door is added too: the rental family's values arrived
 * one phase ahead of the components that read them, because every consumer
 * matches the layouts it knows by equality and falls through to the default
 * otherwise. A real branch goes inside one of these functions for one key —
 * never inside the component.
 */
import {
  familyOf,
  type VerticalFamily,
  type VerticalKey,
} from "@/config/verticals";

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
  | "relocation"
  // Rental-family sections (docs/style/rentparaguay.com.md §home). These only
  // ever appear for a vertical whose homeLayout() is "rental" — see
  // RentalHome.tsx.
  | "servicios"
  | "por-que"
  | "proceso"
  // Directory-family sections (fable-plan-realtor-terreno-rental.md Stage 1 D
  // item 1). These only ever appear for a vertical whose homeLayout() is
  // "directory" — see DirectoryHome.tsx.
  | "como-elegimos"
  | "directorio-teaser"
  // "Opción E · Vender o alquilar" (Claude Design artboard OpcionE,
  // 2026-09-10): the network-reach section between the hero and the form.
  | "red-portales"
  // The form gets its own section id ("formulario") now that it is no
  // longer inline in the hero.
  | "formulario";

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
  if (familyOf(key) === "rental") {
    // docs/style/rentparaguay.com.md §home, in order: split hero · the seven
    // services · why us · how it works · the door's own recent rentals · faq ·
    // closing CTA. Two of those render nothing until they have content —
    // "recientes" while the table has no rental rows, "faq" until S2 writes
    // the questions — because an empty rail reads as a broken site, not as a
    // section that is coming later.
    return [
      "hero",
      "servicios",
      "por-que",
      "proceso",
      "recientes",
      "faq",
      "cta",
    ];
  }
  if (familyOf(key) === "directory") {
    // "Opción E · Vender o alquilar" (Claude Design artboard OpcionE,
    // 2026-09-10), in order: the two-door hero (sell / rent) · the network
    // section · the form · the three-step explainer · "cómo elegimos" · the
    // directory teaser (real verified agents only, §1 item 7) · the "¿Sos
    // inmobiliario?" band · faq. No listing grid, no search bar, no /publicar
    // CTA — this door sells an introduction to a person, not a search over
    // rows.
    return [
      "hero",
      "red-portales",
      "formulario",
      "como-funciona",
      "como-elegimos",
      "directorio-teaser",
      "profesional",
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

export type HomeLayout =
  | "default"
  | "nordico"
  | "guide-en"
  | "rental"
  | "directory";

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
  // Both rental doors render `RentalHome` (docs/style/rentparaguay.com.md) —
  // one shell for the family, in each door's own language.
  if (familyOf(key) === "rental") return "rental";
  // The directory door renders its own seller-first shell (DirectoryHome).
  // `desarrolladores.com.py` shares the family but is `mode: "projects"` and
  // still disabled, so nothing routes to it — when it switches on it gets its
  // own branch here rather than inheriting this one.
  if (familyOf(key) === "directory") return "directory";
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
  // The rental doors show the same white framed card as the Spanish primary:
  // a renter compares price, rooms and area, and a photo-as-the-card hides
  // exactly those (fable/plan-rentparaguay.md §1 item 12).
  if (familyOf(key) === "rental") return "framed-pill";
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
  // Never on the English door (a resident first-home scheme quoted to a
  // foreign buyer is a false promise) and never on the rental family: a cuota
  // is a purchase figure. No rental card renders one anyway — the estimate is
  // cached per venta listing — so this makes the intent explicit rather than
  // relying on the data to stay that way.
  return key !== "en" && familyOf(key) !== "rental";
}

export type AreaUnit = "m2" | "sqft";

/**
 * Secondary area unit shown alongside m². The English door adds `sq ft`
 * (guide §3/§6: `sqft = Math.round(m2 * 10.7639)`, `en-US` formatted) next to
 * every area figure a foreign buyer sees — the card, the price line and the
 * facts strip on the detail page.
 */
export function secondaryAreaUnit(key: VerticalKey): AreaUnit | null {
  // Both English doors: the audience reading either one thinks in sq ft.
  return key === "en" || key === "rent" ? "sqft" : null;
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

export type ChromeVariant = "default" | "guide-en" | "rental" | "directory";

/**
 * Which header/footer nav content and visibility rules apply. `SiteHeader`
 * and `SiteFooter` read this rather than `vertical.key` directly — the guide
 * text itself (English nav labels, footer columns) lives in the i18n
 * dictionary's `guideEn` namespace, keyed by locale like everything else.
 */
export function chromeVariant(key: VerticalKey): ChromeVariant {
  if (key === "en") return "guide-en";
  // The rental family's own header and footer: no login, no publish CTA, no
  // newsletter, one "contact us" button, and nav/footer content from the
  // `rental` dictionary namespace rather than the Spanish marketplace's
  // HEADER_NAV.
  if (familyOf(key) === "rental") return "rental";
  // The directory door's own header and footer: Inicio · Inmobiliarios ·
  // Inmobiliarias · Para inmobiliarios · Contacto, one CTA ("Encontrá tu
  // inmobiliario" → the home form), and no login, publish CTA or newsletter
  // (Stage 1 D item 1 / §1 item 4).
  if (familyOf(key) === "directory") return "directory";
  return "default";
}

/**
 * The families whose chrome carries no login, no `/publicar` CTA and no
 * newsletter. The rental doors are a services firm's site; the directory door
 * is a lead-gen directory (§1 item 4: "no grids, no search, no /publicar, no
 * login in its chrome"). The only account this app has is a marketplace
 * publisher's, which is not what either audience arrived for.
 */
const NO_ACCOUNT_CHROME: VerticalFamily[] = ["rental", "directory"];

/**
 * Whether the header/mobile-drawer shows a login link. realestateinparaguay.com
 * guide §5 "Header": "No login in the header on this domain; foreign
 * visitors are buyers." Also build-prompt.md's explicit override: "No login,
 * newsletter or publicar entry points in this domain's chrome."
 */
export function chromeShowLogin(key: VerticalKey): boolean {
  // Also off for the rental family: those doors are a services firm's site,
  // and the only account this app has is a marketplace publisher's
  // (fable/plan-rentparaguay.md §1 item 11). The directory door joins them —
  // see NO_ACCOUNT_CHROME above.
  return key !== "en" && !NO_ACCOUNT_CHROME.includes(familyOf(key));
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
  // Off for the rental family too: a landlord who lands there is a lead for
  // the management service, not a self-service publisher, so the chrome's one
  // CTA is "Contactanos" (O2) rather than /publicar. Same for the directory
  // door, whose one CTA is "Encontrá tu inmobiliario" → the home form.
  return key !== "en" && !NO_ACCOUNT_CHROME.includes(familyOf(key));
}

/**
 * Whether the home page includes a newsletter signup block. Every door but
 * the English one keeps it — guide §8 / build-prompt.md: "No login,
 * newsletter or publicar entry points in this domain's chrome." (`EnHome`
 * simply never includes "newsletter" in its own section list — this flag
 * exists for any other newsletter entry point a future page might add.)
 */
export function chromeShowNewsletter(key: VerticalKey): boolean {
  return key !== "en" && !NO_ACCOUNT_CHROME.includes(familyOf(key));
}

/**
 * Whether this door renders the rental business's own pages — `/servicios`,
 * `/servicios/<slug>`, and the rental branches of `/`, `/nosotros` and
 * `/contacto` (O3). Every other door redirects those routes to `/`, exactly
 * as `/vender` redirects off every door but the Spanish one
 * (`sellerLandingEnabled()` above): a route that renders on a door whose
 * sitemap, chrome and hreflang all say it does not exist there is a
 * duplicate-content surface nobody links to.
 */
export function rentalPagesEnabled(key: VerticalKey): boolean {
  return familyOf(key) === "rental";
}

/**
 * The rental family's URL helper (R2). Re-exported here because this registry
 * is where the rest of the app asks structural questions about a door, and
 * every consumer — the chrome, the home page, the hub, the routes, the
 * sitemap — already imports from it.
 *
 * It is *defined* one module down, in `src/config/rental-services.ts`, and
 * that is not a style choice: `next.config.ts` builds the cross-language 301s
 * from the same helper, and Next's config loader compiles that file outside
 * the app's module graph, where the `@/…` alias does not resolve. A module
 * `next.config.ts` can import must therefore import nothing that uses the
 * alias — which this file does (`@/config/verticals`, above). Keeping the
 * helper alias-free is what stops the redirects from being a second,
 * hand-maintained copy of the URL table.
 */
export {
  rentalPath,
  rentalPathsByLocale,
  type RentalPageKind,
} from "@/config/rental-services";

/**
 * Whether this door renders the directory business's own pages — the
 * seller-first home, `/para-inmobiliarios`, and the directory rendering of
 * `/agentes`, `/inmobiliarias` and the two profile page types. Same rule as
 * `rentalPagesEnabled()`: `/para-inmobiliarios` redirects to `/` off every
 * other door, because a route that renders on a door whose sitemap, chrome and
 * hreflang all say it does not exist there is a duplicate-content surface
 * nobody links to.
 *
 * Note what this does NOT gate: `/agentes`, `/inmobiliarias` and the profile
 * pages still render on the marketplace doors — they are marketplace pages
 * too. The directory door changes how they look, and `ownsDirectory`
 * (`src/config/verticals.ts`) changes which host is canonical for them.
 */
export function directoryPagesEnabled(key: VerticalKey): boolean {
  return familyOf(key) === "directory";
}

/**
 * Whether this door serves the marketplace's own page types — the category
 * grids, `/propiedad`, `/publicar`, `/precios`, `/proyectos` and friends. False
 * only on the directory door, which 308s all of them to the Spanish
 * marketplace primary (`middleware.ts`, absolute: a relative redirect would
 * loop on that host) and lists none of them in its sitemap
 * (`src/lib/sitemap.ts`).
 *
 * The redirect is what a visitor hits; this predicate is what the sitemap
 * reads. Sharing one answer is what stops a door from submitting URLs it
 * redirects away — the same discipline `hostOwnsListingDetail()` enforces for
 * canonicals.
 */
export function marketplacePagesEnabled(key: VerticalKey): boolean {
  return familyOf(key) !== "directory";
}
