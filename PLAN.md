# PLAN.md — live build status

Living tracker for the ARCHITECTURE.md §6 milestones. **Update this file in
every session that finishes a step** — mark items done, add new blockers.
`[C]` = Claude does it (code/session work). `[YOU]` = founder must do it
(hosting, accounts, real-world data — things code cannot reach).

_Last updated: 2026-07-17 (session: m4-search-filters-map)._

---

## 🔴 ACTIVE INCIDENT — listing detail pages return 500

**Symptom:** every `/propiedad/{slug}-{id}` page errors; homepage and
category pages still work.

**Root cause (confirmed by local reproduction):** the M5 merge (PR #14)
added `listings.review_notes`, `users.password_hash` and the `sessions`
table via migration `drizzle/0001_complete_invaders.sql`, but that migration
**was never run against the production MySQL database**. The detail page
loads the listing with `db.select()` (all schema columns), so MySQL rejects
the query — `Unknown column 'review_notes' in 'SELECT'` — and the page 500s.
Category pages survived only because they select an explicit column list
that doesn't include the new column.

Also broken by the same drift (will fail on first use, even if less visible):
CSV importer writes to `listings`, the publish wizard, login/sessions, and
the admin review queue.

**Fix — one step, [YOU] (Claude has no access to the production DB):**

Run migrations against production. Either:

- From your machine (with Remote MySQL enabled in hPanel for your IP):
  `DATABASE_URL='mysql://USER:PASS@HOST:3306/DB' npm run db:migrate`
- Or paste `drizzle/0001_complete_invaders.sql` into hPanel → phpMyAdmin
  (run each statement; `--> statement-breakpoint` separates them).

Then reload any listing page — verified locally that this alone returns the
pages to 200.

**Process fix so it never recurs:** deploy checklist now includes “run
`npm run db:migrate` whenever `drizzle/` changed” (README §deploy). Any PR
that touches `src/db/schema.ts` must say **MIGRATION REQUIRED** in its
description.

---

## Milestone status (ARCHITECTURE.md §6)

| Milestone | Code | Gate cleared? |
| --- | --- | --- |
| M0 Rails (deploy, DB, R2) | n/a (setup) | ⚠️ partially — app deploys, but the deploy process has no migration step (this incident) |
| M1 Schema + seeds | ✅ done | ⚠️ financing rates are placeholders |
| M2 Minimum supply (importer, review queue) | ✅ done | ⏳ 50 hand-audited listings not confirmed |
| M3 Public launch surface | ✅ done | ⏳ NOT launched — blocked on launch blockers below |
| M4 Search, filters & map | ✅ code done (query layer, map API, split list/map UI) | ⏳ EXPLAIN audit needs to run against real data ([YOU]) |
| M5 Wizard, OTP & accounts | ✅ code merged (PR #13, #14) | ❌ — prod migration missing (incident above), GHL OTP envs unset, no end-to-end phone publish test |
| M6 Scrape importers + SEO at scale | ❌ not started | — |
| M7 Monetization & feeders | ❌ not started | — |

---

## What's left, step by step

### Step 1 — Unbreak production (NOW)

- [ ] **[YOU]** Run migration 0001 on production MySQL (see incident above).
- [ ] **[YOU]** Confirm a listing page loads.
- [x] **[C]** Diagnose root cause + verify fix locally.
- [x] **[C]** Add migration step to deploy checklist (README) + this tracker.

### Step 2 — Close the M5 gate (wizard/OTP/accounts)

- [ ] **[YOU]** Set GHL envs in production (`GHL_WEBHOOK_URL`, `GHL_API_KEY`)
      so OTP + lead push actually deliver.
- [ ] **[YOU]** Create your super-admin user: `npm run user:create` against prod.
- [ ] **[YOU]** Gate test: publish a listing end-to-end from a phone;
      OTP arrives on WhatsApp; listing lands in /admin review queue.
- [ ] **[C]** Fix whatever that test surfaces.

### Step 3 — Clear the launch blockers (M3 STOP gate → LAUNCH)

- [ ] **[YOU]** Real Che Róga Porã / AFD terms → `scripts/seed-financing.ts`
      values (rate, term, caps), then Claude reseeds + recomputes cuotas.
- [ ] **[YOU]** Set `USD_TO_PYG` to the rate you want quoted.
- [ ] **[YOU]** Domain: propia.com.py registered + pointed at the app;
      `NEXT_PUBLIC_CANONICAL_HOST` matches.
- [ ] **[YOU]** hPanel cron jobs scheduled (cuotas + medians nightly).
- [ ] **[YOU]** R2 bucket + `R2_*` envs + `img.propia.com.py` mapped.
- [ ] **[YOU]** GA4 + Search Console properties created.
- [ ] **[C]** Reseed financing, run cuota/median crons, verify sitemap +
      robots + JSON-LD on the live host, submit-ready sitemap.
- [ ] **[YOU]** GATE: real listings indexed, a test lead lands in GHL
      with correct attribution → **LAUNCH**.

### Step 4 — Finish M4 (search, filters & map)

- [x] **[C]** Typed query layer over `idx_search`: exported `categoryConds`/
      `filterConds`/`bboxConds` as the single source of truth for every
      filter shape; fixed `getFilteredCategoryListings`/`countCategory`/
      `countPublished` to do `COUNT(*)` in SQL instead of fetching every
      matching row into JS just to read `.length` (was a real perf bug on
      every page view, not just this milestone).
- [x] **[C]** Map API: `GET /api/listings/map` — bbox + operation/type/
      location/price/bedroom filters, hits `idx_geo`. Coordinates are
      snapped to a ~150m grid (`src/lib/geo.ts`) before leaving the server —
      same "never exact lat/lng publicly" rule as the detail-page map.
      Client-side clustering via `supercluster` in `src/components/MapView.tsx`
      (added as a new dependency).
- [x] **[C]** Split list/map UI: `Lista`/`Mapa` tabs on every category page
      (`?vista=mapa`, plain links — no client JS for the toggle itself),
      full-screen map on mobile (CSS only). Map view reuses the same
      MapLibre + OSM style as the listing detail map (extracted to
      `src/lib/mapStyle.ts` to keep the two in sync).
- [x] **[C]** EXPLAIN audit script (`scripts/explain-audit.ts`) — runs
      `EXPLAIN` against every representative filter/bbox shape and fails if
      any hits `type=ALL` or `key=NULL`. **Not yet run** — needs a
      `DATABASE_URL` with realistic listing volume, which this session
      doesn't have. **[YOU]**: run `npx tsx scripts/explain-audit.ts`
      against prod (or a seeded dev DB) and paste the output back here.
- [ ] **[YOU]** GATE: click through filters on your phone; feels instant.
      (Depends on the EXPLAIN audit above passing — <200ms only holds once
      every shape confirms it's hitting an index.)

### Step 5 — M6 (scale supply + SEO)

- [ ] **[C]** InfoCasas / Clasipar import adapters + watermark scoring.
- [ ] **[C]** Barrio guides via Claude API (top 30), /precios pages,
      internal-link modules.
- [ ] **[YOU]** ANTHROPIC_API_KEY in prod env for guide generation.
- [ ] **[YOU]** GATE: Screaming Frog crawl — zero indexable thin pages,
      zero canonical conflicts.

### Step 6 — M7 (monetization & feeders)

- [ ] **[C]** Valuation lead magnet, featured listings, preventa promotion.
- [ ] **[YOU]** Decide first feeder domain to flip on; pricing for featured.

---

## Standing rules

- Every PR that touches `src/db/schema.ts` ⇒ generate a migration
  (`npm run db:generate`) **and** flag MIGRATION REQUIRED; the deploy is not
  done until `npm run db:migrate` ran against prod.
- Every milestone ends at its STOP gate; no session starts the next
  milestone until the founder clears the gate here.
