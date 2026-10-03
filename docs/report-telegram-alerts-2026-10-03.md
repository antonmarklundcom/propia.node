# Telegram alert report — 2026-10-03

What the "Inmobiliaria Notificaciones" bot reported, what causes each alert, and
a proposed fix for each. Written for the founder and as input to a planning
session. The analysis comes from reading the code on `main` (bb5bf03). The
cloud session that wrote this has no network path to production, so **no live
URL was fetched**. Every cause below is inferred from code and docs. Where it
is a hypothesis, the text says so and names the check that would settle it.

## 0. Summary

The chat holds about 40 messages, but they reduce to **five problems**:

| # | Problem | Alerts | Severity | Owner |
|---|---|---|---|---|
| A | 5 evergreen pages return 404: their city or barrio is **missing from the production `locations` table** | the "5 páginas" alert, repeated ~30× | High: these are SEO landing pages that are in the sitemap | Founder runs one command; code hardening too |
| B | 21 `residenciaenparaguay.es/guias/<cat>/<slug>` URLs return 500. **These URLs are not produced by this app** | the "21/22 páginas" alert, ~6× | Medium: points to a domain-mapping problem | Founder (hPanel/DNS) + a one-line code guard |
| C | Server errors `Failed query … from locations` / `… COUNT(*) from projects` and the generic digest `3199681123`, mostly on `?vista=mapa` | 7 alerts | High: real visitors got a 500 | Code + infra (process pile-up) |
| D | The same live-check alert repeats over and over (alert spam) | all of the above | Medium: noise hides real incidents | Code |
| E | **Product request:** a category page with no listings should never 404. It should stay up with unique text, a CTA and related links | — | Product/SEO decision | Plan + code |

One informational message, "Un aviso espera revisión — LOCAL COMERCIAL … WhatsApp
sin verificar", is the normal review-queue notice. Approve or reject it in
`/admin`. It needs no fix.

---

## A. The five 404s are evergreen pages whose location does not exist in production

```
404 https://terreno.com.py/venta/san-bernardino/terrenos
404 https://realestateinparaguay.com/venta/san-bernardino/casas
404 https://inmobiliaria.com.py/venta/san-bernardino/casas
404 https://inmobiliaria.com.py/alquiler/asuncion/loma-pyta/casas
404 https://inmobiliaria.com.py/alquiler/asuncion/loma-pyta/departamentos
```

**Not caused by "no properties".** Evergreen pages already render 200 at zero
listings: `getIndexability()` returns `index` for any evergreen page
(`src/lib/indexability.ts:37`).

**Cause.** All five are the "S10" evergreen pages for **San Bernardino** and
**Loma Pytã**, which were added after the last production location seed.
`resolve()` in `app/[operacion]/[...segments]/page.tsx:209` and `:225` returns
`null` when `resolveCity()` or `resolveBarrio()` finds no row, and the page then
calls `notFound()` (line 372). That happens *before* the evergreen exception is
checked. Both places are already in the seed tree (`src/lib/ops/location-tree.ts:45`,
`:137`). CLAUDE.md predicted this exactly: *"they 404 until `seed:locations`
runs on production."*

**Fix now (founder, ~2 minutes):**

```bash
npm run seed:locations -- --dry   # confirm it adds San Bernardino + Loma Pytã
npm run seed:locations
npm run cron:geo -- --dry && npm run cron:geo   # CLAUDE.md: run after seed:locations
```

Run these with `DATABASE_URL_RW`, from the founder's machine. Then use
`/admin/operaciones` → "check:live" to confirm all five return 200.

**Fix so it cannot recur (code):**

1. When an evergreen path's city or barrio is missing from the DB, still render
   the evergreen page. Fall back to the static `location-tree.ts` entry for name
   and centroid, with count 0. A registered evergreen page then never 404s.
2. Or, as a cheaper alternative, add a check (in `check:live` or `db:status`)
   that every evergreen path resolves against the database. Name the missing
   locations and the command that fixes them, so the alert says *"run
   seed:locations"* instead of a bare 404.
3. Keep evergreen paths out of the sitemap while their location is missing.
   Today they are listed and then 404, which Google sees.

---

## B. `residenciaenparaguay.es` — 21 × 500 on URLs this app does not have

```
500 https://residenciaenparaguay.es/guias/documentos/residencia-vencida-en-paraguay-multa-y-prorroga
500 https://residenciaenparaguay.es/guias/por-pais/residencia-en-paraguay-para-cubanos
… (21 in total, all /guias/<category>/<slug>)
```

