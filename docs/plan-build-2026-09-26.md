# Build plan — everything that needs neither Meta, email nor Telegram (2026-09-26)

Follows `docs/plan-lead-access-2026-09-25.md` §6 (the 50 ideas per role) after
#210 and #211 merged and migrations `0016`/`0017` were applied to production
(`db:status`: 0 pending, No drift, 2026-09-26).

Checked against the code on `main` at `4957fec` before writing. Three items in
the earlier list were wrong and are corrected here:

- **Owner 8 (reject reason) is already built.** `listings.review_notes` is
  shown on `/mis-avisos` and `/agencia` for a removed listing.
- **Owner 5 "mark sold" is already built.** Owners and agencies may set
  `sold` / `rented` (`AGENCY_STATUSES` in `src/lib/listing-edit.ts`). "Renew"
  only means something with an expiry, which has no column and whose reminder
  needs email, so it moves to the email wave.
- **Realtor 3 (private note) needs a column.** `lead_assignments.note` is the
  operator's note to the partner, not the partner's own. It moves to wave B.

## 1. The 50 ideas, updated

✅ done · 🟡 partly · ⬜ build now, no migration · 🧱 needs a migration (wave B)
· ✉️ email wave · 📱 Meta WhatsApp (saved) · ✈️ Telegram (optional) · 🔒 founder

**Superadmin**

| # | Idea | State | Wave |
|---|---|---|---|
| 1 | Share leads with partners | ✅ #211 | |
| 2 | Lead status and note | ✅ #210 | |
| 3 | User editing, own password | ✅ #211; reset link ✉️ | E1 |
| 4 | Staff can't publish or hard-delete | ✅ #211 | |
| 5 | Response board | ✅ #211 | |
| 6 | History log | ✅ #211 | |
| 7 | Same WhatsApp many times | 🟡 flagged; one card per number ⬜ | A1 |
| 8 | "Listo para socio" checklist | ✅ #211 | |
| 9 | Copy leads to VenderCRM | ✅ 🔒 keys in hPanel | |
| 10 | Email sending | ✉️ | E1 |

**Realtors (agents)**

| # | Idea | State | Wave |
|---|---|---|---|
| 1 | See shared leads, accept or decline | ✅ #211 | |
| 2 | Automatic alert on a new lead | ✉️ / ✈️ (📱 later) | E1 / T |
| 3 | Mark contacted/closed + private note | 🟡 marking ✅; note 🧱 | B1 |
| 4 | "Only my leads" inside an agency | 🧱 (agency setting column) | B1 |
| 5 | Reset own password | ✉️ | E1 |
| 6 | Edit own profile: bio, zones, licence, years | ⬜ (columns exist since `0013`) | A4 |
| 7 | Keep earlier listings after joining an agency (bug 6) | ⬜ auth-adjacent | A5 |
| 8 | WhatsApp reply pre-filled with name and listing | ⬜ `wa.me` | A1 |
| 9 | Feed of leads in their zones to claim | 🔒 privacy decision, then C | C2 |
| 10 | Panel installable on the phone (PWA) | ⬜ | A4 |

**Agencies**

| # | Idea | State | Wave |
|---|---|---|---|
| 1 | Receive shared leads | ✅ #211 | |
| 2 | Hand a lead to one agent | ⬜ reuses `lead_assignments.agent_id`, ships with 4 | B1 |
| 3 | Setting: agents see only their own leads | 🧱 | B1 |
| 4 | Team numbers per agent | 🟡 per listing ✅; per agent ⬜ | A1 |
| 5 | "Send invite on WhatsApp" button | ⬜ `wa.me` | A1 |
| 6 | Spreadsheet import of their own listings | ⬜ reuses the admin planner | C1 |
| 7 | Paid plans, featured placement | 🔒 payments | |
| 8 | Lead export (CSV) | ⬜ | A1 |
| 9 | Testimonials | 🔒 parked | |
| 10 | Quality check before submit | ⬜ | A4 |

**Property seekers**

