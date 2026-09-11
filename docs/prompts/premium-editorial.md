# Premium Editorial — delta-spec for the marketplace doors

Director: Fable (this conversation, 2026-09-11). Builder: one Opus subagent.
Founder request: "a more premium design like the Wilson & Becker reference
for inmobiliaria.com.py and realestateinparaguay.com".

This is a **delta-spec**: the codebase already contains ~80% of the target.
Copy what exists; enumerate only what changes. Every value below is decided.
Where the builder finds a real gap, it chooses, writes the choice into
`docs/log/pe1.md`, and keeps going (AGENTS.md §6).

## 0. The decision (read once)

The reference is a deep-green + gold + cream, Cormorant Garamond over Jost,
photo-carried, zero-radius layout. **That is the repo's existing EDITORIAL
token set** (`src/design/tokens.ts`, the `:root` block in `app/globals.css`,
`EDITORIAL` in `src/design/themes.ts`) and the existing `.ds-*` /
`.home-hero` / `.ds-photo-card` CSS in `app/globals.css`. Both marketplace
doors were moved *off* it on 2026-09-04 (Nórdico for `inmobiliaria`, Petrol
for `en`). This build moves them back on and gives them one new home layout
that mirrors the reference section for section.

Supersedes: `docs/style/inmobiliaria.com.py.md` (Nórdico) and
`docs/style/realestateinparaguay.com.md` (Petrol) as *built* styles. The
rental and directory doors are untouched. `terreno` is untouched (it already
renders the editorial baseline with the default home).

**No token values change.** Do not "tune" the gold or the cream toward the
reference's hexes; the repo's values were contrast-computed and are within a
few points of the reference. The one visible difference (reference `#bb9445`
button vs repo `#C19A4D`) is intentional.

## 1. Theme (src/design/themes.ts, app/layout.tsx)

1. Delete `OVERRIDES.inmobiliaria` and `OVERRIDES.en` entirely (both fall to
   `EDITORIAL`). Keep `alquiler`, `rent`, `agents`. Rewrite the comment above
   `OVERRIDES` to say the marketplace doors run the editorial base since
   2026-09-11 (this spec).
2. `app/layout.tsx`: remove the `@fontsource-variable/newsreader` and the
   three `@fontsource/ibm-plex-sans` imports and their comment (nothing
   selects them any more). Keep Manrope (rental) and Lora / Public Sans
   (directory). Do not remove packages from `package.json`.
3. `src/design/sections.ts`:
   - `HomeLayout`: replace `"nordico" | "guide-en"` with `"premium"`.
     `homeLayout()` returns `"premium"` for `inmobiliaria` and `en`.
   - `homeSections()`: for `inmobiliaria` and `en` return, in order:
     `["hero","destacadas","tipos","nosotros","servicios","zonas","como-funciona","faq-contacto"]`.
     Add those four new ids (`destacadas`, `tipos`, `nosotros`, `faq-contacto`)
     to `HomeSectionId`; remove the ids only Nórdico / guide-en used once
     nothing references them (`proof-row`, `proceso-venta`, `buscar-ciudad`,
     `por-que-vender`, `para-inmobiliarias-row`, `facts-strip`,
     `new-this-week`, `why-paraguay`, `where-to-buy`, `how-buying-works`,
     `relocation`). Grep before deleting each.
   - `cardVariant()`: `inmobiliaria` and `en` → `"photo-scrim"` (delete the
     two branches; rental keeps `framed-pill`).
   - `heroVariant()`: has no consumer outside this file — delete the type
     and the function.
   - Leave `chromeVariant`, `chromeShowLogin`, `chromeShowPublishCta`,
     `sellerCtaHref`, `headerExtraNavHref`, `stickyMobileContactBar`,
     `showCuota`, `secondaryAreaUnit`, `foreignerBox` exactly as they are.
     They are content/behaviour rules, not style.
4. Delete `src/components/home/NordicoHome.tsx` and `EnHome.tsx`.
   `ProofRow.tsx` and `SalesProcessSection.tsx` are also used by
   `app/vender/page.tsx` — keep them. Delete the `nh-*` and `eh-*` CSS blocks
   in `app/globals.css` **only** for classes no remaining file references
   (grep each prefix; `app/vender` may use some `nh-` classes — keep those).
