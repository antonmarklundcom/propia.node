# PLAN.md — live build status

Living tracker for the ARCHITECTURE.md §6 milestones. **Update this file in
every session that finishes a step** — mark items done, add new blockers.
`[C]` = Claude does it (code/session work). `[YOU]` = founder must do it
(hosting, accounts, real-world data — things code cannot reach).

_Last updated: 2026-07-24 (session: shared-edit-admin-pages)._

---

## Where we actually are

- **Live** on `realestateinparaguay.com`, served by the single Next.js
  deployment in the Hostinger **Brazil** account (the app formerly reachable
  at `silver-goshawk-568437.hostingersite.com`; Hostinger renamed the site
  when the domain was attached, so that old URL no longer resolves).
- **Superadmin exists.** A `users` row with `role='admin'` was created by hand
  (SQL via phpMyAdmin, because the panel has no user management). `/login`,
  `/admin` and `/agencia` all work.
- **Migration 0001 is applied in production.** `password_hash`, `sessions` and
  `listings.review_notes` are all present — verified with `SHOW COLUMNS`. The
  "listing detail pages return 500" incident recorded in earlier versions of
  this file is **resolved**; do not re-diagnose it.
- **Photos are `picsum.photos` placeholders.** `next.config.ts` now whitelists
  that host so listing cards render instead of crashing the page, but no real
  photo pipeline exists (see 1.1).

### Post-mortem worth keeping

The multi-hour outage during the domain migration had one root cause that is
easy to hit again: **the MySQL username is not the database name.** The
database is `u210059163_propia`; the user is `u210059163_anton`. hPanel's
Remote MySQL screen lists *databases*, which invites the wrong assumption.
Any `DATABASE_URL` for this project takes the form:

```
mysql://u210059163_anton:<password>@127.0.0.1:3306/u210059163_propia   # from the app
mysql://u210059163_anton:<password>@srv1724.hstgr.io:3306/u210059163_propia  # from a dev machine
```

Second lesson: the error page tells you which layer failed. `503` = the Node
process is not running (startup crash or account process limits). `Application
error … Digest:` = the process is running and a page threw. A request that
hangs and never resolves = neither — look at DNS/SSL or account resources.

---

## Decisions needed from you (these block work below)

- [ ] **D1 — Product name.** The docs say "propia.com.py" everywhere; the UI
      says "Homes Paraguay" (commit `b5a4e0a`). Pick one; the loser gets
      renamed out of the docs and `metadata.title`s.
- [ ] **D2 — Domain order.** ARCHITECTURE.md §v2.1 says propia.com.py launches
      *first and alone* with the EN site `enabled: false`. Reality is the
      reverse: realestateinparaguay.com is live, propia.com.py is not attached,
      `NEXT_PUBLIC_CANONICAL_HOST=realestateinparaguay.com`, and
      `verticals.ts` still marks that host disabled (so it is silently served
      the Spanish propia experience). Decide which domains are on and which is
      canonical. The URL layer no longer waits on this (1.2 is done and treats
      the primary host as authoritative whatever `enabled` says); what is still
      wrong until you decide is the *experience* — the English domain serving
      Spanish copy — plus `realestateinparaguay.com` being `enabled: false`
      while it is the only live host.
- [ ] **D3 — Real financing terms.** `scripts/seed-financing.ts` ships
      placeholder Che Róga Porã / AFD numbers. Every venta card currently
      advertises a monthly cuota derived from invented terms.
- [ ] **D4 — USD→PYG rate** to quote (`USD_TO_PYG`, currently 6082).

## [YOU] — production items code cannot reach

- [ ] `GHL_WEBHOOK_URL` + `GHL_API_KEY` in the production env. **Until these
      are set, WhatsApp OTP never sends and no lead reaches the CRM** — the
      publish wizard and every contact form are effectively dead.
- [ ] Cloudflare R2 bucket + `R2_*` envs + image host mapping (pairs with 1.1).
- [ ] GA4 + Search Console properties.
- [ ] hPanel cron jobs: `cron:cuotas`, `cron:medians` (nightly).
- [ ] **Security hygiene from the migration session:** rotate the MySQL
      password and the panel login password (both were typed into a chat
      transcript), and delete the `%` ("Any Host") Remote MySQL grant that was
      added while debugging — it was never the cause and leaves port 3306 open
      to any IP.
