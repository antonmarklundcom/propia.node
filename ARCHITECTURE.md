# ARCHITECTURE.md — propia.com.py

Paraguay real-estate portal. One engine, multiple branded doors. Target: 15k
listings at launch maturity, 50–100k ceiling, solo founder + Claude Code
maintaining it.

**v2 amendments (2026-07-04), superseding the original brief where they conflict:**

1. **propia.com.py launches FIRST and alone.** The terreno.com.py beachhead is
   dropped from this build. Listing detail pages are canonical on propia from
   day one — the 301 migration map is no longer needed. Feeder domains
   (terreno, alquiler, inmobiliarios, desarrolladores, EN site) stay
   pre-declared in `src/config/verticals.ts` with `enabled: false` so turning
   one on later is a config flip, not a refactor.
2. **No calendar timeframes.** Milestones are strictly sequential with STOP
   gates; ship each as fast as it passes its gate. Goal: propia.com.py live,
   listing properties and earning SEO traffic, ASAP.
3. **No Diana / no second operator.** Review queue, white-glove imports, and
   lead follow-up are founder tasks (or GHL automations). `leads.routed_to`
   uses `internal`, not a person.
4. **GHL is the CRM of record** for leads, WhatsApp messaging, and OTP
   delivery. See §5 (CRM strategy) for the sub-account / own-CRM path.
5. **Model workflow:** Fable 5 does architecture, planning, and the
   hardest/most expensive-to-unwind problems, then STOPs for human review;
   Opus 4.8 executes the heavy implementation phases; Sonnet 5 executes
   templated work (page templates, forms, wizard steps, copy wiring).

**v3 amendments (2026-07-05), superseding v2 and the original where they
conflict:**

1. **Financing data is deferred, not a launch blocker.** The cuota engine
   and UI stay as built; they degrade gracefully (no qualifying
   `financing_programs` row → no cuota line on the card). Verifying real
   Che Róga Porã / AFD / partner-bank terms, the tiered-fallback selection
   (Che Róga Porã → AFD Mi Casa → private bank), and any bank integration
   move to the monetization milestone. The admin panel (§6.4) gets a
   `financing_programs` editor so updating rates later is a 2-minute task,
   not a deploy.
2. **Build order re-sequenced around the founder's priorities** — polished
   front end, accounts + publishing funnel, en-pozo/multi-unit project
   pages, and a real admin panel come BEFORE search-at-scale, scrape
   importers, and monetization. New plan in §7; design decisions in §6.
3. **Auth is a Google OAuth + WhatsApp OTP hybrid** (§6.1). Google = low
   friction identity; verified WhatsApp = the publish gate. They are
   orthogonal and both land in the existing `users` table.
4. **Projects become a public surface.** `/proyectos/{slug}` template for
   edificios / loteamientos / en-pozo developments listing their units
   (§6.3); the wizard gets a developer path that attaches units to a
   project (§6.2).
5. **The admin panel replaces Drizzle Studio** as the management surface
   (§6.4). Studio remains an emergency hatch only.
6. **Nothing in M4′–M7′ requires the production domain.** The domain
   unlocks only the §7 day-of-domain checklist (DNS, canonical host, OAuth
   redirect URIs, GSC, GHL webhook, R2 custom domain, GA4).

Constraining facts: (1) hosting starts on Hostinger shared/cloud (Brazil
region — São Paulo is the lowest-latency major region to Paraguay), migrate
once traction is proven; (2) inventory seeded by scrape/API bootstrap +
white-glove agency imports + paid ads driving FSBO sellers; (3) maps are free
OSM-based to start.

---

## 1. Tech stack

One Next.js app on MySQL. No WordPress/JetEngine — the portal is a product,
not a content site; everything that makes propia win (import/dedup pipeline,
cuota calculation, lead routing to GHL, market-median jobs, Claude-API content
pipeline) is custom code that fits a Node app.