5. Do **not** touch `esNordico` / `enNordico` / `esGuideEn` / `enGuideEn`
   dictionary namespaces: `SiteHeader`, `SiteFooter`, `/vender` and the
   English FAQ still read them.

## 2. The premium home — `src/components/home/PremiumHome.tsx`

Selected in `app/page.tsx` where `NordicoHome` / `EnHome` were selected
(`homeLayout(vertical.key) === "premium"`). Props: `vertical`, `d`, `brand`,
`recent` (8 cards), `cities`, `faq`, `total`. Never reads `vertical.key`
(it reads `homeSections(vertical.key)` and `vertical.locale` only).

`app/page.tsx` passes `faq` as
`vertical.locale === "en" ? [...d.guideEn.faq] : faqHome(brand)` (the
Spanish FAQ config is not locale-aware; the English door's FAQ is its
foreign-buyer one). Render `<JsonLd data={[faqJsonLd(faq)]} />` first, as
`NordicoHome` did.

All copy comes from a **new dictionary namespace `premium`**
(`esPremium` in `src/i18n/es.ts`, `enPremium` in `src/i18n/en.ts`,
registered in `src/i18n/index.ts`). English is a peer pitched at foreign
buyers, not a translation. Keys and the Spanish values are in §4. Reuse
existing keys where named there (`d.home.howSteps`, `d.common.publishCta`).

Class prefix `ph-` (premium home). Container: `.ds-container`
(`--container` 1440, `--section-y`). Fonts, colours, spacing all via the
existing custom properties; **no new hex literals** in the new CSS except
the ones listed in §3.

Sections, in `homeSections` order, each gated on `sections.includes(id)`:

### hero
- `<section class="ph-hero">` full-bleed, `min-height: clamp(640px, 82vh, 820px)`,
  photo via `<Picture slug="casa-premium-asuncion-atardecer" priority>` as
  `.ph-hero__photo` (absolute, `object-fit: cover`, `object-position: center right`),
  `.ph-hero__scrim` = `var(--overlay-hero)`.
- Header stays the existing `SiteHeader` (dark translucent bar, editorial
  tokens) — it already overlays the hero the way the reference's nav does.
  Check `.site-header` is `position: sticky/fixed` + translucent on this
  theme; if it is opaque `--header-bg` on scroll-top, leave it — no header
  work in this build.
- Copy block, left-aligned, `max-width: 640px`: `ds-label` kicker
  (`premium.heroKicker`), `<h1 class="ph-hero__title">` Cormorant 400,
  uppercase, `clamp(44px, 6vw, 74px)`, `line-height: 1.06`,
  `letter-spacing: 1px`, `heroTitleLead` + `<span class="ph-hero__gold">`
  (`heroTitleHighlight`, `--color-accent-hover`) + `heroTitleTail`.
  Subtitle 16px weight 300 `rgba(255,255,255,0.82)` `max-width: 360px`.
- Actions: `ds-btn ds-btn--primary` → `/venta/asuncion` (`heroBrowse`);
  second button: if `waLink(CONTACT_WHATSAPP, premium.waPrefill(brand))`
  is non-null render `ds-btn ds-btn--on-photo` with the WhatsApp glyph
  (inline SVG from `RentalContact.tsx` or the reference) and `heroWhatsapp`,
  `target=_blank rel=noopener`; else render `ds-btn ds-btn--on-photo` →
  `sellerCtaHref(vertical.key)` with `d.common.publishCta`. Never a label
  that promises WhatsApp without a number behind it.
- Trust row `.ph-hero__trust`: four items from `premium.trust` (icon key +
  two-line label). Icons are inline SVGs, stroke `var(--color-accent-hover)`
  1.1px, 22px: `person`, `check-square`, `people`, `clock`. Uppercase
  10.5px, tracking 1.5px, `rgba(255,255,255,0.9)`. Wraps to 2×2 under 900px.