**What the code says:**

- This app's residency door (PR #263, 2026-10-01) serves 14 flat pages
  (`/residencia-paraguay`, `/requisitos-residencia-paraguay`, …, see
  `src/content/residency/pages-*.ts`). It has **no `/guias/<cat>/<slug>`
  route**. No branch or commit in the repo contains these slugs.
- On this door, `/guias/...` is a marketplace path. `middleware.ts:38` would
  **308** it to `inmobiliaria.com.py`. It would not return a 500. `app/guias/[slug]`
  also accepts only one segment.
- `check:live` takes these URLs from `https://residenciaenparaguay.es/sitemap.xml`
  (`src/lib/ops/live-check.ts`, `sitemapSample()`).

**Conclusion (high confidence, unverified live):** `residenciaenparaguay.es`
currently points at **a different site**. It is most likely the domain's
previous or other deployment, whose sitemap lists those `/guias/...` guides and
which is answering 500. It does not point at this Next.js app. CLAUDE.md lists
"DNS/Hostinger domain mapping is a manual step" for this door. Because the
vertical is `enabled: true` and not in `NOT_LIVE_YET`, `check:live` probes it
anyway.

**Check:** open `https://residenciaenparaguay.es/` in a browser. If it does not
show "Residencia en Paraguay" with the 14 landing pages, the domain is not mapped
to this app.

**Fix:**

1. Founder: decide which site should own `residenciaenparaguay.es`.
   - **This app:** map the domain in hPanel to the propia.node Node app (same
     as the other doors). After that, the old `/guias/<cat>/<slug>` URLs, which
     may already be indexed, need a 301 map to the new flat pages. Otherwise
     they 308 to inmobiliaria.com.py's `/guias/...` and 404 there.
   - **The other site:** set `enabled: false` (or remove the vertical) and fix
     that site's 500s there. That site is outside this repo.
2. Code, now: add `residenciaenparaguay.es` to `NOT_LIVE_YET` in
   `src/lib/ops/live-check.ts` until the mapping is done. CLAUDE.md's own rule
   is *"remove a host from it the day its DNS is live"*. Today's alert is a
   false alarm about this app.
3. If the old site had real Google traffic on those guide URLs, add a 301
   redirect map (old guide → closest of the 14 landing pages) in
   `next.config.ts`'s `redirects()` before switching DNS.

---

## C. Server errors: `Failed query` on simple lookups, mostly on map view

```
GET inmobiliaria.com.py/venta/luque?tipo=comerciales&vista=mapa
  Error: Failed query: select … from `locations` where slug = ? and level = ?  params: luque,ciudad,1
GET rentparaguay.com/alquiler/asuncion?tipo_vacio=casas&barrio=mburicao
  Error: Failed query: select … from `locations` …  params: asuncion,ciudad,1
GET www.terreno.com.py/datos
  Error: Failed query: select COUNT(*) from `projects`
+ 4× "An error occurred in the Server Components render", digest 3199681123
  (inmobiliaria …/venta/asuncion?vista=mapa…, realestateinparaguay …?tipo_vacio=oficinas…&vista=mapa,
   rentparaguay …?tipo_vacio=casas…, inmobiliaria …/venta/luque?tipo=comerciales&vista=mapa)
```

**What it is.** These queries are trivially correct: a one-row lookup by slug,
and a `COUNT(*)`. They do not fail because of SQL. Drizzle's "Failed query"
wraps the real MySQL error in `error.cause`, and **the alert discards it**:
`planErrorAlert()` in `src/lib/error-alerts.ts:92` prints only `e.message`. So
the actual reason is invisible. The digest `3199681123` is the generic
production wrapper for the same render failures. The same digest on four URLs
points to one root cause.

**Most likely cause (hypothesis):** database connection exhaustion.

- The pool is 6 connections + 24 queued per process (`src/db/index.ts`). Its own
  comment says *"the real total is connectionLimit × processes"*.
- CLAUDE.md item 23: Hostinger's launcher **piles up orphaned copies of this
  app**. Ten copies use 60 connections, and shared MySQL users are usually
  capped well below that (`max_user_connections`). A failed connect or
  `Queue limit reached` appears as exactly this "Failed query".
