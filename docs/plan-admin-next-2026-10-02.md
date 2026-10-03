# Admin next steps — plan (2026-10-02)

Source: founder session 2026-10-02 (PR #267). Built so far on #267:
`docs/log/admin-triage.md`, `admin-triage-2.md`, `admin-triage-3.md` (Sonnet
batch: CSV exports, reply templates, bulk "Marcar contactadas", period
comparison in Estadísticas, thumbnails, review-queue shortcuts, mobile admin).

**Start every window from `main` after #267 is merged.**

## Opus, decided — build these
| # | Item | Migration? | Notes |
|---|---|---|---|
| O3 | Lead routing rules | no (site_settings JSON) | Manual by default; super-admin switch "routing automático" in /admin/ajustes. Rules in order: zone (city/barrio) → operation → property type → price band → rotation among eligible Socios, skipping a partner with unanswered shared leads older than 24 h. Result = a `lead_assignments` share (existing, `src/lib/lead-assignments.ts`), never a new `routed_to`. Rules screen in /admin/ajustes; every auto-share logged in admin_events; operator can always revoke/override. Pure rule engine + verify script. |
| O10 | Security + performance audit | no | Report first (`docs/log/audit-2026-10.md`): auth/session, every server action's role check, /api/* rate limits and input bounds, SQL raw fragments (`sql.raw` in publisher-kind / contact-kind must stay validated literals), N+1 and missing indexes on admin pages. Then fix confirmed findings in a separate commit. Auth changes: PR only, never merged by an agent. |
| O2 | Partner lead ledger + editable commission suggestion | likely yes | Track every buyer/seller lead each Socio got from the site (shares + listing leads) and outcome; per-partner default split as an editable suggestion prefilled in the Negocio block — never automatic. Founder runs separate contracts, so it is a suggestion only. |
| O8 | Financing per listing | yes (columns on listings or a table) | Off by default, switched on per listing by publisher/admin; free-text terms (rate, term, down payment, entity) typed by the publisher; visible line "Datos provistos por <publisher>, no por el portal". Replaces the site-wide placeholder cuota on that listing only. i18n es+en. |

Migration items (O2, O8): branch of their own, PR title starts
`MIGRATION REQUIRED —`, never merged by an agent; `db:status` in the PR.

## Waiting on founder answers
- O1 Exclusive flag — visible "Exclusiva" badge to visitors? Applies to Socios' listings too ("exclusive marketing with us").
- O5 Duplicate listings — show "También publicado por…" to visitors or admin only? First lister keeps the slot; next takes over when it goes.
- O7 Reviews — only verified leads/deals may review (signed link), operator approves; full on inmobiliarios.com.py, stars on inmobiliaria.com.py.
- O9 WhatsApp per partner — own Meta Cloud API number (partner pays, needs Meta verification) vs click-to-chat + "replied" log.

## Later phases
- O4 Buyer accounts (WhatsApp-code login, favourites in DB, alerts, inbox). Favourites are browser-only today.
- O6 Owner/realtor monthly report.
- Agency panel "mis consultas / todo el equipo" toggle for agency_admin (touches panel scope → Opus, run `verify:scopes`).
- Translations progress UI (after a Gemini key is set).