- Search panel `.ph-hero__search`: `background: var(--color-primary-soft)`,
  `border: 1px solid var(--color-border-accent)`, `padding: 26px 30px 30px`,
  `box-shadow: 0 30px 60px rgba(0,0,0,0.35)`, `margin-bottom: -46px`,
  `position: relative; z-index: 2`. Label `premium.searchTitle` in
  `ds-label` on dark, then the **existing `<SearchBar cities locale>`**
  (already labels-above-values, dark-field styles exist as `.ds-field--on-dark`
  / `.search-bar` — check `.search-bar` renders correctly on
  `--color-primary-soft`; add a `.ph-hero__search .search-bar` override only
  if a field is unreadable). Under it, `.ph-hero__stat`: `total > 0 ?
  d.home.heroStatCount(total.toLocaleString(numberLocale)) :
  d.home.heroStatCountEmpty` in 11px `rgba(255,255,255,0.62)`.
- The next section gets `padding-top: calc(var(--section-y) + 46px)` to
  clear the overlap.

### destacadas
- `.ds-container`, head row (`home-section__head`): `<h2>` Cormorant 400
  30px uppercase tracking 2.2px (`premium.featuredTitle`) + `ds-link-underline`
  `premium.featuredMore` → `/venta/asuncion`.
- Grid `.ph-grid-4` (`repeat(4, 1fr)`, gap `var(--grid-gap)`, 2 cols ≤ 1024,
  1 col ≤ 600) of `<ListingCard>` (photo-scrim variant, `height: 290px` via
  `.ph-grid-4 .ds-photo-card { min-height: 290px }`). Show `recent.slice(0, 8)`.
  Render nothing (whole section) when `recent.length === 0`.

### tipos
- `<h2>` `premium.typesTitle`, then `.ph-types` six-column row (3 cols ≤ 900,
  2 cols ≤ 520), each `<Link>` with a 30px line icon (stroke `var(--color-link)`,
  1px) over a 10.5px uppercase tracking-1.7 label, `border-right: 1px solid
  var(--color-border)` except last, centred. Six entries, fixed in the
  component (structure) with labels from `premium.types[key]`:

  | key | href | icon |
  |---|---|---|
  | casas | `categoryUrl({operation:"venta",citySlug:"asuncion",type:"casa"})` | house |
  | departamentos | same with `type:"departamento"` | building |
  | terrenos | same with `type:"terreno"` | plot (rect + diagonal) |
  | alquileres | `categoryUrl({operation:"alquiler",citySlug:"asuncion"})` | key |
  | comercial | `categoryUrl({operation:"venta",citySlug:"asuncion",type:"comercial"})` | storefront |
  | proyectos | `/proyectos` | crane/tower |

  Confirm `typePlural("comercial")` exists in `src/lib/urls.ts`; if the
  type→plural map lacks it, add the entry rather than dropping the tile.

### nosotros
- `<section class="ph-about">` background `var(--color-accent-soft)` (the
  one tint allowed on cream). Two columns `1fr 1.1fr`, left padded
  `var(--section-y) 0`, right column is the photo
  (`<Picture slug="living-moderno-vista-rio-asuncion">`, `height: 420px`,
  cover, bleeds to the right edge — wrap the grid so the left column aligns
  with `.ds-container` padding but the photo has no right padding at ≥1440).
  Stack on ≤ 900px, photo first.
- Kicker `ds-label` `premium.aboutKicker(brand)`; `<h2>` Cormorant 40px
  `line-height 1.18` `premium.aboutTitle`; text 13.5px/1.85
  `--color-ink-secondary` `max-width 400px` `premium.aboutText(brand)`;
  `ds-btn ds-btn--secondary` `premium.aboutCta` → `/nosotros` on the
  Spanish door, `/about` on the English door. Put the href in the
  dictionary (`premium.aboutHref`) — both routes exist under `app/`.
- **No video play overlay.** There is no video.

### servicios
- `<h2>` `premium.servicesTitle`; `.ph-services` five columns (`34px 1fr`
  inner grid per item, gap 34px; 2 cols ≤ 900, 1 col ≤ 520). Each item: 30px
  line icon, uppercase 10.5px title, 12px/1.75 body. Items from
  `premium.services` (array of `{title, text, href}`), each whole item is a
  `<Link>`. Five, in this order, hrefs fixed in the dictionary:
  buscar → `/venta/asuncion`; vender → `sellerCtaHref` is not available to
  the dictionary, so store `href: "/publicar"` and let the component swap it
  for `sellerCtaHref(vertical.key)` when `key === "vender"`; tasacion →
  `/tasacion`; financiamiento → `/financiamiento`; precios → `/precios`.
  All five routes exist under `app/`.