- Map view (`?vista=mapa`) is the heaviest render. `ListingBrowser.tsx:43` runs
  five reads in one `Promise.all` (listings, cities, barrios, stocked paths,
  door), the map pins API runs more, and `resolveCity()` / `resolveBarrio()`
  (`src/lib/queries.ts:252`) are **uncached**: every request queries
  `locations`.
- Alert D (the repeated "tras un deploy" messages) points the same way: the
  check runs a minute after a server start, so ~30 alerts means many process
  starts.

**Check:** `/admin` health box or `SHOW STATUS LIKE 'Threads_connected'`,
`SHOW VARIABLES LIKE 'max_user_connections'`, and on the server
`ps -ef | grep next` to count running app processes. Better: ship fix 1 below
first, so the next alert names the real MySQL error code.

**Fix:**

1. **Make the alert say why** (small, safe): in `planErrorAlert()` append
   `e.cause?.code` / `e.cause?.message` (for example `ER_USER_LIMIT_REACHED`,
   `ER_CON_COUNT_ERROR`, `ECONNRESET`, `Queue limit reached`). Also include
   `e.cause` in the throttle key so different causes are not merged.
2. **Cache location lookups.** `resolveCity` and `resolveBarrio` resolve slugs
   that change only when `seed:locations` runs. Wrap them in `unstable_cache`
   plus `singleFlight()` with a tag that `seed:locations` revalidates. This
   follows the existing "every tag has a writer" rule in `src/lib/cache.ts`.
   It removes 1–2 queries from every category, map and `/api/mapa` request.
3. **Map view under pressure:** run ListingBrowser's five reads through
   `loadSections()` with a concurrency cap, and let the non-essential ones
   (cities list, barrios, stocked paths) degrade (`src/lib/degrade.ts`) rather
   than 500 the page.
4. **`/datos` on `terreno.com.py`:** the `COUNT(*) from projects` is
   non-essential to that page. Degrade it the same way. Also note
   `terreno.com.py` is `ownsSitePages: false`, so this page only canonicalises
   to inmobiliaria.com.py, yet it still pays the full DB cost.
5. **Infra (founder):** the process pile-up (`docs/hosting-process-cap.md`,
   CLAUDE.md item 23) is the likely root. Confirm the process count and
   whether `max_user_connections` is being hit before changing pool bounds.
   Pool bounds and `src/db/index.ts` are not an agent's to edit.

---

## D. Alert spam: the same failure set re-sent ~30 times

`check:live` runs **a minute after every server start**
(`instrumentation-node.ts`), once per build via a lock file
(`src/lib/ops/process-lock.ts`). It also runs daily from the tick. Nothing
remembers what it already reported. The result:

- Every merge, and every restart of an orphaned process, re-sends the same five
  404s. There were many merges this week (#263–#277).
- The alternation between "5 páginas" and "22 páginas" alerts is consistent
  with **two builds running at once**. A build from before #263 (2026-10-01)
  does not know `residenciaenparaguay.es` and checks only 5 failures; newer
  builds also check that door and find 21 more. This is another sign of
  orphaned old processes, which would fit C. *Hypothesis.* An intermittent
  sitemap fetch on that host could also explain it.

**Fix:**

1. **Fingerprint the failure set.** Store a hash of the sorted failing URLs plus
   status in `site_settings` or `ops_runs`. Alert only when the set changes (new
   failures or recoveries), plus at most one reminder per 24 h while it stays
   unchanged. Send a "✅ resolved" message when the set becomes empty.
2. Group the alert by cause instead of by URL ("5 evergreen pages: location
   missing → run seed:locations"; "residenciaenparaguay.es: every sitemap URL
   500s → domain not mapped?"), together with the action to take.
3. Put the build id in the title ("tras deploy `abc123`"), so two builds racing
   each other is visible.

---

## E. Product request: empty category pages must stay up (never 404)

**Today's rule** (`getIndexability()` + `CategoryPage`):

| Page | 0 listings | 1–2 listings | ≥ 3 |
|---|---|---|---|
| Evergreen (42 + 8 EN paths in `src/content/evergreen/index.ts`) | **200**, indexable, unique 500–900-word text, `BuyerBrief` | 200 index | 200 index |
| Typed, non-evergreen (`/venta/luque/oficinas`) | **307 redirect** to the nearest stocked parent with `?tipo_vacio=` | 200 noindex | 200 index |
| City, non-evergreen (`/venta/caacupe`) | **404** | 200 noindex | 200 index |
| City/barrio not in DB at all | **404** (the alert A case) | — | — |

So outside the evergreen set, an empty page either bounces or 404s. The 404s in
this chat are **not** empty-page 404s. They are case A. But the request stands:
a stable URL that sometimes 404s and sometimes 200s, as stock comes and goes,
is bad for visitors and for Google.

**Proposed rule (to plan and confirm):** every *valid* combination (known city,
optional known barrio, known type, known operation) returns **200 at 0
listings**, built as:

1. **An honest empty state at the top:** "No hay casas en alquiler en Loma Pytã
   en este momento". No fake listings.
2. **Primary CTA:**
   - `BuyerBrief` ("contanos qué buscás y te avisamos/lo buscamos"). It
     already exists in `src/components/BuyerBrief.tsx` and is prefilled from the
     URL.
   - `SaveSearch` email alerts (`src/components/SaveSearch.tsx`, when email is
     configured).
   - A WhatsApp button when `NEXT_PUBLIC_CONTACT_WHATSAPP` is set.
3. **Nearest real stock:** the same type in neighbouring barrios or the city, the
   other operation (alquiler ↔ venta), and other types in the same place. All
   of these exist as data (`getCategoryInventory()`, `relatedCategoryLinks()`).
4. **A short unique text block further down, "Sobre <lugar>":**
   - Source it from data, not a template with the city swapped. The
     `locations.guide_content_es` / `guide_content_en` columns **already exist
     and are unused**: fill them per city/barrio (an AI-drafted, founder-checked
     job, like `cron:translate`) and render that.
   - Add live facts: listing counts nearby, the median price for the city
     (`cityPricesFor()`), and related guides (`src/lib/guide-links.ts`).
   - No numbers in prose (the same rule as evergreen).
5. **SEO:** keep non-evergreen 0-listing pages **`noindex,follow` and out of the
   sitemap**. A 200 thin page that is indexed is a soft-404 / doorway risk; the
   evergreen rule ("no two pages share a paragraph") exists for that reason.
   Visitors and links get a working page; Google indexes only pages with stock
   or real unique content. Promote a place to evergreen when it earns it
   (Search Console impressions on `/admin/google`).
6. **Truly invalid URLs** (unknown city slug, a typo) still 404, but the 404 page
   already lists cities (`app/not-found.tsx`). Add a "did you mean" link to the
   closest slug.

**Decisions needed from the founder before building E:**

- E-1: Replace the redirect-on-empty for typed pages with a 200 empty page,
  yes or no? (The redirect is current SEO policy; changing it is a founder
  call.)
- E-2: Should non-evergreen empty pages be noindex (recommended) or indexed?
- E-3: Who writes and checks `guide_content_es/en`: an AI draft plus founder
  review (a `claimsToVerify` list per place, like evergreen), or the founder
  only?
- E-4: CTA priority on an empty page: BuyerBrief, WhatsApp or email alert
  first?

---

## Suggested order of work

1. **Founder, today:** run `seed:locations` + `cron:geo` (fixes A). Check where
   `residenciaenparaguay.es` points (B).
2. **Small PR (low risk):** `NOT_LIVE_YET += residenciaenparaguay.es` until it is
   mapped; include `error.cause` in server-error alerts (C-1); fingerprint
   live-check alerts and send them only on change, plus a "resolved" message
   (D-1).
3. **Performance PR:** cache `resolveCity` / `resolveBarrio` with a writer in
   `seed:locations` (C-2); degrade the non-essential reads on map view and
   `/datos` (C-3, C-4). Then watch whether C recurs. If it does, the new alert
   text names the MySQL error, and the work moves to the process pile-up (C-5).
4. **Hardening PR:** evergreen pages render from `location-tree.ts` when the DB
   row is missing, and sitemap/check skip them until then (A-1..3).
5. **Plan + build E** after decisions E-1..E-4 are made: the empty-category
   page, `guide_content` generation, and related-stock links.
6. **If B goes to this app:** a 301 map from the old `/guias/<cat>/<slug>`
   URLs to the 14 landing pages, then DNS.

## Not verified

- No production URL, database or log was reachable from this session. Every
  "cause" above comes from code plus CLAUDE.md. B (domain not mapped) and C
  (connection exhaustion) are the two inferences most worth confirming first.
- The count of alerts (~40) is from the pasted chat, not from `ops_runs`.
