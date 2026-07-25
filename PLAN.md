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
- **Photos are still `picsum.photos` placeholders in the data**, but the
  pipeline to replace them now exists (1.1). The rows hold *source URLs*, so
  the site hotlinks them until `npm run backfill:images` runs — which needs
  the R2 envs below.

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

- [ ] ⚠️ **Run `npm run db:migrate` against prod when you merge.** Two
      migrations are generated but not applied:
      • `drizzle/0002` reorders `idx_search` and adds `idx_recent` on
        `listings` (the EXPLAIN audit in step 4). No risk, no rush — the app
        runs fine without it, category pages just keep the slower plan.
      • `drizzle/0003` creates `listing_views_daily`. **This one the code does
        touch:** without the table, every listing detail page render tries to
        count a view and fails. The failure is swallowed (the counter is
        wrapped in try/catch and runs after the response, so pages still
        render) but the panel will report zero views until it exists.
      Both are fast — one DROP/CREATE INDEX pair and one small CREATE TABLE.
      Standing rule: a schema change is not done until the migration has run
      against prod.
- [x] ~~`GHL_WEBHOOK_URL` + `GHL_API_KEY`~~ **No longer required — GHL is
      optional.** Leads were always written to MySQL *before* the CRM push, so
      the push was a copy and nothing is lost without it; `/admin/leads` is now
      the founder's inbox and `/agencia/leads` the agency's. The one thing GHL
      really carried was OTP delivery, and that had a trap: with no key
      configured the provider logged the code server-side and returned
      **success**, so production told publishers "we sent you a code" that could
      never arrive. Now `isMessagingConfigured()` decides: no provider → the
      wizard publishes straight to `pending_review` (login + review are the
      gate) and the row is *not* flagged phone-verified; a provider that fails
      → an honest error, never a fake send.
      Optional later: set `LEAD_WEBHOOK_URL` to any endpoint (n8n, your own
      CRM, GHL) to get lead pushes and re-enable OTP.
