# Lead routing rules (O3, 2026-10-02) — no migration

Branch `claude/lead-routing`. Spec: `docs/plan-admin-next-2026-10-02.md`, item
O3 (committed here: it had been written in the triage session and not pushed).

## What landed
- **/admin/ajustes → "Reparto automático de consultas"** (super-admin only,
  anchor `#reparto`). It has a switch, "Reparto automático", which is **off by
  default**, and one coverage card per current Socio:
  - **Who counts as a Socio:** agencies on the partner plan, plus the
    independent agents listed in `partner_agent_ids`. These are the same two
    lists `publisherKindSql()` uses.
  - **What a card holds:** an "active" box, zones (cities and/or barrios), the
    operations, the property types and a US$ price band.
  - **Where it is stored:** two site settings, `lead_routing_enabled` and
    `lead_routing_rules` (JSON). Every change is a `setting.change` line in
    /admin/historial.
  - **Unverified Socios:** they are shown with a warning and are never shared
    to (`shareLeads()` refuses them anyway).
  - **Former Socios:** their rule is kept, so marking them as Socio again
    brings their coverage back.
- **Preview** (`#reparto-prueba`): a dry run. It shows what the saved rules
  would do with the last 15 leads in the operator's lane, as if routing were
  switched on. Nothing is written.
- **The rules** are in `src/lib/lead-routing-rules.ts`, which is pure and is
  what `npm run verify:routing` checks. They run in this order:
  0. **The listing's own Socio.** A lead on a Socio's listing goes to that
     Socio, with no coverage needed. If that Socio is busy, the lead stays
     manual: it is never handed to a competitor.
  1. **Zone:** the barrio, else the city. A rule with no zones covers the
     whole country.
  2. **Operation**, then 3. **property type**. An empty list means all.
  4. **Price band** on `price_usd`. Bounds are inclusive and optional.
  5. **Busy:** a Socio is skipped while they hold a share still `pending` after
     24 h. This is the same "overdue" the response board counts.
  6. **Pick one:**
     - the most specific zone tier wins: barrio, then city, then anywhere;
     - within that tier, whoever received any share least recently;
     - then the order of the rules.
- **Scope:** only new leads in the operator's own lane (`routed_to =
  internal`), of type buyer, renter or question, that are about a listing.
  - Excluded: reports, leads that are already shared, valuations, sellers,
    directory leads, briefs, and email/WhatsApp-inbox conversions. All of these
    stay manual.
  - In marketplace mode this mostly means leads on the operator's own or
    unowned listings. In agency mode it means every listing lead.
- **Writer:** `autoRouteLead()` in `src/lib/lead-routing.ts`, called inside
  `after()` by `/api/leads` and by "Registrar consulta de WhatsApp".
  - It reads the settings uncached, the same cold-start reason as the WhatsApp
    auto-responder.
  - The result is a normal `shareLeads()` share with the note "Asignada
    automáticamente por las reglas de reparto.", so the operator can revoke it
    or re-share by hand as before.
  - Each automatic share is logged as `lead.auto_share` (detail: target, zone
    tier, number of candidates). The actor is the super-admin who last saved
    the rules, because `assigned_by_user_id` and `actor_user_id` are NOT NULL.
  - Routing off costs one settings read. A failure is a log line, and the lead
    stays with the operator.
- **Share notices:** the email and Telegram "a lead was shared with you" are now
  one function, `sendShareNotices()` (`src/lib/share-notices.ts`). The hand
  share in `shareLeadsAction` and the automatic one both use it, so the two
  cannot drift.

## Verified
- `npm run verify:local` passed, including the new `verify:routing`.
  `verify:routing` was mutation-checked: removing the busy filter, or picking
  the least specific zone tier, each makes it fail.
- Local MariaDB 11.8 (migrated, `seed:locations`, the e2e importer fixture),
  `next start`, Playwright/Chromium: `tests/e2e/lead-routing.spec.ts`, 4/4
  passing. It covers:
  1. The agent is marked Socio in /admin/agentes. Coverage is saved in
     /admin/ajustes: the agent covers Villa Morra (venta), the partner agency
     covers Asunción.
  2. A real POST to `/api/leads` is shared with the agent, with tier `barrio`,
     the note and the actor. A `lead.auto_share` line appears in the history.
     The share shows on the /admin/leads card.
  3. After the agent's share is aged past 24 h, the preview names the agency
     (city tier), and the next lead does go to the agency.
  4. With routing switched off, a new lead gets no share.
  5. At 390 px the page has no horizontal scroll.

  Screenshots (desktop and mobile settings, the preview, the lead card) were
  taken in the session and not committed.

## Not verified
- Production data. Nothing has been switched on there: the setting defaults to
  off.
- The partner email and Telegram notice on an automatic share: no Cloudflare
  email or Telegram vars were set locally. It is the same function the hand
  share already used.
- `verify:scopes` was not run: no panel scope or `listingScopeWhere` changed.
  Shares reach /agencia through the existing `sharedWithPanel()`.

## Founder steps
1. /admin/agentes and /admin/inmobiliarias: make sure your Socios are marked
   and verified.
2. /admin/ajustes → "Reparto automático de consultas": fill in each Socio's
   coverage and save.
3. Check the "Prueba con tus últimas consultas" table, then switch it on.

Choices made without asking (all reversible, listed in
`docs/decisions-needed.md` 2026-10-02):
- a Socio's own listing goes to that Socio;
- one coverage per Socio;
- one price band for all operations;
- listing leads only.
