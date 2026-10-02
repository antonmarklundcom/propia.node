# Admin triage 2 — my leads, partner agents, publisher on leads, source attribution (2026-10-02) — no migration

Branch `claude/funny-ritchie-pcol1s` (PR #267), on top of `admin-triage.md`.

## What landed
- **/admin/leads "Mis consultas / Todas"** (`?vista=mias|todas`, default `mias`,
  remembered in the `admin_leads_vista` cookie, set client-side by
  `RememberView`). Mías = `routed_to = 'internal'`, the Consultas badge rule.
  One switch, `adminLeadsInternalOnly()` (`src/lib/lead-export.ts`): every
  count, chip, the list, history and the CSV export follow it; `linkTo` and the
  export link always spell `vista`. Staff stay internal-only by role, no toggle.
- **Socio for independent agents**: site setting `partner_agent_ids`
  (`SETTING_KEYS.partnerAgentIds`, `parsePartnerAgentIds()`,
  `getPartnerAgentIds()`, `getPublisherSettings()`). `publisherKindSql()` now
  takes `{ houseAgencyId, partnerAgentIds }`; a verified independent agent is no
  longer automatically "Socio" — only one in the list (ids validated, spelled
  raw for ONLY_FULL_GROUP_BY). /admin/agentes: "Marcar como socio / Quitar
  socio" per independent agent, super-admin only (`setAgentPartnerAction`,
  `setting.change` in /admin/historial). Agency plan label "Partner" → "Socio"
  in /admin/inmobiliarias (enum unchanged; the public registration note was left).
- **Publisher on lead cards**: `listAllLeads()` selects `publisherKind` (plus
  `no_listing` for leads without a property) and `publisherName`; pill
  "Socio: <name>", "Propia", …; "Publicó" chip row (`?publico=`) with counts
  (`countLeadsByPublisher()`); CSV gets a "Publicó" column.
- **Attribution**: `src/lib/visit-source.ts` (pure `leadUtmFrom()` +
  browser `readVisitUtm()`): the five lead forms use the URL's `utm_*`, else the
  beacon's stored visit source, plus `utm_referrer` (host only). `/api/leads`
  passes utm source/medium/campaign and the referrer into the `lead_submit`
  analytics event.
- **/admin/analitica "Fuente"** replaces "De dónde llegan" + "Fuente de
  campaña": each visitor once per day under utm_source, else referrer host,
  else Directo; columns visitantes / WhatsApp / formulario
  (`sourceTable()`). The rollup writes a new `source` dimension by the same
  rule (`VISITOR_SOURCE_SQL`); days rolled up before today have none (all
  current data is still inside raw retention). Campaign table kept.

## Verified
- `npm run verify:local` green.
- Local MariaDB 11.8: leads attached to one listing per publisher kind; chip
  counts checked by hand (todas: own 2, socio 1, inmobiliaria 1, agente 1,
  particular 1, sin asignar 1, sin propiedad 6; mías: 2/1/6), filter results,
  CSV row counts per view (14/10 lines incl. header) and via cookie, staff sees
  9 internal leads and no toggle. Socio toggle clicked in a browser: setting
  written, admin_events row, the agent's leads/listings flip to "Socio".
  Analytics seeded: Fuente fb 2/1/1, google.com 1/0/1, ig 1/0/1, Directo 1/0/0
  as expected; `cron:analytics` wrote the `source` rollup rows correctly.
  Screenshots taken in the session (not committed).

## Not verified
- Production data. A real lead submitted through each form in a browser (the
  helper is unit-checked with tsx; the forms only swapped their readUtm body).
- `verify:scopes` not run: no agency panel query touched.

## Founder steps
- /admin/agentes: mark the independent agents you work with as "Socio"
  (verified agents are no longer Socio automatically).
