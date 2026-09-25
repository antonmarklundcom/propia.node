# Lead access, sharing leads with realtors, and email — plan 2026-09-25

Written for the founder's questions of 2026-09-25: how does an employee or a
partner realtor read the messages, can the superadmin hand existing leads to any
agency or realtor, and should the portal get a Cloudflare email inbox. Part 1
records how the code works today (read at `main` `01fb1ea`, open PR #210
included). Parts 2–4 are the plan. Nothing here is built yet.

---

## 1. How it works today (verified in code)

### Who can read which lead

| Who | Where | What they see |
| --- | --- | --- |
| Superadmin (`users.role = admin`) | `/admin/leads` | Every lead on every door, every lane. |
| Employee (`staff`, #171) | `/admin/leads` | Only `routed_to = 'internal'`: contact form, `/vender`, valuation, directory seller leads, and leads on listings nobody owns (`app/admin/leads/page.tsx:163`, `listAllLeads({ internalOnly })`). |
| Agency admin and agents | `/agencia/leads` | Leads on **their agency's listings** only (`getPanelLeads`, `src/lib/panel-queries.ts:679-711`): the query INNER JOINs `listings`, so a lead with no listing is never shown. Every member of an agency sees every lead of that agency. |
| Independent agent | `/agencia/leads` | Leads on listings where they are `owner_user_id`. |
| Private owner (FSBO) | `/mis-avisos/consultas` | Leads on their own listings. |

What follows from that:

- **No agency or realtor can ever see a lead without a listing.** That covers
  `/contacto`, `/vender`, `/tasacion`, the directory forms, and even leads sent
  from an agent's own profile page (`utm.agent_slug`). Only `/admin/leads`
  shows those.
- **D3 matching does not give access.** `lead_matches` rows are only read by
  `/admin/leads`. The hand-off is the operator's WhatsApp link
  (`MatchSendLink.tsx`), and it only exists for directory seller leads.
- **`seed:demo-seller` side effect.** If it has been run on production, leads on
  the demo listings sit in the `agency` lane of "Inmobiliaria Paraguay
  (muestra)", so an employee with `staff` cannot see them. `/admin` still can.

### How accounts are made

| Path | Result |
| --- | --- |
| `/registro` (anyone) | `agency` → `agency_admin` plus a new unverified agency. `independent` → `agent` with no agency. `invite` → role and agency from the token. The person picks their own password. |
| `/agencia/equipo` (agency admin only) | 7-day single-use invite **link**. The app sends nothing; you copy the link and send it on WhatsApp. |
| `/admin/usuarios` (superadmin only) | Create any role (including `staff`) with a password you type, edit, link a user to an agency, delete. |
| `/admin/agentes` (staff and superadmin) | Move an agent into an agency, set `agent` or `agency_admin`. |
| `npm run user:create` | CLI. Knows no `staff` alias. |

### Email

**There is no email sending in this repo.** It has no Resend, no SMTP, and no
mail library in `package.json`. Resend is VenderCRM's provider (the other
repo), not this one. What exists here:

- **Invites:** a link you copy by hand.
- **Password reset:** none. It is a pending founder decision
  (`docs/decisions-needed.md`, 2026-09-15).
- **Lead alerts:** Telegram to your phone (`TELEGRAM_*`) and/or a webhook
  (`LEAD_WEBHOOK_URL`).
- **Realtors and agencies:** no notification of any kind when a lead reaches
  them.

### Bugs found while reading (not fixed here)

1. **You cannot edit or reset any user while you are the only superadmin.**
   `updateUserAction` refuses when the *new* role is not `admin` and there is
   one admin, without checking whether the user being edited *is* that admin
   (`app/admin/usuarios/actions.ts:91`). So saving an employee's name, or giving
   them a new password, returns `last_admin`. Fix: run the check only when the
   target user is currently `admin`.
2. **An employee cannot change their own password.** The only password form is
   `/agencia/perfil`, and `staff` is redirected to `/admin`. With bug 1, nobody
   can change a staff password after it is created.