| # | Idea | State | Wave |
|---|---|---|---|
| 1 | Real photos and English text | 🔒 R2 bucket, `cron:translate` | |
| 2 | Favourites without an account | ⬜ localStorage | A3 |
| 3 | Price alerts that send | ✉️ | E1 |
| 4 | "Who answers and when" after an enquiry | ⬜ | A3 |
| 5 | `/venta/casas` pages | 🔒 decision F-f | |
| 6 | Compare 2–3 listings | ⬜ localStorage | A3 |
| 7 | "Report this listing" | ⬜ a `question` lead, `utm.source: "report:listing"` | A3 |
| 8 | Map with real coordinates | ⬜ bigger | C3 |
| 9 | What "verified" means | ⬜ | A3 |
| 10 | Trustworthy monthly payments | 🔒 AFD rate research | |

**Property owners**

| # | Idea | State | Wave |
|---|---|---|---|
| 1 | Sign up as an owner, not a realtor (bug 5) | ⬜ `consumer` role, no enum change; auth | A2 |
| 2 | Instant alert on each enquiry | ✉️ / ✈️ (📱 later) | E1 / T |
| 3 | Change password in `/mis-avisos` | ⬜ (reset link ✉️) | A2 |
| 4 | "I want a realtor" button | ⬜ seller lead, `utm.source: "owner:panel"` | A2 |
| 5 | Mark sold / renew | ✅ mark sold; renew + expiry reminder ✉️🧱 | E1 |
| 6 | Price vs. area median | ⬜ `market_medians` exists | A2 |
| 7 | Photo upload | 🔒 R2 bucket | |
| 8 | Reject reason shown | ✅ already built | |
| 9 | Valuation result on their account | 🧱 needs a user link on the lead | B2 |
| 10 | Enquiries by form only, phone hidden | 🧱 listing column | B2 |

Totals: ✅ 13 · ⬜ now 21 · 🧱 wave B 6 · ✉️/✈️ 6 · 🔒 8 (some rows count twice).

## 2. Build order and why

```
Wave A  (no migration, 5 PRs, can be built in parallel)
  A1 leads & partners ─┐
  A2 owners            ├─ merge in any order; each rebases on main first
  A3 seekers           │
  A4 profile/PWA/QC    │
  A5 bug 6 (scopes) ───┘
Wave B  (one migration 0018, then 2 PRs)
  B0 schema only  ──► founder: db:status → db:migrate → db:status
  B1 agency lead routing (needs B0)
  B2 owner privacy + valuation (needs B0)
Wave C  (bigger, each after A merges)
  C1 agency spreadsheet import · C2 zone feed (after decision) · C3 map
Wave E  (after inmobiliaria.com.py is Active on Cloudflare + Email Sending onboarded)
  E1 sending · E2 replies threaded per lead (migration) · E3 general inbox
Wave T  (optional, founder go-ahead) Telegram alerts for realtors/owners
  — its column rides in B0 if approved before B0 is cut
```

Rules that make the order safe:

- **One migration per wave.** Every column wave B needs is in one `0018`, so
  the founder runs one `db:migrate`, not four. If Telegram (T) is approved
  before B0 is written, `users.telegram_chat_id` goes in the same file.
- **B0 is schema only** (`schema.ts`, the generated SQL, snapshot, journal).
  B1 and B2 start from `main` after B0 is merged *and* migrated, so no code on
  `main` ever selects a column production lacks.
- **Wave A PRs touch mostly separate folders.** The shared files are
  `src/i18n/es.ts` / `en.ts`: each PR adds its own namespace keys at the end of
  the namespace it owns, so a rebase conflict is an append, not a rewrite.
  Merge A PRs one at a time; the next session runs `git fetch && git merge
  origin/main` before its final `verify:local`.
- **A2 and A5 are auth-adjacent** (registration, panel scope): opened as PRs,
  never merged by an agent (AGENTS.md §2). A1, A3, A4 are UI/copy and may be
  merged by the session only if the founder says so for that PR.

## 3. Wave A — no migration

### A1 — Leads and partners (`/admin/leads`, `/agencia/leads`, `/agencia/equipo`)

