# docs/decisions-needed.md — founder decisions, not build work

Append-only. A phase that hits a call only the founder can make writes one
entry here and stops rather than guessing.

## Reviews on agent profiles

CLAUDE.md backlog item 4: no review/rating system exists today. Building one
needs a schema (a `reviews` table, moderation state), an anti-fake-review
design (who can leave one, what stops a self-review or a competitor's), and a
legal read on publishing a named person's review of another named person.
None of that is a code decision.

Options:

- (a) Not now — leave `/agente/[slug]` and `/inmobiliaria/[slug]` without
  reviews.
- (b) Verified-lead-only reviews — only someone who submitted a lead to that
  agent/agency (traceable in `leads`) can leave one, reducing fake-review
  surface but still needing moderation and a schema.
- (c) Operator-curated testimonials — the founder (or an admin) pastes in a
  short quote per agent/agency by hand, no visitor-submitted content, no
  moderation queue, no anti-fake design needed.

**Recommendation: (c).** It is the cheapest honest start — no new abuse
surface, no legal exposure from publishing a stranger's opinion of another
named person, and it can ship without touching `schema.ts`. (b) is the
natural next step once there is enough lead volume per agent to make it real,
and can reuse (c)'s rendering.

**Decided 2026-09-11 (Fable, `fable-plan-quality.md` "Decided NOT to do"):
(c), and parked** — there are no testimonials to curate yet, so no slot is
built. Revisit when the first agency asks.

## Deprioritized 2026-09-15 (founder) — not urgent, revisit later

Anton confirmed these are not current-business priorities. Leave as-is; no
code work against them until he asks again.

- **Per-project financing opt-in** (CLAUDE.md backlog #7). Che Róga Porã stays
  `active: false` sitewide.
- **Reviews/ratings system** (see above). Stays parked at option (c)/nothing
  built.
- **`afd_primera_vivienda` rate research** (CLAUDE.md backlog #6, currently a
  9.00% placeholder in `scripts/seed-financing.ts`). Not a code task and not
  urgent — do not touch the seeded rate without a researched figure.

Current priority instead: get `npm run cron:translate` run against
production (English listing text is still Spanish-fallback everywhere), and
make sure the self-service agency/agent registration + listing-upload +
admin-approval path is solid, since the founder is about to onboard other
realtors' listings ahead of his own EAS/SERPLAID registration going through.

## Forgotten-password recovery — onboarding audit, 2026-09-15

**Stop and ask; not implemented.** There is no self-service forgotten-password
flow in `app/login` or `src/lib/auth`. The signed-in password change in
`app/agencia/perfil/actions.ts` requires the current password. The super-admin
can replace a user's password in `app/admin/usuarios/actions.ts`, but that is
not a public recovery flow or an agreed identity-check procedure.

**Founder decision:** What identity checks and recovery channel should a realtor
who has forgotten their password use, and should recovery be operator-assisted
or self-service with a configured delivery provider?

AGENTS.md §6 requires a decision before extending auth/account-data flows.
Password-reset infrastructure and public recovery promises are deliberately
deferred; this does not block the separately authorized onboarding panel and
photo-readiness copy.

Implementation choices for this audit unit: reuse the existing zero-listings
result (including drafts) without changing panel queries; dismiss the checklist
for the current page visit without storing account data; show R2 readiness copy
before upload using the existing server predicate, retaining all upload gates.
Messaging/OTP readiness indicators and translation-status UI are out of scope.

## 2026-09-22 — Facts for the English door (A6, needs the founder)

PR "A6: remove unsourced legal and cost claims" replaced every "(verify before
launch)" placeholder on realestateinparaguay.com (home dictionary, foreigner
box on `/propiedad`, and the three guides in `scripts/seed-guias-en.ts`) with
wording that states no rate, fee, timeline or legal category. To put real
figures back, the founder supplies, from a lawyer or escribano, in writing:

1. Whether foreign ownership has exceptions (rural, border zone) and the wording to use.
2. The escribanía cost band (transfer taxes, notary fees, registration) and who pays each.
3. Typical deposit, due-diligence, deed and registration timelines.
4. Who answers English enquiries (the listing agent, or the portal forwards them).
5. Residency: whether any category is linked to buying property.

**Separate, also the founder's:** the English footer says "`<brand>` is a service
of EAS", and the Spanish peer says "es un servicio de EAS". The entity is not
registered yet (about a month away), and "EAS" alone names a company type,
not a company. Decide the exact legal line to show until then (for example the
brand only) and after registration (the full registered name). Not changed in
code, because it is a statement of fact to visitors.

## 2026-09-22 — National type pages (`/venta/casas`), F-f, proposal only

**Today.** `/venta/casas` is a 404: `parseCategorySegments()` (`src/lib/urls.ts`)
reads one segment as a city slug, and no city is called `casas`. Since #178 the
national hub's type chips link to `/venta?tipo=casas`, which is correct and
works, but every `?tipo=` URL is `noindex` by design (`hasListingUserParams`,
pinned by `verify:facets`). So the highest-volume type searches ("casas en venta
Paraguay", "terrenos en venta") have no indexable page on any door; only
city-scoped pages (`/venta/asuncion/casas`) can rank.

**Proposal (recommended: option A).**

- **A. `/<operacion>/<tipo>` as a real category page.** In
  `parseCategorySegments()`, a single segment that `parseTypePlural()` accepts
  becomes `{ kind: "national-type", type }`, and everything else stays a city.
  No city slug collides with a type plural today (checked against the local
  `locations` table: casas, departamentos, terrenos, duplex, comerciales,
  oficinas, depositos, quintas all return no row). A seed guard in
  `seed:locations` would keep it that way. Canonical is itself, indexable under
  the same `getIndexability()` rule (`MIN_INDEXABLE = 3`), listed in the
  sitemap, hreflang derived by `languageAlternates()` like any category page,
  breadcrumb Inicio › Venta › Casas. The hub chips then link there instead of `?tipo=`.
- B. A distinct prefix (`/venta/tipo/casas`). No collision risk, but an uglier
  URL and a new shape to teach every helper.
- C. Make a lone `?tipo=` indexable. Breaks the "query strings are transient"
  rule that `verify:facets` and the sitemap rely on. Not recommended.

**What the founder decides (the rest is implementation):**

1. Option A, B or C.
2. What happens to `/venta?tipo=casas` (and the same on `/alquiler`) once the
   clean URL exists: a **308 to `/venta/casas`** (recommended: one URL per set)
   or keep it as a noindex filter view that canonicalises to `/venta/casas`.
3. Terreno doors (`terreno.com.py`, `landforsaleparaguay.com`) already filter
   every page to terrenos, so their `/venta/terrenos` would duplicate `/venta`.
   Proposal: on those doors a national-type URL for their own type 308s to the
   hub, and other types 404 as they do today.
4. The English door keeps the Spanish path segments (`/venta/casas`), as it
   does for every category page today. Localised English paths would be a
   separate, larger change (the `rentalPath()` pattern).

Size once decided: M (urls.ts, the segments page, sitemap, hub chips,
`verify:seo`/`verify:facets` cases, one e2e). Not built.
