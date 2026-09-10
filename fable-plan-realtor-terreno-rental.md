# fable-plan-realtor-terreno-rental.md — three doors, one review

Written 2026-09-09 (Fable planning session, code at `ff2e9d6`) from Anton's
three feedback lines on `inmobiliarios.com.py`, `terreno.com.py` and
`rentparaguay.com`. Planning only: nothing here has been built. Follows the
`phased-autonomous-build` method — Stage 1 (decisions) first, then a
plan.md-shaped Stage 2. `CLAUDE.md` beats this file on conventions;
`fable/plan.md` §1 (repo rules) and §4 (autonomy protocol) apply by reference.
**Fable executes no phase.** Phases name Opus or Sonnet only.

---

## Stage 1 — What blocks a build start, and what does not

### A. `terreno.com.py` — "only show terrenos / lotes / land"

**Status: already true, with one leak. NOT blocked. Ready now.**

`verticals.ts` declares `filters: { property_type: ["terreno"] }` and
`verticalConds()` (`src/lib/facet-sql.ts`) ANDs it into the category grid,
home rails, similar listings, the map query and the sitemap — verified by
reading each call site. The one place it is missing: `getAgencyListings()` and
`getAgentListings()` in `src/lib/queries.ts` (lines 408–425, 474–491) filter
on `status` + `agencyId`/`agentId` only. They feed the "Más de esta
inmobiliaria / este agente" rail on `/propiedad/[slug]` and the listing grids
on `/inmobiliaria/[slug]` and `/agente/[slug]`. On terreno.com.py a visitor
viewing a lot from a mixed-inventory agency sees that agency's houses in the
rail. Fix: an optional `vertical` param on both, passed from the three
callers. One Sonnet task, ~30 min, no decision needed.

### B. `rentparaguay.com` Services submenu

**NOT blocked. Ready now.**

`SiteHeader.tsx` already renders pure-CSS hover/focus dropdowns for any nav
group with `links` (the marketplace uses them); the rental nav just maps every
`d.rental.chromeNav` entry to `links: []`. The seven services live in
`src/config/rental-services.ts` with their labels in
`rental.services[dictKey]`. Building the submenu = build the "Servicios" group's
`links` from that list (label from the dictionary, href
`/servicios/<slug>`) and let `MobileMenu` (already renders child lists) do the
rest. One Sonnet task.

### C. `rentparaguay.com` — "all URLs are Spanish" + "es. subdomain / /es/ path / buy alquiler.com.py"

This is two asks. Split them, because one is already answered and the other
is a real fork.

**C1. Which host serves Spanish?** — **decision needed, but the answer is
mostly already built.** Anton's "or I can buy alquiler.com.py" is exactly what
the code does today: `alquiler.com.py` (es) and `rentparaguay.com` (en) are one
business via `family: "rental"`, both `enabled: true`, hreflang-paired,
`verify:seo` green (CLAUDE.md domain table, `fable/plan-rentparaguay.md`). It
is not live only because DNS for both domains has not been pointed at
Hostinger and `NEXT_PUBLIC_CONTACT_WHATSAPP` is unset — founder-only steps.

Three options, honestly compared:

| Option | What it costs | Verdict |
| --- | --- | --- |
| **A — `alquiler.com.py`** (as built) | Confirm/buy the domain, point DNS. **Zero code.** | **Recommended.** Exact-match `.com.py` for the Spanish search term; already wired and verified. |
| **A′ — `es.rentparaguay.com`** | No purchase. In this architecture a subdomain is just another `Host`, so it is a **one-line host-key rename** of the `alquiler.com.py` entry in `verticals.ts` (`resolveVertical()` looks up the bare host; keys stay unique; hreflang pairs by family+locale, unchanged). Plus a subdomain DNS record. | Fine fallback if the `.com.py` is unavailable or overpriced. Weaker SEO than A, but no new routing dimension. |
| **B — `rentparaguay.com/es/…` path prefix** | A **new routing dimension** the codebase does not have: middleware parses a path segment, every route/link/canonical/sitemap/hreflang call site learns about it, `verify:seo`'s "one Host = one locale" invariants and the whole `x-locale`-from-Host model get a second source of truth. Opus, multiple phases, touches every public route. | **Not recommended.** Only worth it if Anton specifically needs Spanish reachable on the `.com` for an ads/SEO reason he can name. |

