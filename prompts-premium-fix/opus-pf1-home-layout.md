# PF1 — home & layout fixes (Opus). Findings F1–F7, F10–F11 of
# `fable-plan-premium-fix.md`. Read that file first, then AGENTS.md, then
# CLAUDE.md "Brand name", "i18n", "Caching". Then `docs/prompts/premium-editorial.md`
# §2 (the home's section spec) and `docs/log/pe1.md`.

You own ONLY: `app/globals.css` (the `.site-header*`, `.hub-hero*` and `ph-*`
rules), `src/components/home/PremiumHome.tsx`, `src/components/SiteFooter.tsx`,
new keys in the `premium` namespace of `src/i18n/es.ts` + `en.ts`, the two new
files `public/img/hub-venta.webp` and `public/img/hub-alquiler.webp`, and
`docs/log/pf1.md`. Another agent is editing other namespaces of the i18n files
and other pages at the same time — do not touch anything outside this list.

Fix, in this order, one commit each:

1. **F1 horizontal scroll (desktop).** `.ph-about__media`'s negative right
   margin overflows the viewport once the container hits `--container`. Make
   the bleed reach the container's right edge only — e.g. keep the grid at
   `max-width: var(--container)` and put `overflow-x: clip` on `.ph-about`
   (clip, not hidden: nothing inside needs to escape), or restructure so the
   photo column is `1.1fr` of a grid whose right padding is 0 without a negative
   margin. Verify `scrollWidth === clientWidth` at 1440 and 1920.
2. **F2 phone header.** At 390 px the brand (235) + gap + CTA (79) + burger (42)
   exceed the bar. Extend the existing `max-width: 380px` shrink rules to
   `max-width: 430px` and let `.site-header__brand` shrink (`min-width: 0`,
   sub-line hidden below 430 if needed). No page may scroll sideways at 390.
3. **F3 hub photos.** Create `public/img/hub-venta.webp` and
   `public/img/hub-alquiler.webp` with `sharp` from the premium set
   (`casa-premium-asuncion-atardecer-1920.webp` → venta,
   `living-moderno-vista-rio-asuncion-1920.webp` → alquiler), 1920 px wide,
   quality 78. These are placeholders until the real imagery in
   `docs/imagery-prompts.md` lands; say so in the log. The two 404s must be gone.
4. **F4 rhythm.** Lower `--section-y` to `clamp(64px, 7vw, 104px)`. Give the
   `tipos` band and the `servicios` band half spacing (`--section-y-tight`).
   Where two cream sections meet, the second one's top spacing is the gap —
   do not stack both. Target: desktop home ≤ 4 800 px, phone home ≤ 8 500 px.
5. **F5 zones.** `.ph-zones` becomes `repeat(auto-fit, minmax(200px, 1fr))`
   capped at 6, tiles `clamp(200px, 16vw, 260px)` tall on desktop. Five tiles
   must fill the row; two or three must not stretch to absurd widths (cap the
   tile `max-width` or the grid width).
6. **F6 contact card.** When there is no WhatsApp number, the aside must still
   earn its column: rows for "Formulario de contacto" (→ `/contacto`),
   "Publicá tu propiedad" (→ `/publicar`), "Lunes a viernes 8:00–18:00" (this
   line already exists on `/contacto` — reuse that dictionary key, do not
   invent hours), plus the existing location row and CTA. When the number IS
   set, the WhatsApp row stays first. Copy via the `premium` namespace, `en`
   peer in the same commit.
7. **F7 footer glyphs.** Replace the ✉️ / 📍 literals in `SiteFooter.tsx` with
   the same inline SVG line glyphs the home's contact rows use (stroke 1.2,
   `currentColor`). No emoji remains in the footer.
8. Optional if all above are green: F10 (trust row as one horizontally
   scrolling line on phone, `scroll-snap`, no scrollbar) and F11 (count line
   11.5 px, `--color-ink-secondary`).

Verify (in this order): `npm run verify:local`; then start the app on port
3001 against the seeded DB
(`DATABASE_URL="mysql://propia:propia@127.0.0.1:3306/propia" NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py node node_modules/next/dist/bin/next start -p 3001`)
and, with the director's Playwright harness (`lib.mjs` in the scratchpad dir
named in the plan — copy it and change the port), assert no horizontal
overflow at 390 / 768 / 1024 / 1440 / 1920 on `/`, `/venta`, `/venta/asuncion`,
`/propiedad/casa-moderna-en-villa-morra-a1b2c3d4e1` on BOTH hosts, and that no
request 404s. Screenshot the home at 1440 and 390 and look at it.

Commit each fix separately on your worktree branch with messages
`PF1 — F<n>: <what>`. Do not push. Write `docs/log/pf1.md` (what landed, what
was not verified, deviations). Report the file list, every deviation, and the
final home heights at 1440/390.