- **Superadmin 7 — one card per number.** `/admin/leads` gets a "Agrupar por
  número" toggle (`?agrupar=1`): leads with the same `leadPhoneKey()` collapse
  into one card, newest on top, older ones in a `<details>` list with their
  own status/note/share controls. Rows are never merged or deleted. Staff
  predicate (`internalOnly`) applies to the group count exactly as it does to
  `countLeadsByPhoneKey()` today.
- **Realtor 8 — pre-filled WhatsApp reply.** On every lead card in
  `/agencia/leads` (own and shared) and `/mis-avisos/consultas`, the WhatsApp
  button opens `wa.me/<number>?text=` with "Hola <name>, te escribo por
  <listing title> (<listing URL>)…". Copy in `es.ts`/`en.ts`, the URL from
  `listingCanonicalOrigin()`. No listing → a generic greeting.
- **Agency 5 — invite on WhatsApp.** `/agencia/equipo` gets an optional
  WhatsApp field on the invite form and a "Enviar por WhatsApp" button next to
  the copied link (`wa.me` with the link in the text). The number is not stored.
- **Agency 8 — CSV export.** `GET /agencia/leads/export` (route handler) returns
  the same rows `getPanelLeads()` + `getSharedLeads()` show that user,
  nothing more. Same scope helper, no new query path. UTF-8 BOM so Excel opens
  accents correctly. `/admin/leads` gets the same for the current filter.
- **Agency 4 — numbers per agent.** `/agencia` (agency admin only): per agent,
  listings published, leads in the last 30 days, shared leads answered, median
  hours to answer (from `lead_assignments.state_at`). One GROUP BY each.

Acceptance: `verify:local` green; `verify:scopes` on a local DB (the export
uses panel queries); a Playwright run of the group toggle and the export.

### A2 — Owners (`/registro`, `/mis-avisos`) — auth-adjacent, founder merges

- **Owner 1 — register as an owner.** `/registro` gets a third kind, "Soy
  dueño/a (vendo o alquilo mi propiedad)", creating a `consumer` user with no
  agency and no `agents` row, landing on `/mis-avisos`. `AccountKind` gains
  `owner`; `users.role` is unchanged (no enum member). Same throttle and
  validation as the other kinds.
- **Owner 3 — change password.** `/mis-avisos/cuenta` reuses `AccountForm` and
  `updateOwnAccount()` exactly as `/admin/cuenta` does.
- **Owner 4 — "Quiero que una inmobiliaria lo venda".** A button per listing in
  `/mis-avisos` creates a `seller` lead (`routed_to: internal`,
  `utm.source: "owner:panel"`, `listing_id` set) with an optional message, and
  fires `alertOperator()`. It then appears in `/admin/leads` where it can be
  matched or shared. Idempotent per listing per 24 h.
- **Owner 6 — price vs. area.** On `/mis-avisos/aviso/[id]`: "Precio por m²
  vs. mediana de <zona>" from `market_medians` (latest period, same location
  and type), shown only when a median exists with enough samples. Wording is a
  comparison, never advice.

### A3 — Seekers (public pages)

- **Seeker 2 — favourites.** A heart on `ListingCard` and the detail page,
  stored in `localStorage` (`propia:favorites`, same pattern as
  `propia:recently-viewed`), and a `/favoritos` page that fetches those public
  ids (published only). `noindex`. No account.
- **Seeker 6 — compare.** "Comparar" on cards (max 3, localStorage), a sticky
  bar, `/comparar?ids=…` table: price, USD/m², m², rooms, baths, zone, cuota
  where the door shows it. `noindex`.
- **Seeker 4 — who answers and when.** After an enquiry, the success message
  names who receives it (agency / agent / particular / the portal team) from
  the same `routedTo` decision, plus the WhatsApp fallback when one exists.
  No promised response time unless the founder gives one.
- **Seeker 7 — report a listing.** A small "Reportar este aviso" form on the
  detail page (reason: vendido, precio incorrecto, falso, otro + text). Stored
  as a `question` lead, `routed_to: internal`, `utm.source: "report:listing"`,
  with the listing id. `/admin/leads` gets a "Reportes" chip. Rate-limited like
  the lead form. No new table.
