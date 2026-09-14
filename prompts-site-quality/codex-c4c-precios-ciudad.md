Task: Follow-up to group (d) in docs/prompts/premium-editorial-inner.md. The city price page app/precios/[ciudad]/page.tsx is still in the old admin-panel look: inline style objects, panel-btn back link, panel-table for the medians table, panel-empty. Restyle it to match the just-restyled index app/precios/page.tsx and the group (c) marketing pages: PageHero (tone light, eyebrow = the brand, h1 = the existing city title string, lead = the existing subtitle string), a narrow Section holding the table, a narrow muted Section for the method and thin-sample notes. The medians table becomes an editorial table: no panel-table classes, new .precios-table* rules scoped under a .precios-city wrapper class on main, hairline row separators, header cells Jost 11px uppercase tracking 0.1em secondary ink, body cells Jost 15px, numeric cells right aligned in Cormorant 20px, no zebra stripes, no borders except hairlines, radius 0, and the table wrapper keeps horizontal scroll at 390px width. The back link to /precios becomes a plain text link in Jost 12px uppercase with a left arrow glyph if one exists in src/components/Glyph.tsx, otherwise plain text. Remove every inline style object. Keep the JsonLd, metadata, dictionary strings, caveat and thin-note copy, and every query unchanged. Also append one line to the Group (d) section of docs/prompts/premium-editorial-inner.md recording that the city page follows the same treatment.

Files to touch: app/precios/[ciudad]/page.tsx, app/globals.css (new .precios-city* and .precios-table* rules only), docs/prompts/premium-editorial-inner.md (one line), docs/log/c4c.md (new, short).

Do not touch: app/precios/page.tsx, MarketingUI.tsx, dictionaries, anything else. No git commands. No npm run build. Do not print or write environment variables or secrets.

Definition of done:
- app/precios/[ciudad]/page.tsx contains no style={{ attribute and no panel- class, and renders PageHero and Section from MarketingUI.
- A Unicode-aware emoji search over the touched files returns nothing.
- docs/log/c4c.md written.

Commands to run before reporting (working directory C:\Users\anton\propia.node), run every one and report FAIL rather than skip:
- npm run typecheck
- npm run verify:i18n (may die with an ENOMEM error in this sandbox; if so, report that exact text as FAIL and continue)

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
