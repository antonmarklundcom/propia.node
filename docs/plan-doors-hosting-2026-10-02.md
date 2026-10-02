# Plan: the Hostinger process cap vs. many real-estate domains

Written 2026-10-02. Status: **a plan only. No code until the founder answers
the open questions (§9, also in `docs/decisions-needed.md`).**

Builds on `docs/hosting-process-cap.md` (the measurements, PR #266, Tests
A/B/C). Read that first for why the cap is hit. This file answers a different
question: *which doors should stay on the Node app, which should become
static HTML/PHP sites, and how to add more domains later without new Node
threads*. Editing stays in one place either way: `/admin` and `/agencia` on
the Node app.

**Founder constraint (2026-10-02):** every current door stays on Node.js until
its new HTML replacement is finished. Nothing below turns a door off before
then. Each door moves on its own, when its HTML is ready.

---

## 1. Recommendation

1. **Measure first, move nothing yet.** Run the baseline and Tests A/B/C (§8).
   PR #266 (the orphan exit) may already bring the copy count down. We need
   24 h of `pmon2.log` / `reap.log` *after* #266 before deciding.
2. **If Test B shows one origin hostname = one instance: option A (Cloudflare
   Worker host-router) is the fix for the cap.** It's already written
   (`workers/host-router/`), needs no app change, and every door stays on
   Node.js, so it fits the constraint above. SEO stays exactly as it is
   (every ownership flag, hreflang and sitemap rule still applies), there is
   nothing to keep in sync, and it costs nothing extra. Once it holds, a new
   domain costs **zero** extra threads.
3. **Build the HTML doors as option B: "hub and spokes".** The Node app is the
   hub (`/admin`, `/agencia`, the two marketplace primaries, a read-only public
   API). Each HTML door is a spoke. It renders its own home, its own pages and
   the evergreen pages it owns, all as server-side HTML, from the API, through
   a file cache that keeps serving stale content if the hub is down. Listing
   detail always stays on the hub. B works whatever Test B shows. With A in
   place, B becomes a choice per door (design freedom, independence from
   Node), not a requirement of the cap.
4. **Don't do C on its own, and don't do D.** A nightly snapshot (C) is too
   stale for a marketplace: sold listings stay up a day. Its one strength,
   surviving a hub outage, is built into B through the spoke's stale cache.
   Direct database reads from PHP (D) copy the business rules into PHP, put a
   database credential on every spoke, and break silently on the next
   migration.
5. **If Test B shows copies grow even on one hostname, the hostname isn't the
   cause.** Then A won't help, and B helps only as far as traffic leaves Node.
   The guaranteed fix is **E (a VPS)** for the Node app. Until then, keep the
   orphan exit, the thread env vars and the reaper.

The two primaries (`inmobiliaria.com.py`, `realestateinparaguay.com`) stay on
Node in every option. They own `/propiedad`, the directory in English, the
categories, the site pages, and the logins.

---

## 2. What each door is today (from `src/config/verticals.ts`)