- [ ] **Cloudflare R2 bucket + `R2_*` envs + image host mapping.** Now the
      blocker rather than a companion task: 1.1 is written and builds, but
      until `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and
      `R2_BUCKET` exist in the production env, every upload button says
      "storage not configured". Also map `R2_PUBLIC_BASE_URL`
      (img.propia.com.py) to the bucket's public URL, then run
      `npm run backfill:images` once to stop hotlinking the import sources.
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
| M0 Rails (deploy, DB, R2) | ✅ deploy + DB + R2 pipeline built | ⏳ R2 envs not set, so no photo has been stored yet |
| M1 Schema + seeds | ✅ done | ⚠️ financing rates are placeholders (D3) |
| M2 Minimum supply (importer, review queue) | ✅ done | ⏳ 50 hand-audited listings not confirmed |
| M3 Public launch surface | ✅ done | ✅ canonical host is per-request (1.2) |
| M4 Search, filters & map | ✅ filters, search, EXPLAIN audit (index fixed, migration 0002), bbox map API + split list/map view | ⏳ one typed facet builder still to share between category and map queries |
| M5 Wizard, OTP & accounts | ✅ wizard, auth, admin user management, self-registration, profile editing; publishing no longer needs OTP | ✅ no external provider required |
| M6 Scrape importers + SEO at scale | 🔶 link-import (3.5) + `/precios` pages and internal link modules done; barrio guides remain | ⏳ Screaming Frog crawl not run |
| M7 Monetization & feeders | ❌ not started | — |

---

## Codeable work, in priority order

Everything below is `[C]` unless marked otherwise. Ordered so each step makes
the product more usable than the last.

### Step 1 — Make the portal genuinely usable

- [x] **1.1 R2 image pipeline.** ✅ Code done — **waiting on the `[YOU]` R2
      envs to actually run.** `src/lib/r2.ts` (S3 client pointed at R2),
      `src/lib/images.ts` (sharp: EXIF-oriented, downscaled to 1600px + a
      480px thumb, re-encoded to WebP) and `src/lib/listing-images.ts` (the
      same `EditScope` guard the edit layer uses, extended with an `owner`
      scope for FSBO publishers). Upload/delete/reorder/set-cover in both
      panels via one shared `PhotoManager`, photo upload in the publish
      wizard as soon as a draft row exists, and
      `npm run backfill:images [--dry-run] [--limit N]` to pull the importer's
      remote URLs into the bucket and rewrite `r2_key`.
      Two things worth knowing: re-encoding is what makes the upload path
      safe — a file that only claims to be an image never gets stored, and
      **EXIF GPS is dropped** rather than served (schema §2.1 says precise
      coordinates are never public). And cards now request the thumb, so a
      category page stops pulling ~20 full-size photos over mobile data.
      Until the envs are set the panel shows "photo storage is not
      configured" instead of failing — missing config is a disabled feature,
      never a crash.
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
      differently. Photos included as of 1.1 (shared `PhotoManager`).

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

- [x] **3.1 Registration for agents and agencies.** ✅ Done — `/registro`
      creates the login plus its profile rows in one call
      (`src/lib/registration.ts`): an *inmobiliaria* gets a `users` row
      (`agency_admin`), an `agencies` row and the `agents` row that links them;
      an *agente independiente* gets a `users` row (`agent`) and an `agents`
      row with `agency_id` NULL. Both start `is_verified = false`, so sign-up
      grants a login and never trust — the ✓ badge is still your manual call,
      and listings still pass the review queue. The new account is logged in
      immediately, and the form has no `role` field to forge: role, agency link
      and verification state are all decided server-side.
      **This exposed a real gap it had to fix:** the whole `/agencia` panel
      assumed an `agency_id`, so an independent agent would have logged in to
      an empty dashboard and been unable to edit the listing they just
      published. `panelScope()` (auth/guards.ts) now resolves an agency account
      to its agency and an independent to `owner_user_id` — the same `owner`
      scope the wizard uses — and the dashboard listings, leads inbox, status
      changes, edit form and photo actions all run through it.
- [x] **3.2 Profile editing.** ✅ Done — `/agencia/perfil` (fourth tab) edits
      the company record (name, logo, WhatsApp, contact email), the caller's own
      public agent profile (name, photo, WhatsApp) and their own login (name,
      email, password). Three separate permissions, not one form: the company
      record is **agency-admin only** — an `agent` inside the agency sees it
      read-only and a forged POST is refused — while every user owns their agent
      profile and their login. Changing a password revokes every session for
      that user and reissues one for the browser doing it, so a stolen cookie
      cannot outlive the change. Slugs are never rewritten on a rename, same SEO
      contract as listings.
      _Not included:_ a **description/bio** field. The plan assumed the schema
      had one; it does not (`agencies` has name/logo/whatsapp/email, `agents`
      name/photo/whatsapp). Adding it is a one-column migration — say the word
      and it lands with MIGRATION REQUIRED. Logo and photo are URL fields for
      now rather than uploads, even though 1.1 could power an upload.
- [x] **3.3 Per-listing stats for the owner.** ✅ Done — **MIGRATION REQUIRED
      (`drizzle/0003`, new `listing_views_daily` table).** Views and leads per
      listing over a rolling 30 days: totals across the top of `/agencia`, two
      columns in the listings table, and a figures-plus-30-day-bars card at the
      top of every edit page (admin and agency, same component).
      Four decisions worth keeping:
      **(a) One row per listing per day, not per view** — an owner asks "how
      many people saw my ad this week", never "who saw it at 14:03", and a
      row-per-view would be the fastest-growing table in the schema for an
      answer nobody wants. **(b) Counted after the response** via Next's
      `after()`, so stats never cost the visitor latency and a failed counter
      never breaks a page that rendered fine. **(c) Crawlers excluded**
      (`view-tracking.ts`) — an owner who sees "420 views" and gets no calls
      concludes the portal is broken; if most of those were Googlebot the
      number lied. **(d) UPDATE-then-INSERT, not `ON DUPLICATE KEY UPDATE`**,
      which is MySQL-only and the schema's first rule is that the Postgres
      escape hatch stays open; the insert race is caught and retried as an
      update.
      Verified against a real database and a real browser: 3 human views
      counted and 3 bot views ignored end-to-end, 8 concurrent first-views of
      the same listing produce one row and lose none of the 8, views older than
      the window excluded, another agency's scope sees nothing, and the panel
      renders 188 views / 3 leads with a 30-bar trend.
- [x] **3.4 `/admin/leads` — every lead the site captured.** ✅ Done — third
      `/admin` tab: type filter chips with counts, search by name / WhatsApp /
      email, the owning agency (or “Interno” when the lead is yours), which
      vertical captured it, the listing it came from, and a one-tap WhatsApp
      reply. This is the only place `routed_to = 'internal'` leads (valuation,
      seller) are visible at all — no agency panel shows them.
      Note: `/admin` now has five tabs, which is past what fits one row on a
      phone; the next addition should group rather than append.

### Step 4 — Finish M4 (search, filters & map)

- [x] **Map API: bounding-box endpoint.** ✅ `GET /api/mapa?bbox=…` plus the
      same filter vocabulary the category URLs use, so pins and grid can never
      disagree. `src/lib/map-queries.ts` owns the rule that matters:
      **coordinates are rounded to 3 decimals (~110 m) before they leave the
      module**, because `lat`/`lng` and `address_text` are "never shown publicly
      at full precision" (schema §2.1) — a pin on the exact building tells a
      stranger which house is empty and for sale. A listing with no coordinates
      of its own borrows its barrio/city centroid and is flagged
      `approximate: true` (dashed pin) rather than being invented into a
      position or dropped. Capped at 400 pins, and a box wider than 12° is
      refused (422) rather than answered with the country.
- [x] **Split list/map UI, mobile map.** ✅ `?vista=mapa` on any category page —
      a query param, not a route, so the canonical URL is untouched and no thin
      duplicate gets indexed. Price pills + cluster chips, filters carried
      across the switch, maplibre still lazy-loaded so the list view (what
      crawlers and most visitors see) never downloads the map engine.
      **Clustering is ~50 lines of screen-space grid bucketing, not
      `supercluster`:** MapLibre's built-in clustering draws counts with a
      `symbol` layer, which needs a `glyphs` font URL the free raster OSM style
      does not have — so the "cheap" path was a dependency on someone else's
      font server. HTML markers style with plain CSS instead.
- [ ] Typed query layer over `idx_search` covering every facet combination
      (the audit and the index fix are done; the remaining piece is one shared
      typed builder so the category, map and future saved-search queries can't
      drift apart).
- [x] **EXPLAIN audit — done, and it found a real index bug.** ⚠️ **MIGRATION
      REQUIRED (`drizzle/0002`).** `idx_search` was
      `(status, operation, property_type, location_id, price_usd)`, but the URL
      scheme queries operation + location *always* and property_type only on
      `/{operacion}/{ciudad}/{tipo}` — so a city landing page could use only
      the `(status, operation)` prefix and scanned every listing of that
      operation (`key_len 2`, ~1 800 rows at 3 000 listings). Reordered to
      `(status, operation, location_id, property_type, price_usd)` so the
      optional column is last, and added `idx_recent`
      `(status, operation, location_id, published_at)` for the default
      `published_at desc` ordering, which no index covered.
      Verified on a local DB with 3 000 listings spread across the seeded
      locations: rows examined on a city page **1 800 → 163**, and the query
      itself **1.50 ms → 0.75 ms** (A/B on the same data, with a control run).
      Remaining honestly: an `IN (...)` location list plus `ORDER BY` still
      filesorts — inherent to a range predicate, and cheap now that the range
      is small.
      _Left for the map work:_ a typed facet layer and the bounding-box
      endpoint below.

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
- [x] In `getFilteredCategoryListings` the rows select and the count select do
      not depend on each other — ✅ now issued together in one `Promise.all`.
- [x] Load the small `locations` table once and walk the parent chain in
      memory — ✅ done. One cached read per request serves every
      `locationChain()` *and* `citySubtreeIds()` call, replacing one round-trip
      per hierarchy level plus one per subtree lookup.
- [x] **Counters were reading whole result sets.** ✅ Fixed — `countCategory`,
      `countPublished`, the filtered count, `countReviewQueue`,
      `countSuperAdmins`, `countListingsByStatus` and `countLeadsByType` all
      selected every matching row and took `rows.length` in JavaScript, so
      MySQL streamed the full result to Node to be thrown away. Now `COUNT(*)`
      and `GROUP BY`, index-only per EXPLAIN. Measured ~2× faster at 3 000
      listings, and it stops scaling with inventory.
- [x] `getPanelLeads` read every owned listing id into Node and sent them back
      as an `IN (...)` list — ✅ now one inner join with the scope predicate.

### Step 6 — M6 (scale supply + SEO)

- [x] **3.5 Import one listing from its link — the agent claims it.** ✅ Done at
      `/agencia/importar` (fourth agency tab).
      **This replaces the "InfoCasas / Clasipar scrape adapters" item below, on
      purpose.** Crawling a competitor's catalogue and republishing it breaches
      their terms, copies listing text and photos that belong to the agency or
      the portal, and fills the site with duplicates carrying someone else's
      watermarks — and the risk lands on us, not them. Pulling *one* listing, at
      the request of the agent who owns it, who ticks an attestation, is the same
      utility with none of that: it is a migration tool for supply we are
      recruiting anyway.
      How it works: paste a link → we fetch and parse → **a review form**
      pre-filled with what we read, blanks left blank on purpose → the
      attestation → a `draft` in that agent's own scope that still goes through
      the review queue. Nothing is published from a URL, and `is_verified` stays
      false. The source URL lands on `listing_sources` and in `review_notes`, so
      when you approve it you can see where it came from.
      Parsing is JSON-LD first, then OpenGraph, then generic text patterns —
      **no per-site CSS selectors**, which is both more robust and the part that
      would make this feel like scraping. Amount parsing follows PY convention
      (`Gs. 1.250.000.000`, `US$ 85.000` — dots are thousands).
      **Photos are not copied.** The agent uploads their own from the edit page;
      that keeps other portals' watermarks off the site.
      The security-critical piece is `src/lib/safe-fetch.ts`: fetching a
      user-supplied URL server-side is SSRF, so http/https only, DNS resolved
      and every address checked public, re-checked after each redirect hop, 2 MB
      cap, 10 s timeout. Verified against loopback, link-local (cloud metadata),
      all three RFC1918 ranges, IPv6 loopback, `file://`, `gopher://` and
      `0.0.0.0` — all refused.
      _Known limit:_ no per-user rate limit on the fetcher yet. It needs a login
      and only ever returns parsed listing fields (never raw HTML), so the abuse
      ceiling is low, but a cooldown is worth adding before you have many
      accounts.
