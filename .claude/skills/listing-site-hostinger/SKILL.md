---
name: listing-site-hostinger
description: >
  Playbook for building a classified-listings portal (real estate, vehicles,
  machinery — anything with faceted search + lead capture) with Claude Code,
  deployed on a Hostinger Cloud plan. Distilled from building propia.com.py
  (14 PRs). Use when starting a NEW listing vertical (e.g. camiones.com.py)
  or when resuming milestone work on an existing one. Covers the day-0
  checklist, architecture defaults, milestone sequence with STOP gates,
  Hostinger deploy specifics, and the mistakes to not repeat.
---

# Listing sites in Claude — Hostinger Cloud plan

You are building a classifieds/listings portal: inventory rows with faceted
filtering, programmatic SEO pages, WhatsApp-first lead capture, and a small
admin panel — maintained by a solo founder + Claude Code, hosted on a
Hostinger Cloud/Business plan (Node.js app + free MySQL + cron jobs).

## Rule 0 — is this actually a new site?

Before scaffolding anything, check whether the "new site" is really a new
**engine** or just a new **door** on an existing one.

- Same inventory domain, different slice/brand (terreno.com.py = propia's
  terrenos; alquiler.com.py = propia's rentals) → **it's a vertical config
  flip in the existing repo** (`src/config/verticals.ts` + host-header
  middleware + distinct copy). Never fork the repo for these.
- Different inventory domain with a different schema (camiones.com.py:
  trucks have km, cabina, ejes — not dormitorios) → **new repo, this
  playbook**, copying the engine patterns below.

## Day 0 — rails before features (do ALL of this in PR #1)

The single biggest source of rework on propia was building features before
verification rails existed. In the first PR, before any product code:

1. **Scaffold**: Next.js App Router + TypeScript strict + Drizzle ORM
   (MySQL dialect) + `docker-compose.yml` for local MySQL 8. Path alias
   `@/* → ./src/*`.
2. **ESLint config committed** (`next lint` needs one; without it no session
   can lint). `npm run typecheck` + `npm run lint` scripts.
3. **GitHub Actions CI** (~25 lines): `npm ci && npm run typecheck && npm run
   lint && npm run build && npm audit --audit-level=high` on every PR. Every
   Claude session gets a green/red signal instead of re-verifying by hand.
4. **Unit tests for pure logic from the start** (vitest or `node:test`).
   The money math (price normalization, financing/cuota calculators), URL
   builders/parsers, dedup key derivation, and the indexability rule are
   pure functions — test them the day they're written. On propia every
   session re-verified these with throwaway scripts instead.
5. **SessionStart story for Claude-on-the-web**: cloud sessions may not be
   able to pull Docker images (registry blocked). Provide either a
   `.claude/hooks` SessionStart hook that provisions the DB, or a documented
   no-DB verify path (unit tests over pure logic + `next build`). Otherwise
   DB-touching code ships unverified — this happened on propia.
6. **Seed/demo data checked in** (e.g. `data/sample-listings.csv`, ~50 rows)
   + an idempotent importer, so any session can stand up a working site.
7. **Fresh dependencies + audit clean**. propia's PR #10 existed only to
   patch drizzle-orm/esbuild/postcss CVEs committed at scaffold time.
8. **ARCHITECTURE.md as the contract**: stack table, data model intent,
   URL scheme, milestone list with STOP gates, and the model policy
   (which model does architecture vs implementation vs templated work).
   Every future session reads it first; it prevents re-litigating decisions.

**M0 deploy gate is real**: app serving on the production URL, DB
round-trip, one image through the CDN — BEFORE feature work. propia built
M1–M5 with no deploy artifacts in the repo; don't repeat that.

### Day-0 artifacts (copy-paste, adjust names)

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - run: npm audit --audit-level=high
```

ESLint (flat config, `eslint.config.mjs`):

```js
import next from "eslint-config-next";
export default [...next(), { ignores: [".next/", "node_modules/"] }];
```

Tests — `vitest` with zero config; put `*.test.ts` next to the pure-logic
modules (`src/lib/cuota.test.ts`, `src/lib/urls.test.ts`,
`src/lib/import/normalize.test.ts`, `src/lib/indexability.test.ts`).
`package.json` scripts: `"test": "vitest run"`, `"lint": "eslint ."`.
These four test files ARE the no-DB verify path for cloud sessions —
every money-math or URL change gets caught without MySQL running.

## Architecture defaults (proven on propia — reuse unless a reason not to)

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js App Router, ONE app for all domains | ISR for SEO pages; host-header middleware sets `x-vertical` |
| DB | Hostinger MySQL 8 via Drizzle | Free with plan. No stored procs, no MySQL-only JSON tricks → Postgres escape hatch stays open |
| Search | SQL + composite indexes, no search engine v1 | One `idx_search (status, operation/category, type, location_id, price)` covers every consumer query |
| Images | Cloudflare R2 + CDN, never hosting disk | 10 GB free, zero egress; thumbs via sharp on upload |
| Maps | MapLibre + OSM tiles ($0) | Mapbox-compatible → paid upgrade is a token swap |
| Jobs | hPanel cron → `npx tsx scripts/*.ts` | Every job idempotent + re-runnable |
| Auth | Opaque session cookies (sha256(token) as row PK) + WhatsApp OTP | No auth library; OTP delivered via the CRM webhook |
| CRM/leads | ONE boundary file (`src/lib/crm.ts`, `CrmProvider` interface) | DB records the lead first, then webhook out. Nothing else knows which CRM. Console fallback provider for dev |
| i18n/copy | One canonical strings file (voseo es-PY for .py sites) | Never generate neutral-Spanish variants ad hoc |

### Schema patterns that paid off

- **Wide denormalized listing row**; normalized filter price (`price_usd`)
  computed at write time; display-only JSON columns never filtered in SQL.
- **`status` enum covers the whole lifecycle** (`draft → pending_review →
  published → paused/sold/removed`) — drafts, the review queue, and the
  wizard all reuse the listings table. No separate drafts table.
- **`public_id` (10-char) + slug in URLs**; slug cosmetic, never recomputed
  (SEO contract). `parse` and `build` for every URL shape live in ONE file.
- **Provenance table (`listing_sources`)** with `content_hash` + `dedup_key`
  from day one — seeding is always multi-source (scrape + manual + FSBO)
  and retrofitting dedup is misery.
- **Locations/taxonomy hierarchy** with precomputed `full_slug` and cached
  `listing_counts` JSON → thin-page rule and "N avisos acá" with zero COUNT
  queries at request time.
- **Every panel write is scoped in its WHERE clause** (`owner_user_id` /
  `agency_id` from the session, never the request). Guards re-run in every
  server action.
- **Indexability rule in ONE module** consumed by both page templates and
  the sitemap generator: count ≥ 3 → index + sitemap; 1–2 → noindex,follow;
  0 → 410/redirect.

## Milestone sequence (strictly sequential, STOP gates, no dates)

M0 rails/deploy → M1 schema+seeds (STOP: schema reviewed against every UI
element and page type — changes after launch cost 10x) → M2 import pipeline
+ minimal review queue (STOP: re-runs create zero duplicates) → M3 launch
surface: detail page, category ISR pages, sitemap, lead webhook (STOP:
**LAUNCH**, real listings indexed, leads landing with attribution) → M4
search/filters/map (STOP: EXPLAIN audit, every combination hits an index) →
M5 publish wizard + OTP + accounts → M6 scrapers + programmatic SEO at
scale → M7 monetization + feeder domains.

Model policy that worked: frontier model for architecture/schema/gates,
Opus-tier for expensive-to-unwind implementation, smaller model for
templated pages/forms/copy wiring.

## Hostinger Cloud specifics

- **MySQL**: hPanel → Databases → MySQL (free). Create DB + user, allow
  remote access only if needed for migrations from CI; otherwise run
  `drizzle-kit migrate` from the server or a one-off session.
- **Node app**: hPanel → website → Node.js application (Cloud/Business
  plans). Point at the repo (git deploy), build `npm run build`, start
  `npm run start`. Brazil/São Paulo region for Paraguay-adjacent latency.
- **Cron**: hPanel → Cron Jobs → `npx tsx scripts/<job>.ts` (nightly price
  caches, medians, sitemap refresh). Jobs must be idempotent — shared
  hosting kills long processes.
- **Keep the pool small** (`connectionLimit: 8`) — Hostinger caps
  concurrent MySQL connections per user.
- **A hosting move is not a database move**: migration triggers (revisit
  quarterly): >~50k rows with filter latency, need search-as-you-type,
  import jobs exceed execution limits → then VPS + Meilisearch (+ optionally
  Postgres), a weekend not a rewrite.

## Connecting multiple domains to one engine

Feeder domains (terreno.*, alquiler.*, the EN site) are the SAME app and
the SAME database — do NOT stand up a second app that "fetches" listings
from the first. A second deployment sharing data means an internal API,
auth between apps, cache/sync drift, and double ops — with no real
security gain, since it's the same data owned by the same founder. The
isolation that matters is enforced in code, not by infrastructure:

- **Routing**: point every domain's DNS at the same Hostinger Node app
  (hPanel → Domains → add domain/alias to the site, or an A/CNAME record
  to the same target). Next.js middleware reads the `Host` header, looks
  it up in `src/config/verticals.ts`, and injects `x-vertical` +
  `x-locale` into the request. Unknown/disabled hosts resolve to the
  primary brand.
- **Data slice**: each vertical config declares hard filters (e.g.
  terreno → `property_type=['terreno']`) that every listing query applies.
  A feeder domain physically cannot render inventory outside its slice —
  that's the "share only terreno's properties" guarantee, done at the
  query layer.
- **Write surface**: keep /admin, /publicar, /login on the primary domain
  only — feeder verticals get a redirect for panel routes. Public doors
  are read-only + lead capture; the attack surface of a feeder domain is
  a filtered read.
- **SEO safety (the actual risk)**: listing DETAIL pages are canonical on
  the primary domain only; feeder domains own their own category/landing/
  guide pages with distinct copy and link into the primary for details.
  Without this, Google sees duplicate content across your own domains and
  splits/penalizes rankings.
- **Lead attribution**: the captured vertical is stored on every lead
  (`leads.vertical`) so you can measure each door's yield from day one.
- **TLS**: Hostinger issues certificates per domain — add each domain in
  hPanel and enable SSL before flipping `enabled: true`.

Launch checklist per feeder domain: DNS → hPanel domain + SSL → distinct
copy strings → `enabled: true` in verticals config → verify canonicals
point at the primary → submit the feeder's sitemap in its own Search
Console property.

## Process rules (the actual retro of propia's 14 PRs)

1. **One PR = one coherent increment.** propia merged SEVEN PRs in one day
   from one design branch (#3–#9), each a small tweak — review noise, and
   the same files (globals.css ×11, home page ×7) churned repeatedly.
   Batch design work; merge when the increment is done.
2. **Never stack new work on an already-merged branch.** PRs #11 and #12
   shipped from the same branch name; #14's branch name describes #13's
   content. Fresh branch from main per increment, named for what it does.
3. **Design once with a visual loop, not by ping-pong.** The repeated
   "polish/redesign/flesh out" cycle happens when Claude designs blind.
   Define tokens + page skeletons first; verify with screenshots
   (Playwright is preinstalled in Claude web sessions) before merging;
   iterate in-session, not across merged PRs.
4. **CI + tests from PR #1** (see Day 0) — the absence of both is why every
   propia session started with manual re-verification and why a security-
   patch PR was needed at all.
5. **State what was NOT verified in every commit/PR** (e.g. "OTP DB writes
   not exercised — no DB in sandbox"). It tells the founder exactly what to
   smoke-test and keeps trust honest.
6. **Copy in one file, URL logic in one file, CRM in one file.** Every
   place propia enforced a single-source-of-truth module, later features
   composed cleanly; every scattered concern (CSS) churned.
7. **Pre-declare the doors.** List every future domain in the verticals
   config with `enabled: false` on day one — turning one on is then a
   config flip, and canonical/lead-attribution logic never needs a refactor.
