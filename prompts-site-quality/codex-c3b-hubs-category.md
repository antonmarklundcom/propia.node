Task: Editorial restyle of the hub pages (/venta, /alquiler) and the category pages (/[operacion]/[...segments]) on the two marketplace doors, group (b) of docs/prompts/premium-editorial-inner.md. Read that file in full first (its Shared rule on glyphs and its Group (b) section are the spec; every value there is decided), then AGENTS.md, then docs/prompts/premium-editorial.md section 0. Finding F18 of fable-plan-site-quality-2026-09-13.md: the category page's search panel and filter bar are white boxes with rounded inputs and a black Filtrar button inside the editorial chrome; it reads as two products.

Files to touch: src/components/SearchBar.tsx and src/components/CategoryFilterBar.tsx (class names and glyphs only; no behaviour change), app/[operacion]/page.tsx and app/[operacion]/[...segments]/page.tsx (class names, glyphs and heading markup only), src/components/Glyph.tsx (add names if missing; it exists on this branch), app/globals.css (edit in place only the .search-bar*, .filter-bar*, .view-switch*, .pagination*, .panel-btn*, .filter-empty* rules and the category/hub heading rules; append a block /* == C3-b == */ for anything new). Do NOT edit .ph-hero__search .search-bar (the home's overlapping panel stays as built), .hub-hero*, .ph-*, .site-header*.

Do not touch: the detail page, ContactForm, MarketingUI.tsx, mk-* rules, src/db/**, drizzle/**, verticals.ts, middleware.ts, next.config.ts, auth, /admin/**, /agencia/**, /mis-avisos/**, any i18n file unless a string carries an emoji prefix that must go (then strip it in both es.ts and en.ts). Do NOT run git add, git commit or git push (the sandbox cannot write .git; the director commits). npm run build fails in this sandbox with EPERM readlink on the user profile folder; that is the sandbox, do not work around it.

Work through Group (b) items 1 to 4 of the spec in order.

Definition of done:
- The search bar and filter bar on hub and category pages have no box background, no shadow, no border radius; hairline rules as specified; gold primary search submit, outlined filter submit.
- .view-switch is two outlined buttons sharing one border, active deep green with cream text.
- Category h1 is Cormorant 36 with the count line under it; the grid uses the .ph-grid-4 rhythm; pagination links outlined, radius 0.
- A Unicode-aware emoji search (regex \p{Extended_Pictographic} with the u flag, via node) over the files above returns nothing.
- Filtering, sorting, list/map switching and pagination behave exactly as before (no JS logic change; compare the component diffs to confirm only class names and markup around the same elements changed).
- npm run typecheck and npm run verify:i18n pass.
- No file outside the list changed (git status --short).
- docs/log/c3b.md: what landed, what was not verified (you have no browser), deviations.

Commands to run before reporting (working directory C:\Users\anton\propia.node): npm run typecheck ; npm run verify:i18n ; git status --short

Run every command listed and report FAIL with the real output rather than skipping or substituting a different check. Do not push.

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