Recommendation: **A** (or A′ if the domain is not obtainable). Do not build B.

**C2. English URLs on the English door** — **decision needed, real but
contained.** Today the rental business's own pages use Spanish paths on both
doors: `/servicios/administracion-airbnb`, `/nosotros`, `/contacto`
(`rental-services.ts`: "Spanish on both doors, plan §1 item 8" — a deliberate
earlier call Anton is now reversing). Making them English on
`rentparaguay.com` means: `RentalService` gains `slugEn`; a per-locale path
map (`/services/airbnb-management`, `/about`, `/contact`) that
`languageAlternates()` uses — today it assumes the *same* path on every door
("the map is deliberately identical on both hosts"), so `src/lib/alternates.ts`
needs a small path-translation layer; the sitemap's `RENTAL_SITEMAP_PATHS`
becomes per-locale; the Spanish paths 301 to English on the EN door; S1's
redirect map from the old WordPress site (whose `oldPath`s are already
English) can point straight at the English slugs. Opus, one phase, medium
risk because it touches `alternates.ts`/`origin.ts`/sitemap and `verify:seo`.
**Limit to state plainly:** `/propiedad/<slug>` stays as is on every door — it
is the marketplace's page type and `realestateinparaguay.com` also serves it
under `/propiedad`; changing it is out of scope of the rental doors.
Recommendation: **yes, do it (phase R2)**, independent of C1.

### D. `inmobiliarios.com.py` — realtor lead-gen, not a marketplace copy

**BLOCKED on two things: domain ownership and the product shape.**

*Domain:* the repo contradicts itself. `CLAUDE.md`'s table says "Not owned";
`docs/prompts/inmobiliarios-directory.md` (later, in the same repo) says "We
now own inmobiliarios.com.py (parked, pointed at our hosting)" and calls that
row stale. The competitive analysis (`docs/inmobiliarios-com-py-competitive-analysis.md`)
scanned a *previous* site on that domain. One line from Anton settles it. If
it is not owned, D becomes a concept plan on the `alquiler.com.py` precedent
(code can land `enabled: true` and be previewed by `Host` header; nothing
reaches a visitor until DNS).

*Code reality:* the vertical entry exists (`key: "agents"`, `family:
"directory"`, `mode: "directory"`, `enabled: false`) but **nothing branches on
`mode`** — `homeSections/heroVariant/cardVariant/chromeVariant` all key on
`inmobiliaria`/`en`/rental family and fall through to the Spanish marketplace
defaults. If DNS were pointed today the door would render inmobiliaria.com.py
with a different brand string. `/agentes`, `/agente/[slug]`, `/inmobiliarias`,
`/inmobiliaria/[slug]` exist as marketplace pages (indexable on every
marketplace host). The `agents` table holds only name, slug, photo, whatsapp,
`isVerified`, agencyId — **no bio, no zones, no licence, no rating**; there is
no reviews table (CLAUDE.md backlog 4 — the "review queue" is listing
moderation). Leads: `lead_type` already has `seller`, `valuation`,
`agent_signup`; `routed_to` is single-destination and a listing-less lead is
`internal` (founder forwards by hand from `/admin/leads`, which already has a
WhatsApp-forward button).

**Proposed concrete shape — "Encontrá tu inmobiliario" (hittamäklare model),
v1 with zero schema change:**

