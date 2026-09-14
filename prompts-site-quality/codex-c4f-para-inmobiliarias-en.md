Task: The English door realestateinparaguay.com renders app/para-inmobiliarias/page.tsx entirely in Spanish because every string in that file is hardcoded (TITLE, DESCRIPTION, BENEFITS, steps, stats labels, FAQ, section titles, CTA labels, LeadForm reasons and labels). Move all of that copy into the dictionary exactly the way C2 did for /nosotros, /contacto and /tasacion (see docs/log/c2.md and how app/nosotros/page.tsx reads dict() from @/i18n/server and passes locale to client components): add a paraInmobiliarias namespace to src/i18n/es.ts with the current Spanish strings byte-identical, and to src/i18n/en.ts with a natural English translation written for foreign-facing real estate agencies and agents (title: For agencies and agents). Functions of brand where the Spanish uses the brand name. The page reads dict() and currentLocale(), passes locale to LeadForm, and keeps the same components, JsonLd (FAQ and breadcrumb built from the dictionary strings), glyph icon names, hrefs and layout. The EN metadata title and description come from the dictionary too. If src/i18n has a typed Dictionary shape or a verify:i18n key-parity check, satisfy it.

Files to touch: app/para-inmobiliarias/page.tsx, src/i18n/es.ts, src/i18n/en.ts, src/i18n/index.ts only if the dictionary type needs the new namespace, docs/log/c4f.md (new, short).

Do not touch: anything else. No git commands. No npm run build. Do not print or write environment variables or secrets.

Definition of done:
- app/para-inmobiliarias/page.tsx contains no Spanish string literals longer than one word (glyph names, hrefs, class names and keys are fine).
- Spanish output is unchanged: every Spanish string in the dictionary is byte-identical to what the file had.
- npm run typecheck passes.
- docs/log/c4f.md written.

Commands to run before reporting (working directory C:\Users\anton\propia.node), run every one and report FAIL rather than skip:
- npm run typecheck
- npm run verify:i18n (may die with an ENOMEM error in this sandbox; if so, report that exact text as FAIL and continue)

Report format:
  Files changed: each path with a one-line summary
  Commands run: each command with PASS or FAIL and a one-line result
  Flagged or not done: anything skipped, blocked, or ambiguous, or None