3. **Staff can publish and hard-delete listings**, even though Approve/Reject is
   superadmin-only. `/admin/propiedades` bulk status accepts `published` under
   admin scope, and delete is `requireStaffOrAbove`
   (`app/admin/propiedades/actions.ts:44-104`). Founder decision whether that is
   intended.
4. **Valuation leads fire no alert.** `app/tasacion/actions.ts` inserts the lead
   but never calls `alertOperator()`, so there is no Telegram message.
5. **A private seller who registers becomes an `agent`.** `/registro` has no
   owner/consumer kind, which contradicts "FSBO publishers get no agents row".
6. **An independent agent who accepts an agency invite loses panel access to
   their earlier listings.** The scope switches to the agency, and
   `/mis-avisos` is closed to agency roles.
7. `user:create` has no `staff` alias, and its header text is stale.

---

## 2. What to do right now (no code)

**Employee who works for you on the portal.** Create them in `/admin/usuarios`
with role `staff`, and send them the password on WhatsApp. They log in at
`/login` and land on `/admin`. There they read the internal leads, can use
matching, can edit listings (see bug 3), and can manage guides, agencies and
agents. They cannot see leads that belong to an agency, an agent or an owner.
Until bugs 1 and 2 are fixed, pick a strong password, because neither of you
can change it later.

**Partner realtor.** Do not make them `staff`: that would show them every
internal lead and let them edit every listing. Send them
`https://inmobiliaria.com.py/registro`. They register as an agency (or as an
independent agent) and choose their own password; that matters because there is
no password reset. Then verify them in `/admin/inmobiliarias` or
`/admin/agentes`. From then on they see leads on the listings they publish.
Nothing lets them see your ~10 existing general leads yet; that is what part 3
builds.

**Your ~10 existing leads, until part 3 ships.**

- Directory seller leads have the "match" panel, which sends a WhatsApp
  hand-off.
- Any other lead you forward by hand from `/admin/leads` (name, WhatsApp,
  message). The privacy note in §3.6 applies to that too.
- Only if the leads sit on demo listings attached to your demo agency: linking
  a person to that agency (`/admin/usuarios` → agency) shows them those leads in
  `/agencia/leads`. It also lets them edit every listing of that agency, so do
  this only for someone who works for you.

---

## 3. Plan: the superadmin shares a lead with an agency or a realtor

### 3.1 Goal

In `/admin/leads`, you select one lead or several and pick an agency or an
agent. The lead then appears in that agency's (or agent's) `/agencia/leads`,
marked "Asignada por el portal", with your note. They accept or decline and mark
it contacted. You see their answer next to the lead. You can take the access
back.

### 3.2 Why a new table, and not what exists

- **Not `leads.routed_to`, and not a `leads.agent_id` / `agency_id` column.**
  CLAUDE.md forbids both. A lane is *where the lead came from*; sharing is *who
  may read it*, and a lead can be shared with more than one party.
- **Not `lead_matches` as it stands.**
  - It can only point at an agent (`agent_id NOT NULL`), never an agency.
  - Its meaning is a directory "proposal, max 3, verified only".
  - It has no revocation, and no index on `agent_id`.
- **The two tables still meet.** In phase L3, marking a directory match as
  "sent" can also create a share, so the matched agent finally sees the lead in
  their panel. That is the agent-facing half D3b always meant to build.

### 3.3 Schema (phase L1, `MIGRATION REQUIRED —`, never merged by an agent)

This goes after #210's `0016` is applied and #210 is merged. The new migration
is `0017`.