1. **Home = seller-first landing.** Hero: one short form (ciudad/barrio,
   tipo, venta/alquiler, nombre, WhatsApp) → "Recibí propuestas de hasta 3
   inmobiliarios de tu zona, gratis y sin compromiso". Below: the 3-step
   explainer (Contanos → Compará → Elegí), "cómo elegimos" (verified,
   licence-pending note, real activity), a directory teaser of **real**
   verified agents only (never padded cards — the competitor's exact mistake),
   a "¿Sos inmobiliario?" band → `/para-inmobiliarios`, FAQ. No listing grid,
   no search bar, no `/publicar` CTA, no login in the chrome.
2. **Seller lead = existing pipeline.** `leadType: "seller"`, `utm.source:
   "directory:home"` (the `/vender` marker pattern), lands `internal` in
   `/admin/leads`. **v1 matching is manual**: the operator picks up to three
   agents and forwards with the existing button. This is the honest MVP —
   there is no agent supply to auto-match against yet — and it is what lets
   D1 ship without a migration.
3. **Directory pages re-skinned for this door**: `/agentes` + `/inmobiliarias`
   filterable by ciudad (zones **derived** from each agent's published
   listings' cities — existing data, no column), sorted verified-first;
   profiles lead with coverage, verification and "contactá a este
   inmobiliario" (a `seller` lead routed `agent` — `routedTo` already resolves
   `agent` when a listing has one; for a profile-originated lead D1 passes the
   agent explicitly, which is a small `/api/leads` extension, no schema).
   Listing count is a secondary line, not the headline.
4. **`/para-inmobiliarios`**: the realtor value prop (leads in your zone, a
   verified profile, free in v1) + the existing `agent_signup` `LeadForm`.
   Paid placement later reuses `agencies.plan` (`free/destacado/partner`
   already exists) — **no payments in this plan**.
5. **What the door does NOT serve**: category grids, `/propiedad`, `/publicar`,
   `/precios`, `/proyectos` redirect to `https://inmobiliaria.com.py<path>`
   (a `directoryPagesEnabled()`/gate mirroring `rentalPagesEnabled()`).
   `ownsListingDetail: false` stays (`verify:seo` requires it for `mode`
   doors).
6. **Profile ownership (Opus decision, needs a yes):** today every marketplace
   host self-canonicalises `/agente/*` and `/inmobiliaria/*` — two Spanish
   hosts already duplicate them. Proposal: a new `ownsDirectory: boolean` on
   `VerticalConfig` (the `ownsListingDetail` pattern). At go-live the directory
   door owns profiles and lists them in its sitemap; marketplace doors keep
   rendering them but canonicalise there and drop them from their sitemaps.
   `verify:seo` gets "exactly one served door owns directory pages per
   locale". Until DNS is live the flag stays on `inmobiliaria.com.py` — a
   canonical pointing at a dead host is worse than a duplicate.

**Phase D3 (parked, schema, flag-before-merge):** real matching — `agents`
gains `bio`, `license_no`, `years_active`, `zones` (json); a `lead_matches`
table (lead × agent × status) and an `/admin/leads` "match 3" UI; later a
seller-facing compare page. This is the prior brief's step 3 ("propose in
PLAN.md first") and CLAUDE.md's "flag before merging … DB schema". Not
started until Anton says go after D1/D2 are live and there are agents to
match.

---

## Stage 2 — Plan

### Phase table

| Phase | Lane | Model | Prompt file | Owns | Depends on | Merge rule |
| --- | --- | --- | --- | --- | --- | --- |
| **T1** terreno rail leak | 2 | Sonnet | `prompts-realtor-terreno-rental/sonnet-t1-terreno-rail.md` | `src/lib/queries.ts` (two functions), `app/propiedad/[slug]/page.tsx`, `app/inmobiliaria/[slug]/page.tsx`, `app/agente/[slug]/page.tsx` | — | merge when green (bugfix) |
| **R1** rental Services dropdown | 2 | Sonnet | `prompts-realtor-terreno-rental/sonnet-r1-services-menu.md` | `src/components/SiteHeader.tsx` (rental branch), `src/i18n/es.ts`+`en.ts` (`rental.chromeNav` only), globals.css append block | — | merge when green (UI) |
| **R2** English URLs on rentparaguay.com | 1 | Opus | `prompts-realtor-terreno-rental/opus-r2-english-paths.md` | `src/config/rental-services.ts`, `src/lib/alternates.ts`, `src/lib/sitemap.ts`, `next.config.ts` redirects, `app/servicios/**`, `app/nosotros`, `app/contacto`, `sections.ts` (path helper), `scripts/verify-seo.ts`, docs | R1 | **open, do not merge** — canonical/hreflang/sitemap contract (O1 precedent) |
| **D1** directory door: routing, shell, seller form | 1 | Opus | `prompts-realtor-terreno-rental/opus-d1-directory-door.md` | `verticals.ts` (agents entry + `ownsDirectory`), `sections.ts`, `alternates.ts`, `origin.ts`, `sitemap.ts`, `SiteHeader/Footer` directory branch, `app/page.tsx` directory branch + `components/home/DirectoryHome.tsx`, `components/DirectoryLeadForm.tsx`, `/agentes`, `/inmobiliarias`, profile pages (directory rendering), `/api/leads` (explicit agent), `verify-seo.ts`, i18n `directory` namespace **skeleton** | none (T1 first is nice, not required) | **open, do not merge** — new door goes `enabled: true` + ownership flag |
| **D2** directory copy, `/para-inmobiliarios`, FAQ, docs | 2 | Sonnet | `prompts-realtor-terreno-rental/sonnet-d2-directory-copy.md` | `directory` namespace in `es.ts`/`en.ts`, `app/para-inmobiliarios` (directory branch), FAQ JSON-LD, `CLAUDE.md`/`README.md` rows, KNOWN-ISSUES | D1 | merge when green (copy) |
| **D3** matching + agent profile fields | — | Opus | *not written* | `schema.ts`, drizzle migration, `/admin/leads`, `lead_matches` | D2 live + Anton's go | **parked** — schema; flag-before-merge; needs `db:status` before and after |
| **B** `/es/` path-prefix i18n | — | — | *not written* | everything | — | **parked / not recommended** (Stage 1 C1) |

Sequencing: T1 and R1 can start today, in parallel, in two Sonnet windows.
R2 after R1 merges (both edit the rental nav). D1 in its own Opus window,
independent of R-phases. D2 after D1 is merged by Anton. No phase touches
`schema.ts`; D3 is the only one that would, and it does not exist yet.

Estimated cost: T1 $2–3 · R1 $4–6 · R2 $15–20 · D1 $30–40 · D2 $10–15.
Wall-clock: T1+R1 < 1 h; R2 ~1.5 h; D1 ~2 h (one session, may need two — if
so, split profile rendering into D1b); D2 ~1 h.

### §1 Decisions already made — do not re-litigate

Repo rules: `fable/plan.md` §1 items 1–11 verbatim, plus:

1. Every door narrows listings only through `verticalConds()`; a query that
   feeds a per-door surface takes `vertical` and passes it through (T1 is the
   last known gap).
2. The rental family stays two hosts, one `family`, paired by hreflang. No
   `/es/` path prefix in this codebase. Whether the Spanish host is
   `alquiler.com.py` or `es.rentparaguay.com` is a one-line `verticals.ts`
   host-key change, not a design question.
3. Header dropdowns stay pure CSS (server component, `:hover/:focus-within`),
   and their content comes from the dictionary + `RENTAL_SERVICES`, never a
   hard-coded list.
4. `inmobiliarios.com.py` is a **lead-gen directory**, not a listings
   marketplace: no grids, no search, no `/publicar`, no login in its chrome.
   Seller leads use `leadType: "seller"` + `utm.source` (no `leads.source`
   column, no new enum member). v1 matching is manual through `/admin/leads`.
5. Zero schema change in T1/R1/R2/D1/D2. Anything that wants a column goes to
   D3's list in §10.
6. The directory door is `enabled: true` from D1 (the `alquiler.com.py`
   precedent: a disabled door cannot be previewed or verified). DNS is the
   go-live switch. `ownsDirectory` flips to the directory door **in the same
   PR as go-live**, never before DNS resolves.
7. Never show a padded/placeholder agent card. A directory teaser with fewer
   than N (D1 picks N, default 3) verified agents renders the "sé de los
   primeros" band instead.
8. No *propia*, no placeholder email, no invented figures, brand always as an
   argument (CLAUDE.md).

**TBD (blocking, see "Questions for Anton"):** domain ownership of
`inmobiliarios.com.py`; the product shape in Stage 1 D; C1 (A vs A′); C2 (R2
go/no-go); profile-ownership flip (D §6).

### §2 Object model — what the build adds

Nothing in the database. Code-level shapes:

- `VerticalConfig.ownsDirectory?: boolean` (D1) — which served door is
  canonical for `/agentes`, `/agente/*`, `/inmobiliarias`, `/inmobiliaria/*`.
  Read by `origin.ts` (`directoryCanonicalOrigin()`), `alternates.ts` (scope
  `"directory"`), `sitemap.ts`, and `verify:seo`.
- `RentalService.slugEn` + `localizedRentalPath(locale, path)` (R2) — the
  per-locale path map for the rental business's own pages.
- `directory` i18n namespace (`esDirectory`/`enDirectory`, D1 skeleton, D2
  fill): home, form, explainer, directory filters, profile labels,
  `/para-inmobiliarios`, FAQ. The English peer exists because the type gate
  requires it, not because the door serves English.
- `ChromeVariant` gains `"directory"`; `homeLayout` gains `"directory"`;
  `directoryPagesEnabled(key)` / `marketplacePagesEnabled(key)` in
  `sections.ts`.
- `/api/leads` accepts an optional `agentSlug` (validated, resolved to
  `routedTo: "agent"`) for profile-originated leads.

### §3 Scope

Core: T1, R1, D1, D2. Approved-if-yes: R2. Parked: D3, B. Out of scope
everywhere: payments, reviews/ratings, automatic matching, a seller-facing
compare page, an agent inbox beyond what `/agencia` already gives a claimed
agent.

### §4 Autonomy protocol

`fable/plan.md` §4 applies. Additions: Opus phases R2 and D1 **open their PR
and stop** (structural; founder merges). Sonnet phases merge green
themselves. A phase that finds it needs a schema column stops per §4.4 and
writes it to `docs/decisions-needed.md`. Preview every door with
`curl -H "Host: <domain>"`; `npm run verify:local` before every push.

### §5 Lane 1 (Opus)

**§5.1 R2 — English paths on rentparaguay.com.** Add `slugEn` to each
`RENTAL_SERVICES` entry (airbnb-management, apartment-management,
realtor-asuncion, residency-paraguay, invest-in-paraguay, virtual-address,
rent). A pure `rentalPath(locale, key)` helper returns `/servicios/<es>` or
`/services/<en>`, `/nosotros`↔`/about`, `/contacto`↔`/contact`; the services
hub `/servicios`↔`/services`. Routes: add `app/services/[slug]` and
`app/services/page.tsx` that render only on `locale === "en"` rental doors
(share the components); on the EN door the Spanish paths 301 to English, on
the ES door the English paths 301 to Spanish. `languageAlternates()` accepts
`paths: Partial<Record<Locale, string>>` for pages whose path differs per
locale (default: same path). Sitemap static list per locale. S1's redirect map
(`next.config.ts`) targets the English slugs on the EN door. `verify:seo`:
every EN rental URL has an ES alternate and vice-versa; no rental URL 200s in
the wrong language on a door. `/propiedad` untouched. Exit: `verify:local`
green; seven `/services/*` URLs 200 with `Host: rentparaguay.com`; their
Spanish twins 301 there; hreflang pairs shown in `<head>` on both doors; PR
open, not merged.

**§5.2 D1 — the directory door.** (a) `verticals.ts`: `enabled: true`,
brand "Inmobiliarios Paraguay" (Anton may prefer another — §7), add
`ownsDirectory` to the type, set it on `inmobiliaria.com.py` for now.
(b) `sections.ts`: `chromeVariant` → `"directory"`, `homeLayout` →
`"directory"`, `directoryPagesEnabled`, `marketplacePagesEnabled`;
`chromeShowLogin/PublishCta/Newsletter` false for the directory family.
(c) Chrome: nav Inicio · Inmobiliarios · Inmobiliarias · Para inmobiliarios ·
Contacto; one CTA "Encontrá tu inmobiliario" → `/#form`. (d) `DirectoryHome`
per Stage 1 D item 1, with `DirectoryLeadForm` (posts `seller` +
`utm.source: "directory:home"`; same `/api/leads` guarantees as `VenderForm`).
(e) `/agentes`, `/inmobiliarias`, `/agente/[slug]`, `/inmobiliaria/[slug]`:
a directory rendering when `chromeVariant === "directory"` — city filter from
derived zones (`directory-queries.ts`), verified-first, teaser rule §1.7,
"contactá" form with `agentSlug`. (f) Redirect the marketplace-only routes to
`https://inmobiliaria.com.py<path>` on this door; sitemap lists only what the
door renders. (g) `verify:seo`: "exactly one served door owns directory pages
per locale", "a directory door lists no `/propiedad`, `/venta`, `/alquiler`
paths". (h) i18n `directory` namespace skeleton (keys + one exemplar sentence
each; D2 fills). (i) `CLAUDE.md` row: "code landed, DNS pending; ownsDirectory
flips at go-live". Exit: `verify:local` green; `curl -H "Host:
inmobiliarios.com.py"` on `/`, `/agentes`, `/agente/<slug>`,
`/para-inmobiliarios` renders the directory shell; `/venta/asuncion` 301s to
the marketplace; a seller lead row inserts with the marker (localhost MySQL,
else a PR note); PR open, not merged.

