# Phase D4 — inmobiliarios.com.py home: the "2a Paso a Paso" design. SONNET session, medium effort. After D1/D2 merged (they are). Independent of D1b (#122) — touches different files.

Direction: Anton chose artboard **2a "Paso a Paso"** from the Claude Design
canvas *Inmobiliarios Home · 3 direcciones* (2026-09-10): *"El registro en
tres pasos es el héroe. Crema cálido, azul cobalto, Lora + Public Sans. Cada
beneficio se ata a un paso concreto."* This file is the spec distilled from
that artboard. You do not need the canvas file.

Read ONLY: this file; `src/components/home/DirectoryHome.tsx` (the shell you
restyle — keep its section order and its `homeSections()` gating);
`src/components/DirectoryLeadForm.tsx`; `src/design/themes.ts` (the `RENTAL`
block and `OVERRIDES` — copy that pattern); `docs/style/rentparaguay.com.md`
§1–§3 (the shape of a door style doc); the `directory` namespace in
`src/i18n/es.ts` + `en.ts`; the i18n section of `CLAUDE.md`; and in
`app/globals.css` only the blocks you touch: `.vd-hero*`, `.vd-form*`,
`.home-how*`, `.nh-hero*` (read for the class contract, not to rewrite).

## Owns

`src/design/themes.ts` (one new token set `DIRECTORY`, assigned to key
`agents` in `OVERRIDES`), `app/layout.tsx` (two font imports),
`package.json` (two `@fontsource` packages), `src/components/home/DirectoryHome.tsx`,
`src/components/DirectoryLeadForm.tsx` (the stepper), the `directory`
namespace in `es.ts` + `en.ts` (edit and add keys), `app/globals.css` (a new
`dh-*` block for the directory home, appended at the end), a new
`docs/style/inmobiliarios.com.py.md`, `docs/log/d4.md`, one §9 line in
`fable-plan-realtor-terreno-rental.md`.

## Hard limits

No `schema.ts`, `verticals.ts`, `sections.ts`, `alternates.ts`, `origin.ts`,
`sitemap.ts`, `crm.ts`, `/api/leads`, `middleware.ts`, no new routes, no
cache changes, no `.github/workflows`. Do not touch `app/agente/**` or
`app/inmobiliaria/**` (D1b is in flight there). A shared component must never
branch on the vertical key: colour and type come from the theme tokens, the
layout from `DirectoryHome`, which already is the directory-only shell. The
**request payload of the form does not change**: same fields, same one POST to
`/api/leads`, same `leadType: "seller"`, same `utm.source`, same `agentSlug`
and `agencySlug` pass-through props.

## Decisions already made — do not re-litigate

### 1. Tokens (`DIRECTORY` in `themes.ts`), from the artboard

| Token | Value | Note |
| --- | --- | --- |
| `--color-background` | `#FAF7F0` | warm cream |
| `--color-ink` / `--color-primary` / `--color-primary-dark` / `--color-primary-soft` | `#1A1D2B` | near-black navy; primary is used as the dark ground of the footer/header only |
| `--color-ink-secondary` | `#4B4E5C` | |
| `--color-ink-muted` | `#8A8D99` | decorative only |
| `--color-accent` / `--color-link` / `--button-primary-bg` | `#1F4FD8` | cobalt. White on it 5.9:1 |
| `--color-accent-hover` / `--color-link-hover` / `--button-primary-bg-hover` | `#173FB0` | |
| `--color-accent-soft` | `#E8EEFB` | the one tint allowed as a block fill |
| `--color-accent-on-dark` | `#8FB0FF` | cobalt lifted for navy grounds |
| `--color-on-accent` / `--button-primary-fg` | `#FFFFFF` | |
| `--color-border` | `rgba(26,29,43,0.12)` | |
| `--color-border-accent` | `rgba(31,79,216,0.28)` | |
| `--font-display` | `'Lora Variable', Georgia, serif` | |
| `--font-sans` | `'Public Sans Variable', system-ui, sans-serif` | |
| `--radius-control` | `8px` | inputs, buttons |
| `--radius-photo` | `16px` | the form card |
| `--button-case` | `none` | sentence case |
| `--label-tracking` | `.1em` | uppercase kickers |
| `--container` / `--section-y` / `--grid-gap` | `1280px` / `clamp(72px, 8vw, 112px)` / `24px` | |
| header/footer tokens | copy the `RENTAL` block's shape, with `--header-bg: #FFFFFF`, `--footer-bg: #1A1D2B`, nav colour `#1A1D2B`, CTA = cobalt fill white text | |
| `--site-notice-label-color` | `#173FB0` | |

Fonts: `npm i @fontsource-variable/lora @fontsource-variable/public-sans`
and import both in `app/layout.tsx` exactly the way Manrope/Newsreader are
imported there (self-hosted, unconditionally loaded, selected only by this
theme). No Google Fonts `<link>`.

### 2. Page structure (`DirectoryHome`), top to bottom

Keep the existing section ids and `sections.includes(...)` gates. Restyle,
reorder nothing.

**Hero** (`hero`): two columns on desktop (copy 7 / form card 5), stacked on
mobile with the form directly under the H1 and subtitle.
- Kicker (uppercase, cobalt): `heroKicker` → **"Para propietarios · Gratis"**.
- H1 in Lora, ~clamp(38px, 4.6vw, 66px), line-height 1.02: `heroTitle` →
  **"Vendé tu propiedad con un agente que ya conoce tu barrio."**
- Subtitle: `heroSubtitle` → **"Registrate en tres pasos. Recibís una
  tasación gratuita, propuestas de hasta tres agentes verificados y tu aviso
  en toda la red."**
