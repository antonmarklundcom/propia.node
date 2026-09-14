Task: Editorial restyle of the marketing and directory pages on the two marketplace doors, group (c) of docs/prompts/premium-editorial-inner.md: /nosotros, /contacto, /proyectos, /proyecto/[slug], /tasacion, /agentes, /inmobiliarias, /agente/[slug], /inmobiliaria/[slug]. Read that file in full first (its Shared rule on glyphs and its Group (c) section are the spec; every value there is decided), then AGENTS.md, then docs/prompts/premium-editorial.md section 0. Finding F9 of fable-plan-site-quality-2026-09-13.md: these pages still use emoji icon fonts, rounded chips and boxed white panels inside the editorial chrome.

Files to touch: src/components/MarketingUI.tsx (add the tone prop on PageHero; icon props accept Glyph names; no other API change), src/components/Glyph.tsx (add names if missing; it exists on this branch), the nine page files above and the components only they render (src/components/ValuationTool.tsx, src/components/ProjectCard.tsx, src/components/RentalAbout.tsx and RentalContact.tsx are NOT in scope: they belong to the rental doors), app/globals.css (edit in place only the .mk-* rules, .page-hero*, .feature-grid*, .step-list*, .stat-row*, .cta-band*, .prose* rules and append a block /* == C3-c == */ for anything new), src/i18n/es.ts and src/i18n/en.ts only to strip emoji prefixes from existing strings used by these pages (no new keys), docs/log/c3c.md.

Do not touch: the home, .ph-* rules, .site-header*, .hub-hero*, the detail page, ContactForm.tsx (group a restyled it; group c only reuses it), SearchBar, CategoryFilterBar, the rental doors' pages under app/services, app/servicios, app/about, app/contact, src/db/**, drizzle/**, verticals.ts, middleware.ts, next.config.ts, auth, /admin/**, /agencia/**, /mis-avisos/**. Do NOT run git add, git commit or git push (the sandbox cannot write .git; the director commits). npm run build fails in this sandbox with EPERM readlink on the user profile folder; that is the sandbox, do not work around it.

Work through Group (c) items 1 to 6 of the spec in order. Copy is not changed; only markup around the same content, class names, glyphs and CSS.

Definition of done:
- PageHero supports tone=dark and /nosotros and /contacto pass it; Section titles carry the hairline treatment; FeatureGrid, StepList and StatRow items render glyphs, hairlines and no card boxes; CtaBand is deep green with a gold button; mk-card, mk-dev and mk-project-grid items are cream with hairline borders, radius 0, glyph fallbacks instead of label initials.
- A Unicode-aware emoji search (regex \p{Extended_Pictographic} with the u flag, via node) over the files above returns nothing.
- The rental doors' pages are byte-identical (git diff shows no change under app/services, app/servicios, app/about, app/contact, RentalAbout.tsx, RentalContact.tsx, RentalServicePage.tsx, RentalServicesHub.tsx).
- npm run typecheck and npm run verify:i18n pass.
- No file outside the list changed (git status --short).
- docs/log/c3c.md: what landed, what was not verified (you have no browser), deviations.

Commands to run before reporting (working directory C:\Users\anton\propia.node): npm run typecheck ; npm run verify:i18n ; git status --short

Run every command listed and report FAIL with the real output rather than skipping or substituting a different check. Do not push.

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