### §6 Lane 2 (Sonnet)

**§6.1 T1** — see the prompt. **§6.2 R1** — see the prompt. **§6.3 D2** —
fill the `directory` namespace in both dictionaries (vos-form Spanish, brand
as an argument, no invented stats: no "429 opiniones"), `/para-inmobiliarios`
directory branch (value prop + `agent_signup` form), FAQ with JSON-LD, docs
rows, KNOWN-ISSUES. Exit: `verify:i18n` green, no empty strings, pages render
full copy under the `Host` header, PR merged.

### §7 Human-inputs checklist

| Item | Needed by | Who |
| --- | --- | --- |
| Confirm `inmobiliarios.com.py` is owned (CLAUDE.md vs docs/prompts disagree) | before D1 | Anton |
| Brand string for the directory door ("Inmobiliarios Paraguay" default) | D1 | Anton |
| C1: confirm/buy `alquiler.com.py`, or say "use es.rentparaguay.com" | before rental go-live | Anton |
| DNS for `rentparaguay.com` + Spanish host → Hostinger; `NEXT_PUBLIC_CONTACT_WHATSAPP` + rebuild | rental go-live (already in `plan-rentparaguay.md` §7) | Anton |
| DNS for `inmobiliarios.com.py` → Hostinger; then the go-live PR flips `ownsDirectory` | directory go-live | Anton + one Sonnet PR |
| Merge decisions on R2 and D1 PRs | when opened | Anton |
| `npm run db:status` before/after any D3 migration | D3 | Anton/session |