- Four check bullets (`heroPoints`), each tied to a step:
  1. "Tasación gratuita de tu propiedad, con datos de tu zona"
  2. "Vos elegís el agente entre las propuestas que recibís"
  3. "Tu aviso publicado en inmobiliaria.com.py y realestateinparaguay.com"
  4. "Sin costo para vos: no cobramos comisión al propietario"
- The **form card**: white, radius 16, soft shadow `0 12px 40px
  rgba(26,29,43,0.10)`, a three-segment step bar on top, then the stepper
  form (below). Card title inside: `formTitle` → **"Empecemos por vos"**.

**"Qué pasa después de registrarte"** (`como-funciona`): H2 in Lora, three
numbered cards on one row (stack on mobile), numerals `01 02 03` in Lora 48px
cobalt, titles 20px 600, text 16px/1.55. Copy (`howTitle`, `howSteps`):
- 01 **Tasamos tu propiedad** — "Un valor estimado con datos de tu barrio,
  sin costo."
- 02 **Recibís propuestas** — "Hasta tres agentes verificados de tu zona te
  presentan su plan. Vos elegís con quién trabajar."
- 03 **Tu aviso en toda la red** — "El agente lo publica en
  inmobiliaria.com.py y en realestateinparaguay.com."

**"Cómo elegimos"** (`como-elegimos`): keep copy as is; style as three plain
columns on cream, hairline top, no cards.

**Directory teaser** (`directorio-teaser`): keep the never-pad rule and the
`mk-agency` cards. Restyle the head as in the artboard: kicker "Red de agentes
verificados" (`teaserTitle`), subtitle, and a `ds-link-underline` "Ver el
directorio" (`teaserAllLink`). **No count of agencies anywhere.**

**"¿Sos inmobiliario?"** (`profesional`): navy ground `--color-primary`,
white text, cobalt-on-dark link colour, one outline button. Copy unchanged.

**FAQ** (`faq`): unchanged copy, `<details>` as today, restyled with hairlines.

### 3. The form becomes a real three-step stepper (`DirectoryLeadForm`)

Same state, same payload, one `fetch` at the end. Client-side only.

- Step bar labels (`formSteps: string[]`, exactly three): **"1 · Tus datos"**,
  **"2 · Tu propiedad"**, **"3 · Confirmar"**. Current segment cobalt, done
  segments navy, pending grey. `aria-current="step"` on the current one.
- **Step 1**: name, WhatsApp. Button `formNext` → **"Continuar al paso 2 →"**.
  Validate WhatsApp with the existing phone rule before advancing; show the
  existing `formPhoneError`.
- **Step 2**: operation, property type, city, message (optional, label
  `formMessageLabel` → **"Algo más que quieras contarnos"**, placeholder
  **"m², estado, si está alquilada…"**). Buttons: `formBack` → **"← Volver"**
  and `formNext2` → **"Continuar al paso 3 →"**. Operation, type and city are
  required to advance, as today.
- **Step 3**: a summary list (name · WhatsApp · operation · type · city) with a
  `formEdit` → **"Editar"** link back to step 1, then the fineprint (terms /
  privacy, existing keys) and the submit `formSubmit` → **"Quiero mi tasación
  gratuita"**. `formSending` unchanged.
- Success panel: `formSuccessTitle` **"Recibimos tu consulta"**,
  `formSuccessText` **"Te escribimos por WhatsApp con los agentes que trabajan
  tu zona."**
- Under the submit and under step 1's button: `formNote` → **"Gratis y sin
  compromiso. Solo te contactan agentes verificados."**
- The profile pages render this same component (with `agentSlug` /
  `agencySlug`). The stepper applies there too; nothing else changes for them.

### 4. Copy rules

Vos-form Spanish. `en.ts` gets every new/changed key with the same arity —
translate intent ("tasación" → "free valuation", "agente" → "agent"). **No
invented figures**: no "48 h", no agency count, no response time, no
"comparables", no "tu panel" (no owner panel exists — PLAN.md D8). The
"hasta tres agentes" promise stays a process, not a guarantee. No *propia*,
no email. The brand stays an argument where it already is.

### 5. Chrome

The header/footer are shared components already driven by `chromeVariant()`
and the theme tokens — you do not edit them. Nav labels stay as in
`directory.chromeNav`; only colours and type change through the tokens.

## Exit (self-verified, in this order)

1. `npx tsc --noEmit` clean.
2. `npm run verify:i18n`, `verify:facets`, `verify:import`, `verify:seo`
   green; `npm run build` clean.
3. Read-check: `DirectoryLeadForm` builds the identical JSON body as before
   (diff the `fetch` call); `themes.ts` has no new key outside `OVERRIDES`
   and `DIRECTORY`; no component branches on `vertical.key`.
4. No MySQL here, so `/` on `Host: inmobiliarios.com.py` 500s; do not chase
   it. Instead render-check the pieces you can: `npm run build` and reading.
5. `docs/style/inmobiliarios.com.py.md` (§1 tokens table with the contrast
   values above, §2 chrome, §3 home sections) and `docs/log/d4.md` (≤ 12
   lines Built, ≤ 8 Decisions, ≤ 8 Known issues, one Verification line),
   plus the §9 line, in the same PR.
6. Branch `claude/d4-paso-a-paso-home`, one PR against `main`, title
   "D4 — inmobiliarios.com.py: Paso a Paso home (cream, cobalt, Lora +
   Public Sans)". **Do not merge** — Anton wants to see it on the preview
   first. In the PR body list the manual check: open `/` with
   `Host: inmobiliarios.com.py`, walk the three steps, submit, confirm a
   `seller` lead with `utm.source = "directory:home"` in `/admin/leads`.
