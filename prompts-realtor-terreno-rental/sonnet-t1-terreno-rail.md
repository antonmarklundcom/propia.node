# Phase T1 — terreno.com.py: agency/agent rails leak other property types. SONNET session. Lane 2, runs in parallel with R1. READY NOW.

Read ONLY: this file, `fable-plan-realtor-terreno-rental.md` Stage 1 A + §1, §4,
and the "Listing filters" section of `CLAUDE.md`. Execute under the autonomy
protocol (`fable/plan.md` §4). Build nothing outside this fix.

Owns: `src/lib/queries.ts` (`getAgencyListings`, `getAgentListings` only),
`app/propiedad/[slug]/page.tsx`, `app/inmobiliaria/[slug]/page.tsx`,
`app/agente/[slug]/page.tsx`, `docs/log/t1.md`.

Hard limits: no `schema.ts`, no `verticals.ts`, no `facet-sql.ts`, no cache
keys, no new query functions. Load skill `propia-dev`.

Budget: one session, ≤ 45 min. Branch `claude/t1-terreno-rail` off a fresh
`git fetch origin main && git reset --hard origin/main`.

The bug: both functions build their WHERE from `status` + `agencyId`/`agentId`
only and never call `verticalConds()`, so on terreno.com.py (`filters:
{ property_type: ["terreno"] }`) the "Más de esta inmobiliaria/este agente"
rail on `/propiedad/[slug]` and the grids on the two profile pages show a
mixed-inventory agency's houses and flats.

Fix:
- Add an optional `vertical?: VerticalConfig` param to both functions and
  spread `...(params.vertical ? verticalConds(params.vertical) : [])` into
  `conds`, exactly as `getRecentListings` (queries.ts ~line 395) does.
- Pass `vertical` from the three callers (`currentVertical()` is already
  awaited on the detail page; the profile pages may need to add it).
- Do NOT touch `countAgencyListings`/`countAgentListings` (indexability) —
  note it in the log as the §10 backlog item instead.
- These queries are not `unstable_cache`d, so no cache-key change; confirm
  and say so in the PR body.

Exit: `npm run verify:local` green; with a localhost DB seeded with one
agency owning a terreno and a casa, `curl -H "Host: terreno.com.py"` on the
terreno's `/propiedad` page shows no casa in the rail while `Host:
inmobiliaria.com.py` still does (no DB → describe the reasoning in the PR
body instead); PR merged green (bugfix — autonomous merge authorised).

## After this phase
Write `docs/log/t1.md` (≤ 12 lines). Add the line to plan §9. Spawn nothing.