- [ ] ~~InfoCasas / Clasipar scrape adapters~~ — **deliberately not built**, see
      3.5 above. If you ever want bulk supply from a portal, the route is a
      *partnership* with a feed, not a crawler.
- [ ] Watermark scoring for imported photos (still relevant once photos arrive
      from anywhere but a direct upload).
- [x] **`/precios` pages + internal link modules.** ✅ Done, and **no API key
      needed** — this half of the SEO surface is built from medians we compute
      ourselves (`cron:medians`), so it works the moment that cron runs.
      `/precios` lists cities with defensible data; `/precios/{ciudad}` shows
      median price and price/m² per (type × operation) with a link into the
      matching category page, plus a plain-language method note.
      The honesty rule is load-bearing: a city aggregate is a
      **sample-weighted** mean of its barrio medians (not a median of medians,
      which would treat a barrio with 40 listings and one with 2 as equals), a
      group under 8 listings renders **with a caveat** rather than silently, and
      a page whose every group is thin is `noindex`. The sitemap uses the same
      rule, so page and sitemap can never disagree — that agreement is what
      keeps programmatic pages out of doorway territory, and it matters more
      here than on a category page because a median *looks* authoritative.
      Link modules: category page → its city's prices, listing detail → same,
      price row → the category page it summarises, footer → `/precios`.
