# inmobiliarios.com.py — "Paso a Paso"

The directory door's own visual direction, distinct from every marketplace
and rental door's. Locked 2026-09-10 (phase D4), from Claude Design canvas
*Inmobiliarios Home · 3 direcciones*, artboard 2a: *"El registro en tres
pasos es el héroe. Crema cálido, azul cobalto, Lora + Public Sans. Cada
beneficio se ata a un paso concreto."* This file is the contract D4 built
against — see `prompts-realtor-terreno-rental/sonnet-d4-paso-a-paso-home.md`
for the original spec.

## §1 Tokens

`DIRECTORY` in `src/design/themes.ts`, assigned to key `agents` in
`OVERRIDES`.

| Token | Value | Contrast (computed) |
| --- | --- | --- |
| `--color-background` | `#FAF7F0` | warm cream |
| `--color-ink` / `--color-primary` / `--color-primary-dark` / `--color-primary-soft` | `#1A1D2B` | near-black navy — 15.68:1 on cream; primary is the dark ground of the footer/header only |
| `--color-ink-secondary` | `#4B4E5C` | 8.53:1 |
| `--color-ink-muted` | `#8A8D99` | decorative only, never body text |
| `--color-accent` / `--color-link` / `--button-primary-bg` | `#1F4FD8` | cobalt — white on it 5.9:1 |
| `--color-accent-hover` / `--color-link-hover` / `--button-primary-bg-hover` | `#173FB0` | |
| `--color-accent-soft` | `#E8EEFB` | the one tint allowed as a block fill |
| `--color-accent-on-dark` | `#8FB0FF` | cobalt lifted for navy grounds — 6.59:1 on `#1A1D2B` |
| `--color-on-accent` / `--button-primary-fg` | `#FFFFFF` | |
| `--color-border` | `rgba(26,29,43,0.12)` | |
| `--color-border-accent` | `rgba(31,79,216,0.28)` | |
| `--site-notice-label-color` | `#173FB0` | same value as `--color-link-hover` |

Type: **Lora Variable** (display, serif) + **Public Sans Variable** (body,
sans) — two new self-hosted `@fontsource-variable` packages, imported
unconditionally in `app/layout.tsx` the way Manrope/Newsreader are; no
Google Fonts `<link>`. Shape: radius **8px** on controls, **16px** on the
form card, `--button-case: none` (sentence case), `--label-tracking: .1em`.
Container 1280, section rhythm `clamp(72px, 8vw, 112px)`, grid gap 24.

Header/footer copy the `RENTAL` block's shape: white header
(`--header-bg: rgba(255,255,255,0.96)`), navy nav text, cobalt-fill white-text
CTA; navy footer (`--footer-bg: #1A1D2B`).

## §2 Chrome

- **Header**: white, hairline bottom, sentence-case nav, cobalt-fill CTA.
  Unchanged from D1 — `directory.chromeNav` still names Inicio / Inmobiliarios
  / Inmobiliarias / Para inmobiliarios / Contacto. Only colour and type move
  through the tokens; nav labels and structure are D1's, not D4's.
- **Footer**: navy ground, so the page ends on the brand's own colour — same
  four-column shape D1 shipped (directory / la empresa / contact), just
  restyled through the token set above.
- No login, no publish CTA, no newsletter — unchanged from D1
  (`chromeShowLogin`/`chromeShowPublishCta`/`chromeShowNewsletter` false for
  this door).

## §3 Home sections (in order, unchanged from D1)

`homeSections("agents")`: `hero` · `como-funciona` · `como-elegimos` ·
`directorio-teaser` · `profesional` · `faq`. D4 restyles every section; none
are added, removed or reordered.

1. **hero** (`#form`) — two columns on desktop, **copy 7 / form card 5**
   (`.directory-home .nh-hero__grid`), stacked on mobile with the form
   directly under the H1 and subtitle. Kicker "Para propietarios · Gratis",
   H1 in Lora (~clamp(38px, 4.6vw, 66px)), four check-bullet `heroPoints`
   each tied to a step of the process. The form card is white, radius 16,
   shadow `0 12px 40px rgba(26,29,43,0.10)` (both already the token
   defaults) with a three-segment step bar on top.
2. **como-funciona** ("Qué pasa después de registrarte") — H2 in Lora, three
   numbered cards, numerals `01 02 03` in Lora 48px cobalt (scoped override
   of the shared `.home-how__num`, which stays a small circular badge on
   every other door), titles 20px/600, text 16px/1.55.
3. **como-elegimos** ("Cómo elegimos") — unchanged copy; the shared
   `.home-values` block already renders as three plain columns on a hairline
   top with no card chrome, so no restyle was needed there.
4. **directorio-teaser** — kicker "Red de agentes verificados", a
   `ds-link-underline` "Ver el directorio". Still never pads: fewer than
   `MIN_TEASER_AGENTS` (3) verified professionals renders the "sé de los
   primeros" band instead (D1's rule, untouched). No agency count anywhere.
5. **profesional** ("¿Sos inmobiliario?") — navy ground
   (`--color-primary`), white text, cobalt-on-dark kicker/link colour
   (`--color-accent-on-dark`), one outline button (scoped override of the
   shared `.home-pro__button`, which stays a solid fill on every other
   door). Copy unchanged from D1/D2.
6. **faq** — unchanged copy and `<details>` markup, restyled through the
   token set (hairlines, Public Sans body).

## §4 The stepper (`DirectoryLeadForm`)

Same state, same `/api/leads` payload, one `fetch` at the end — D4 changed
only how the fields are presented, not what is collected or sent. Three
screens gated on local `step` state:

1. **Step 1 — "Tus datos"**: name, WhatsApp. `formNext` advances after the
   existing phone-digit validation (`formPhoneError` on failure).
2. **Step 2 — "Tu propiedad"**: operation, property type, city, optional
   message. `formBack` returns to step 1; `formNext2` requires operation,
   type and city (same fields required as the pre-D4 single-screen form).
3. **Step 3 — "Confirmar"**: a read-only summary (name · WhatsApp ·
   operation · type · city) with `formEdit` back to step 1, the existing
   terms/privacy fineprint, and the submit button.

New classes, all under `app/globals.css`'s appended D4 block: `.df-steps` /
`.df-step` (`--current`/`--done` modifiers, `aria-current="step"` on the
current segment) / `.df-actions` / `.df-back` / `.df-summary` / `.df-edit`.

The same component renders on `/agente/[slug]` and `/inmobiliaria/[slug]`
profile pages (`agentSlug`/`agencySlug` props unchanged) — the stepper
applies there too automatically, no separate wiring.

## §5 Copy rules

Vos-form Spanish; `en.ts`'s `enDirectory` is the peer, not a literal
translation (same rule as the rest of the dictionary). No invented figures —
no response-time promise, no agency count, no "tu panel" (no owner panel
exists yet, PLAN.md D8). "Hasta tres agentes" stays a process, never a
guarantee. No *propia*, no email.
