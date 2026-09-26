# Plan — agency mode, analytics, partner alerts (2026-09-26)

**Founder decision, 2026-09-26:** the site runs as a **real-estate agency by
default** — every enquiry comes to the founder, who shares it with one to three
partner realtors for a commission split. The open listing site (anyone
publishes, contact goes straight to the lister) stays in the code behind a
switch in `/admin`. This plan replaces the wave-B columns in
`docs/plan-build-2026-09-26.md` §4 that only served the open-listing model.

Inputs: the Codex review of 2026-09-26 (triaged below) and the founder's
answers in the same session.

## Batches, in order

| # | Batch | Migration | Status |
|---|---|---|---|
| 1 | Fixes: `previous_json`, English copy, DeepL removed, this plan | no | merged (#220) |
| 2 | Agency schema (0019), schema only | **yes — founder** | open (#222) |
| 3 | Agency-mode switch + contact routing (copy: founder) + partner install page | no (`site_settings`) | built, off by default |
| 4 | Partner alerts on Telegram + reminders + app install page | uses 2 | after 2 |
| 5 | First-party analytics + `/admin/analitica` | uses 2 | built — merge after #222 is migrated |
| 6 | Deal and commission ledger | uses 2 | after 2 |
| 7 | Later, once real inventory exists | — | backlog |

3–6 can be built in parallel once batch 2 is merged **and** migrated; each owns
its own folders. The shared file is `src/i18n/es.ts` / `en.ts` (append-only per
namespace, as wave A did).

### 1 — Fixes (no migration)

- `parseSnapshot()` (`src/lib/import/snapshot.ts`) for every `previous_json`
  reader. Production is MariaDB 11.8, so the rollback's `deduped` branch and
  `recentPriceChanges()` were live bugs.
- English door copy no longer promises monthly payments (`showCuota()` never
  shows them there): home meta/hero, how-it-works, values, invest, hub lead,
  category meta description, the buying guide, `/about`, the realtor pitch.
- DeepL removed from `cron:translate`: Gemini → Claude only. DeepL never saw
  the glossary prompt, so it translated place names ("Sajonia" → "Saxony").

### 2 — Agency schema, migration 0019 (`MIGRATION REQUIRED —`, founder migrates, then merges)

All additive with defaults; the live code keeps working the moment it is
applied.

| Change | For |
|---|---|
| `deals` table: `lead_id`, `listing_id` NULL, partner (`agency_id` / `agent_id`), `stage` (`viewing` · `offer` · `reserved` · `won` · `lost`), `lost_reason`, `sale_price_usd`, `commission_pct`, `my_share_pct`, `my_share_usd`, `paid_at`, `note`, `created_by`, timestamps | batch 6 |
| `analytics_events` (raw): `ts`, `day`, `vertical`, `path`, `listing_id` NULL, `event` (`page_view` · `wa_click` · `lead_submit`), `referrer_host`, `utm_source/medium/campaign`, `device`, `visitor_hash` | batch 5 |
| `analytics_daily` (rollup): `day`, `vertical`, `path`, `listing_id`, `event`, `count`, `uniques` | batch 5 |
| `lead_assignments.partner_note` text NULL | partner's own note (was wave-B Realtor 3) |
| `lead_assignments.reminded_at` datetime NULL | batch 4 reminders |
| `users.telegram_chat_id` varchar(40) NULL | batch 4 |

**Dropped from the old B0** (open-listing features, not needed in agency mode):
`agencies.agents_own_leads_only`, `listings.contact_form_only`,
`leads.user_id`. They can come back if the listing-site mode is ever used for
real.

### 3 — Agency-mode switch (no migration)

One setting, `business_mode` = `agency` | `marketplace`, in the existing
`site_settings` table, edited by the super-admin in `/admin`, read through one
cached helper (tag + `revalidate*` writer, per the caching rules). One switch
with two tested presets — not ten independent toggles.

| | marketplace | agency (default) |
|---|---|---|
| `/publicar` | open | 308 → `/vender` |
| `/registro`, `/para-inmobiliarias`, `/planes`, `/precios` | public | hidden; partners join by invite (exists) |
| Header CTA | "Publicar" | "Vendé con nosotros" |
| Listing WhatsApp / phone / form | the lister | **the founder** (`NEXT_PUBLIC_CONTACT_WHATSAPP`), form lead `internal` |
| Seller card on `/propiedad` | agent / agency | the door's brand |
| `/agentes`, `/inmobiliarias` | full directory | partners only |
| `inmobiliarios.com.py` | unchanged | unchanged — it is already a seller-lead source |

Copy that becomes false in agency mode and must switch with the mode:
"sin costo por lead / sin comisión sobre tus operaciones" (realtor pitch),
"We are not a real estate agency and do not represent either party"
(`enAboutPage.limitsBody` and its Spanish peer), "Contact directly … no
middleman". Buyer-facing "no commission for you" can stay if the seller or
partner pays. **Do not flip to agency in production until the founder has
answered decision D1 below.**

### 4 — Partner alerts and the phone app

- **Telegram per partner.** `/agencia/perfil` gets "Conectar Telegram": a
  `t.me/<bot>?start=<HMAC(user id)>` link (stateless, no token column); the
  bot's webhook (`/api/telegram`, secret-token header) stores the chat id.
  Alerts: a lead shared with you, a buyer replied by email (E2), a reminder.
  Same "never pretend it was delivered" rule as `alertOperator()`.
- **Reminders.** A shared lead with no answer after N hours (setting, default
  4) pings the partner once, then the founder. Scheduled by a Cloudflare
  Worker cron trigger calling one app endpoint hourly — one request an hour,
  nothing added per visitor (Hostinger's limit is processes, not disk).
- **The app.** The panel is already installable (A4, `app/manifest.ts`,
  `start_url: /agencia`). Partners already get leads, shared leads, email
  threads under each lead, listings and profile there. Add a short "Install
  the app" page with the Android (Chrome → Install) and iPhone (Safari →
  Share → Add to Home Screen) steps. **No web push**: it needs a service
  worker, which A4 rejected on purpose, and iPhone only allows it for
  installed apps; Telegram reaches both platforms without that.

### 5 — First-party analytics (no Google)

- **No extra request per page view.** Record on the server inside requests
  that already happen (page renders and client-navigation requests, prefetches
  excluded — the builder must verify soft navigations are counted), keep a
  small in-memory buffer, write it once a minute as one multi-row INSERT. A
  WhatsApp click goes through a `/r/wa/<listing>` redirect that counts and 302s
  to `wa.me` — the one request the visitor was making anyway.
- **No cookies.** Unique visitors = hash(IP + user agent + daily salt). Bots
  excluded with `isBotUserAgent()` (`src/lib/view-tracking.ts`).
- **Retention:** raw events 365 days (setting), `analytics_daily` forever.
  Size: about 250 bytes a row with indexes — ~90 MB a year at 1 000 views a
  day, ~0.9 GB at 10 000. The nightly rollup and pruning run from the same
  Worker cron as batch 4.
- **`/admin/analitica`:** visitors per door, top pages and listings, sources
  and campaigns, WhatsApp clicks vs. form leads, the path visit → listing →
  contact. Per-listing views for owners and agencies already exist
  (`listing_views_daily`, `/mis-avisos`, `/agencia`); this adds WhatsApp clicks
  to those panels.

**What landed (batch 5):** `src/lib/analytics.ts` (in-memory buffer, one
INSERT a minute, daily-rotating visitor hash, bots and staff pages dropped),
`app/api/a` (the beacon, never touches the database), `AnalyticsBeacon` in the
root layout (about one request per visit: sent when the tab hides or ten
events queue; the visit's referrer and utm ride on every event, so a WhatsApp
tap is credited to the campaign that brought the visitor), form leads counted
server-side in `/api/leads`, `cron:analytics` (rollup + retention prune, also in
`/admin/operaciones`), `/admin/analitica`, and a "Clics en WhatsApp" column in
`/agencia` and `/mis-avisos`. Deviation from the plan above: page views are
sent by a batched beacon rather than recorded inside the page render — root
layouts do not re-render on client navigation, so server-side counting would
miss most page views.

### 6 — Deal and commission ledger

- From a lead in `/admin/leads`: open a deal, move it through the stages,
  record sale price, commission %, your share, paid date, lost reason.
- The partner updates the stage from `/agencia/leads` on leads shared with
  them (same `sharedWithPanel()` predicate); money fields are founder-only.
- `/admin/negocios`: pipeline by stage, commission owed / paid per partner per
  month, lost reasons, response time per partner (the existing response
  board).

**What landed (2026-09-26, branch `claude/bold-davinci-myybaw-deals`, on top
of 0019).** `src/lib/deals.ts` is the only module on `deals`; form parsing and
es-PY formatting are pure in `src/lib/deal-form.ts`; copy in
`src/i18n/es-deals.ts` (panel, Spanish only).
- `/admin/leads`: each card (not reports) has a collapsed «Negocio» block —
  stage, lost reason, partner (only targets the lead was shared with, revoked
  shares included), sale price, commission %, your share %, your share US$,
  paid date, note. Super-admin only (`saveDealAction` → `requireSuperAdmin()`,
  and `upsertOperatorDeal()` refuses any other role itself). Staff see the
  stage read-only; their query selects no money column. The «≈ US$» beside
  "Tu parte" is a display estimate from the stored values, never saved. Every
  save that changes something writes `deal.update` to `admin_events`.
- `/agencia/leads`: a stage selector (visita / oferta / reservado / ganado /
  perdido + motivo) on each shared lead. `setPartnerDealStage()` uses
  `sharedWithPanel()` (now exported from `lead-assignments.ts`) for the read
  and in the UPDATE's own WHERE, creates the deal when missing (partner =
  that share's target, `created_by_user_id` = the partner), claims a deal with
  no partner, refuses another partner's deal, and writes no money column.
  Logged as `deal.stage`.
- `/admin/negocios` (main tab row, next to Consultas; super-admin only): KPI
  table (deals per open stage, won this month / total, your share won-unpaid
  and paid, this month / total — sums of `my_share_usd` as typed), the deals
  table with a link back to each lead card, per-partner rows, lost reasons.
  The response board stays on /admin/leads (linked).
- `scripts/verify-scopes.ts` covers it: form validation, the money writer
  refusing staff/agency/agent/consumer/developer roles, a partner moving a
  stage only on an actively shared lead (not another agency's, not after a
  revoke, not another partner's deal), and a partner write leaving every money
  field unchanged.
- Not built: a default split prefilled from D2 (founder decision), deleting a
  deal, a CSV export of the ledger.

### 7 — Later (after real inventory)

Monthly owner performance email (E1), "tell us what you want" brief when a
search finds nothing, national type pages `/venta/casas` (F-f), lead-delivery
status and retry for VenderCRM, "availability last confirmed" and a listing
completeness checklist.

## Codex review — triage

**Built or in the plan:** `previous_json` (batch 1), English payment copy
(batch 1), place names in translation (batch 1, DeepL removed), funnel
measurement and WhatsApp clicks (batch 5), the pricing promise conflicting with
commission (batch 3 copy), unanswered-lead reminders (batch 4), lost reasons
and outcomes (batch 6), `db:status` on MySQL 8.4 (fixed in #219).

**Backlog (batch 7):** owner reports, concierge brief, `/venta/casas`,
delivery retry, availability date, completeness checklist.

**Ignored, with reason:**

- Preview/staging environment — one Hostinger deployment, zero users, no CI by
  design; costs a second slot and database.
- "Standardize the package manager" — only `package-lock.json` exists.
- Paid agency subscriptions, featured-listing sales, paid onboarding packages —
  open-listing revenue; in agency mode realtors are partners, not customers.
- Real newsletter / price-alert subscriptions — nothing to alert on until real
  inventory exists.
- Explicit demo flag — the demo listings were deleted; do not reseed demo data
  in production.
- Empty Spanish homepage vs. 47 English listings — different crawl dates, and
  the English door only ever narrows the Spanish set.
- Generic dependency audit / more e2e — done when a batch touches that area.
- Backup-restore test — worth doing once, but in hPanel by the founder, not code.

## Decisions for the founder

| # | Decision | Recommendation |
|---|---|---|
| D1 | Taking commission in Paraguay: licence / registered company needed? | Ask a local advisor before flipping production to agency mode |
| D2 | Default commission split with partners (prefills the ledger) | Whatever the written referral agreement says |
| D3 | Privacy sentence for sharing leads (open since 2026-09-25) | Sign it — in agency mode every lead is shared |
| D4 | Partner sees the buyer's name and phone only after pressing "La tomo"? | Yes — protects the commission |
| D5 | The four E2/E3 choices in `docs/decisions-needed.md` | Keep all; switch item 4 to "Telegram alert" via batch 4 |
| D6 | Claude translation default is an expensive model | Use Gemini, or set `ANTHROPIC_TRANSLATION_MODEL` to a small model after comparing 10 real listings |
| D7 | `/venta/casas` (F-f), password reset, English-door facts (A6), staff listing rights | Unchanged, still open in `docs/decisions-needed.md` |