- [ ] Barrio guides via the Claude API (top 30). Needs `ANTHROPIC_API_KEY` in
      prod `[YOU]`. Note the guides are the *only* part of §4.4 that needs it.
- [ ] **[YOU]** GATE: Screaming Frog crawl — zero indexable thin pages, zero
      canonical conflicts.

### Step 7 — M7 (monetization & feeders)

- [ ] Valuation lead magnet, featured listings, preventa promotion.
- [ ] **[YOU]** Decide the first feeder domain to switch on and the pricing for
      featured placement.

---

## Known dialect dependency

`scripts/compute-medians.ts` uses `.onDuplicateKeyUpdate()`, which is
MySQL-only, against the standing "no MySQL-only tricks" rule. It is one call in
a nightly cron (not a request path), so it is cheap to port when needed — but it
is the one place the Postgres escape hatch is currently nailed shut. The views
counter deliberately avoids the same trick; see `recordListingView`.

## Verification you can re-run

- **The map was driven in a real browser (Playwright + Chromium), not just
  typechecked — and that is the only reason it works.** Two bugs were invisible
  from the code: (1) `maplibre-gl.css` sets `.maplibregl-map { position:
  relative }` and its stylesheet is injected *after* `globals.css`, so
  `inset: 0` silently stopped sizing the map container — it collapsed to
  height 0 and, because maplibre also sets `overflow: hidden`, every marker
  inside became unclickable (`document.elementFromPoint` at a cluster chip
  returned the wrapper, and a real mouse click did nothing); (2) on a phone the
  search and filter cards filled the entire first screen, so tapping "Mapa"
  showed no map until you scrolled past both. Both fixed and re-verified:
  container 1098×620, hit test lands on the chip, a genuine click zooms
  (chips 33 → 11, pins 10 → 31), price pill links to the right listing.
  Note OSM raster tiles cannot load from inside the dev sandbox (the proxy
  blocks `tile.openstreetmap.org`), so screenshots show pins over a blank
  backdrop; pins and clustering are ours and work regardless.

- `npm run verify:scopes` — exercises the panel's ownership guards against a
  local database: sign-up shape (roles, unverified flags, the `agents` link),
  the validation refusals, **cross-tenant isolation** (an agency cannot read,
  edit or restatus an independent's listing), slug immutability on rename, and
  that a password change revokes only that user's sessions. It refuses to run
  unless `DATABASE_URL` points at localhost, and it cleans up its own rows.
  This is the only automated check in the repo — if you touch
  `listingScopeWhere`, `panelScope` or any panel query, run it.

## Pending migration

**`drizzle/0002` is generated but NOT applied to production.** It reorders
`idx_search` and adds `idx_recent` on `listings` (see the EXPLAIN audit in step
4). Deployed code does not select new columns, so the app runs fine either way
— the only cost of waiting is that category pages keep the slower plan. Run
`npm run db:migrate` against prod when convenient; it is a DROP INDEX plus two
CREATE INDEX on a small table, so it completes immediately.

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
