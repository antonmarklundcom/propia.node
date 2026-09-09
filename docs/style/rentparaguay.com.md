# rentparaguay.com + alquiler.com.py — the rental family

One business, two doors, **one style**. `rentparaguay.com` (English) and
`alquiler.com.py` (Spanish) are the same rental-and-management firm, unlike the
marketplace pair, which are two brands sharing rows. So a single `RENTAL` token
set in `src/design/themes.ts` is assigned to both keys, and a single
`RentalHome` renders both homes; only the dictionary differs.

This file is the contract S1–S3 build against. Locked 2026-09-09 (phase O2).

## §1 Tokens

Anchor: **slate `#182830`**, sampled from the old site's own logo files
(`Logo-dark-1.png`). Nothing else of that WordPress theme is kept — its
wordmark was the vendor's demo brand ("Altora"), not the founder's.

Accent: **clay `#A64B28`**. Warm, hospitable, and unmistakably neither the
marketplace's green (`#2E6B4F`) nor the English door's brass (`#BFA265`).

| Token | Value | Contrast (computed) |
| --- | --- | --- |
| `--color-ink` / `--color-primary` | `#182830` | 14.21:1 on paper |
| `--color-ink-secondary` | `#4F5D64` | 6.38:1 |
| `--color-ink-muted` | `#8A959B` | 2.87:1 — decorative only, never body text |
| `--color-background` | `#FAF7F4` (warm paper) | — |
| `--color-accent` / `--color-link` | `#A64B28` | 5.38:1 on paper; white on it 5.74:1 |
| `--color-accent-hover` / `--color-link-hover` | `#7E3517` | 8.17:1 |
| `--color-accent-soft` | `#F6E7DF` | ink on it 12.57:1 |
| `--color-accent-on-dark` | `#E39A72` | 6.59:1 on slate |
| `--button-primary-*` | clay fill, white text | this door sells one action |
| `--site-notice-label-color` | `#7E3517` | 7.2:1 on `#F6E7DF` (the baseline `#8C6829` is 3.9:1 there — below AA) |

Type and shape are Nórdico's: **Manrope** for display and body (already
installed — no new font package), radius **10px**, one soft shadow
(`0 8px 30px rgba(24,40,48,0.10)`) used on the hero photo and on a service card
at hover, hairlines everywhere else. Container 1280, section rhythm
`clamp(80px, 8vw, 120px)`, grid gap 24.

## §2 Chrome

- **Header**: white, hairline bottom, sentence-case 15px nav. Brand = the
  domain (`brandName()`), with the shared line icon.
- **Nav**: Alquileres (`/alquiler`) · Servicios (`/servicios`) · Nosotros ·
  Contacto. Flat, no dropdown panels, from `rental.chromeNav`.
- **One CTA**: "Contactanos" / "Contact us" → `/contacto`.
- **No login, no publish CTA, no newsletter** anywhere in this chrome
  (`chromeShowLogin` / `chromeShowPublishCta` / `chromeShowNewsletter` are
  false for the family). A landlord here is a lead for the management service,
  not a self-service publisher.
- **Footer**: slate ground, four columns — brand + tagline + contact, the seven
  services, company, legal. WhatsApp only when `CONTACT_WHATSAPP` is set; no
  mailbox exists, so the email line is a link to `/contacto` (never a
  placeholder address). No marketplace columns: these doors link to `/venta`,
  `/proyectos` or `/para-inmobiliarias` nowhere, and the footer is not the
  exception.

## §3 Home sections (in order)

`homeSections()` for the family: `hero` · `servicios` · `por-que` · `proceso` ·
`recientes` · `faq` · `cta`.

1. **hero** — 55/45 split on white, kicker + H1 + one paragraph + two buttons
   (contact, services) and a photograph. **No search bar**: the marketplace's
   hero sells a search over 15k rows, this door sells a conversation.
2. **servicios** — the seven cards from `src/config/rental-services.ts`, each
   image + title + one line, linking to `/servicios/<slug>`.
3. **por-que** — four "why us" cards on a 2px clay rule.
4. **proceso** — the one dark section: four numbered steps on slate.
5. **recientes** — the door's own rental inventory. **Renders nothing when
   empty**, which is the state today.
6. **faq** — **renders nothing until S2 fills `rental.faq`**; the FAQPage
   JSON-LD is gated on the same array.
7. **cta** — closing panel on soft clay, one button to `/contacto`.

`heroVariant()` is deliberately **not** extended: `RentalHome` renders its own
hero, as `NordicoHome` and `EnHome` do, so a registry entry would have no
reader.

## §4 Image slots — `public/img/rental/` (S1 wrote these)

Built 2026-09-09 (phase S1) to the rule in plan §6.1: the shipped set is
exactly what `RentalHome`, `RentalAbout`, `RentalServicesHub` and
`RentalServicePage` reference — `grep -rho "/img/rental/[a-z0-9-]*\.webp" src
app | sort -u` equals `ls public/img/rental`. Plan Appendix B lists more
slots (`hero-home-2`, `services`, `contact`, and a `-2` variant for six
services) than the components ended up wiring a second `<Image>` for; those
are not built — see `fable/KNOWN-ISSUES.md`. Longest edge 1600px, WebP q≈80,
all ≤250 KB (largest is `hero-home.webp` at 186 KB). The two logo PNGs are
palette reference only and are **not** shipped.

| File | Source (`docs/rentparaguay-extraction/images/`) | Provenance |
| --- | --- | --- |
| `hero-home.webp` | `rent-paraguay.jpeg` | paraguay-stock |
| `about.webp` | `about-us-rent-paraguay.png` | generic-stock |
| `alquiler.webp` | `rent-asuncion.jpeg` | paraguay-stock |
| `administracion-airbnb.webp` | `hf_20260223_220129_372eed74-….png` | higgsfield |
| `administracion-de-departamentos.webp` | `apartment-management-manteinance-paraguay-asuncion.jpeg` | generic-stock |
| `inmobiliaria-asuncion.webp` | `realtor-asuncion-paraguay.jpeg` | generic-stock |
| `residencia-paraguay.webp` | `residency-paraguay.jpeg` | paraguay-stock |
| `invertir-en-paraguay.webp` | `rent-paraguay-invest.jpeg` | paraguay-stock |
| `domicilio-virtual.webp` | `virtual-adress-asuncion.jpeg` | generic-stock |

Provenance was decided by looking at each file, not trusting the filename:
`administracion-de-departamentos`'s source photo carries a US brand's
"Verified Contractors Network" tablet overlay (a competitor's stock asset,
not Paraguay-specific); `domicilio-virtual`'s source shows a tram reflected
in the glass, and Asunción has no light rail, so despite its filename it
reads as generic urban stock, likely shot elsewhere; `inmobiliaria-asuncion`
and `about` are staged office/architecture scenes with nothing tying them to
Paraguay. `residencia-paraguay` and `invertir-en-paraguay` carry explicit
"PARAGUAY" text baked into the image and stay `paraguay-stock` despite also
looking AI-generated. The PR body repeats the `generic-stock` rows as the
founder's regenerate-or-keep call.

## §5 Copy rules

English is the **source** language (the old site wrote it); the Spanish is a
translation of intent for a Paraguayan reader, vos-form, never a new claim.
Nothing the WordPress theme fabricated survives: no "400+ agents", no demo
listings, no testimonials, no invented team. Where the old copy states a
measured figure ("within 48 hours", "approved on the first attempt"), the new
copy states the service, not the number.