- [ ] **Account capacity.** The Brazil account runs 91 sites at ~96% of plan
      resources, and Max Processes has breached its cap (169/200 average).
      That is a live risk to this site's uptime, not a future concern.

---

## Milestone status (ARCHITECTURE.md §6)

| Milestone | Code | Gate cleared? |
| --- | --- | --- |
| M0 Rails (deploy, DB, R2) | ⚠️ deploy + DB done; **R2 never built** | ❌ |
| M1 Schema + seeds | ✅ done | ⚠️ financing rates are placeholders (D3) |
| M2 Minimum supply (importer, review queue) | ✅ done | ⏳ 50 hand-audited listings not confirmed |
| M3 Public launch surface | ✅ done | ✅ canonical host is per-request (1.2) |
| M4 Search, filters & map | 🔶 filters + search bar exist; map API, split list/map view, EXPLAIN audit remain | ❌ |
| M5 Wizard, OTP & accounts | 🔶 wizard + auth merged, but **no account management at all** and OTP undeliverable | ❌ |
| M6 Scrape importers + SEO at scale | ❌ not started | — |
| M7 Monetization & feeders | ❌ not started | — |

---

## Codeable work, in priority order

Everything below is `[C]` unless marked otherwise. Ordered so each step makes
the product more usable than the last.

### Step 1 — Make the portal genuinely usable

- [ ] **1.1 R2 image pipeline.** The single biggest gap: no one can upload a
      photo. Today `src/lib/format.ts` only prefixes a stored key with
      `R2_PUBLIC_BASE_URL`; there is no S3/R2 client in the repo at all, and
      the importer parks the source URL in `listing_images.r2_key` with a
      comment deferring the real fetch to M6. Build: upload helper (presigned
      PUT or server-side put), `sharp` thumbnails, wire it into the publish
      wizard and the agency panel, and a backfill script that pulls existing
      remote URLs into R2 and rewrites `r2_key`. Needs the `[YOU]` R2 envs to
      run, but the code can land first.
