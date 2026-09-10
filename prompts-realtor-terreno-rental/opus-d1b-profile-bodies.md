# Phase D1b — inmobiliarios.com.py: the two profile page bodies. OPUS session. Lane 1. After D1 + D2 are merged (they are).

Written 2026-09-10 by the review session that closed PR #119 (superseded by
D1/D2). This is the work `docs/log/d1.md` deferred under "Deferred to D1b".

Read ONLY: this file; `docs/log/d1.md` (the "Leads" and "Deferred to D1b"
sections); `fable-plan-realtor-terreno-rental.md` Stage 1 D and §1;
`app/agente/[slug]/page.tsx`; `app/inmobiliaria/[slug]/page.tsx`;
`src/components/home/DirectoryHome.tsx` (the exemplar for directory markup and
class vocabulary); `src/components/DirectoryLeadForm.tsx`;
`app/api/leads/route.ts` (the `agentSlug` block — the shape to mirror);
the `directory` namespace in `src/i18n/es.ts` and `en.ts`; the i18n and
caching sections of `CLAUDE.md`. Do not read the other logs or the rest of the
plan.

## What exists today (so you do not re-derive it)

- The directory door is served (`enabled: true`, DNS pending). Its home,
  `/agentes`, `/inmobiliarias` and `/para-inmobiliarios` already render a
  directory body. Its chrome, canonical, hreflang, robots and sitemap for the
  two profile page types already follow `ownsDirectory`. **The SEO half of
  D1b is done; only the page bodies are not.**