### zonas
- Head row: `<h2>` `premium.zonesTitle` + `ds-link-underline`
  `premium.zonesMore` → `/venta/asuncion`.
- `.ph-zones` six tiles (`repeat(6,1fr)`, 3 ≤ 1024, 2 ≤ 600), each
  `ds-photo-card ds-photo-card--zone` `height: 150px` (200px ≤ 600) linking
  to `/venta/<slug>`, `<Picture>` inside as `.ds-photo-card__img`, existing
  zone scrim, `zone-card__name` + `zone-card__sub` (`premium.zoneSub`).
  Tiles are a fixed list in `app/page.tsx` (replace `ZONE_CARDS`):

  | name | slug | Picture slug |
  |---|---|---|
  | Asunción | asuncion | zona-asuncion-skyline-costanera |
  | Luque | luque | zona-luque-casas-modernas |
  | San Lorenzo | san-lorenzo | zona-san-lorenzo-barrio-residencial |
  | San Bernardino | san-bernardino | zona-san-bernardino-lago-ypacarai |
  | Encarnación | encarnacion | zona-encarnacion-costanera-parana |
  | Ciudad del Este | ciudad-del-este | zona-ciudad-del-este-vista-aerea |

  Render a tile only when its slug is in `cities` (same guard the old
  `cityShortcuts` used) so no tile links to an empty category page.

### como-funciona
- Replaces the reference's testimonials (**no reviews exist and none may be
  invented** — `docs/decisions-needed.md`). Dark section
  (`ds-section ds-section--dark`), `<h2>` `premium.howTitle`, three columns
  from `d.home.howSteps` (existing, both locales): numeral `01 02 03` in
  Cormorant 46px `--color-accent-on-dark`, title uppercase 11.5px, text 13px
  `rgba(255,255,255,0.72)`. Drop the emoji `icon` field — do not render it.
  Under the grid, `ds-link-underline ds-link-underline--dark`
  `d.home.howMore` → `/como-funciona`.

### faq-contacto
- `.ph-faqcontact` grid `1.5fr 0.9fr` (stack ≤ 900). Left: `<h2>`
  `d.home.faqTitle`, `faq.map` as the existing `home-faq__item` `<details>`
  markup, then `home-faq__more` → `/preguntas-frecuentes` (Spanish door only:
  gate on `vertical.locale === "es"` — the English door has no such page).
- Right `.ph-contact`: `<h2>` `premium.contactTitle`; rows with hairline
  bottoms: WhatsApp row only if `waLink(CONTACT_WHATSAPP)` non-null (label
  `premium.contactWhatsapp`, number text); email row only if
  `CONTACT_EMAIL` non-null (it is null today — **never a placeholder**);
  location row `premium.contactLocation` with pin icon; then
  `ds-btn ds-btn--primary` full-width: WhatsApp link when available, else
  `premium.contactFormCta` → `/contacto` (Spanish) / `/contact` (English) —
  href in the dictionary (`premium.contactHref`).