- [x] **1.2 Per-request canonical host.** ✅ Done — `src/lib/origin.ts` derives
      the origin from the `Host` header, the way `middleware.ts` already
      resolves the vertical, and every absolute URL (canonical, OG, JSON-LD,
      sitemap, robots, the CRM's listing link) now goes through it. Two
      functions, because detail pages are the one page type whose owning host
      isn't simply the host that served it: `siteOrigin()` and
      `listingCanonicalOrigin()` (ARCHITECTURE §2.8 — feeders canonicalise
      their detail pages back to the primary host; EN owns its own).
      A host speaks for itself only if it is an enabled vertical **or** the
      `NEXT_PUBLIC_CANONICAL_HOST` primary — so unknown hosts (previews, the
      raw `*.hostingersite.com` name) still point at the primary instead of
      indexing themselves. Verified against a running build: the live host
      self-canonicals exactly as before (no regression), propia.com.py starts
      self-canonicalling the moment it is attached, and disabled feeders point
      at the primary. **D2 no longer gates any of this** — it now only decides
      which verticals are `enabled` and what the env var says.
- [x] **1.3 Listing editing for owners.** ✅ Done — `/agencia/propiedad/[id]`
      edits every field, not just status. Shares one form component and one
      parser with the admin edit (`src/components/panel/ListingForm.tsx`,
      `src/lib/listing-form-input.ts`) so the two can never validate
      differently. Photos still excluded — they need 1.1.

### Step 2 — Admin control plane

- [x] **2.1 `/admin/usuarios` — user management.** ✅ Done. Third `/admin` tab:
      create users, edit name/email/role/locale, reset a password (which also
      revokes that user's open sessions), and delete a user (sessions removed,
      their `agents` row unlinked but kept so the public profile and its
      listings survive). Lockout guards live in the server actions, not the UI:
      no changing your own role, no deleting your own account, no removing the
      last super-admin. No migration — existing columns only.
- [x] **2.2 `/admin/propiedades` — all listings.** ✅ Done — status filter
      chips with counts, title/public-id search, and edit at
      `/admin/propiedades/[id]` covering every field, the full status
      lifecycle, and hard delete. Scope is an `EditScope` enforced in the query
      layer's WHERE clause (`src/lib/listing-edit.ts`), so the same code serves
      the agency panel without it ever reaching another agency's rows.
- [x] **2.3 Link users to agencies in the UI.** ✅ Done as part of 2.1 — each
      user card has an agency picker that creates or repoints the `agents` row
      `requireAgencyContext()` reads. Onboarding an agency no longer needs
      database access.

### Step 3 — Supply-side self-service

- [ ] **3.1 Registration for agents and agencies.** There is no `/registro`
      route; every account is founder-created. Add sign-up that creates the
      user plus its `agents`/`agencies` rows in a pending state, reusing the
      existing `isVerified` flag for your approval.
- [ ] **3.2 Profile editing.** Agencies and agents cannot edit their own name,
      logo, contact details or description — the data model supports it
      (`agencies`, `agents`), the UI does not exist.
- [ ] **3.3 Per-listing stats for the owner** (views, leads) so the panel is
      worth logging into.

### Step 4 — Finish M4 (search, filters & map)

- [ ] Typed query layer over `idx_search` covering every facet combination.
- [ ] Map API: bounding-box endpoint + client-side supercluster.
- [ ] Split list/map UI, mobile full-screen map.
- [ ] EXPLAIN audit — every combination hits an index, <200ms.

### Step 5 — Performance (already diagnosed, just needs doing)

- [x] `React.cache()` around `resolve()` / `countCategory()` (category page)
      and `load()` (detail page). ✅ Done with 1.2, which is what made it
      urgent: reading the `Host` header is a dynamic API, so those routes no
      longer keep a full route cache between requests and every hit is a real
      render. Note `cache()` keys on **argument identity** — the cached
      `subtreeIds()` exists so `countFor()` receives the same array reference
      from both callers and actually hits.
- [x] Parallelise `getListingByPublicId` (`src/lib/queries.ts`): ✅ done —
      `images`, `chain`, `agency` and `agent` depend only on the listing row,
      never on each other, and now run in one `Promise.all` instead of four
      serial round-trips.
- [x] Fix the false-parallel block in `app/propiedad/[slug]/page.tsx`: ✅ done —
      `await citySubtreeIds(city.id)` sat *inside* the `Promise.all` array
      literal, so it ran to completion before the other two branches started.
      Hoisted above the block.
- [ ] In `getFilteredCategoryListings` (`src/lib/queries.ts:162`) the rows
      select and the count select do not depend on each other — run them
      together.
- [ ] Consider loading the small `locations` table once and walking the
      parent chain in memory instead of one query per level.

### Step 6 — M6 (scale supply + SEO)

- [ ] InfoCasas / Clasipar import adapters + watermark scoring.
- [ ] Barrio guides via the Claude API (top 30), `/precios` pages, internal
      link modules. Needs `ANTHROPIC_API_KEY` in prod `[YOU]`.
- [ ] **[YOU]** GATE: Screaming Frog crawl — zero indexable thin pages, zero
      canonical conflicts.

### Step 7 — M7 (monetization & feeders)

- [ ] Valuation lead magnet, featured listings, preventa promotion.
- [ ] **[YOU]** Decide the first feeder domain to switch on and the pricing for
      featured placement.

---

## Standing rules

- Every PR that touches `src/db/schema.ts` ⇒ generate a migration
  (`npm run db:generate`) **and** flag MIGRATION REQUIRED; the deploy is not
  done until `npm run db:migrate` ran against prod. Deployed code selects every
  column in the schema, so a DB behind on migrations 500s whole page trees.
- Never edit `drizzle.config.ts`, `src/db/index.ts` or `DATABASE_URL` handling
  unless the task *is* the DB connection. `src/db/index.ts` builds the pool at
  module load, so a malformed `DATABASE_URL` crashes the process at startup
  (503) rather than failing a single page.
- Run `npm run build` locally before pushing — Hostinger auto-deploys `main`
  and there is no staging.
- No MySQL-only tricks; the Postgres escape hatch stays open.
- Indexability decisions go through `getIndexability()` — never duplicated.
- All lead/OTP traffic goes through `src/lib/crm.ts`.
- Local-facing copy is Paraguayan voseo from `src/i18n/es.ts`.
