Task: Final emoji sweep for the marketplace doors (fable-plan-site-quality-2026-09-13.md, shared glyph rule in docs/prompts/premium-editorial-inner.md). A rendered audit still finds emoji on the public pages listed below. Replace every emoji with the Glyph component from src/components/Glyph.tsx. First extend GLYPHS in Glyph.tsx with these single-stroke 24px outline icons in the same style as the existing ones: chart (a simple bar chart, three bars), calendar (rect with two top ticks and a horizontal line), users (two heads and shoulders), card (a credit card rect with a stripe), bank (a pediment on columns), chat (a speech bubble), receipt (a doc with a zigzag bottom edge), percent (a diagonal with two small circles), history (a clock with a counter-clockwise arrow). Then replace:
- app/como-funciona/page.tsx icon strings: doc, receipt, building.
- app/datos/page.tsx icon strings: chart, money, bank.
- app/financiamiento/page.tsx icon strings: money, chart, calendar, bank.
- app/para-inmobiliarias/page.tsx icon strings: list, chat, building, chart, card, users.
- app/guias/page.tsx line with the page emoji and app/guias/[slug]/page.tsx the same: <Glyph name='doc' />.
- app/not-found.tsx the house emoji: <Glyph name='home' size={40} />.
- app/page.tsx: the city chip pin emoji becomes <Glyph name='pin' size={14} /> before the name; the two home-pro card icons become Glyph building and Glyph land (size 28).
- src/components/RecentlyViewed.tsx title emoji: <Glyph name='history' size={18} /> inside the h2 before the text.
- src/components/publish/PublishWizard.tsx the bank emoji in the cuota preview: <Glyph name='bank' size={16} />.
- src/components/RentalContact.tsx (shared with rental doors, markup only): chat, doc, pin glyphs at size 16.
- src/i18n/es.ts and src/i18n/en.ts: the discoverCards icon values are emoji strings; change them to glyph name strings (home, search, money or whatever fits each card title) and make the consumer in app/page.tsx render <Glyph name={c.icon} /> when isGlyphName(c.icon) is true, otherwise the raw string. Check that no other dictionary key in those two files carries an emoji value; if one does, replace it the same way and note it in the log.
Where a Glyph sits inline next to text, add the class glyph--inline if such a class exists in app/globals.css, otherwise add a minimal .glyph--inline rule (vertical-align -0.15em, margin-right 0.35em). Keep all copy, hrefs, layout and behaviour unchanged.

Files to touch: src/components/Glyph.tsx, app/como-funciona/page.tsx, app/datos/page.tsx, app/financiamiento/page.tsx, app/para-inmobiliarias/page.tsx, app/guias/page.tsx, app/guias/[slug]/page.tsx, app/not-found.tsx, app/page.tsx, src/components/RecentlyViewed.tsx, src/components/publish/PublishWizard.tsx, src/components/RentalContact.tsx, src/i18n/es.ts, src/i18n/en.ts, app/globals.css (only a .glyph--inline rule if needed), docs/log/c4e.md (new, short).

Do not touch: src/lib/photos.ts (its emoji are data, not UI), anything else. No git commands. No npm run build. Do not print or write environment variables or secrets.

Definition of done:
- A Unicode-aware emoji search over app and src, excluding src/lib/photos.ts, returns nothing. Use node with a regex over the files, not grep with \x escapes.
- Every new glyph name is used at least once and typechecks as GlyphName.
- docs/log/c4e.md written with the mapping table.

Commands to run before reporting (working directory C:\Users\anton\propia.node), run every one and report FAIL rather than skip:
- npm run typecheck
- npm run verify:i18n (may die with an ENOMEM error in this sandbox; if so, report that exact text as FAIL and continue)

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