- `app/agente/[slug]/page.tsx` already forks once, at the contact block:
  `directoryPagesEnabled(vertical.key)` renders `DirectoryLeadForm` with
  `agentSlug` + `source="directory:profile"`. Its header (avatar, "Agente ·
  N propiedades", agency line, WhatsApp link) and its listing rail are still
  the marketplace rendering, and read `esAgentProfile` directly — Spanish
  only, so the English marketplace door shows Spanish here too (pre-existing;
  not yours to fix beyond the directory branch).
- `app/inmobiliaria/[slug]/page.tsx` has **no directory branch at all**: on
  the directory door it is the marketplace body, with the agency's raw
  WhatsApp/email links and inline Spanish literals.
- `/api/leads` accepts `agentSlug` (zod slug, resolved to a real row, routed
  `agent`, name+slug stamped into `utm`, unknown slug → `internal`, never a
  400). There is **no `agencySlug`**.

## Owns

`app/agente/[slug]/page.tsx` (directory branch only), `app/inmobiliaria/[slug]/page.tsx`
(add the directory branch), `src/components/DirectoryLeadForm.tsx`
(one optional prop), `app/api/leads/route.ts` (the `agencySlug` lane, mirror
of `agentSlug`), the `directory` namespace in `es.ts` + `en.ts` (new keys
only), `app/globals.css` (a small `dir-profile-*` block, only if an existing
class genuinely cannot express it), `docs/log/d1b.md`, one line in plan §9.

## Hard limits

No `schema.ts` (no migration, no `agent_id`/`agency_id`, no `leads.source`,
no new `routed_to` member — `"agency"` already exists). No `verticals.ts`,
`sections.ts`, `alternates.ts`, `origin.ts`, `sitemap.ts`, `crm.ts`, no cache
key changes, no new routes. The marketplace rendering of both pages must be
byte-for-byte unchanged in behaviour — every change sits behind
`directoryPagesEnabled(vertical.key)`. No invented figures (no ratings, no
response times, no counts other than the real `listingCount`). No licence
line. Vos-form Spanish; `en.ts` peer with identical keys and arity.

## Decisions already made — do not re-litigate

1. **The agency profile gets its own lead lane, not a link to the home form.**
   Add `agencySlug` to `/api/leads` as the exact mirror of `agentSlug`: zod
   slug, resolved against `agencies` (id, name, slug), routed `"agency"`,
   `agency_slug` + `agency_name` written into `utm` from the row, unknown
   slug falls through to the normal chain and is never a 400. If both slugs
   are sent, the agent wins (a person over a house). `DirectoryLeadForm`
   gains an optional `agencySlug` prop sent alongside `agentSlug`; the
   `source` stays `"directory:profile"` for both page types.
2. **Directory body = what a property owner needs to decide, nothing else.**
   For both page types, in this order: breadcrumb (keep) · header (photo or
   initials, name with the verified tick, "Inmobiliario independiente" /
   "Inmobiliaria" kind line, the real listing count, the agent's agency link
   where there is one) · a **coverage line** derived from the listings the
   page already loads (distinct city names, at most four, "Trabaja en
   Asunción, Luque y San Lorenzo") — nothing stored, nothing new queried ·
   the lead form section (`DirectoryLeadForm`, title "Contactá a
   <name>", subtitle = the door's `heroSubtitle`) **placed before the listing
   rail, not after** — the form is the product on this door · the listing
   rail as "Cartera publicada" using `ListingCard` as today, capped at the
   existing 24. No raw WhatsApp or mailto links on the directory branch: a
   directory lead goes through the form so the operator sees it (D1 "Leads").
3. **Agent list rows on the agency page**: if `getAgentsByAgency`-style
   query already exists in `src/lib/directory-queries.ts` or `queries.ts`,
   render "Equipo" as a compact list linking to `/agente/<slug>`; if it does
   not exist, **do not write one** — leave it out and note it in the log.
4. **Class vocabulary**: reuse `agent-profile__*` / `agency-profile__*` for
   the header, `contact-panel` for the form section, `similar-listings` for
   the rail, `ds-*`/`home-*` for anything section-level, exactly as
   `DirectoryHome` and the marketplace bodies do. A new `dir-profile-*` rule
   only when nothing existing expresses it; keep it under ~40 lines.
5. **Copy goes into `directory` in `es.ts`/`en.ts`**, new keys only:
   `profileKindAgent`, `profileKindAgency`, `profileCoverage(cities: string[])`,
   `profileFormTitle(name: string)`, `profilePortfolioTitle`,
   `profileEmpty`, `profileTeamTitle`. `generateMetadata` on the directory
   branch uses `profileFormTitle`-style copy only if it is already
   brand-parameterised; otherwise leave metadata as is.

## Exit (self-verified, in this order)

1. `npx tsc --noEmit` clean.
2. `npm run verify:i18n`, `verify:facets`, `verify:import`, `verify:seo`
   green. `npm run build` clean (no database needed for the build).
3. With `npm run dev` and no MySQL, the pages 500 with `ECONNREFUSED` on every
   door (known; D1 recorded the same). Verify instead by reading: the
   marketplace branch of both files is unchanged apart from being wrapped;
   the directory branch has no `href="https://wa.me"` and no `mailto:`;
   `agencySlug` resolution is a single indexed lookup and cannot throw a 400.
4. Branch `claude/d1b-profile-bodies`, one PR against `main`, title
   "D1b — inmobiliarios.com.py: directory bodies for /agente and /inmobiliaria".
   PR body: what changed per file, the `agencySlug` lane, and the "not
   verified live: no MySQL here" line with the two manual checks to run after
   merge (submit the form on one agent profile and one agency profile with
   `Host: inmobiliarios.com.py`; confirm a `seller` row with
   `utm.source = "directory:profile"` and the right `agent_name` /
   `agency_name` in `/admin/leads`).
5. **Do not merge.** This touches `/api/leads`; Anton merges.
6. `docs/log/d1b.md` (≤ 12 lines Built, ≤ 8 Decisions, ≤ 8 Known issues,
   one Verification line) and the §9 line in the plan, in the same PR.

## After this phase

Nothing to spawn. Remaining items are founder-only (DNS for
`inmobiliarios.com.py`, then the one-line go-live PR flipping `ownsDirectory`;
DNS + `NEXT_PUBLIC_CONTACT_WHATSAPP` for the rental doors;
`NEXT_PUBLIC_CANONICAL_HOST` on hPanel; `cron:translate` against the live
database) or parked on a decision (D3, schema).
