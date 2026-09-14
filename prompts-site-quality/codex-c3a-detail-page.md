Task: Editorial restyle of the listing detail page and the lead form on the two marketplace doors, group (a) of docs/prompts/premium-editorial-inner.md. Read that file in full first (its Shared rule on glyphs and its Group (a) section are the spec; every value there is decided), then AGENTS.md, then CLAUDE.md sections Brand name and i18n, then docs/prompts/premium-editorial.md section 0. Findings F9, F14, F15, F16 of fable-plan-site-quality-2026-09-13.md: the live detail page shows 20 emoji glyphs, the same lead form twice, a PE avatar derived from the Publicado en label, and a flat gray placeholder frame while cards use the dark-green editorial placeholder.

Files to touch: app/propiedad/[slug]/page.tsx, src/components/ContactForm.tsx, src/components/Glyph.tsx (new), src/components/home/PremiumHome.tsx (only to import the two glyphs it draws inline from Glyph.tsx; no other change), src/components/PriceAlert.tsx (class names only if needed), app/globals.css (edit in place only the rules for .listing-detail*, .listing-facts*, .listing-section*, .listing-details-grid*, .detail-gallery*, .seller-card*, .contact-form*, .contact-panel, .similar-listings*, and append one block /* == C3-a == */ for anything new), src/i18n/es.ts and src/i18n/en.ts only to strip emoji prefixes from existing strings in the listing and contact namespaces (no new keys unless the spec names one), docs/log/c3a.md.

Do not touch: the home layout, .ph-* rules, .site-header*, .hub-hero*, .search-bar, .filter-bar, MarketingUI.tsx, any mk-* rule, src/db/**, drizzle/**, src/config/verticals.ts, middleware.ts, next.config.ts, auth, /admin/**, /agencia/**, /mis-avisos/**. Do NOT run git add, git commit or git push: the sandbox cannot write .git; the director commits after auditing. npm run build fails in this sandbox with EPERM readlink on the user profile folder; that is the sandbox, not you, do not work around it.

Work through Group (a) items 1 to 8 of the spec in order, plus the Shared rule on glyphs for the files above. Keep the layout; change only what the spec lists.

Definition of done:
- The detail page server output contains exactly one ContactForm; the lower band links to #contacto and is hidden at or below 900 px.
- A Unicode-aware search for emoji (regex \p{Extended_Pictographic} with the u flag, via node) over app/propiedad, src/components/ContactForm.tsx, src/components/PriceAlert.tsx and the listing and contact namespaces of src/i18n/*.ts returns nothing.
- The seller avatar never renders initials when there is no agency; it renders the home glyph.
- The empty gallery uses the listing-card__nophoto treatment, no icon.
- npm run typecheck and npm run verify:i18n pass.
- No file outside the list above changed (git status --short).
- docs/log/c3a.md: what landed, what was not verified (you have no browser), deviations.

Commands to run before reporting (working directory C:\Users\anton\propia.node): npm run typecheck ; npm run verify:i18n ; git status --short

Run every command listed and report FAIL with the real output rather than skipping or substituting a different check. Do not push.

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