```sql
CREATE TABLE lead_assignments (
  id                  bigint unsigned AUTO_INCREMENT PRIMARY KEY,
  lead_id             bigint unsigned NOT NULL,
  agency_id           bigint unsigned NOT NULL DEFAULT 0,  -- 0 = none
  agent_id            bigint unsigned NOT NULL DEFAULT 0,  -- 0 = none; exactly one of the two is set
  assigned_by_user_id bigint unsigned NOT NULL,
  note                varchar(280),                        -- operator → realtor, shown to them
  state               enum('pending','accepted','declined','contacted','closed') NOT NULL DEFAULT 'pending',
  state_at            datetime NULL,
  revoked_at          datetime NULL,                       -- NULL = access active
  created_at          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lead_target (lead_id, agency_id, agent_id),
  KEY idx_agency (agency_id, created_at),
  KEY idx_agent  (agent_id, created_at)
);
```

- **`NOT NULL DEFAULT 0` rather than NULL** follows the same rule as
  `listing_sources.scope_agency_id`: MySQL treats NULLs in a unique key as all
  different, so NULL would let the same agency be assigned twice.
- **Re-assigning a revoked share** clears `revoked_at` on the existing row.
  Assigning is idempotent.
- **Enum members are only ever appended** (same rule as `routed_to`).
- **`leads.status` and `leads.note` from #210 stay the operator's own view.**
  The note there is never shown to a realtor. The realtor's progress lives in
  `lead_assignments.state`.

### 3.4 Phases

Each phase is one PR. The size is given after the phase name.

**L0 — fix what blocks onboarding (S, auth-adjacent: open the PR, the founder
merges).**

- Bug 1: the last-admin check looks at the target user's current role.
- Bug 2: an "Mi cuenta" password form for `staff` and `admin`. Reuse
  `profile-queries.ts`'s change-password code, which needs the current password
  and revokes other sessions.
- Bug 4: `alertOperator()` on valuation leads.
- Bug 7: a `staff` alias in `user:create`.
- `verify:local` must be green.

**L1 — schema (S, `MIGRATION REQUIRED — lead_assignments`).**

- `schema.ts` + `drizzle/0017_*.sql` + snapshot.
- `db:status` output goes in the PR.
- The founder runs `db:status` → `db:migrate` → `db:status` before merging.

**L2 — superadmin side (M).** Files: `app/admin/leads/page.tsx`,
`app/admin/leads/actions.ts`, a new `app/admin/leads/AssignPanel.tsx`,
`src/lib/lead-assignments.ts` (new, `server-only`), and `esPanel` keys.

- On every lead card, a "Compartir con…" select that lists verified agencies,
  then verified agents grouped by agency, plus an optional note.
- A list of current shares, each with its state, a "Quitar acceso" button and a
  WhatsApp "Avisar" link to the agency's or agent's number, pre-filled with
  "Te compartí una consulta en tu panel: <link>".
- **Bulk:** checkboxes on the list plus one "Compartir seleccionadas con…" form.
  That is how the existing ~10 leads get handed over in one go.
- **Permissions:**
  - Superadmin can share any lead.
  - Staff can share `internal` leads only, using the same predicate as their
    list (as `proposeMatches` already does).
  - Only verified targets can receive a share, like matching.
- Every insert or revoke is one guarded statement, and every action starts with
  `requireStaffOrAbove()`.

**L3 — realtor side (M, touches panel queries: `verify:scopes` required).**

`getPanelLeads(scope)` gets a second branch, merged with the first and
de-duplicated by lead id.

- **Agency scope:** an active share with `agency_id = X`, or a share with an
  `agent_id` of an agent whose `agency_id = X`.
- **Owner scope (independent agent):** an active share whose `agent_id` is the
  user's own `agents.id`.
- **Private owners:** never receive shares (`/mis-avisos` is unchanged).
- **Uses LEFT JOIN `listings`**, so listing-less leads show up. The existing
  lane branch keeps its INNER JOIN and is not touched.

On the `/agencia/leads` card:

- Badge "Asignada por el portal" and the operator's note.
- Buttons Aceptar / Rechazar / Contactado / Cerrada. The write re-checks the
  share against the same scope.
- The WhatsApp reply button as today.

Optional in the same phase: the directory "match sent" also inserts an
agent-targeted share.

