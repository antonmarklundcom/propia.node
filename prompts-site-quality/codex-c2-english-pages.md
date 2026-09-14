Task: The English marketplace door realestateinparaguay.com renders Spanish on every public page except the home body and the listing pages. Measured live on 2026-09-13: the home tab title is Encontra tu propiedad en Paraguay; /nosotros, /contacto, /precios, /precios/[ciudad], /proyectos, /proyecto/[slug], /agentes, /inmobiliarias, /tasacion, /guias, /publicar (which renders the login page Ingresa a tu panel), /login, /registro have Spanish title, meta description, h1 and h2 on the English host. This is finding F8 of fable-plan-site-quality-2026-09-13.md. Read that file (section 1 row F8, section 6), then AGENTS.md, then CLAUDE.md sections i18n and Brand name in full, before starting. Find the full list of offenders with: grep -rln from @/i18n/es in app and src/components (pages that import an es namespace directly instead of reading the request-scoped dictionary).

Files to touch: app/layout.tsx (generateMetadata only: default title tagline, description and openGraph.locale es_PY or en_US must come from the request locale, keep the title.template rule), the public page files listed above and the components only they render, any namespace of src/i18n/es.ts and src/i18n/en.ts EXCEPT premium, src/i18n/index.ts if a new namespace is wired, docs/log/c2.md.

Do not touch: app/globals.css, src/components/home/PremiumHome.tsx, src/components/SiteFooter.tsx, the premium namespace, /admin/**, /agencia/**, /mis-avisos/** and the esPanel namespace (staff copy stays Spanish by decision), src/db/**, drizzle/**, src/config/verticals.ts, middleware.ts, next.config.ts, any URL or slug (the /nosotros, /contacto slugs stay Spanish on the English door by design; the rental doors' /about family is a different thing and is not in scope).

Method, per page:
- Server pages read copy through dict() from @/i18n/server. Never getDictionary with a hard-coded es and never a direct es namespace import in a server page. Client components take locale as a prop and call getDictionary(locale).
- Move each page's Spanish literals (including those already sitting in an es namespace that is not in the Dictionary type yet) into the dictionary and write the en.ts peer in the same commit. English translates intent for foreign buyers and NEVER invents a fact the Spanish does not state: no hours, prices, counts or phone numbers the Spanish lacks.
- generateMetadata on each page uses dict() too.
- Numbers stay locale-formatted via the existing number-locale helper, not via the dictionary.
- The Spanish output of every page must be byte-identical in copy to before your change. Take a note of each page's title, h1 and h2 text before you start and compare at the end.

Definition of done:
- grep -rln from @/i18n/es app src/components returns no public page or component (staff surfaces listed under Do not touch may still match).
- On the English host, none of the pages listed above has a Spanish title, meta description, h1 or h2. You cannot run a browser; verify by starting the built app (see commands) and fetching each page with curl -s -H Host: realestateinparaguay.com http://localhost:3002/<path> and grepping the title, description, h1 and h2 tags; paste the extracted values into docs/log/c2.md for both hosts.
- Spanish host output unchanged in copy for the same pages (same curl with Host: inmobiliaria.com.py).
- Every new es.ts key has its en.ts peer in the same commit; npm run verify:i18n is green after every page.
- npm run verify:local passes at the end. npm run verify:seo still passes (hreflang and canonicals untouched).
- Do NOT run git add, git commit or git push: the sandbox cannot write .git; the director commits after auditing.
- docs/log/c2.md: pages done, pages deliberately left with the reason, everything not verified.

Commands to run before reporting (working directory C:\Users\anton\propia.node): npm run verify:i18n ; npm run verify:local ; git status --short. For the curl checks, start the app with the DATABASE_URL already present in the repo's .env (do not print it, do not copy it anywhere): npm run build then npx next start -p 3002, run the curls, then stop the server.

Run every command listed and report FAIL with the real output rather than skipping or substituting a different check. Do not push.

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