### Floating WhatsApp button
`.ph-wa-float` fixed bottom-right 54px circle `var(--color-whatsapp)`,
rendered by `PremiumHome` **only** when `waLink(CONTACT_WHATSAPP)` is
non-null. `z-index: 25` (under the mobile drawer's, above content). Hide it
below 860px on `/propiedad` — not applicable here (home only), so no rule
needed; but keep it clear of `.listing-cta-bar` by not rendering on any page
but home.

## 3. `<Picture>` — `src/components/Picture.tsx`

Server component, no client code.

```tsx
export function Picture({ slug, alt, className, priority, sizes = "100vw" }:
  { slug: string; alt: string; className?: string; priority?: boolean; sizes?: string })
```

Renders exactly the `<picture>` webimg emits: AVIF `srcset` at 640/1280/1920,
WebP `srcset` at the same widths, `<img src="/img/premium/<slug>-1280.webp">`
with `alt`, `className` on the `<img>`, `loading="lazy" decoding="async"`
unless `priority` (then `fetchPriority="high"`, no `loading`). Path prefix is
the constant `PREMIUM_IMG = "/img/premium"`. No width/height attributes (the
CSS sizes every slot; layout shift is avoided by the fixed-height containers).

Image files live in `public/img/premium/<slug>-<w>.{avif,webp}`. The slugs
and alt texts are **fixed by `docs/imagery-prompts.md`** — read its table and
use those exact slugs and alts (alt in both languages: the Spanish alt goes
in `esPremium.imgAlt[slug]`, the English in `enPremium.imgAlt[slug]`; the
component receives `alt` from the caller).

**Placeholders, so the site is never broken before the founder's images
arrive:** generate the full set from the photos already in `public/img/`
with webimg (works in this sandbox, tested):

```bash
# from the repo root
W="npx --yes github:antonmarklundcom/webimg"
$W convert public/img/hero-home.webp          --name casa-premium-asuncion-atardecer      --alt "placeholder" --prompt "placeholder from hero-home" --ar 16:9 --out public/img/premium
$W convert public/img/editorial-invertir.webp --name living-moderno-vista-rio-asuncion    --alt "placeholder" --prompt "placeholder" --ar 3:2  --out public/img/premium
$W convert public/img/zona-asuncion.webp      --name zona-asuncion-skyline-costanera      --alt "placeholder" --prompt "placeholder" --ar 4:3  --out public/img/premium
$W convert public/img/zona-luque.webp         --name zona-luque-casas-modernas            --alt "placeholder" --prompt "placeholder" --ar 4:3  --out public/img/premium
$W convert public/img/zona-luque.webp         --name zona-san-lorenzo-barrio-residencial  --alt "placeholder" --prompt "placeholder" --ar 4:3  --out public/img/premium
$W convert public/img/zona-san-bernardino.webp --name zona-san-bernardino-lago-ypacarai   --alt "placeholder" --prompt "placeholder" --ar 4:3  --out public/img/premium
$W convert public/img/zona-encarnacion.webp   --name zona-encarnacion-costanera-parana    --alt "placeholder" --prompt "placeholder" --ar 4:3  --out public/img/premium
$W convert public/img/zona-asuncion.webp      --name zona-ciudad-del-este-vista-aerea     --alt "placeholder" --prompt "placeholder" --ar 4:3  --out public/img/premium
```

Commit the 48 files. **Do not commit `public/img/premium/manifest.json`**
(delete it after the run; the founder's later run will write its own). Any
`⚠ upscaling` warning is expected here (the sources are small) and goes in
the log, not fixed. The founder regenerates by re-running `convert` with the
same `--name`, which overwrites in place — that is why the slugs are fixed
now.

Leave `public/img/hero-home.webp`, `editorial-*.webp`, `zona-*.webp`,
`og-share.webp`, `listing-fallback.webp` in place: the default (terreno)
home, the rental door and OG tags still read them.

## 4. Copy — `esPremium` (Spanish values; write `enPremium` yourself)

English rules: foreign-buyer pitch (PLAN.md D6), "estimated monthly payment"
not cuota, never a fact the Spanish does not state. Same keys, same arities,
same array lengths (`verify:i18n` enforces it).

```ts
export const esPremium = {
  heroKicker: "Asunción · Paraguay",
  heroTitleLead: "Propiedades ",
  heroTitleHighlight: "premium",
  heroTitleTail: " en Paraguay",
  heroSubtitle: "Casas, departamentos y terrenos en venta y alquiler en Asunción y todo el país, con cuota estimada y financiamiento.",
  heroBrowse: "Ver propiedades",
  heroWhatsapp: "Hablar por WhatsApp",
  waPrefill: (brand: string) => `Hola, vi ${brand} y quiero más información.`,
  trust: [
    { icon: "person", label: "Contacto directo\ncon quien publica" },
    { icon: "check-square", label: "Avisos\nverificados" },
    { icon: "people", label: "Inmobiliarias\nde todo el país" },
    { icon: "clock", label: "Respuesta rápida\npor WhatsApp" },
  ],
  searchTitle: "Encontrá tu próxima propiedad",
  featuredTitle: "Propiedades destacadas",
  featuredMore: "Ver todas las propiedades →",
  typesTitle: "Tipos de propiedades",
  types: {
    casas: "Casas", departamentos: "Departamentos", terrenos: "Terrenos",
    alquileres: "Alquileres", comercial: "Locales y oficinas", proyectos: "Proyectos nuevos",
  },
  aboutKicker: (brand: string) => `Somos ${brand}`,
  aboutTitle: "Claridad. Confianza.\nResultados.",
  aboutText: (brand: string) => `${brand} reúne casas, departamentos y terrenos de inmobiliarias y particulares de todo el país. Cada aviso muestra su precio, su cuota estimada y el contacto directo de quien lo publica, sin intermediarios ni comisión para vos.`,
  aboutCta: "Conocé más sobre nosotros",
  aboutHref: "/nosotros",
  servicesTitle: "Qué podés hacer acá",
  services: [
    { key: "buscar", title: "Buscar propiedades", text: "Filtrá por zona, tipo y presupuesto, en lista o sobre el mapa.", href: "/venta/asuncion" },
    { key: "vender", title: "Vender o alquilar", text: "Publicá gratis y recibí consultas directo en tu WhatsApp.", href: "/publicar" },
    { key: "tasacion", title: "Tasación estimada", text: "Un rango de precio con los avisos publicados de tu zona.", href: "/tasacion" },
    { key: "financiamiento", title: "Financiamiento", text: "Cuota estimada por aviso y las líneas de crédito vigentes.", href: "/financiamiento" },
    { key: "precios", title: "Precios de mercado", text: "Mediana de precio por m² en cada ciudad, actualizada.", href: "/precios" },
  ],
  zonesTitle: "Zonas destacadas",
  zonesMore: "Ver todas las zonas →",
  zoneSub: "Ver propiedades",
  howTitle: "Cómo funciona",
  contactTitle: "Contactanos",
  contactWhatsapp: "Escribinos por WhatsApp",
  contactLocation: "Asunción, Paraguay",
  contactFormCta: "Enviar consulta",
  contactHref: "/contacto",
  imgAlt: {
    "casa-premium-asuncion-atardecer": "…",   // from docs/imagery-prompts.md
    // … one entry per slug in that table
  } as Record<string, string>,
};
```

The `\n` in `trust[].label` and `aboutTitle` is rendered as a `<br />`
(split on `\n` in the component). `imgAlt` values: copy the alt column from
`docs/imagery-prompts.md` verbatim (Spanish → `esPremium`, English →
`enPremium`).

Do not touch the `home` namespace except to read it.

## 5. Docs

- `docs/style/README.md`: change the two marketplace rows to
  `**built: Premium Editorial** (2026-09-11, docs/prompts/premium-editorial.md) — supersedes Nórdico / variant A`.
- `docs/log/pe1.md`: what landed, deviations from this spec with the reason,
  the upscaling warnings, what was not verified (no database in the sandbox
  ⇒ the home renders with `recent = []`; say so).
- `CLAUDE.md` "Brand name" section: one sentence after the brand table —
  both marketplace doors render the editorial (green/gold/Cormorant) system
  since 2026-09-11; the per-door Nórdico/Petrol themes are deleted.

## 6. Definition of done (self-verify, in this order)

1. `npm install` (if `node_modules` is missing), then `npm run typecheck`.
2. `npm run verify:i18n`, `npm run verify:seo`, `npm run verify:facets`,
   `npm run verify:import`.
3. `npm run build` — must be clean. No database is available; the build
   does not need one (every route is dynamic).
4. Render check without a database: `DATABASE_URL` unset ⇒ `next start` will
   500 on the home. Instead review the JSX and CSS adversarially for: the
   `-46px` overlap being clipped by an `overflow: hidden` ancestor, the
   search panel's z-index against the hero scrim, white text on the
   `accent-soft` about section (must be ink), the six-column rows at 400px
   width (must wrap, never overflow the viewport — `body` must not scroll
   horizontally), and the floating button never rendering without a number.
5. `git diff --stat`; confirm nothing under `.github/workflows/`, nothing in
   `src/db/schema.ts`, nothing in `verticals.ts`.
6. Commit on branch `claude/sleepy-volta-qvrq9q` with message
   `PE1 — Premium Editorial home for the marketplace doors`, **do not push**
   (the director pushes after review). Report: files changed, every
   deviation from this spec, and anything not verified.
