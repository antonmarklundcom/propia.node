# Site quality plan — marketplace doors, 2026-09-13

Written by the Fable director session on 2026-09-13 after rendering the **live**
`inmobiliaria.com.py` and `realestateinparaguay.com` (main @ `62694e8`) in headless
Chromium at 1440 px and 390 px: home, `/venta`, `/alquiler`, `/venta/asuncion`,
`/propiedad/<slug>`, `/nosotros`, `/contacto`, `/precios`, `/proyectos`, `/agentes`,
`/guias`, `/publicar`, `/vender`, `/tasacion`.

It **supersedes the execution part of `fable-plan-premium-fix.md`** (PF1–PF3 were
written 2026-09-12 and never built). Its findings F1–F11 are all confirmed on the
live hosts and are kept by number below; F12–F20 are new. The execution model is
different: every phase here is implemented by **Codex CLI** from Anton's PC via
`codex-run.ps1` (manager-worker-codex skill), one branch and one PR per phase,
audited by the director by running the app and rendering it before merge. No Claude
subagent builds anything in this plan.

## 1. What the live sites show (ranked)

Confirmed measurements, both doors unless noted:

| Page @ width | scrollWidth (should equal width) |
| --- | --- |
| Home @ 1440 | **1496** (both doors) |
| Home @ 390 | **392** (es door), 390 (en door) |
| `/venta`, `/venta/asuncion`, `/propiedad/*` @ 390 | **392** (es door) |
| `/vender` on the en door @ 1440 | 1496 (it renders the home, see F17) |

