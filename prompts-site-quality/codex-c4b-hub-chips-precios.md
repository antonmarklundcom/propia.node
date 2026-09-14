Task: Two pages missed by the C3 editorial restyle (fable-plan-site-quality-2026-09-13.md, docs/prompts/premium-editorial-inner.md). Step 1, documentation first: append a new section titled Group (d): hub chips and /precios to docs/prompts/premium-editorial-inner.md, before the Definition of done section, that specifies the changes below in the same style as groups (a)-(c). Step 2, implement it.

The hub pages app/[operacion]/page.tsx have a Por tipo section rendering .mk-chip.hub-chip links with a .hub-chip__count badge (app/globals.css around lines 6394 and 8262). Today the chips have no visible border (mk-chip only sets a border-top) and the count is a gold pill, which reads as leftover UI-kit styling. Restyle: each chip is an inline-flex link with a full 1px hairline border var(--color-border), radius 0, padding 10px 16px, Jost 12px uppercase letter-spacing 0.1em primary ink, count in Cormorant 16px gold (var(--color-accent) or the token the home uses for gold) with no background pill, hover = border var(--color-primary) and no transform. The Por ciudad .hub-tile grid is already editorial, leave it.

The /precios index page app/precios/page.tsx is still unstyled: inline style maxWidth 900, an h1 at fontSize 24, a hardcoded grey paragraph, a plain list. Restyle it the way app/precios/[ciudad]/page.tsx and the group (c) marketing pages were done: use PageHero (tone light) with eyebrow, h1 and the indexSubtitle lead, then a Section containing the city list as an editorial list where each row is a hairline-separated link with the city name in Cormorant 24 and the sample count in Jost 12 uppercase secondary ink on the right, then the method paragraph in a muted Section with the Section title treatment. Remove every inline style object from that file. Keep the JsonLd, metadata, dictionary strings and the empty state text unchanged. Remove the unused numberLocale variables only if the typecheck or lint would otherwise complain, otherwise leave them.

Files to touch: docs/prompts/premium-editorial-inner.md, app/precios/page.tsx, app/globals.css (only .hub-chip*, .mk-chip if needed for the hub, and new .precios-* rules), docs/log/c4b.md (new, short: what landed, what was not verified, deviations).

Do not touch: app/[operacion]/page.tsx markup unless a class name must change, app/precios/[ciudad]/page.tsx, MarketingUI.tsx, any dictionary file, anything else. No git commands. No npm run build (fails in this sandbox). Do not print or write environment variables or secrets.

Definition of done:
- Group (d) section exists in docs/prompts/premium-editorial-inner.md.
- app/precios/page.tsx contains no style={{ attribute and renders PageHero and Section from MarketingUI.
- .hub-chip has a full hairline border, radius 0, no transform on hover; .hub-chip__count has no background.
- A Unicode-aware emoji search over the touched files returns nothing.
- docs/log/c4b.md written.

Commands to run before reporting (working directory C:\Users\anton\propia.node), run every one and report FAIL rather than skip:
- npm run typecheck
- npm run verify:i18n (may die with an ENOMEM error in this sandbox; if so, report that exact text as FAIL and continue)

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
