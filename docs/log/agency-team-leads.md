# /agencia/leads — "Mis consultas / Todo el equipo" (2026-10-02) — no migration

Branch `claude/agency-team-leads`. The plan's later-phase item from
`docs/plan-admin-next-2026-10-02.md` ("Agency panel 'mis consultas / todo el
equipo' toggle for agency_admin"), with the founder's rule: agents see only
their own.

## What changed

| Who | Reads on /agencia/leads (page, CSV, threads, answers) |
| --- | --- |
| Agent inside an agency | **Only their own.** Their own means leads on listings assigned to them (`listings.agent_id` = their `agents` row) and shares addressed to that row. Teammates' leads, leads on listings with no agent, and shares made to the agency are not visible to them. There is no toggle; a note says what they see. |
| agency_admin | **The whole agency**, in "Todo el equipo" (the default, the same as before). "Mis consultas" (`?vista=mias`, remembered in the `agencia_leads_vista` cookie) narrows the page and the CSV to their own listings' leads and the shares to their own row. Unassigned leads and agency shares stay in "Todo el equipo". |
| Independent agent (no agency) | Unchanged: the owner scope is already theirs alone. |

How it is built:
- **One resolver**, `panelLeadAccess(ctx, view)` in `src/lib/panel-lead-access.ts`.
  It returns the share viewer and the listing-lead filter. It is used by:
  - the page and `/agencia/leads/export`, with the toggle;
  - `panelCanSeeLead()` (and so `userMaySeeLead()`, which guards the email
    and WhatsApp thread actions and attachments), with the widest view the
    role allows;
  - `setShareStateAction`, `setPartnerNoteAction` and `setDealStageAction`,
    likewise with the widest view.
- **The two halves of the filter** are `getPanelLeads(…, onlyAgentId)`, an
  extra `listings.agent_id = ?` on top of the agency scope, and
  `sharedWithPanel()`'s new `onlyAgentId`. The latter matches shares to that
  agents row, and only while the row is still in the agency.
- **The toggle narrows the display; the role narrows access.** An admin in
  "Mis consultas" can still open and answer anything in the agency.
- **CSS fix:** an active link chip kept the site's gold link-hover colour on
  its dark fill. It now stays white, on /admin too.

## Verified
- `npm run verify:local` green, via the pre-push hook.
- **`npm run verify:scopes` against a local MariaDB 11.8: all checks
  passed**, including 23 new ones. The new checks cover:
  - an agent's inbox, shares and CSV;
  - thread access to their own lead, a teammate's lead, an unassigned lead,
    an agency share and their own share;
  - answering or noting the agency's share and a teammate's share (refused),
    and their own (allowed);
  - the admin's "team" and "mine" lists and their access to teammates' leads;
  - the view parser;
  - an agent who left the agency keeping nothing through a stale viewer.
- **`next start` + Playwright:** `tests/e2e/agency-lead-views.spec.ts`, 2/2
  passing.
  - The agent sees their lead and their share, nothing else, and no toggle.
    That holds even with `?vista=equipo` in the URL and in the CSV.
  - The admin sees everything by default. "Mis consultas" narrows to their
    own, the choice is remembered on a bare reload, and each view's CSV
    matches its page.

  Screenshots were taken in the session (not committed).

## Not verified
- Production data. **Behaviour change to tell agencies about:** agents who
  could read the whole agency's inbox now see only their own. Listings with
  no agent assigned only reach the agency admin.