- **Seeker 9 — what "verified" means.** A short explainer section (on
  `/como-funciona`, linked from every verified badge via a tooltip/link). The
  text states what the operator actually checks today; the founder confirms
  the wording before merge (🔒 copy only).

### A4 — Realtor profile, PWA, quality check

- **Realtor 6 — edit own profile.** `/agencia/perfil` gets bio, zones (city
  picker over `locations` ciudad slugs), licence number, years active, photo
  URL. Writes the `agents` row linked to the user; `revalidateDirectory()`.
  An agent can only edit their own row; an agency admin also their agents'.
- **Realtor 10 — PWA.** `app/manifest.ts` (name per door brand, icons from the
  existing apple icon), `start_url: /agencia`, display standalone. No service
  worker caching of pages (every route is dynamic); install only.
- **Agency 10 — quality check.** Before "Enviar a revisión" in the listing
  form: a checklist (≥ 5 photos, map position, price and currency, m², title
  length, description length) with warnings, not blocks, except the ones the
  review queue already rejects.

### A5 — Bug 6: agent keeps earlier listings after joining an agency

When an independent agent accepts an invite, their listings with
`owner_user_id = them` and no agency move to the agency (`agency_id` set,
`agent_id` = their agents row), inside the same transaction as the invite
accept, and the move is written to `admin_events`. Alternative if the founder
prefers: keep them personal and show them in `/agencia` under "Mis avisos
anteriores". **Default: move them** (the agent is now that agency's). Touches
panel scope → `verify:scopes` required, founder merges.

## 4. Wave B — one migration `0018`

### B0 — schema only (`MIGRATION REQUIRED —`, founder migrates and merges)

| Column | For |
|---|---|
| `lead_assignments.partner_note text NULL` | Realtor 3 — the partner's own note on a shared lead |
| `agencies.agents_own_leads_only boolean NOT NULL DEFAULT false` | Agency 3 |
| `listings.contact_form_only boolean NOT NULL DEFAULT false` | Owner 10 |
| `leads.user_id bigint unsigned NULL` + index | Owner 9 — the logged-in user who sent it (valuation, enquiries) |
| `users.telegram_chat_id varchar(40) NULL` | only if Telegram (T) is approved first |

All additive with defaults, so the live code keeps working the moment it is
applied, before any B1/B2 code deploys.

Note on `leads.user_id`: CLAUDE.md forbids `leads.agent_id` and a new
`routed_to` member (who *receives* a lead). `user_id` is who *sent* it, set
only when the visitor is logged in; it never grants access to anyone else.

### B1 — agency lead routing (after B0 is migrated)

- Partner note on shared leads (Realtor 3), visible to that agency/agent only.
- Agency setting "Cada agente ve solo sus consultas" (Agency 3): when on, an
  `agent` sees leads on listings where they are `agent_id` plus leads handed to
  them; `agency_admin` still sees all. One predicate in `panelScope` /
  `getPanelLeads()`, read and write alike.
- Hand a lead to one agent (Agency 2): the agency admin creates a
  `lead_assignments` row with `agent_id` set, `assigned_by_user_id` = the
  admin. Reuses the existing accept/decline flow on the agent's side.
- `verify:scopes` gains checks for all three. Founder merges.

### B2 — owner privacy and valuation history (after B0 is migrated)

- Owner 10: a checkbox in the publish/edit form; when on, the detail page hides
  the WhatsApp button and phone and shows only the form.
- Owner 9: `app/tasacion/actions.ts` and `app/api/leads/route.ts` set
  `user_id` when a session exists; `/mis-avisos/tasaciones` lists that user's
  valuation leads with the result they were shown.

## 5. Wave C — bigger, after wave A

- **C1 Agency spreadsheet import (Agency 6).** `/agencia/importar` gets the
  CSV/XLSX path using the existing `planImport` / `commitImport` with
  `agencyId` forced to the user's agency and the permission column set by the
  attestation checkbox. No second validation path (CLAUDE.md import rules).
  Rollback stays admin-only.