| # | Where | What a visitor sees | Cause / note | Phase |
| --- | --- | --- | --- | --- |
| **F12** | `/guias`, both doors, in the main nav and footer | **HTTP 500 "Algo salió mal".** | PR #136 (`MIGRATION REQUIRED`) added `posts.locale` in `drizzle/0014`. Production has not run that migration, so `select().from(posts)` fails with `ER_BAD_FIELD_ERROR`, which `isMissingTable()` in `src/lib/post-queries.ts` does not treat as fail-soft. Two fixes: Anton runs `npm run db:status` / `db:migrate` against production (founder-only, §4), and the code degrades to an empty list on *any* schema-drift error, not only a missing table. | C0 + founder |
| F1 | Home @ 1440, both doors | Page scrolls sideways 56 px; dark sections stop short of the right edge. | `.ph-about__media` negative right margin. | C1 |
| F2 | Every page @ ≤ 420 px, es door | Header 2 px wider than the screen; page wobbles. | `.site-header__inner` shrink rules start at 380 px. | C1 |
| F3 | `/venta`, `/alquiler` | Flat green hero, two 404s (`/img/hub-venta.webp`, `/img/hub-alquiler.webp`). | Files never committed. | C1 |
| F4 | Home | Empty cream rooms between sections; desktop 5 742 px, phone 10 651 px (es). | `--section-y` stacked top + bottom. | C1 |
| **F13** | Home "destacadas", both doors | The eight featured cards are **all "Departamento en alquiler"** with the same placeholder photo. On a door whose primary business is venta, the first thing a visitor sees is eight identical rental cards. | `getRecentListings(8)` is date-ordered and the last import was rentals. The home payload already fetches `ventaCasas`, `ventaDeptos`, `alquileres`, `terrenos`; the featured grid should interleave them (e.g. 3 venta casas, 2 venta deptos, 2 alquiler, 1 terreno, falling back to `recent` to fill). | C1 |
| F5 | Home zones | 6-column grid, 5 tiles, empty slot; all five tiles use the same photo. | Grid rule + only eight placeholder photos exist. | C1 |
| F6 | Home contact card | Heading, "Asunción, Paraguay", one button. | No WhatsApp number configured. | C1 |
| F7 | Footer | ✉️ 📍 emoji. | Literals in `SiteFooter.tsx`. | C1 |
| F10 | Home @ 390 | Hero ~1 100 px before the search panel. | Tighten. | C1 |
| F11 | Home | "N propiedades publicadas" 10 px low contrast. | Minor. | C1 |
| F8 | en door, every non-home public page | `/nosotros`, `/contacto`, `/precios`, `/proyectos`, `/agentes`, `/tasacion`, `/publicar` (→ login "Ingresá a tu panel"), `/guias` and the home's tab `<title>` ("Encontrá tu propiedad en Paraguay") are **Spanish** on `realestateinparaguay.com`. Confirmed by `<title>`, `<h1>`, `<h2>` on each. | Pages import `es*` namespaces directly; `app/layout.tsx` default title/description/og:locale are not locale-aware. | C2 |
| **F17** | `/vender` on the en door | Renders the home (redirect to `/`) — fine by design, but it is linked nowhere on that door, so no action beyond F1. Recorded so nobody chases it. | `sellerLandingEnabled()` | — |
| F9 | `/propiedad/[slug]`, `/nosotros`, `/contacto`, `/proyectos`, category pages | Emoji icon fonts (20 emoji on a detail page: 🏠 🛏 🚿 🚗 📐 🕒 ☰ 📄 📍 …), rounded chips, black "Enviar Mensaje" button, boxed white filter panels, gray placeholder frame with a 🏠 — the pre-PE1 design inside the editorial chrome. | PE1 restyled the home only. | C3 |
| **F14** | `/propiedad/[slug]` | **The same lead form is rendered twice**: in the sticky aside and again full-width under the map, identical fields and prefilled message. | Two `<ContactForm>` mounts in `app/propiedad/[slug]/page.tsx` (lines ~628 and ~651). Keep the aside form; the lower block becomes a short "¿Interesado?" band with one button that scrolls to / focuses the aside form (mobile: the aside is below the content anyway, so render the form once there). | C3 |
| **F15** | `/propiedad/[slug]` seller card | Avatar reads **"PE"** — the initials of the "Publicado en …" label, not of a seller. | `sellerInitials` derived from the wrong string when there is no agency. Show the brand's house glyph (the header mark) when no agency logo exists. | C3 |
| **F16** | `/propiedad/[slug]` | The "Fotos próximamente" frame is a flat gray box with a 🏠, while cards use the editorial dark-green placeholder with the tag "FOTO PRÓXIMAMENTE". | Two placeholder treatments. Use the card's treatment on the detail page too. | C3 |
| **F18** | Category page `/venta/asuncion` | 17 results as a 4×5 grid of identical placeholder photos; filter bar and search panel are white boxes with rounded inputs and a black "Filtrar" button. Reads as two products. | PE1 scope. | C3 |
| **F19** | Every listing on both doors | **Every one of the 47 published listings shows a placeholder photo.** This is the single largest reason the sites "look odd": the design is photo-carried and there are no photos. Not a code bug. | Content gate. `npm run backfill:images` / R2 pipeline exists; the founder decides which listings get real imagery first. Until then, F13 + F16 + a cap on how many placeholder cards the home shows make the placeholder state look intentional. | founder |
| **F20** | Both doors | `NEXT_PUBLIC_CONTACT_WHATSAPP` unset: no WhatsApp bubble, no WhatsApp row in the contact card, the "Respuesta rápida por WhatsApp" trust line in the hero promises a channel that does not exist on the page. | Env var, founder-only. C1 hides that trust line when the number is unset. | C1 + founder |

Not bugs, recorded so nobody chases them: the "Sitio en construcción" notice is intentional; placeholder photos repeating across cards is expected until F19 lands; the sticky header appearing mid-page in full-page screenshots is a capture artefact.

## 2. Phases

All Codex. Tiers per the manager-worker-codex skill: `cheap` = gpt-5.6-luna low,
`normal` = gpt-6-astra low, `hard` = gpt-6-astra high. Each phase is one branch
`codex/<phase>` off a freshly reset `origin/main`, one PR, merged by the director
after the audit in §3. Phases run **sequentially** (one working tree; C1 and C2
share `src/i18n/*.ts`).

