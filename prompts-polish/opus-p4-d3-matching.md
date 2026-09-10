# Phase P4 — D3: agent zones + lead matching in /admin/leads. OPUS session, medium effort. SCHEMA — PR only, never merged by this session.

Read ONLY: this file; `fable-plan-polish.md` §1, §4; `fable-plan-realtor-terreno-rental.md`
the "Phase D3" paragraph in Stage 1 D and §10; `docs/log/d1.md` "Leads";
`src/db/schema.ts` (`agents`, `leads`, `agencies`); `src/lib/directory-queries.ts`;
`app/admin/leads/page.tsx` and its actions; `app/api/leads/route.ts` (read
only — you do not change it); CLAUDE.md "Migrations" and "Caching" sections;
the `drizzle/` folder naming.

Owns: `src/db/schema.ts`; a new `drizzle/00xx_*.sql` via `npm run
db:generate` (never hand-written); `src/lib/matching.ts` (new, `server-only`);
`src/lib/directory-queries.ts` (additions); `app/admin/leads/**`; `esPanel`
keys in `es.ts` (+ `en.ts` peer); `docs/log/p4.md`; one §9 line.

Hard limits: no `/api/leads` change, no public page change, no `routed_to`
enum change, no `leads.source`/`agent_id` column (D1 decided leads carry the
agent in `utm`; `lead_matches` is the structure that replaces that). No cache
tag without a writer (`revalidateDirectory()` after any agent write).

## Decisions (final)
1. **Schema.** `agents` gains `bio` (text, null), `license_no` (varchar 60,
   null), `years_active` (smallint, null), `zones` (json: array of city slugs,
   null). New table `lead_matches`: `id`, `lead_id` FK, `agent_id` FK,
   `status` enum `("proposed","sent","accepted","declined")` default
   `proposed`, `note` varchar 280 null, `created_at`, `sent_at` null; unique
   `(lead_id, agent_id)`; index on `lead_id`.
2. **Matching is a suggestion, not automation.** `suggestAgentsForLead(leadId)`
   in `matching.ts`: agents that are verified AND (declared `zones` contains
   the lead's city slug from `utm.city` OR have published inventory in that
   city — reuse `listAgentsForDirectory()`'s city derivation), ranked: zone
   declared + inventory first, then inventory only, then zone only; cap 6.
   Pure SQL/TS, no cache — it runs on one admin click.
3. **Admin UI** in `/admin/leads`: on each `seller` lead whose `utm.source`
   starts with `directory:`, a "Proponer inmobiliarios" panel: the ranked six
   as checkboxes (max 3 selectable), a "Guardar propuesta" action writing
   `lead_matches` rows, then per match a "Enviar por WhatsApp" link (existing
   `forwardHref` pattern, to the AGENT's WhatsApp, message = the existing
   forward text) that on click-through marks `status: "sent"` via a small
   server action. Show existing matches with status. No email.
4. **Agents edit their own fields later** (D3b, backlog): this phase only
   adds the columns; the admin can fill `zones`/`bio` on the existing
   `/admin` agent edit surface if one exists — if not, leave it and note it.
5. **Migration discipline.** `npm run db:generate` for the SQL; commit the
   generated file + `meta` journal. In the PR body, paste the exact commands
   Anton runs: `npm run db:status` → `npm run db:migrate` → `npm run
   db:status` (must read `No drift`). This PR is **not** merged by you.

## Exit
`npx tsc --noEmit`; `verify:i18n`, `verify:facets`, `verify:seo`,
`verify:import` green; `npm run build` clean. With docker MySQL if available
(`docker compose up -d && npm run db:migrate`), `npm run db:status` reads `No
drift` and a `lead_matches` insert round-trips; if no docker here, say so in
the PR. Branch `claude/p4-d3-matching`, one PR "D3 — agent zones and lead
matching (schema; Anton merges after db:status)". **Do not merge.**
`docs/log/p4.md` + §9 line in the PR.
