# D1b — directory bodies for /agente/[slug] and /inmobiliaria/[slug]

Phase D1b of `fable-plan-realtor-terreno-rental.md` (Stage 1 D). Branch
`claude/d1b-profile-bodies`. The work `docs/log/d1.md` deferred.

## Built

- Both profile pages now fork on `directoryPagesEnabled(vertical.key)`. The
  marketplace rendering is unchanged; it is the `else` half of one ternary.
- The directory body, same order on both: breadcrumb · header (photo or
  initials, verified tick, kind line, the real listing count, the agent's
  agency link) · a coverage line · the lead form · the portfolio rail.
- The form is **before** the rail: on this door it is the product.
- Coverage is derived from the listings the page already loaded — distinct
  city names in portfolio order, at most four — through `locationChain()`'s
  per-request location map. Nothing stored, no new query, no schema.
- `/api/leads` gained `agencySlug`, the exact mirror of `agentSlug`: zod slug,
  resolved against `agencies`, routed `"agency"` (an enum member that already
  exists), `agency_slug` + `agency_name` written into `utm` from the resolved
  row. An unknown slug is never a 400. If both slugs arrive the agent wins.
- `DirectoryLeadForm` gained the optional `agencySlug` prop; `source` stays
  `"directory:profile"` for both page types.
- New `directory` keys in `es.ts` + `en.ts`: `profileKindAgent`,
  `profileKindAgency`, `profileCoverage`, `profileFormTitle`,
  `profilePortfolioTitle`, `profileEmpty`, `profileTeamTitle`.
- One ~15-line `.agency-profile__team` rule in `globals.css`; everything else
  reuses `agent-profile__*` / `agency-profile__*` / `contact-panel` /
  `similar-listings`.

## Decisions

- **No raw WhatsApp or mailto on the directory branch.** The agency page's
  marketplace body links both; the directory body does neither, because a lead
  the operator never sees is one this door cannot follow up (D1 "Leads").
- **The agency profile gets its own lead lane** rather than a link back to the
  home form, so `/admin/leads` names the office the owner actually chose.
- **"Equipo" reuses `listAgentsForDirectory()`**, filtered by `agencySlug`,
  instead of a new `getAgentsByAgency` query (D1b decision 3): the same cached,
  `directory`-tagged read `/agentes` already runs. Consequence, deliberate: it
  lists only agents with published inventory — the directory index's own rule.
- No `schema.ts`, no new route, no cache-key change, no invented figure (no
  rating, no response time, no count but the real `listingCount`).

## Known issues

- The team list is a whole-directory read filtered in JS. Fine at this size;
  a real `getAgentsByAgency` belongs with D3's matching work.
- The marketplace branch of `/agente/[slug]` still reads `esAgentProfile`
  directly, so the English marketplace door shows Spanish there. Pre-existing,
  out of D1b's scope.
- The agency page's `generateMetadata` is still Spanish inline literals
  (pre-existing); only the body was in scope.
- `/inmobiliaria/[slug]` has no agency-side "verified" copy of its own; the
  tick reuses `directory.listVerified`.

## Verification

`npx tsc --noEmit`, `npm run build`, `verify:import`, `verify:facets`,
`verify:i18n`, `verify:seo` all green. **Not verified live: this environment
has no MySQL**, so both pages 500 with `ECONNREFUSED` on every door (D1 hit the
same). Two manual checks after merge: submit the form on one agent profile and
one agency profile with `Host: inmobiliarios.com.py`, and confirm a `seller`
row in `/admin/leads` with `utm.source = "directory:profile"` and the right
`agent_name` / `agency_name`.