Tests: extend `scripts/verify-scopes.ts`.

- A shared lead is visible to the target agency and to its agents.
- It is invisible to another agency.
- It is invisible after it is revoked.
- An independent agent sees only their own shares.
- Staff cannot share an `agency`-lane lead.
- A realtor cannot change another agency's share.

**L4 — tell the realtor (S → M).**

- **L4a, zero config.** The "Avisar" WhatsApp link from L2 is the notification.
  It needs nothing and is honest: nothing is logged as "sent" unless you click
  it.
- **L4b, after the email provider exists (§4).** On share, email the agency or
  agent (`agencies.email`, `users.email`) through `src/lib/mail.ts`, which
  silently does nothing when unconfigured (same rule as `alertOperator`).
- Also add an `/admin/leads` column: "no response after 24 h".

**L5 — later.** These are not part of this plan:

- Agency admin distributes a shared lead to one of their agents.
- An "agents only see their own leads" switch per agency.
- Response-time stats per agency.

### 3.5 Acceptance for the whole feature

- You share the 10 existing leads with the partner's agency in one bulk action.
- The partner logs in and sees exactly those 10 plus their own listing leads.
- They accept one, and `/admin/leads` shows "accepted".
- You revoke one, and it disappears from their panel on the next load.
- `verify:local` and `verify:scopes` are green, and `db:status` shows no drift.

### 3.6 Founder decisions this needs (also in `docs/decisions-needed.md`)

