# Phase D1 — inmobiliarios.com.py: the directory door (routing, shell, seller form, directory pages). OPUS session. Lane 1. GATED: run only after Anton answers plan questions 1, 2, 3 and 6.

Read ONLY: this file, `fable-plan-realtor-terreno-rental.md` Stage 1 D, §1,
§2, §4, §5.2; `CLAUDE.md` (domains, i18n, caching, filters sections);
`docs/inmobiliarios-com-py-competitive-analysis.md` §6–7 (concept only —
reuse nothing of theirs); `src/config/verticals.ts`; `src/design/sections.ts`;
`src/lib/alternates.ts`; `src/lib/origin.ts`; `src/lib/sitemap.ts`;
`app/page.tsx`; `app/vender/page.tsx` + `VenderForm.tsx` (the form/lead
pattern to copy); `app/agentes`, `app/agente/[slug]`, `app/inmobiliarias`,
`app/inmobiliaria/[slug]`; `app/api/leads/route.ts`; `scripts/verify-seo.ts`.

Owns: the paths in the plan's phase table row for D1, plus
`src/lib/directory-queries.ts` (derived zones), `docs/log/d1.md`.

Hard limits: **no `schema.ts`, no migration, no new `lead_type` / `routed_to`
member, no `leads.source` column** — seller leads are `seller` +
`utm.source: "directory:home"` / `"directory:profile"`; a wish for a column
goes to plan §10 (D3). No reviews/ratings, no payments, no automatic
matching. No padded agent cards (§1.7). No login/publish/newsletter in this
chrome. Load skills `propia-dev`, `nextjs-national-lead-gen` (conversion
patterns for the home only).

Budget: one session, ≤ 90 min; if the directory renderings of the four
profile/list pages do not fit, open the PR with home + routing + form and
list the pages as D1b in the log — do not rush them. Branch
`claude/d1-directory-door`. WIP commit every 30 min.

Build per plan §5.2 (a)–(i), in that order — routing and `verify:seo` before
any UI, so a wrong ownership rule is caught before it has pages. Directory
door `enabled: true`; `ownsDirectory` stays on `inmobiliaria.com.py` until
the go-live PR (§1.6). Marketplace-only routes on this door redirect to
`https://inmobiliaria.com.py<path>` (absolute — a relative redirect would
loop on this host). `/api/leads`: optional `agentSlug`, validated with zod,
resolved to `routedTo: "agent"`; unknown slug → `internal`, never 400 (a lead
is never lost to a stale link). Zones derived from published listings'
cities — one cached query, vertical key in the cache key, a
`revalidateListings()` writer already covers it (verify, do not assume).

Exit: `verify:local` green; `curl -H "Host: inmobiliarios.com.py"` renders the
directory shell on `/`, `/agentes`, `/agente/<slug>`, `/inmobiliarias`,
`/para-inmobiliarios`; `/venta/asuncion`, `/propiedad/<slug>`, `/publicar`
301 to inmobiliaria.com.py; sitemap on that host lists no marketplace paths;
`verify:seo` "families" block still green with the new directory checks; a
seller lead row inserts with the marker (localhost DB, else a PR note);
**PR open, not merged** — founder merges (new served door + ownership flag).

## After this phase
`docs/log/d1.md`, plan §9 line, `CLAUDE.md` row. Stop with the report.
Next (after Anton merges): `sonnet-d2-directory-copy.md`, model Sonnet.