- **C2 Zone lead feed (Realtor 9).** Needs a founder decision first: may a
  verified partner see a general lead's zone and type before it is shared?
  Proposal: they see "Venta · casa · Luque · hace 2 h" without name or phone,
  press "Me interesa", and the operator approves the share. Reuses
  `lead_assignments` (state `pending` until approved) — confirm no migration
  when designing.
- **C3 Map (Seeker 8).** Direction C from the design docs, on
  `display_lat`/`display_lng` and `idx_geo` (CLAUDE.md map rules).

## 6. Wave E — email (after Cloudflare is Active)

Prerequisites (founder): `inmobiliaria.com.py` Active on Cloudflare, Workers
Paid, Email Sending onboarded for it, an API token with only "Email Sending:
Edit", and in hPanel `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_EMAIL_TOKEN`.

- **E1 sending (no migration unless noted):** `src/lib/email.ts` over the REST
  API (not SMTP), silent no-op when unset (same rule as `alertOperator()`).
  Sender per door once that door's domain is onboarded, else
  `no-reply@inmobiliaria.com.py`. Uses: password reset link for every role
  (needs a `password_resets` table → migration, and the founder decision in
  `docs/decisions-needed.md`), "a lead was shared with you", owner "new
  enquiry", price alerts, listing expiry reminder (needs an expiry column).
- **E2 replies threaded per lead:** `Reply-To: lead-<id>@…`, Email Routing →
  Worker → signed POST to `/api/inbound-email` → stored under the lead
  (new table → migration).
- **E3 general inbox:** `hola@` / `contacto@` in `/admin`, reply from the app,
  "convert to lead".

## 7. Wave T — Telegram (optional)

A bot the founder creates with @BotFather (free). Realtors/owners press
"Conectar Telegram" → a deep link with a one-time token → the bot stores their
chat id → new lead / shared lead / owner enquiry alerts. Needs
`users.telegram_chat_id` (put it in B0 if approved in time) and a webhook route
for the bot. Most Paraguayan users are on WhatsApp, so treat it as an opt-in
extra, not the main channel.

## 8. Founder decisions this plan needs

1. **Privacy sentence** (from 2026-09-25) — before sharing non-directory leads.
2. **Seeker 9 wording** — what the operator actually checks before "verified".
3. **Bug 6 default** — move the agent's earlier listings into the agency
   (recommended) or keep them personal.
4. **C2 zone feed** — may partners see anonymised general leads to claim?
5. **Telegram** — approve before B0 is written so its column rides along.

## 9. Prompts for the build sessions (Opus 5.5, medium effort; never Fable)

Each session: `git fetch origin main && git checkout -B claude/<name>
origin/main`, read `AGENTS.md`, `CLAUDE.md` and this file, build only its
section, `npm run verify:local` green, open the PR, stop.

> **A1** — Build §3 A1 of `docs/plan-build-2026-09-26.md` on
> `claude/build-a1-leads`. Run `verify:scopes` against a local database and say
> in the PR whether you could. Do not merge.

> **A2** — Build §3 A2 on `claude/build-a2-owners`. Auth-adjacent: open the PR,
> title it `AUTH —`, do not merge.

> **A3** — Build §3 A3 on `claude/build-a3-seekers`. Leave the "verified"
> explainer text marked for founder review in the PR body.

> **A4** — Build §3 A4 on `claude/build-a4-profile-pwa`.

> **A5** — Build §3 A5 on `claude/build-a5-agent-listings` with the default in
> §8.3 unless the founder has decided otherwise. Run `verify:scopes`. Do not
> merge.

> **B0** — Only after the founder confirms §8.5 (Telegram yes/no). Write the
> §4 B0 columns in `src/db/schema.ts`, generate `0018`, run `db:status` and
> `db:migrate` + `db:status` against a local database, open
> `MIGRATION REQUIRED — 0018 …`, do not merge.

> **B1 / B2** — Only after `0018` is applied to production and B0 is merged.
> Build §4 B1 (`claude/build-b1-agency-routing`, `verify:scopes`, do not merge)
> or §4 B2 (`claude/build-b2-owner-privacy`).