1. **Privacy.** `/privacidad` §3 says a lead is shared "with whoever published
   the property" and with tech providers. It does **not** cover handing a
   general enquiry (`/contacto`, `/vender`, `/tasacion`) to a partner realtor.
   Directory leads are covered by their form copy ("Solo te contactan agentes
   verificados"). Proposed line for §3: *"Con profesionales inmobiliarios
   verificados con los que trabajamos, cuando tu consulta no es sobre un aviso
   concreto o nos pedís que te pongamos en contacto."* The founder signs the
   wording. Until then, share only directory leads and leads the person agreed
   to have forwarded.
2. **Verified-only targets** (recommended) or any agency.
3. **Staff may share internal leads** (recommended) or superadmin only.
4. **Bug 3:** may staff publish and delete listings?

---

## 4. Cloudflare email: verdict for this portal

**Pricing, checked 2026-09-25**
([Cloudflare pricing docs](https://developers.cloudflare.com/email-service/platform/pricing/),
[announcement](https://blog.cloudflare.com/email-service/)):

- Email Sending has been in public beta since 16 April 2026. It needs Workers
  Paid at **$5/month per account**.
- That includes **3,000 outbound emails a month** for the whole account, then
  **$0.35 per 1,000**.
- Inbound Email Routing is free.
- Each domain must use Cloudflare nameservers. Free zones cost $0.
- There is no inbox, IMAP or webmail. Any mailbox UI is software we write.

**Verdict: yes for sending and forwarding, no for a second mailbox inside this
portal.**

1. **Do now, zero code: a real contact address.** Move one door's DNS (start
   with `inmobiliaria.com.py`) to Cloudflare and turn on Email Routing, e.g.
   `hola@` forwarded to your Gmail. You can then set
   `NEXT_PUBLIC_CONTACT_EMAIL` and rebuild, which ends "there is no portal
   email". Replying *from* that address is not solved by forwarding. That waits
   for VenderCRM's outbox (point 3).
2. **Build here: sending only.** Add `src/lib/mail.ts` with a
   `MAIL_PROVIDER=none|cloudflare` env var, where `none` (the default) does
   nothing. It calls Cloudflare's REST API over HTTPS with an API token. Hosting
   on Hostinger is fine, because no Worker is needed to send. It unlocks:
   - realtor notifications (L4b);
   - invite links by email;
   - the forgotten-password flow, which is still a founder decision on identity
     checks (`docs/decisions-needed.md`);
   - price-alert emails for seekers.
   All system mail comes from one domain first (`noreply@inmobiliaria.com.py`).
   Volume is far below 3,000 a month, so the cost is the $5 base. There is no
   reason to add Resend to this repo.
3. **Do not build an inbox in `/admin` or `/agencia`.** Build it once, in
   VenderCRM (its `PLAN-EMAIL.md`, phases E1–E6), and have this portal push
   leads there (`docs/plan-crm-inbox.md` §3, `VenderCrmProvider`). Two
   mailboxes in two apps means two storage layers, two tenant-isolation models
   and two places a realtor has to check. Agencies that want a CRM with a
   mailbox become VenderCRM tenants; `agencies.ghl_sub_account_id` already
   anticipates that link.
4. **Channel reality.** Buyers and sellers in Paraguay answer on WhatsApp, not
   email. Email matters for the English door (foreign buyers) and for
   realtor/B2B notifications. So the order is: WhatsApp hand-off (L4a, now) →
   email notifications (L4b) → VenderCRM inbox.

**Two technical traps before you move this portal's DNS to Cloudflare:**

- **Keep every record "DNS only" (grey cloud).** `src/lib/client-ip.ts` takes
  the *last* `x-forwarded-for` hop as the visitor. Behind Cloudflare's proxy
  (orange cloud), that hop is a Cloudflare edge IP. Every visitor would then
  share one rate-limit bucket across the whole site: 20 login attempts per 15
  minutes, 10 leads per 10 minutes, and 5 sign-ups per 10 minutes. Turning the proxy on first
  needs a code change that trusts `CF-Connecting-IP` only from Cloudflare's
  published IP ranges.
- **Check the MX records first.** Turning on Email Routing replaces the
  domain's MX records. If a door receives mail through Hostinger email today,
  that mail moves to Cloudflare.

---

## 5. Order of work

1. **Founder:**
   - apply `0016` (`db:status` → `db:migrate` → `db:status`) and merge #210;
   - decide §3.6.
2. **L0** (bugs), then **L1** (schema, founder migrates), **L2**, **L3**,
   **L4a** in that order. L2 and L3 can be one session. Each is its own PR.
3. **In parallel, founder only:** Cloudflare DNS for `inmobiliaria.com.py`
   (grey cloud) and `hola@` routing to Gmail.
4. **`src/lib/mail.ts`** (Cloudflare sending), then **L4b**, then the
   password-reset flow once its identity-check decision is made.

## 6. Top 10 per role, and how they fit together

The spine is one loop:

1. A seeker or an owner sends a lead.
2. It lands in a lane.
3. You triage the general ones and share them with a verified partner.
4. The partner answers and reports progress.
5. You see who responds.
6. Good partners bring more listings, and more listings bring more seekers.

Each list below feeds that loop. **(built)** marks something that already exists
and only needs finishing.

**Superadmin**

1. Share leads with an agency or agent, singly or in bulk (L2).
2. Lead status and internal note. Built in #210; waits on migration `0016`.
3. User editing that works: bug 1, a password form for staff and admin (bug 2),
   and later a reset link instead of typed passwords.
4. Clear staff rights: decide bug 3, so only you approve and delete.
5. Response board: shares with no answer after 24 h, and response time per
   partner.
6. Audit trail: who shared, published, deleted or changed a role, and when.
7. Duplicate/spam lead merge: the same WhatsApp many times, merged into one
   thread.
8. Partner onboarding checklist: verified, WhatsApp set, profile complete, first
   listing live.
9. Push leads to VenderCRM (`docs/plan-crm-inbox.md` §3).
10. Email provider for system mail (§4), which unblocks items 3 and 5 and the
    realtor notifications.

**Realtors (agents)**

1. See leads shared with them, with accept or decline (L3).
2. Be told when a lead arrives: WhatsApp link now (L4a), email later (L4b).
3. Mark each lead contacted or closed, with a private note.
4. An "only my leads" view inside an agency. Today every member sees
   everything.
5. Self-service password reset (founder decision on identity checks).
6. Edit their own directory profile: bio, zones, licence, years. This is D3b and
   feeds matching.
7. Keep their earlier listings after joining an agency (bug 6).
8. WhatsApp reply pre-filled with the person's name and the listing link.
9. A feed of portal leads in their declared zones, offered for them to claim.
   This is where matching grows into.
10. A panel that works as an app on the phone (PWA install).

**Agencies**

1. Receive portal-shared leads with accept or decline (L3).
2. Hand a lead to one specific agent (L5).
3. A per-agency setting: agents see only their own leads (L5).
4. Team numbers: leads, answers and response time per agent. Listing views and
   leads per listing are **(built)**.
5. "Send invite on WhatsApp" button. The invite link is **(built)**; today it is
   copied by hand.
6. Spreadsheet import for their own catalogue. Today it is superadmin-only;
   `/agencia` has URL import only.
7. Plan tiers (`free` / `destacado` / `partner` already in the schema) giving
   featured placement. Payments are a founder decision.
8. Lead export (CSV), or a push into their own VenderCRM tenant.
9. Profile page with curated testimonials (decision (c) in
   `docs/decisions-needed.md`, parked).
10. A listing quality check before submit: photos, map position, price and
    currency.

**Property seekers**

1. Real photos (R2 bucket, `backfill:images`) and English listing text
   (`cron:translate`). These are the two biggest visible gaps, and both need
   only the founder.
2. Favourites without an account, stored in the browser like "recently viewed".
3. A price alert that actually alerts. Today it is stored as a lead; it needs
   the email sending in §4.
4. After an enquiry, a clear "who answers and when", with a WhatsApp fallback.
5. Indexable national type pages such as `/venta/casas` (decision F-f).
6. Compare 2–3 listings side by side.
7. "Report this listing": sold, wrong price, fake.
8. The map with real coordinates (direction C, later).
9. What "verified" means, on the profile, and testimonials later.
10. Trustworthy monthly payments once the AFD rate is researched (parked by the
    founder).

**Property owners (private sellers)**

1. Register as an owner, not as an agent (bug 5).
2. An instant alert on a new enquiry. Today only a webhook exists, so add a
   WhatsApp link or email.
3. Password reset, and a change-password form in `/mis-avisos`.
4. An "I want a realtor to sell it" button. It becomes a directory seller lead,
   which you then match or share (part 3). This is where the owner loop and the
   realtor loop meet.
5. Renew, mark as sold, and an expiry reminder.
6. How the price compares with the zone median. `market_medians` is
   **(built)**; show it to the owner.
7. Photo upload once R2 exists.
8. When a listing is rejected, what exactly to fix.
9. Keep the valuation result on their account and follow up on it.
10. The choice to receive enquiries through the form only, without showing their
    phone number.

## 7. Prompt for the build session

Use Opus 5.5 or Sonnet. Not Fable (AGENTS.md cost guardrail).

> Read `AGENTS.md`, `CLAUDE.md` and `docs/plan-lead-access-2026-09-25.md`.
> Build phase **L0** only, exactly as §3.4 describes, on a fresh
> `claude/lead-access-l0` branch from `origin/main`. It is auth-adjacent: open
> the PR, do not merge it. Run `npm run verify:local` and paste the result.
> Then stop and report. Next sessions: L1 (`MIGRATION REQUIRED —`, do not merge),
> then L2+L3 together after the founder has migrated `0017` (run
> `npm run verify:scopes` against a local database and say whether you could),
> then L4a.

---

## 8. Founder go-ahead, 2026-09-25, and the build waves

Superadmin items approved: **1** (share leads), **3** (user editing),
**5** (response board), **6** (history), **7** (duplicates), **8** (partner
checklist), **9** (VenderCRM push). **2** (#210) is already coded and waits
only on migration `0016`. **4** (staff rights) is explained to the founder
below; its default in wave 1 is the recommendation. **10** (email) waits
until the founder has tested Cloudflare nameservers on one parked domain (§4).

**4 in plain words.** Today a `staff` user can publish a listing and delete it
for good from `/admin/propiedades`. That skips the approval step that only the
superadmin is meant to do. Recommendation, and the wave-1 default: staff may
edit listings and set every status except `published`, and cannot hard-delete.
Publishing and deleting stay with the superadmin.

### What needs a migration and what does not

| Item | Schema change? | Wave |
| --- | --- | --- |
| 2 lead status and note (#210) | yes, `0016` (already written) | founder, now |
| 3 user editing, 4 staff rights | no | 1 |
| 7 duplicate leads (v1: flag and filter by the same WhatsApp, no merge) | no | 1 |
| 8 partner checklist (computed from existing columns) | no | 1 |
| 9 VenderCRM push | no (best-effort, same as today's webhook) | 1 |
| 1 share leads, 5 response board, 6 history | yes, **one** migration `0017` for both tables | 2 |

Wave 1 can be coded now, in parallel with the founder applying `0016`. Wave 2
must start from `main` **after** #210 is merged, so `0017` numbers after `0016`.

### Item 9: VenderCRM push, the contract fixed now

- Endpoint `POST https://crm.clientes.com.py/api/v1/leads` with header
  `X-Api-Key`. **Keys live only in hPanel environment variables**, never in the
  repo, a doc or a browser bundle.
- Env var names. A door whose key is unset stays local-only and never borrows
  another door's key.

  | Env var | Door (`leads.vertical`) | Key exists in VenderCRM (2026-09-23 list)? |
  | --- | --- | --- |
  | `VENDERCRM_BASE_URL` | all (`https://crm.clientes.com.py`) | n/a |
  | `VENDERCRM_KEY_INMOBILIARIA` | inmobiliaria.com.py (`inmobiliaria`) | yes |
  | `VENDERCRM_KEY_AGENTS` | inmobiliarios.com.py (`agents`) | yes |
  | `VENDERCRM_KEY_TERRENO` | terreno.com.py (`terreno`) | yes |
  | `VENDERCRM_KEY_RENT` | rentparaguay.com (`rent`) | yes |
  | `VENDERCRM_KEY_EN` | realestateinparaguay.com (`en`) | **no**, create the site in VenderCRM first |
  | `VENDERCRM_KEY_LAND` | landforsaleparaguay.com (`land`) | **no** |
  | `VENDERCRM_KEY_ALQUILER` | alquiler.com.py (`alquiler`) | **no**, domain not bought |
  | `VENDERCRM_KEY_DEVS` | desarrolladores.com.py (`devs`, disabled) | yes, unused while disabled |

- The lead is saved in MySQL first, as today. The push runs in `after()` with a
  5 s timeout and never blocks the visitor. Both writers (`app/api/leads/route.ts`
  and `app/tasacion/actions.ts`) pass the saved lead id.
- `idempotency_key` = `portal-lead-<leads.id>`. It is unique per submission
  (what VenderCRM asks for) *and* the same on a retry of that row, which is what
  makes the backfill below safe to re-run.
- `phone` = `leads.whatsapp`. `source` = `site:<vertical>`. The lead id, lead
  type and listing public id and title go in `fields`. Never send `pipeline`,
  `stage` or `owner`.
- VenderCRM keys never turn on OTP. `isMessagingConfigured()` stays tied to the
  webhook. Alerts stay on Telegram and the webhook.
- A backfill job for the leads already in the database:
  `src/lib/ops/crm-backfill.ts` plus `scripts/crm-backfill.ts`,
  `npm run crm:backfill -- --dry`, with `--limit`. The dry run and the real run
  are the same pass (AGENTS.md §4). The founder runs it locally with the keys
  exported.
- Log only the status code and lead id on failure. Never log the body, the phone
  or the key.

### Wave 2 schema (`0017`, one migration)

- `lead_assignments`, exactly as §3.3.
- `admin_events`:
  - columns `id`, `actor_user_id`, `action varchar(60)`,
    `target_type varchar(30)`, `target_id bigint unsigned`,
    `detail_json json NULL` (display only), `created_at`;
  - indexes on `(target_type, target_id)` and on `created_at`;
  - written on share and revoke, publish, delete, role change and password
    reset by admin;
  - read on `/admin/leads` (per lead) and a new `/admin/historial`.
- The response board (5) is computed from `lead_assignments.created_at` and
  `state_at`, so it needs no extra column.

## 9. Founder steps: applying a migration (Windows, PowerShell)

Same steps for `0016` now and `0017` later; only the branch name changes.

1. Hostinger keeps a daily backup. For extra safety, open phpMyAdmin and export
   the `leads` table.
2. hPanel → Databases → **Remote MySQL**: make sure your current IP is on the
   list.
3. In your local clone:
   ```powershell
   cd C:\path\to\propia.node
   git fetch origin
   git switch claude/fervent-mccarthy-3yz0t6     # PR #210's branch
   npm install
   $env:DATABASE_URL = "<the owner/RW database URL>"
   npm run db:status      # expect: 1 pending (0016_light_post), drift on leads
   npm run db:migrate
   npm run db:status      # must say: 0 pending, No drift
   ```
4. Merge PR #210 on GitHub. Hostinger deploys it within minutes.
5. Test it: send a message from `/contacto`, then open `/admin/leads` and check
   that it shows with the status chips.
6. Clean up:
   ```powershell
   git switch main
   git pull
   Remove-Item Env:DATABASE_URL
   ```

**Never merge a `MIGRATION REQUIRED` PR before step 3 reports `No drift`.**
New code that writes a column the database lacks breaks every page that writes
it.

## 10. Prompts for Sonnet sessions (cheaper than Opus for this)

**Wave 1: start now.**

> Read `AGENTS.md` and `CLAUDE.md`. Then read the plan, which is on another
> branch: `git fetch origin claude/clever-hawking-32toiz && git show
> origin/claude/clever-hawking-32toiz:docs/plan-lead-access-2026-09-25.md`.
> Build **wave 1** of §8 as three PRs, each from a fresh `origin/main`:
> (A) L0 bugs 1, 2, 4, 7 from §1 plus staff rights (item 4 of §8: staff cannot
> publish or hard-delete) — auth-adjacent; (B) the VenderCRM push and the
> `crm:backfill` job exactly as §8 "Item 9", env vars documented empty in
> `.env.example`; (C) items 7 and 8 (duplicate-WhatsApp flag and filter on
> `/admin/leads`, partner checklist on `/admin/inmobiliarias`), `esPanel` copy.
> If your session only allows one branch, make one PR with three clearly
> separated commits and say so. No schema change in any of them. `npm run
> verify:local` green before every push, never `--no-verify`, paste its tail in
> each PR, and say what you could not verify (no production DB from a cloud
> session). **Do not merge anything** — the founder merges. Stop and report the
> PR links.

**Wave 2: only after #210 is merged.**

> Read `AGENTS.md`, `CLAUDE.md` and the plan (`git show
> origin/claude/clever-hawking-32toiz:docs/plan-lead-access-2026-09-25.md`).
> From a fresh `origin/main` (which must contain `drizzle/0016_light_post.sql`),
> build **wave 2** of §8. PR 1, titled `MIGRATION REQUIRED — lead_assignments
> and admin_events`: schema + `drizzle/0017_*.sql` via `npm run db:generate`,
> nothing else. PR 2, stacked on PR 1: §3.4 L2 (share with bulk, revoke,
> WhatsApp "Avisar"), L3 (realtor side in `getPanelLeads`), the response board
> and the `admin_events` writes and `/admin/historial`. Extend
> `scripts/verify-scopes.ts` with the cases in §3.4 L3, and run `npm run
> verify:scopes` if a local MySQL is available (say plainly if not). Share only
> with verified agencies and agents. Staff may share internal-lane leads only.
> Do not merge either PR. Stop and report.
