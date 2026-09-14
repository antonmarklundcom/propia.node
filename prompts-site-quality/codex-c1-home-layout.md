Task: Fix the layout and content defects of the shared Premium Editorial home and the site chrome on the two marketplace doors (inmobiliaria.com.py, Spanish; realestateinparaguay.com, English). Read, in this order: fable-plan-site-quality-2026-09-13.md (section 1 rows F1-F7, F10, F11, F13, F20, and section 6), AGENTS.md, CLAUDE.md sections Brand name, i18n and Caching, docs/prompts/premium-editorial.md section 2, docs/log/pe1.md. The findings were measured on the live hosts: home scrollWidth 1496 at a 1440 viewport on both doors, 392 at 390 on the Spanish door, two 404s on the hub pages, and eight identical rental cards in the featured grid.

Files to touch: app/globals.css (only the .site-header* rules, the .hub-hero* rules and the ph-* rules), src/components/home/PremiumHome.tsx, app/page.tsx (only the code that selects which listings the featured grid receives), src/components/SiteFooter.tsx, new keys in the premium namespace of src/i18n/es.ts and src/i18n/en.ts, two new files public/img/hub-venta.webp and public/img/hub-alquiler.webp, docs/log/c1.md.

Do not touch: src/db/**, drizzle/**, drizzle.config.ts, src/config/verticals.ts, middleware.ts, next.config.ts, any auth code, any other i18n namespace, any page other than app/page.tsx, any CSS rule outside the three families named above. Never add a placeholder email or phone number. Never write the word propia anywhere visitor-facing.

Fix these, in this order (do NOT run git add, git commit or git push: the sandbox cannot write .git; the director commits after auditing):

1. F1 horizontal scroll on desktop. .ph-about__media uses a negative right margin that overflows the viewport once the container reaches its max width. Make the bleed stop at the viewport edge: either put overflow-x: clip on .ph-about, or restructure the grid so the photo column reaches the right edge without a negative margin. Document width must equal the viewport width at 1440 and 1920.

2. F2 phone header. At 390 px the brand block plus gap plus CTA plus burger exceed the bar width by about 2 px on the Spanish door. Extend the existing max-width: 380px shrink rules to max-width: 430px, give .site-header__brand min-width: 0 so it can shrink, and hide the brand sub-line below 430 px if needed. No page may be wider than 390 at a 390 viewport.

3. F3 hub photos. Create public/img/hub-venta.webp and public/img/hub-alquiler.webp with sharp (already a dependency) from the existing premium set under public/img/premium: the casa-premium-asuncion-atardecer 1920 file becomes hub-venta, the living-moderno-vista-rio-asuncion 1920 file becomes hub-alquiler. 1920 px wide, quality 78. Write the conversion as a one-off node script run from the repo root; do not add a new npm script. Say in the log that these are placeholders until the real imagery in docs/imagery-prompts.md lands.

4. F4 vertical rhythm. Lower --section-y to clamp(64px, 7vw, 104px). Introduce --section-y-tight (half) for the tipos band and the servicios band. Where two cream sections meet, only one of them carries the gap; never stack a bottom padding and a top padding of full size. Target: desktop home at 1440 no taller than 4800 px, phone home at 390 no taller than 8500 px.

5. F13 featured mix. app/page.tsx already fetches recent, ventaCasas, ventaDeptos, alquileres and terrenos for the home payload. Build the eight featured cards by interleaving: 3 venta casas, 2 venta departamentos, 2 alquileres, 1 terreno; when a bucket is short, fill from recent without duplicates (dedupe by listing id), preserving that venta cards come first. Keep the count at 8. Do not change the cache key or the queries themselves.

6. F5 zones. .ph-zones becomes repeat(auto-fit, minmax(200px, 1fr)) capped so that a row never exceeds 6 tiles; tiles clamp(200px, 16vw, 260px) tall on desktop. Five tiles must fill the row with no empty slot; two or three tiles must not stretch absurdly (cap tile max-width or the grid width).

7. F6 contact card. When there is no WhatsApp number configured, the aside must still earn its column: rows for Formulario de contacto (link to /contacto), Publica tu propiedad (link to /publicar), the existing hours line that /contacto already renders (reuse that dictionary key, do not invent hours), plus the existing location row and CTA. When the number IS set, the WhatsApp row stays first. New copy goes in the premium namespace with the en peer in the same commit.

8. F20 hero trust row. The trust line about a fast WhatsApp reply must render only when a WhatsApp number is configured (same condition the WhatsApp bubble uses). With no number the row shows the other three items and stays balanced (three columns, not a 2x2 with a hole).

9. F7 footer glyphs. Replace the envelope and pin emoji literals in src/components/SiteFooter.tsx with the same inline SVG line glyphs the home's contact rows use (stroke 1.2, currentColor). No emoji may remain in the footer.

10. F10 and F11. On phone, the hero trust row becomes one horizontally scrolling line with scroll-snap and no visible scrollbar. The properties-published count line under the search panel becomes 11.5 px in the secondary ink colour.

Definition of done:
- All ten fixes present.
- npm run typecheck and npm run verify:i18n pass. (npm run build fails inside this sandbox with EPERM readlink on the user profile folder; that is the sandbox, not you. Do not try to work around it; the director runs verify:local and renders both doors.)
- Every new es.ts key has its en.ts peer in the same commit; verify:i18n is green.
- No file outside the Files to touch list is modified (check with git status before reporting).
- docs/log/c1.md lists what landed, what was not verified in a browser (you have no browser; the director renders it), and every deviation from this prompt.

Commands to run before reporting (working directory C:\Users\anton\propia.node): npm run typecheck ; npm run verify:i18n ; git status --short

Run every command listed and report FAIL with the real output rather than skipping or substituting a different check. Do not push.

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
