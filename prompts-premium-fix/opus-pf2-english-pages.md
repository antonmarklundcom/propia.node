# PF2 — the English door is English on every public page (Opus). Finding F8
# of `fable-plan-premium-fix.md`. Read that file first, then AGENTS.md, then
# CLAUDE.md "i18n" and "Brand name" in full.

Today `realestateinparaguay.com` renders Spanish for: the home's tab `<title>`
default ("Encontrá tu propiedad en Paraguay") and default `<meta description>`
and `og:locale` from `app/layout.tsx`; and the whole body + metadata of
`/nosotros`, `/contacto`, `/agentes`, `/inmobiliarias`, `/precios`,
`/precios/[ciudad]`, `/proyectos`, `/proyecto/[slug]`, `/tasacion`, `/vender`,
`/login`, `/registro`, `/guias` (check which of these still import an `es*`
namespace directly — `grep -rln 'from "@/i18n/es"' app src/components`).

You own ONLY: `app/layout.tsx` (`generateMetadata` and nothing else), the
public page files above and the components they alone render, any namespace of
`src/i18n/es.ts` / `en.ts` EXCEPT `premium`, `src/i18n/index.ts` if a new
namespace is wired, and `docs/log/pf2.md`. Another agent owns `globals.css`,
`PremiumHome.tsx`, `SiteFooter.tsx` and the `premium` namespace right now —
do not touch them. Staff surfaces (`/admin/**`, `/agencia/**`, `/mis-avisos/**`,
`esPanel`) stay Spanish-only by decision (quality plan §1.9) — leave them.

Method, per page:
- Read copy through `dict()` from `@/i18n/server` (request-scoped) — never
  `getDictionary("es")` and never a direct `esX` import in a server page.
  Client components take `locale` as a prop and use `getDictionary(locale)`.
- Move each page's Spanish literals (including those already in an `esX`
  namespace that is not in the `Dictionary` type yet) into the dictionary and
  write the `en.ts` peer in the same commit. English translates intent for
  foreign buyers and NEVER invents a fact the Spanish does not state (no
  hours, prices, counts, phone numbers that the Spanish lacks).
- `generateMetadata` on each page uses `dict()` too. In `app/layout.tsx` the
  default title tagline, description and `openGraph.locale` (`es_PY` / `en_US`)
  come from the locale, not a constant. Keep the `title.template` rule
  (brand suffix set once).
- Numbers stay locale-formatted via the existing number-locale helper, not
  the dictionary.
- Do not change any URL. `/nosotros`, `/contacto` etc. keep their Spanish
  slugs on the English door (the rental doors' `/about` are a different family;
  see CLAUDE.md "A rental URL is spelled in exactly one place").

Verify: `npm run verify:i18n` after every page, `npm run verify:local` at the
end; then start the app on port 3002 against the seeded DB
(`DATABASE_URL="mysql://propia:propia@127.0.0.1:3306/propia" NEXT_PUBLIC_CANONICAL_HOST=inmobiliaria.com.py node node_modules/next/dist/bin/next start -p 3002`)
and fetch every page above with `-H "Host: realestateinparaguay.com"` and
with `-H "Host: inmobiliaria.com.py"`: the English responses must contain no
Spanish `<title>`, `<meta name="description">`, `<h1>` or `<h2>`; the Spanish
ones must be byte-identical in copy to before your change (diff the h1/h2
text). Check `verify:seo` still passes (hreflang/canonical untouched).

One commit per page (`PF2 — /<page> reads the dictionary`), one for the
layout metadata. Do not push. Write `docs/log/pf2.md`: pages done, pages
deliberately left (with the reason), anything not verified. Report the list.
