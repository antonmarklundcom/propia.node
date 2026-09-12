# Premium Editorial — fix plan after the first live render (PF)

Written 2026-09-12 by the director session, after rendering `main` @ `897e683`
(PE1, PR #138, merged and therefore live) in a headless Chromium at 1440 px and
390 px on both marketplace doors, with a seeded local MySQL. The production
hosts could not be reached from the sandbox (egress policy), so this is the
same code on the same build — not a screenshot of Hostinger. Everything below
was seen in that render, not inferred from CSS.

Not bugs, recorded so nobody chases them: the placeholder photos repeat
across cards and zones (they are the eight converted originals, real imagery
lands per `docs/imagery-prompts.md`); the "Sitio en construcción" notice is
intentional; lazy images below the fold are blank in a full-page screenshot
until scrolled — they load fine.

## Findings, ranked

| # | Where | What a visitor sees | Cause | Phase |
| --- | --- | --- | --- | --- |
| F1 | Home, desktop, both doors | The page scrolls sideways; the dark sections and footer stop 56 px short of the right edge, leaving a cream strip. | `.ph-about__media { margin-right: calc(-1 * var(--container-pad)) }` bleeds past the viewport whenever the container is at its max width (≥ 1440 px). Nothing clips it. | PF1 |
| F2 | Every page, phone (≤ ~420 px), Spanish door | The bar is 5 px wider than the screen: burger pokes out, page wobbles sideways. | `.site-header__inner` at 390 px: brand 235 + gap 10 + actions 135 > 358 available. The shrink rules only start at `max-width: 380px`. | PF1 |
| F3 | `/venta`, `/alquiler` hubs, both doors | Hero is flat green; two 404s per page load. | `globals.css` (P2, #132) references `/img/hub-venta.webp` and `/img/hub-alquiler.webp`; neither file was ever committed. | PF1 |
| F4 | Home, desktop | ~260 px of empty cream between "destacadas" and "tipos", again before "nosotros", again before "zonas". Phone home is 10 800 px tall. Reads as unfinished. | `--section-y: clamp(88px, 10vw, 132px)` applied as padding on both the bottom of one section and the top of the next. The one-row "tipos" band gets the same spacing as a photo section. | PF1 |
| F5 | Home, desktop | Zone row: a 6-column grid with 5 tiles → an empty slot at the right. Tiles are 150 px thumbnails in a "photo-carried" design. | `.ph-zones { grid-template-columns: repeat(6, …) }` while `PremiumHome` renders only zones whose city has inventory (any count 1–6). | PF1 |
| F6 | Home, both doors | "Contactanos" card is a heading, "Asunción, Paraguay" and a button — nothing else, because `NEXT_PUBLIC_CONTACT_WHATSAPP` is unset and there is no email (by design). | The aside was designed around a WhatsApp row that is hidden. | PF1 |
| F7 | Footer, all pages | ✉️ and 📍 emoji in an editorial footer. | `SiteFooter.tsx` literals. | PF1 |
| F8 | English door, every non-home page | `/nosotros`, `/contacto`, `/agentes`, `/inmobiliarias`, `/precios`, `/proyectos`, `/tasacion`, `/login`, `/registro`, `/vender` and the tab `<title>` of the **home** ("Encontrá tu propiedad en Paraguay") are Spanish on `realestateinparaguay.com`. `<meta description>` and `og:locale` are Spanish too. | These pages import `esX` namespaces directly instead of `dict()`; `app/layout.tsx`'s default title/description/og locale are not locale-aware. Known gap (CLAUDE.md i18n), now visible to every English visitor who clicks anything but a listing. | PF2 |
| F9 | `/propiedad`, `/nosotros`, `/contacto`, `/proyectos`, `/venta/<ciudad>` | Emoji icon fonts (🏠 🛏 🚿 🚗 📐 🕒 📍 🔍 🤝 💸 📋 🎨), rounded chips, a black "Enviar Mensaje" button, boxed white filter panels — the previous design language inside the new editorial chrome. Not broken; visibly two designs. | PE1 restyled the home only. | PF3 |
| F10 | Home, phone | Hero ~1 100 px tall before the search panel: title, copy, two stacked CTAs, 2×2 trust row. | Not a bug; tighten if PF1 has budget (trust row can be one scrolling line on phone). | PF1 (optional) |
| F11 | Home | "9 propiedades publicadas" under the search panel is 10 px, low contrast. | Minor. | PF1 (optional) |

## Phases

| Phase | Model | Owns (nothing else) | Depends on |
| --- | --- | --- | --- |
| **PF1 home & layout fixes** — F1–F7, F10–F11 | Opus | `app/globals.css` (`.site-header*`, `.hub-hero*`, every `ph-*` rule), `src/components/home/PremiumHome.tsx`, `src/components/SiteFooter.tsx`, the `premium` namespace in `src/i18n/es.ts`/`en.ts` (new keys only), `public/img/hub-venta.webp` + `hub-alquiler.webp` (new), `docs/log/pf1.md` | — |
| **PF2 English door completeness** — F8 | Opus | `app/layout.tsx` (`generateMetadata` only), the public pages listed in F8 and their `generateMetadata`, new namespaces in `src/i18n/es.ts`/`en.ts` (anything except `premium`), `docs/log/pf2.md`. **Not** `globals.css`, not `PremiumHome.tsx`, not `SiteFooter.tsx`, not `/admin/**`, `/agencia/**`, `/mis-avisos/**` (staff copy stays Spanish, quality plan §1.9). | — (parallel with PF1) |
| **PF3 editorial restyle of the inner pages** — F9 | Opus (director writes the delta-spec first, as for PE1) | `/propiedad/[slug]`, the hub and category pages, `/nosotros`, `/contacto`, `/proyectos`, the lead form, `globals.css` blocks for those pages | PF1 merged (same CSS file) |

PF1 and PF2 run now, in parallel, from this director session as subagents in
separate worktrees (`prompts-premium-fix/opus-pf1-home-layout.md`,
`prompts-premium-fix/opus-pf2-english-pages.md`). PF3 is a design phase: its
prompt is `prompts-premium-fix/opus-pf3-inner-pages.md` and it waits for the
founder to look at PF1 on a preview first.

## Rules that apply to every phase here

- AGENTS.md in full. No `schema.ts`, no `verticals.ts`, no auth, no
  `.github/workflows/`, no new domain, no placeholder email or number.
- Every visitor-facing string through the dictionary; every `es.ts` key gets
  its `en.ts` peer in the same commit; `npm run verify:i18n` green.
- `npm run verify:local` green before the branch is handed back. Render both
  doors in a real browser (the director's harness is at
  `/tmp/claude-0/…/scratchpad/lib.mjs`; a seeded local MariaDB is on
  `mysql://propia:propia@127.0.0.1:3306/propia`) and check `document.documentElement.scrollWidth === clientWidth` at 1440 and 390 on the home,
  `/venta`, `/venta/asuncion`, `/propiedad/<slug>`.
- Log what was not verified in `docs/log/pf<N>.md`.

## Definition of done for the whole plan

- No horizontal scroll on any public page at 390, 768, 1024, 1440, 1920.
- No 404 in the network panel on home, hubs, category, detail.
- The English door has no Spanish `<title>`, description or body copy on any
  public page a visitor can reach from the nav or footer.
- The home's vertical rhythm reads as one designed page, not sections with
  empty rooms between them.