| Door | Owns (SEO) | Has listings | What it would take as a static spoke |
|---|---|---|---|
| `inmobiliaria.com.py` | detail, categories, site pages (es) | all | **stays on Node** (hub) |
| `realestateinparaguay.com` | detail, categories, site pages, directory (en) | foreign_exposure | **stays on Node** (hub; also the Worker's `ORIGIN_HOST`) |
| `inmobiliarios.com.py` | directory (es) | none (profiles) | agent and agency profiles plus matching leads. **Recommend staying on Node.** A directory API is out of scope (§9 Q5) |
| `terreno.com.py` | only its **9 evergreen land pages** + home + `/venta` hub | terreno | medium: the evergreen pages need content and counts from the API |
| `landforsaleparaguay.com` | home + `/venta` hub | terreno (en) | small. **Not live yet** (`NOT_LIVE_YET`), so no SEO risk |
| `rentparaguay.com` | home, `/alquiler` hub, `/services/*`, `/about`, `/contact` | rentals | medium: the WordPress 301 map in `next.config.ts` has to move to `.htaccess` |
| `residenciaenparaguay.es` | its own flat content pages | none | smallest: content + lead form, no listing API needed |
| `landforsaleinparaguay.com` | nothing (308 → landforsaleparaguay.com) | — | a one-line redirect at the registrar, in Cloudflare or in `.htaccess`. It never needs Node |

The feeder flags already do most of the work: every candidate spoke has
`ownsListingDetail: false`, and the listing doors have `ownsCategories: false`
and `ownsSitePages: false`. So a spoke never has to render detail pages,
category grids or guides. It canonicalises (or links) them to the hub
today. The one exception is terreno's evergreen pages (§5.3).

---

## 3. Comparison

Measured unit: "threads" against the 200 cap. One `next-server` copy is
6–11 threads (6 with `UV_THREADPOOL_SIZE=2` + `--v8-pool-size=1`).

| | **A** Worker → one origin | **B** static spokes + public API | **C** nightly snapshot | **D** PHP reads the DB | **E** VPS + Caddy |
|---|---|---|---|---|---|
| Node threads | 1 app × 1–2 copies **if Test B passes**, otherwise no change | only the hub's copies. API calls hit a hostname the app already has. Spokes: 0 (static) or short-lived `lsphp` | 0 at request time, plus one job per night | 0 | no cap. Exactly 1 process per app (systemd/PM2) |
| SEO | **unchanged**: every flag, hreflang, sitemap and evergreen rule applies as today | good **if** the spoke renders server-side and follows the flags (§5). Risk: URLs missing at cutover | good HTML, but up to 24 h stale (sold listings, wrong counts) | depends on how faithfully PHP reimplements the rules | unchanged |
| Freshness | live | minutes (spoke file cache, 10 min TTL suggested) | ≤ 24 h | live | live |
| Maintenance | one codebase. Worker ~100 lines, already reviewed | two codebases (Next + spoke template), plus a versioned API. Spoke design changes are HTML work | generator + transfer path + templates | **worst**: published filter, door filters, locale fallback, image URLs and canonicals all duplicated in PHP. A migration can break spokes silently | one codebase. **You** own OS updates, TLS (Caddy does it automatically), backups, deploy hook, monitoring |
| Security surface | Cloudflare in front. Shared-secret header (`ORIGIN_PROXY_SECRET`, in place) | a new public read API (no PII, bounded) and a cross-origin lead endpoint (rate-limited) | smallest: no live API. But a write path from Node to the spoke's folder or a bucket | a DB credential on every spoke, Remote MySQL allowlist, column-level grants or a view (= migration) | a whole server exposed. SSH and firewall are yours |
| Cost | $0 extra (Workers Paid $5/mo already on the account, 10 M req/mo) | $0 hosting (websites included in Cloud Startup). Build: API ~2–3 days, each spoke is founder time | $0 | $0 | ~US$7–15/mo + 1–2 days setup |
| Rollback | per door, minutes: Cloudflare record to DNS-only (works only while the domain is still parked on Hostinger) | per door: re-attach the domain to the Node app (or switch the Cloudflare origin back) + revert the `delivery` flag. The app still renders the door | same as B | same as B | DNS back to Hostinger (TTL-bound, hours) |
| A new domain later | Cloudflare zone + 2 routes + a `verticals.ts` entry. **0 threads** | a spoke from the template + a `verticals.ts` entry. **0 Node threads, whatever Test B shows** | same as B | a spoke + DB grants | a `server_name` line + a `verticals.ts` entry |
| Depends on Test B | **yes** | no | no | no | no |

---

## 4. The public API (option B)

### 4.1 Principles

- **Read-only and published-only.** Every read goes through
  `publishedFacetWhere(facets, vertical)` (`src/lib/facet-sql.ts`). That
  function already ANDs `status = 'published'`, the visitor's facets and the
  door's hard filters. The API adds no new WHERE clause. Facets are parsed by
  `parseFacetParams()` (`src/lib/facets.ts`), the same function the grid and
  `/api/mapa` use.
- **The door is a parameter, never the Host header.** The caller is a PHP
  server or a browser on another domain, and the request lands on the hub
  hostname. The middleware will still stamp the hub's `x-vertical`; the API
  must ignore it. `?door=<VerticalKey>` is validated against `VERTICALS`, and
  only doors with the new `delivery: "static"` flag (§6) are accepted (plus the
  hub doors, for testing).
- **An explicit allowlist serializer.** A pure `toPublicListing(row)` picks
  fields by name. Spreading a row is forbidden. A verify script asserts that
  the forbidden keys (§4.4) never appear.
- **Served from one fixed hub hostname.** Recommendation:
  `https://realestateinparaguay.com/api/public/v1/…`. It's the hostname that
  stays directly on Hostinger in both A and B, so it never adds an instance.
  (§9 Q6.)

### 4.2 Endpoints (v1)

| Endpoint | Returns | Notes |
|---|---|---|
| `GET /api/public/v1/listings?door=&operacion=&ciudad=&barrio=&tipo=&precio_min=&precio_max=&dormitorios=&orden=&page=` | `{ items: PublicListing[], total, page, pageSize }` | pageSize 24 (fixed), `page` ≤ 40. Unknown city slug → empty, never widened (the `/api/mapa` rule) |
| `GET /api/public/v1/facets?door=` | counts per operation, city, type | feeds the spoke's menus. A spoke links only to paths that have stock (same idea as `stockedPathsOrNull()`) |
| `GET /api/public/v1/page?door=&path=` | `{ seo: { title, description, canonical, robots, alternates }, evergreen?: {...content sections...}, inventory?: { count, priceBands }, listings?: PublicListing[] }` | the spoke's per-page SEO is **computed by the hub** with the same pure functions as today (§5). Evergreen content stays in `src/content/evergreen/*.ts`, edited in one place |
| `GET /api/public/v1/sitemap?door=` | `{ paths: [{ path, lastmod }] }` | `buildSitemapEntries()` with that door's own options (`includeListingDetail` etc. derived from its flags). The spoke turns it into `/sitemap.xml` |
| `POST /api/public/v1/leads` (+ `OPTIONS`) | `{ ok, routedTo }` | §7 |

Not in v1: listing detail on spokes (§9 Q3), directory profiles (§9 Q5),
map pins (a spoke links to the hub's map), bulk export of any kind.

### 4.3 `PublicListing`: the fields allowed

`publicId`, `canonicalUrl` (the hub's `/propiedad/…` URL in the door's own
language: `detailOwnerForLocale(door.locale)` + `listingUrl()`, with
`?utm_source=<door host>` appended, see §7.3), `operation`, `propertyType`,
`title` (locale-aware: `titleEn ?? title` on an English door, the rule in
CLAUDE.md), `priceAmount`, `priceCurrency`, `priceUsd`, `cuotaGs` **only when
`showCuota(door)`**, `bedrooms`, `bathrooms`, `parking`, `areaM2`, `landM2`,
`propertyState`, `city` / `barrio` (names + slugs), `coverUrl` + `thumbUrl`
(through `imageUrl()`, so the R2 switch later changes nothing for spokes),
`photoCount`, `isVerified`, `featured` (boolean, never the date),
`publishedDate` (date only), `isSample` (the cover is a demo photo, the
same check `src/lib/photos.ts` makes for the card's "Aviso de muestra"
chip, so spokes can mark demo data while it is live).

No description in v1. A full description on a spoke duplicates the detail
page's main content. If a teaser is wanted later: ≤ 160 characters, plain
text.

### 4.4 Must NOT be exposed, ever

- Internal ids: `listings.id`, `agencyId`, `agentId`, `ownerUserId`, `projectId`.
- Location precision: `addressText`, `lat`/`lng`. (No coordinates at all in
  v1. If a map is added later, use the rounded ones `map-queries.ts` already
  produces.)
- Seller contact of any kind: agent/agency/owner WhatsApp, phone, email,
  names of private owners. **No agent phone numbers in v1, even though the
  hub's detail page shows a WhatsApp button**: spokes send the visitor to that
  detail page, or to their own lead form. (§9 Q10.)
- Moderation and pipeline state: `status` other than published (drafts,
  `pending_review`, paused, sold, rented, removed), `reviewNotes`,
  `translationHash`, `featuredUntil` as a date, import data (`listing_sources`,
  `import_jobs`/`import_rows`).
- Whole tables: `users`, sessions, `leads`, `lead_assignments`, `lead_matches`,
  `deals`, `email_*`, `whatsapp_*`, `admin_events`, `analytics_*`,
  `web_vitals`, `site_settings`, `saved_searches`, `agency_invites`, `fx_rates`
  internals. None of `/admin`, `/agencia`, `/mis-avisos`, server actions or
  cookies. The API never reads a session and never sets
  `Access-Control-Allow-Credentials`.

### 4.5 Caching

- Cached readers in `src/lib/public-api/queries.ts`: `unstable_cache` wrapped
  in `singleFlight()` (`src/lib/cache.ts`), tag `CACHE_TAGS.listings`, TTL
  `CACHE_TTL.listings`. **The cache key contains the door key**, the
  normalised facets and the page number. Forgetting the door key would leak
  one door's listing set to another (CLAUDE.md, "Listing filters"). Dates are
  re-wrapped in the exported wrapper (`publishedDate` is a string anyway).
  Existing `revalidateListings()` calls already clear the tag, so no new
  writer is needed.
- HTTP: `Cache-Control: public, max-age=60, s-maxage=300,
  stale-while-revalidate=600`. The door is in the URL, so the URL is a correct
  cache key. Add `Vary: Origin` only on responses that carry CORS headers.
- The spoke caches each response on disk (10 min TTL). If the hub fails, it
  keeps serving the stale copy for up to 7 days. That's C's resilience
  without C's staleness.

### 4.6 Rate limiting and CORS

- `allowRequest()` (`src/lib/rate-limit.ts`), keyed on
  `clientIpFrom(req.headers)`: GET 300/min per IP, POST shares the existing
  `leads|<ip>` bucket (10 per 10 min). PHP spokes on the same Hostinger
  account probably share one outbound IP. With the spoke cache the volume is
  tiny, but watch for 429s (§8.4). If they appear, add an optional per-door
  key header to lift the limit. That's not in v1.
- CORS: GET and POST answer with `Access-Control-Allow-Origin` echoing the
  Origin **only** if it is `https://<host>` or `https://www.<host>` of a
  `delivery: "static"` door, or listed in `PUBLIC_API_EXTRA_ORIGINS` (an env
  var, for the founder's temporary `*.hostingersite.com` spoke URLs while
  building; no domain goes into code). Server-to-server GETs from PHP carry no
  Origin and need no CORS.

### 4.7 Files to add (when approved)

| File | What |
|---|---|
| `src/config/verticals.ts` | new optional field `delivery?: "app" \| "static"` (unset = app) |
| `src/lib/public-api/doors.ts` | pure: the static-door table, Origin → door map, CORS headers |
| `src/lib/public-api/serialize.ts` | pure: `toPublicListing()`, the allowlist |
| `src/lib/public-api/page-seo.ts` | pure: canonical/robots/alternates for a (door, path) built only from `categoryTarget()`, `sitePageTarget()`, `getIndexability()`, `alternatesFor()` |
| `src/lib/public-api/queries.ts` | `server-only`: cached readers on `publishedFacetWhere()` |
| `src/lib/lead-submit.ts` | the shared core pulled out of `app/api/leads/route.ts` (parse → route → `recordLead` → `sendLeadCopies`), so the two lead endpoints are **one path** |
| `app/api/public/v1/{listings,facets,page,sitemap,leads}/route.ts` | thin handlers |
| `scripts/verify-public-api.ts` | `npm run verify:public-api`: forbidden keys absent, the cache key contains the door, the Origin map matches `verticals.ts`, unknown door → 404. Added to `verify:local` and the pre-push hook |
| `src/lib/ops/door-manifest.ts` + `scripts/door-manifest.ts` | `npm run door:manifest -- --door terreno`: read-only. Lists every URL the door serves today (its sitemap set + every redirect source from `next.config.ts` for that host). This is the cutover parity checklist |
| `scripts/verify-seo.ts` | block **(p)**, §6 |
| `.env.example` | `PUBLIC_API_EXTRA_ORIGINS`, optional `TURNSTILE_SECRET_KEY` |

No schema change. No auth or payments code touched. The lead endpoint is a
new public write path, so the PR is for the founder to merge, not an agent.

---

## 5. SEO for HTML doors

### 5.1 What a spoke may own

Exactly what its `verticals.ts` row already lets it own, and nothing more:

- its home, its operation hub (`/venta`, `/alquiler`), its own pages
  (`/nosotros`|`/about`, `/contacto`|`/contact`, `/terminos`, `/privacidad`,
  rental `/services/*`, residency pages);
- the evergreen pages whose registry entry names it (`door` in
  `src/content/evergreen/index.ts`). Today only terreno's 9 land pages.

It must **not** render `/propiedad/*`, category grids, guides, price pages,
project pages or directory profiles. Its cards and menus link to the hub's
canonical URL for those. Rendering them would make it a duplicate, even with
a canonical tag. Linking is cleaner, and it's what the flags already decide.

### 5.2 What a spoke must render server-side (in the HTML, not via client JS)

`<title>`, meta description, `<link rel="canonical">` (self, from
`/page`'s `seo.canonical`), `<meta name="robots">`, `hreflang` links **exactly
as `seo.alternates` returns them** (and none when it returns none), one `<h1>`,
the intro and evergreen copy, the listing cards as real `<a href>` links with
`<img alt>`, `Organization` + `WebSite` JSON-LD for the door (no `email`
contactPoint, the CLAUDE.md rule), Open Graph tags with a **static** image
(the hub's `/api/og/door` brands by Host, so it would show the hub's brand),
`/robots.txt` and `/sitemap.xml` built from `/sitemap`. Counts and prices
come from the API, never typed into the HTML (the evergreen "no number in a
content file" rule still holds).

The temporary `*.hostingersite.com` build URL **must** send
`X-Robots-Tag: noindex` and a `Disallow: /` robots.txt, or Google indexes the
staging copy as a duplicate.

### 5.3 terreno.com.py's evergreen land pages

`inmobiliaria.com.py`'s copies of those 9 paths canonicalise **to
terreno.com.py** today (`categoryTarget()`). So the spoke must answer each of
them with 200, self-canonical and the full content, or the marketplace
canonicalises to a 404. Two ways (§9 Q4):

- **(a) Recommended:** the spoke renders them from `GET /page?door=terreno&path=…`.
  Content stays in `src/content/evergreen/*.ts` (edited in one place),
  inventory and price bands come live from the hub, and `verify:seo`'s
  paragraph and word-count rules keep applying.
- (b) Before cutover, move those 9 entries' `door` to `inmobiliaria`. The
  spoke then has no evergreen pages, and terreno loses the land-keyword pages
  it was given in S9.

### 5.4 hreflang

Spokes emit only what `alternatesFor()` derives. Delegating doors emit none
today, and a delegating door is never a language version of another family's
door. The one place a spoke can appear in a set is an evergreen page, through
`ownerHostByLocale`. Because the hub computes `seo.alternates` with the same
function, the hub page and the spoke page always reciprocate. Hand-written
hreflang on a spoke is forbidden.

---

## 6. Ownership flags and `verify:seo`

A spoke keeps its row in `verticals.ts`, still `enabled: true`, so every
canonical, hreflang and evergreen derivation keeps treating it as a served
door. It gains `delivery: "static"`. Nothing else about the derivation
changes, because the flags already describe what a spoke owns. New block
**(p)** in `scripts/verify-seo.ts` refuses a push where a `delivery: "static"`
door:

1. has `ownsListingDetail: true`, `ownsCategories` ≠ `false`,
   `ownsSitePages` ≠ `false`, or `ownsDirectory: true`;
2. is `CANONICAL_HOST` or `MARKETPLACE_PRIMARY_HOST`;
3. owns an evergreen path while the API's `page` endpoint can't serve it
   (checked against the registry);
4. would leave a locale with no app-served owner for detail, categories or
   site pages.

`check:live` (`src/lib/ops/live-check.ts`) needs no change: it fetches each
door's home, evergreen paths and a sitemap sample over HTTP, so after cutover
it automatically becomes the spoke's parity monitor. While a spoke is being
built, the domain still points at Node, so nothing changes.

If a request for a spoke's host ever reaches the app again (rollback), the
middleware renders that door exactly as today. That's what makes rollback a
DNS move and nothing else.

---

## 7. Leads from HTML doors

### 7.1 Path

The browser on the spoke POSTs straight to
`https://<hub>/api/public/v1/leads` (CORS, §4.6). No PHP proxy. A PHP proxy
would make every visitor share the spoke server's IP, so the 10-per-10-min
limit would cover the whole door.

1. Origin must map to a static door. **The door comes from Origin, never from
   the body.** No Origin → 403 (this endpoint exists only for browsers; the
   existing `/api/leads` keeps its own rule).
2. JSON (preflighted) or `application/x-www-form-urlencoded` (a no-JS
   `<form>` fallback; answered with a 303 to `https://<door>/gracias`).
3. The body is a subset of the existing schema: `leadType` (buyer, renter,
   seller, landlord, question), optional `listingPublicId`, `name`,
   `whatsapp`, `email`, `message`, `utm`. Plus a honeypot field (must be
   empty) and an optional Turnstile token.
4. A `listingPublicId` that isn't published, or that the door's filters
   don't admit (`verticalAdmits()`), is dropped from the lead, never a 400. A
   lead is never lost.
5. `lead-submit.ts` (shared with `/api/leads`): `leadLaneFor()` →
   `recordLead({ vertical: <door key> })` → `sendLeadCopies()` →
   `deliverLead()`. **`leads.vertical` is the spoke's key, so
   `VENDERCRM_KEY_<DOOR>` routing, `/admin/leads` and alerts work unchanged.**
   The server stamps `utm.surface = "static"` so spoke leads can be counted.
   No schema change.

### 7.2 Spam

The same `leads|<ip>` rate limit, the 32 KB body cap, `checkPhone()`, the
honeypot, and the existing per-address cap on confirmation emails. Optional:
Cloudflare Turnstile (free) when `TURNSTILE_SECRET_KEY` is set (§9 Q7). The
Origin check is a filter, not a security boundary; the rate limit is what
bounds abuse, same as today.

### 7.3 Leads that start on a spoke and finish on the hub

A visitor who clicks a card on terreno.com.py lands on
`inmobiliaria.com.py/propiedad/…`, and a lead sent there is stamped with the
hub's `vertical`. The API appends `utm_source=<spoke host>` to every
`canonicalUrl`, and `LeadForm` already copies `utm_*` from the landing URL
into `leads.utm`, so `/admin/leads` still shows which door sent the visitor.
(A utm on an internal link doesn't hurt SEO: the hub's canonical tag strips
it.)

---

## 8. Migration order, rollback, measurement, and the commands to run

### 8.1 Order

| Step | What | Who | Node stays? |
|---|---|---|---|
| 0 | Baseline 24 h after #266 (§8.3, commands 1–4) | founder | yes |
| 1 | Tests A/B/C (commands 5–6), DNS/layout facts (7–8) | founder | yes |
| 2 | **If Test B passes:** Worker pilot on terreno.com.py (`docs/hosting-process-cap.md` §5), 24 h measure, then the other doors one at a time. **The doors still run on Node.js**, only the hostname Hostinger sees changes (§9 Q1) | founder | yes |
| 3 | Public API PR (§4.7). Founder reviews and merges | agent builds, founder merges | yes |
| 4 | Founder builds each spoke on a temporary Hostinger URL against the API (noindex, `PUBLIC_API_EXTRA_ORIGINS`) | founder | yes |
| 5 | **Per-door cutover, only when that door's HTML is finished:** run `door:manifest` and check every URL answers on the spoke as it did on Node (200, or the same 301) → PR flips `delivery: "static"` (verify:seo green) → move the domain → `check:live` green → submit the spoke's sitemap in Search Console → watch Coverage for 2 weeks | both | **that door only** moves |

Cutover order (lowest SEO risk first):
**landforsaleparaguay.com** (not live yet) → **residenciaenparaguay.es**
(no listings; proves the lead endpoint) → **rentparaguay.com** (move the
WordPress 301 map to `.htaccess`; `door:manifest` lists every source) →
**terreno.com.py** (the evergreen pages, §5.3) → `inmobiliarios.com.py`
only if Q5 says so. `landforsaleinparaguay.com` can become a plain redirect at
any time, without Node. The primaries never move.

"Move the domain":
- If the door is already behind Cloudflare (step 2 done): remove its Worker
  route and point the proxied record at the spoke's origin. Instant. Rollback
  = put the route back.
- If not: remove the domain from the Node app's parked list in hPanel, then
  attach it to the static website. A few minutes of SSL issuance. Rollback =
  the reverse.

**Rollback per door, in every case:** point the domain back at the Node app
and revert the `delivery` PR (`git revert`). The app still knows the door and
renders it from the same rows; URLs are identical, so a rollback within days
costs no rankings.

### 8.2 What to measure, before and after each step

- `pmon2.log`: propia copy count and total threads, peak per hour.
- `reap.log`: kills per day. The goal is ~0 once #266 and/or A work.
- console.log: `[lifecycle] … exiting: orphaned` lines per day (the #266
  self-exit).
- Per spoke after cutover: `check:live` result, Search Console Coverage
  (indexed vs "submitted URL not selected as canonical"), leads per door per
  week (`/admin/leads` filtered by door), API 429s and errors in the app log.

### 8.3 Commands to run and paste back

All on the server over SSH unless marked. Paste the full output.

**1. Copies and threads right now** (run 3×, an hour apart):

```bash
date
ps -u "$USER" -o pid,ppid,nlwp,etime,args --sort=start_time | grep -E '[n]ext-server|[l]snode|[l]sphp'
echo "threads total: $(ps -L -u "$USER" --no-headers | wc -l)"
for p in $(pgrep -u "$USER" -f next-server); do readlink /proc/$p/cwd; done | sed 's#/hbuilds.*##' | sort | uniq -c
```

**2. Reaper kills per day** (paste the `tail` too, so the next version of this
command can match your log format exactly):

```bash
tail -5 ~/reap.log
awk '{print $1}' ~/reap.log | sort | uniq -c | tail -14
```

**3. Process monitor trend:**

```bash
tail -30 ~/pmon2.log
```

**4. Did the #266 orphan exit fire?** (use the same console.log path where you
saw the paired startups):

```bash
grep -h '\[lifecycle\]' <path-to-the-app-console.log> | tail -20
```

**5. Test A: does `X-Forwarded-Host` reach the app?** (from anywhere)

```bash
curl -s -H 'X-Forwarded-Host: terreno.com.py' https://realestateinparaguay.com/ | grep -o '<title>[^<]*' | head -1
curl -s https://realestateinparaguay.com/ | grep -o '<title>[^<]*' | head -1
```

**6. Test B: one hostname, many doors** (then Test C = your `~/dtest.sh`
right after, paste `~/dtest.log`):

```bash
cnt(){ pgrep -u "$USER" -f 'next-server' | while read p; do readlink /proc/$p/cwd; done | grep -c realestateinparaguay; }
pkill -u "$USER" next-server; sleep 5; echo "start $(cnt)"
for d in realestateinparaguay.com inmobiliaria.com.py www.inmobiliaria.com.py inmobiliarios.com.py terreno.com.py \
         www.terreno.com.py rentparaguay.com residenciaenparaguay.es landforsaleparaguay.com; do
  curl -s -o /dev/null -w "$d %{http_code} " -H "X-Forwarded-Host: $d" https://realestateinparaguay.com/
  sleep 20; echo "copies=$(cnt)"
done
```

**7. Where each domain's DNS is today** (from anywhere; decides how much work A
is per door, and whose MX records must be copied):

```bash
for d in inmobiliaria.com.py realestateinparaguay.com inmobiliarios.com.py terreno.com.py rentparaguay.com \
         landforsaleparaguay.com landforsaleinparaguay.com residenciaenparaguay.es; do
  echo "$d NS=[$(dig +short NS $d | tr '\n' ' ')] A=[$(dig +short A $d | tr '\n' ' ')] MX=[$(dig +short MX $d | tr '\n' ' ')]"
done
```

**8. What a PHP site costs on this plan** (pick any existing PHP/HTML site on
the same Hostinger account; this tells whether `lsphp` workers are cheap and
exit by themselves):

```bash
S=https://<an-existing-php-site-on-this-account>/
for i in $(seq 30); do curl -s -o /dev/null "$S" & done; wait; sleep 2
echo "-- right after"; ps -u "$USER" -o pid,ppid,nlwp,etime,args | grep '[l]sphp'
sleep 90
echo "-- 90 s later"; ps -u "$USER" -o pid,ppid,nlwp,etime,args | grep '[l]sphp'
ls -d ~/domains/*/ 2>/dev/null | head -20
```

### 8.4 Decision table: Test results → option

| Test A (header) | Test B (copies with one hostname) | Then |
|---|---|---|
| reaches the app | stays at 1 (or 2 = the startup pair) | **A for every non-primary door** (pilot terreno, 24 h, then one door at a time). The cap is solved and doors stay on Node. Spokes (B) become optional per door, cut over only when their HTML is finished |
| stripped by LiteSpeed | stays at 1–2 | A is still the fix, but needs a small PR: the Worker and `host.ts` read a different header name (e.g. `x-door-host`). Re-run Test A with that name, then as above |
| either | grows per request, as with real hostnames | **The hostname isn't the cause. Move no DNS.** Keep #266 + thread env vars + reaper, and measure 24 h. If peaks stay above ~120 threads: **E (VPS)** for the Node app. Spokes still help in proportion to the traffic they take off Node, but don't solve it |
| either | inconclusive (slow growth, noisy) | Run Test B a second time. If still unclear, the terreno Worker pilot *is* the experiment (fully reversible): compare 24 h of `pmon2.log` before and after |
| — | after #266, copies already stay ≤ 3 with 0 reaper kills for 24 h | nothing urgent. Choose A or B per door on business grounds alone |

Whatever the outcome, B is how **new** domains should join if you want them
as standalone HTML sites. A is how they join if you want them rendered by the
app.

---

## 9. Open founder decisions

Also written to `docs/decisions-needed.md` (2026-10-02 entry).

1. **Worker before HTML?** Does "keep the current sites on Node.js until the
   HTML is finished" allow putting the Worker in front of them? They still run
   on Node; only the hostname Hostinger sees changes. *Recommended: yes, if
   Test B passes.*
2. **Which doors become HTML at all**, and in which order? *Recommended order:
   landforsaleparaguay.com → residenciaenparaguay.es → rentparaguay.com →
   terreno.com.py.* If A solves the cap, you may decide some never need to.
3. **Listing detail on spokes:** cards link to the hub's `/propiedad` page
   (*recommended*: no duplicate pages, no seller contact data in the API), or
   the spoke renders its own detail page with a canonical to the hub (more
   API, needs seller contact rules)?
4. **terreno.com.py's 9 evergreen land pages:** the spoke renders them from
   the API (*recommended*, content stays edited in this repo), or ownership
   moves to inmobiliaria.com.py before cutover?
5. **inmobiliarios.com.py stays on Node** (*recommended*: profiles, matching
   and directory leads have no API in this plan)?
6. **API hostname:** `realestateinparaguay.com` (*recommended*: it stays
   directly on Hostinger in both A and B) or `inmobiliaria.com.py`?
7. **Spam:** honeypot + rate limit only (default), or also Cloudflare
   Turnstile (needs a site key in the spokes and `TURNSTILE_SECRET_KEY` in
   hPanel)?
8. **Where spokes are hosted:** Hostinger websites with PHP (*recommended* to
   start: the PHP template you already use, file cache, Hostinger Git
   deploy), or Cloudflare Pages / Workers static assets (zero Hostinger
   processes, but no PHP, so pages must be rebuilt on a schedule)?
9. **If Test B fails:** OK to budget a VPS (~US$7–15/month + 1–2 days setup)
   for the Node app?
10. **Seller phone numbers in the API:** none in v1 (*recommended*), even
    where the hub's detail page shows a WhatsApp button?