| Phase | Tier | Findings | Owns (nothing else) | Prompt |
| --- | --- | --- | --- | --- |
| **C0 guias fail-soft** | normal | F12 | `src/lib/post-queries.ts` (error classification only), `docs/log/c0.md` | `prompts-site-quality/codex-c0-guias-failsoft.md` |
| **C1 home & layout** | hard | F1–F7, F10, F11, F13, F20 | `app/globals.css` (`.site-header*`, `.hub-hero*`, all `ph-*`), `src/components/home/PremiumHome.tsx`, `app/page.tsx` (featured selection only), `src/components/SiteFooter.tsx`, new keys in the `premium` namespace of `src/i18n/es.ts` + `en.ts`, `public/img/hub-venta.webp`, `public/img/hub-alquiler.webp`, `docs/log/c1.md` | `prompts-site-quality/codex-c1-home-layout.md` |
| **C2 English door completeness** | normal (escalate to hard on second failure) | F8 | `app/layout.tsx` (`generateMetadata` only), the public pages listed in F8 and the components only they render, any i18n namespace except `premium`, `src/i18n/index.ts`, `docs/log/c2.md`. Not `/admin/**`, `/agencia/**`, `/mis-avisos/**` (staff copy stays Spanish, quality plan §1.9). | `prompts-site-quality/codex-c2-english-pages.md` |
| **C3 inner pages editorial** | hard, one dispatch per page group | F9, F14, F15, F16, F18 | Director writes `docs/prompts/premium-editorial-inner.md` (delta-spec) after C1 is merged and Anton has seen the home. Groups: (a) `/propiedad/[slug]` + `ContactForm`; (b) hub + category (search panel, filter bar, list/map toggle, chips); (c) `/nosotros`, `/contacto`, `/proyectos`, `/tasacion`, `/agentes` + `/inmobiliarias` cards. CSS blocks appended as `/* == C3-<group> == */`. | written per group when C1 is merged |

Order: C0 → C1 → C2 → C3(a) → C3(b) → C3(c). C0 first because it is a live 500
on a nav link and a ten-minute change.

## 3. Audit before merge (director, every phase)

Reading the worker's report is not an audit. For each PR:

1. `npm run verify:local` on the branch, on Anton's PC.
2. `git diff --stat origin/main` — only the phase's owned files moved.
3. Start the app locally against a seeded database, then with the Playwright
   harness in the director's scratchpad (`shot.mjs` / `inner.mjs`, copied into
   `docs/tools/` by C0 so the next session has it) assert, on **both** hosts via
   the `Host` header: `scrollWidth === clientWidth` at 390 / 768 / 1024 / 1440 /
   1920 on `/`, `/venta`, `/venta/asuncion`, `/propiedad/<slug>`; zero responses
   ≥ 400; for C2, no Spanish `<title>`, `<meta name=description>`, `<h1>`, `<h2>`
   on the en host for the F8 pages.
4. Look at the screenshots. Rhythm and hierarchy are judged by eye, not by a
   number.
5. Merge (autonomous merge for UI/copy is authorised, PR #117). A merge is a
   deploy: re-run step 3 against the live hosts within the hour and record the
   result in `docs/log/c<N>.md`.

## 4. Founder-only steps (not code, block the "amazing" bar regardless of code)

1. **Run the pending migration on production**: `npm run db:status` with the
   production `DATABASE_URL`, then `npm run db:migrate`. Until then `/guias` is
   empty even after C0, and `/admin/operaciones` (`ops_runs`) is broken.
2. **Set `NEXT_PUBLIC_CONTACT_WHATSAPP` in hPanel and rebuild** (F20). Both
   doors gain the WhatsApp bubble and the contact-card row the design was built
   around.
3. **Real listing photos** (F19). Pick the 10–20 listings that matter, get
   photos, run the R2 backfill. The photo-carried editorial design cannot look
   finished on placeholders, whatever the code does.
4. Confirm `NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py` in hPanel (CLAUDE.md
   "Outstanding manual step"). The live hreflang output already looks right, so
   this may be done; a one-line check.

## 5. Definition of done for the whole plan

- No horizontal scroll on any public page at 390, 768, 1024, 1440, 1920, both doors.
- No response ≥ 400 on home, hubs, category, detail, `/guias`.
- The English door has no Spanish `<title>`, description or body copy on any
  public page reachable from its nav or footer.
- The home leads with a mixed featured set (venta first), one design language on
  every public page, one lead form per listing page, no emoji glyphs anywhere
  visitor-facing.
- Founder steps 1–2 done; step 3 started.

## 6. Rules that apply to every phase (repeated so the prompt is self-contained)

AGENTS.md in full. No `schema.ts`, no `verticals.ts`, no auth, no
`.github/workflows/`, no new domain, no placeholder email or number, no `propia`
anywhere visitor-facing. Every visitor-facing string through the dictionary; every
`es.ts` key gets its `en.ts` peer in the same commit; `npm run verify:i18n` green.
`npm run verify:local` green before the branch is handed back. Log what was not
verified in `docs/log/c<N>.md`.