### §8 Open business questions — parked

- Realtor monetization (free v1; `agencies.plan` exists for paid placement).
- Whether the founder's own agency appears in its own directory (conflict of
  interest optics vs. being the only verified supply on day one).
- Reviews/ratings design (CLAUDE.md backlog 4) — a prerequisite for the
  "track record" promise beyond verification + activity.
- EAS/SERPLAID licence display once the founder's licence issues (~Oct 2026).

### §9 Build log index

- T1: `docs/log/t1.md` — terreno.com.py agency/agent rail leak fixed
  (`getAgencyListings`/`getAgentListings` now take `vertical`).

- **R1** rental Services header dropdown — `docs/log/r1.md`. Merged.

- **R2** English URLs for the rental business's own pages on
  `rentparaguay.com` (`/services/<en>`, `/about`, `/contact`; `slugEn`,
  `rentalPath()`, per-locale sitemap, cross-language 301s, WordPress map
  retargeted to the English slugs) — `docs/log/r2.md`.

### §10 Backlog

- D3: `agents.bio/license_no/years_active/zones`, `lead_matches`, admin
  "match 3", seller compare page. Schema. Flag before merge.
- `countAgencyListings/countAgentListings` are unfiltered by vertical (drives
  profile indexability on terreno.com.py) — decide whether a profile with only
  non-terreno listings should be indexable there; T1 notes, does not change.
- B: `/es/` path prefix — only if Anton names a reason A/A′ cannot cover.
- English `/propiedad` alias on English doors — separate, marketplace-wide.

---

## Questions for Anton (one line each)

1. **inmobiliarios.com.py — do you own it today?** (CLAUDE.md says no;
   `docs/prompts/inmobiliarios-directory.md` says yes, parked at Hostinger.)
2. **Directory shape — yes to Stage 1 D as written** (seller-first home,
   manual 3-agent forwarding in v1, derived zones, no schema until D3)?
   Corrections welcome in a line.
3. **Profile canonical moves to inmobiliarios.com.py at go-live** (marketplace
   doors keep rendering profiles but point there) — yes/no?
4. **Spanish rental host: A (alquiler.com.py — confirm it is registered /
   buy it) or A′ (es.rentparaguay.com, no purchase)?** Not B (`/es/`) unless
   you have a reason that needs Spanish on the `.com` itself.
5. **R2 English URLs on rentparaguay.com — go?** (`/services/airbnb-management`,
   `/about`, `/contact`; `/propiedad` stays.)
6. **Brand string for the directory door** — "Inmobiliarios Paraguay" OK?
7. T1 and R1 need no answer — say "go" and they start in two Sonnet windows.