**MySQL, not Postgres — deliberately.** Hostinger provides MySQL/MariaDB free
with the plan. MySQL 8 with proper composite indexes handles 100k-row faceted
filtering easily (the incumbent's whole inventory is 14.5k rows). The escape
hatch is baked in:

- **Drizzle ORM** (`src/db/schema.ts`) — schema in TypeScript, migrations
  generated. Switching to the Postgres driver later is contained and mostly
  mechanical.
- **No MySQL-only cleverness**: no stored procedures, no MySQL-specific JSON
  tricks in hot paths. Geo queries are plain lat/lng bounding boxes on
  `idx_geo` — nothing blocks a Postgres/PostGIS upgrade.

**A hosting move is NOT a database move.** When leaving Hostinger shared for
a VPS (Hostinger KVM or elsewhere), the cheapest path is `mysqldump` → MySQL
on the VPS — same driver, same schema, one evening. Switch to Postgres only
when a migration trigger actually fires:

> **Migration triggers (revisit quarterly):** listings > ~50k with visible
> filter latency; you need search-as-you-type (→ Meilisearch, wants a VPS
> anyway); import jobs exceed shared-hosting execution limits; a second
> developer joins. Then: VPS + Postgres + Meilisearch, a weekend not a
> rewrite.

| Layer | Choice | Why / cost |
| --- | --- | --- |
| Framework | Next.js App Router, single app for ALL domains | ISR for programmatic SEO, host-header middleware for verticals, server components for slow Paraguayan mobile |
| Database | MySQL 8 / MariaDB on Hostinger via Drizzle | Free with the plan; portable |
| Search | SQL + composite indexes; no search engine in v1 | Free, zero ops; Meilisearch is the Year-2 upgrade |
| Images | Cloudflare R2 + CDN | 10 GB free, zero egress; never on hosting disk; thumbs via sharp on upload |
| Maps | MapLibre GL JS + OSM tiles | $0; Mapbox-compatible API = paid upgrade is a token swap |
| Geocoding | Nominatim, aggressively cached in `locations` | $0; Paraguay's location space is small |
| Background jobs | hPanel cron → `npx tsx scripts/*.ts` | No queue infra; every job idempotent + checkpointed |
| Auth | Session cookies + WhatsApp OTP via GHL | Reuses the $497 GHL plan; no Twilio |
| Leads/CRM | Webhook → GHL (`src/lib/crm.ts`) | See §5 |
| Analytics | GA4 now, Plausible later | Free now |

## 2. Data model

Implemented in `src/db/schema.ts` (Drizzle, MySQL dialect) — that file is the
source of truth. Summary of the design intent per table:

- **`listings`** — wide, deliberately denormalized row per property.
  `price_usd` normalized at write time (ALL filtering uses it); `cuota_gs`
  cached by nightly cron (`src/lib/cuota.ts`, French amortization vs best
  qualifying `financing_programs` row); `bedrooms = 0` means monoambiente,
  `NULL` means N/A (terreno). `idx_search (status, operation, property_type,
  location_id, price_usd)` covers every consumer query; map view uses
  `idx_geo` bounding boxes with client-side supercluster.
- **`listing_images`** — R2 keys, position 0 = cover; importer scores
  watermarks so third-party-portal watermarked photos never become the cover.
- **`locations`** — pais → departamento → ciudad → barrio hierarchy with
  precomputed `full_slug` and hourly-cached `listing_counts` JSON (powers
  "122 propiedades acá" and the thin-page rule with zero COUNT queries at
  request time). Seed from OSM/GeoNames cross-checked against Tu Lugar's
  taxonomy. `guide_content_es/en` hold Claude-generated barrio guides.
- **`agencies` / `agents` / `developers` / `projects`** — supply side.
  `projects` powers the nearby-projects autocomplete in the wizard (preventa
  units attach to buildings) and the developer revenue lane.
  `agencies.ghl_sub_account_id` reserved for the CRM product lane (§5).
- **`listing_sources`** — provenance + dedup, load-bearing because seeding is
  scrape + white-glove + FSBO simultaneously. Dedup order: exact `source_url`
  → same listing; matching `dedup_key` (normalized phone + price ±5% bucket +
  m² ±10% bucket + location) → flag for the review queue, never auto-merge.
  Importers mark stale listings `paused` via `last_seen_at`.
- **`leads`** — every lead fires a webhook to GHL with full context; the
  portal never sends WhatsApp itself. `lead_type` distinguishes
  seller/valuation leads (the money report is one query).
- **`market_medians`** + **`financing_programs`** — nightly cron recomputes
  medians (own + blended sources) and every listing's `cuota_gs`. Medians
  power the valuation magnet, barrio guides, and the "8% debajo de la mediana"
  context module (render only when `sample_size ≥ 8`).
- **`users`** + **`otp_codes`** — WhatsApp OTP before publish (6 digits,
  10-min expiry, resend cooldown), delivered via GHL.

### Domain routing

`src/config/verticals.ts` + `middleware.ts`. Vertical config lives in code
(deploy cadence, type safety). Only propia is `enabled` in v1; unknown or
disabled hosts resolve to propia. Canonical policy: listing detail pages exist
canonically on propia.com.py only; future feeder domains own their own
category/landing/guide pages with distinct copy and link into propia. The EN
site is the exception (own `description_en` detail pages with hreflang —
translation ≠ duplicate).

## 3. Design system & UX

Tokens in `src/design/tokens.ts` (deep green #1A5D3A + amber #E8A13D;
WhatsApp green never repurposed). Voseo strings in `src/i18n/es.ts` — the
canonical set; never generate neutral-Spanish variants. Mobile-first (Android
+ WhatsApp is the market).

Keep from Tu Lugar: 3-step wizard with autosave, map-pin + nearby-projects
location flow, WhatsApp OTP at publish, split list/map with price pins and
cluster chips, pre-filled inquiry + quick-question chips, "Avisame si baja",
publish-as persona selector.

propia's openings (the differentiators, in priority order):

1. **Cuota on the card** — `🏦 Gs X/mes con Che Róga Porã` on every venta
   card (amber, from cached `cuota_gs`); rentals show the Gs conversion line.
2. **Trust system** — `✓ Verificado` badge (WhatsApp-verified publisher + no
   open duplicate/report flags); watermarked photos never the cover.
3. **Market context on the detail page** — "Mediana del barrio: $X/m² — este
   aviso está 8% por debajo" when `sample_size ≥ 8`.
4. **WhatsApp as the primary CTA** (logs the lead before redirecting —
   attribution never depends on the agent); email demoted to secondary.
5. Wizard deltas: foreign-exposure toggle (default ON, shown pre-launch with
   "próximamente"), 20-photo cap + video URL, cuota preview on the price
   step, "¿Tienes muchos inmuebles?" → white-glove intake.

## 4. Programmatic SEO

URL scheme:

```
/{operacion}/{ciudad}                      /alquiler/asuncion
/{operacion}/{ciudad}/{tipo}               /alquiler/asuncion/departamentos
/{operacion}/{ciudad}/{barrio}/{tipo}      /venta/asuncion/recoleta/casas
/propiedad/{slug}-{public_id}              listing detail (canonical)
/barrios/{ciudad}/{barrio}                 neighborhood guide
/precios/{ciudad}[/{barrio}]               market-data pages
/proyectos/{slug}                          development/preventa pages
/inmobiliarias/{slug}  /agentes/{slug}     supply-side profiles
```

Types pluralized (casas, departamentos, terrenos); operations as nouns
(venta, alquiler — never verb forms). ISR (`revalidate: 3600`) over a page
inventory derived from `locations.listing_counts`; top ~200 pages seeded via
`generateStaticParams`, long tail renders on first hit.

**Thin-page rule — non-negotiable, single source of truth in
`src/lib/indexability.ts`**, called by BOTH page templates and the sitemap
generator: count ≥ 3 → indexable + sitemap; 1–2 → renders but
`noindex,follow`, out of sitemap; 0 → 410 or redirect to parent. Barrio pages
additionally require an indexable parent city page.

Structured data: `RealEstateListing` + `Offer` (+ `Residence`/`LandParcel`),
`BreadcrumbList` everywhere, `ItemList` on categories, `FAQPage` on guides,
`RealEstateAgent` on profiles. Sitemap index → chunked child maps, nightly
cron. Internal linking via one data-driven `RelatedLinks` component — never
hand-curated. Guides: monthly Claude-API batch, grounded ONLY in DB data
(medians history, counts, projects, landmarks), 400–600-word voseo,
regenerated quarterly.

## 5. CRM strategy (GHL now, options later)

**Now:** GHL is the CRM. The portal's entire CRM surface is
`src/lib/crm.ts` (`CrmProvider` interface): `pushLead()` and `sendOtp()`.
Leads are recorded in MySQL first (source of truth for the money report),
then pushed to GHL with full context (listing, vertical, UTM). GHL pipelines
handle follow-up.

**Later, two compatible expansion paths — decided outside this repo:**

- **GHL sub-accounts per agency**: resell GHL as the agency's CRM.
  `agencies.ghl_sub_account_id` already exists; lead routing sends the lead
  to the agency's sub-account instead of the internal pipeline. Fastest
  revenue, zero build.
- **Own real-estate CRM** (a Mspecs/Vitec for Paraguay): a separate repo and
  product. This repo stays ready by keeping the boundary clean: leads webhook
  payloads are provider-agnostic JSON, stable `public_id`s everywhere, and
  nothing outside `crm.ts` knows GHL exists. The future CRM consumes the same
  payloads GHL does today.

Do **not** build CRM features in this repo beyond the webhook boundary.

## 6. Accounts, publishing funnel, projects & admin (v3 design)

### 6.1 Identity & sessions

Two identity signals, deliberately orthogonal:

- **Google OAuth** — account creation / login convenience. Hand-rolled
  authorization-code flow (server-side code exchange, then the `userinfo`
  endpoint over TLS — no JWT verification dependency, no auth framework;
  `users` and `otp_codes` already exist and next-auth's adapter model buys
  nothing here). Adds `users.google_sub` (varchar, unique, nullable);
  Google's email fills `users.email`.
- **WhatsApp OTP** — the **publish gate**, not a login method requirement.
  Existing `otp_codes` table + `crm.ts sendOtp()` (the `ConsoleCrm` dev
  fallback means this is fully buildable and testable before GHL or the
  domain exist). A listing cannot leave `draft` until its owner has
  `whatsapp_verified_at` set. Phone-only users (OTP login, no Google) are
  first-class; Google-only users must verify WhatsApp at publish time.

Sessions: new `sessions` table (`id`, `user_id`, `token_hash`,
`expires_at`, `created_at`, `last_seen_at`). Opaque 256-bit random token,
SHA-256 hashed at rest, in an HTTP-only `Secure` `SameSite=Lax` cookie,
30-day sliding expiry. No JWTs — revocation is a row delete.

Account types: the existing `users.role` enum (`consumer`, `agent`,
`agency_admin`, `developer`, `admin`) already covers the wizard's
publish-as personas — no schema change. OTP abuse controls: existing
`attempts` + resend cooldown, plus a per-IP cap at the route layer.

### 6.2 Publishing funnel (the wizard)

Three steps, autosave from the first keystroke: step 1 immediately creates
a `listings` row with `status = 'draft'`; every subsequent change patches
it. Abandoned drafts cost nothing and enable "seguí donde quedaste".

1. **Lo básico** — operation, property type, publish-as persona, location
   (map pin + barrio autocomplete), price + currency (cuota preview when a
   program qualifies).
2. **Detalles** — bedrooms/bathrooms/m², amenities, description, photos
   (≤ 20, presigned direct-to-R2 upload, position 0 = cover), video URL.
3. **Publicar** — preview card, foreign-exposure toggle (default ON),
   WhatsApp OTP if not yet verified, submit.

Moderation: v1 is **review-first for everyone** — `draft` →
(OTP verified) → `pending_review` → admin approves → `published`. The
publish-first-with-post-hoc-review model (market norm per the InfoCasas /
Tu Lugar audit) is a later flip, isolated behind a single
`autoPublish(user)` predicate — never scattered role checks.

**Developer / en-pozo path:** when the persona is `developer` (or
`property_state` ∈ en_pozo / en_construccion), the wizard asks "¿Es parte
de un proyecto?" → autocomplete over `projects` (already in the schema) or
an inline mini-form (name, type, stage, delivery date, location) that
creates the project pending admin approval. Units are ordinary listings
with `project_id` set. A **"Duplicar unidad"** action clones a unit
listing for retitle/reprice — a 40-unit tower is minutes of work, and the
schema needs nothing new.

### 6.3 Project pages — `/proyectos/{slug}`

The §4 URL scheme already reserves the route; v3 makes it a real template:
hero + stage badge (`en pozo` / `en construcción` / `entrega inmediata`),
delivery date, developer card, description, map, and a unit grid grouped
by typology (bedrooms × m² banding) with "desde $X" pricing; lead CTA
routes to the developer (`leads.routed_to = 'developer'` — already in
`crm.ts`). Unit detail pages link up to their project via the existing
`RelatedLinks` system.

Indexability goes through `getIndexability()` — the single source of
truth, extended, never duplicated: a project page is indexable when it has
≥ 1 published unit; otherwise `noindex,follow`. JSON-LD: `ApartmentComplex`
+ `ItemList` of units.

### 6.4 Admin panel — `/admin`

Same Next.js app (no second deploy), an `/admin` route group behind a
server-side session check for `role = 'admin'`; `noindex`, robots
disallow, out of the sitemap. v1 surface in priority order:

1. **Review queue** — `pending_review` listings and dedup flags from
   `listing_sources`; approve / reject-with-reason / edit-then-approve.
2. **Listings table** — filter by status/source; pause, remove, mark
   sold/rented; edit.
3. **Projects & developers** — approve wizard-created projects, CRUD-lite.
4. **Agencies & agents** — CRUD-lite, `is_verified` toggle, `plan`
   assignment (free / destacado / partner — the §20-question answer was in
   the schema all along; what each tier *unlocks* is defined in M10′).
5. **Leads (the money report)** — list with listing/vertical/UTM context,
   GHL push status, manual re-push.
6. **Financing programs** — editor over `financing_programs`, so the
   deferred rate verification (v3 amendment 1) becomes data entry.

**Invariant:** admin actions call the same mutation layer the wizard and
importer use (one status-transition + upsert module) — slug generation,
`price_usd` normalization, and dedup bookkeeping hold no matter who
writes. Drizzle Studio stays for emergencies only.

### 6.5 Design system pass

`src/design/tokens.ts` grows from color/type primitives to a full scale:
spacing, radii, shadows, type scale, z-index. One shared component set —
Button, Input/Select/Textarea, Chip, Badge, Card, Modal/Sheet, Stepper,
Toast, EmptyState — consumed by BOTH the public site and the wizard/admin,
built once in M4′. Voseo microcopy stays in `src/i18n/es.ts`; mobile-first
Android remains the target.

### 6.6 Global navigation & home layout (v3.1 amendment, 2026-07-05)

Founder decision: bring the shell to TuLugar parity NOW (partner demos),
without waiting for accounts. Everything below uses the §6.5 component
set; nothing ships a dead link.

**Header.** Desktop: brand · Comprar · Alquilar · Terrenos · Publicar CTA
("Proyectos" joins when §6.3 ships). Mobile: brand + Publicar CTA +
hamburger opening a full-height sheet (the §6.5 Modal in sheet mode) with
the same links plus the popular-search chips.

**Mobile bottom tab bar** (global, mobile-only, 4 tabs):
Inicio (/) · Buscar (opens a bottom sheet containing the SearchBar) ·
Publicar (accent style; existing WhatsApp intake link until M6′) ·
WhatsApp (chat with Propia — logs a lead first, same pattern as the
detail-page CTA). Rules: (1) hidden on listing detail pages — the §3
contact bar owns that slot, never two stacked bars; (2) active state per
route; (3) ≥44px targets; (4) sits below modals in the z-ladder. When M5′
lands: WhatsApp slot → Mensajes, and a 5th Cuenta tab appears.

**Home layout, in order:**
1. Hero: H1 + subtitle + SearchBar + popular-search chips.
2. Four TuLugar-style highlight tiles (colored icon + title + subtitle):
   Asunción (Capital) · Luque (Zona en crecimiento) · Areguá (Lago
   Ypacaraí) · Proyectos en pozo → the §4 category URL filtered by the new
   `estado` param.
3. Live stats strip: "N nuevas publicaciones en los últimos 7 días"
   (computed from `published_at`) + "Más de X propiedades activas ·
   Actualizado diariamente · Publicá gratis" (`es.publishCta`).
4. Preventa strip: horizontal-scroll row of `property_state ∈ {en_pozo,
   en_construccion}` listing cards with a stage Badge — becomes the real
   projects carousel when §6.3 ships.
5. Explorá por ciudad (counts) → 6. Explorá por tipo →
7. Publicaciones recientes → footer.

**Category filter extension:** public `estado` query param (`en_pozo` |
`en_construccion` | `entrega_inmediata`) added to `CategoryFilters` —
same rule as every filter: narrows the visible grid only, NEVER feeds
`getIndexability()`.

**Share polish (same pass):** favicon set + default OpenGraph image and
per-listing OG tags — partner links travel over WhatsApp; the preview is
the first impression.

Execution: Sonnet 5 (templated UI over the §6.5 set).

## 7. Build plan v3 (sequential milestones, no dates — ship ASAP)

Model policy: **Fable 5** = architecture + hardest problems + review gates
(done: this document, schema, indexability, cuota, routing, CRM boundary).
**Opus 4.8** = expensive-to-unwind implementation. **Sonnet 5** = templated
work. Every milestone ends in a STOP gate the founder clears; no session
starts the next milestone past a gate.

**M0 — Rails** _(Sonnet 5)_ — deploy pipeline to Hostinger (git → build →
Node.js app in hPanel), production MySQL created + connected, R2 bucket +
upload helper, envs. STOP: app serves on a real URL, DB round-trips, one
image round-trips through R2. Nothing else until deploys are boring.

**M1 — Schema live + seeds** _(Opus 4.8)_ — generate + run Drizzle
migrations from `src/db/schema.ts`; seed `locations` (OSM/GeoNames ×
Tu Lugar taxonomy) and `financing_programs` (verify real Che Róga Porã/AFD
terms); cuota + median cron scripts wired (fine against sparse data). STOP:
schema reviewed against every §3 UI element and §4 page type — changes after
M3 cost 10x.

**M2 — Minimum supply** _(Opus 4.8)_ — white-glove intake: CSV/spreadsheet
adapter + the importer framework core (normalize → dedup → upsert +
`listing_sources`), Drizzle Studio as the interim admin, minimal review
queue. Enough to get real published listings WITHOUT waiting for scrapers.
STOP: 50 hand-audited listings correct; importer re-runs produce zero
duplicates.

**M3 — Public launch surface** _(Opus 4.8 core, Sonnet 5 UI)_ — the
LAUNCHABLE increment: listing detail page (gallery, sticky WhatsApp contact
card, cuota module, JSON-LD), category ISR pages with the templated intro
block, `getIndexability()` enforced, sitemap index + robots, lead capture →
GHL webhook, GA4 + Search Console. STOP → **LAUNCH propia.com.py**: real
listings indexed, leads landing in GHL with correct attribution.

**M4′ — Design system & public polish** _(Sonnet 5)_ — §6.5: tokens
expansion + the shared component set, applied across the existing public
pages (cards, detail, category, header/footer, 404). STOP: founder signs
off the look **on a phone**; no component ships that the wizard/admin
can't reuse.

**M5′ — Auth & accounts** _(Opus 4.8; run a security review before
merge)_ — §6.1: Google OAuth flow, `sessions` table + cookie layer,
WhatsApp OTP login/verify against `ConsoleCrm` (no GHL, no domain needed),
minimal `/cuenta` page. Schema delta: `users.google_sub` + `sessions` —
migrate BEFORE M6′ builds on it. STOP: an outsider creates an account via
Google AND via phone-only OTP, on a phone; OTP rate limits and session
revocation verified.

**M6′ — Wizard, uploads & projects** _(Opus 4.8 core, Sonnet 5 UI)_ —
§6.2 funnel with autosave + presigned R2 uploads, §6.3 `/proyectos/{slug}`
template, "Duplicar unidad", review-first moderation via the shared
mutation layer. STOP: end-to-end publish of (a) a casa and (b) an en-pozo
project with 3 units, both on a phone, landing in `pending_review`.

**M7′ — Admin panel** _(Sonnet 5 UI over an Opus 4.8 authz/mutation
layer)_ — §6.4 in its priority order. STOP: founder moderates a real
submission start-to-finish (approve, reject, feature, mark sold) without
opening Drizzle Studio.

**M8′ — Search, filters & map at scale** _(Opus 4.8 query layer, Sonnet 5
UI)_ — typed query function over `idx_search`, facets, map API (bounding
box + supercluster), split list/map UI, mobile full-screen map. STOP:
<200ms server-side filters, every combination hits an index (EXPLAIN
audit).

**M9′ — Importers + programmatic SEO at scale** _(Opus 4.8)_ — **no
scraping** (v3 legal review: Ley 1328/1998 database rights +
unfair-competition + cybercrime exposure make portal scraping a
non-starter). Inventory comes from agency-CRM integrations (KiteProp,
2clicsApp, Bitrix24, Tokko syndication feeds) + white-glove imports +
FSBO ads. Watermark scoring, barrio guides via Claude API for top 30
barrios, /precios pages, full internal-link modules. STOP: Screaming Frog
crawl — zero indexable thin pages, zero canonical conflicts, valid
structured data everywhere.

**M10′ — Monetization & feeders** _(mixed)_ — define what each
`agencies.plan` tier (free / destacado / partner) actually unlocks;
verified financing data + tiered cuota fallback (v3 amendment 1);
valuation lead magnet; featured listings + preventa promotion; then feeder
domains flipped on one at a time (alquiler → EN site → directories), each
with distinct copy. Year-2 items (Meilisearch, VPS/Postgres, agent
lite-CRM, reviews) stay out of scope until §1 triggers fire.

### Day-of-domain checklist (the ONLY work gated on owning propia.com.py)

1. DNS → the Hostinger app; `NEXT_PUBLIC_CANONICAL_HOST=propia.com.py`.
2. Google OAuth: add the production redirect URI in Google Cloud Console
   (localhost URIs keep working for dev).
3. Google Search Console: verify property, submit the sitemap index.
4. GHL: point `GHL_WEBHOOK_URL` at the production workflow; send one test
   lead and one test OTP end-to-end.
5. R2: map `img.propia.com.py` to the bucket.
6. GA4: create the property, add the tag.

Everything else in M4′–M7′ proceeds on localhost / a temporary Hostinger
subdomain without waiting.
