# fable-plan-polish.md — the ten leftovers, as phases

Written 2026-09-10 by the Fable review session that closed #119 and merged
#122/#124/#125/#126. Method: `phased-autonomous-build`, without a watcher —
every phase is independent, spawned at once as a subagent, and ends with its
PR. `CLAUDE.md` beats this file on conventions. Anton's ten-item list, sorted:

| # | Item | Resolution |
| --- | --- | --- |
| 1 | Directory go-live flip | **Done**, #126. |
| 2 | Rental WhatsApp env var | Anton, hPanel: set `NEXT_PUBLIC_CONTACT_WHATSAPP`, rebuild. Not code. |
| 3 | Old rentparaguay.com WordPress redirects | Anton, before decommissioning the old host. Not code. |
| 4 | `cron:translate` | Anton, later, `--limit` first. Not code. |
| 5 | Rentals/venta hub tidy-up | **P1** (Sonnet). |
| 6 | Hero photos for the hubs | **P2** (Opus, Higgsfield). |
| 7 | Directory profile look | **P3** (Sonnet). |
| 8 | D3 agent matching | **P4** (Opus, schema — PR only, Anton merges after `db:status`). |
| 9 | Owner inbox (D8) | Largely exists (`/mis-avisos/consultas`, `routed_to: "owner"`); **P5** verifies and fixes the stale docs. |
| 10 | Reviews/ratings | Parked. P5 writes the decision question to `docs/decisions-needed.md`. |
| — | Spanish rental domain | `alquiler.com.py` not bought. When Anton owns a name (`alquileres.com.py` first choice), rename the host key in `verticals.ts` + `next.config.ts` redirects + docs; one Sonnet hour. Not started. |

## Phase table

| Phase | Model | Prompt | Owns | Depends on |
| --- | --- | --- | --- | --- |
| P1 hub tidy-up | Sonnet | `prompts-polish/sonnet-p1-hub-tidy.md` | `app/[operacion]/page.tsx`, `src/components/SearchBar.tsx` (button class only), `esHub`/`enHub` keys, CSS append `/* == P1 == */` | — |
| P2 hub photos | Opus | `prompts-polish/opus-p2-hub-photos.md` | `public/img/hub-*.webp`, CSS append `/* == P2 == */`, the `data-op` attribute on `.hub-hero` if P1 has not landed | P1 preferred, tolerated overlap |
| P3 profile look | Sonnet | `prompts-polish/sonnet-p3-profile-look.md` | directory branch of `app/agente/[slug]/page.tsx` + `app/inmobiliaria/[slug]/page.tsx`, CSS append `/* == P3 == */`, `directory` i18n keys (new only) | — |
| P4 D3 matching | Opus | `prompts-polish/opus-p4-d3-matching.md` | `src/db/schema.ts`, new `drizzle/*.sql`, `app/admin/leads/**`, `src/lib/directory-queries.ts`, `src/lib/matching.ts` (new), `esPanel` keys, `docs/log/p4.md` | — ; **PR only, never merged by the session** |
| P5 docs truth | Sonnet | `prompts-polish/sonnet-p5-docs-truth.md` | `CLAUDE.md` (backlog items 8, 10, 11 and the domain table rows named in the prompt), `PLAN.md` D8 line, `README.md` domain section, `docs/decisions-needed.md` | — |

## §1 Decisions already made — do not re-litigate

1. Every rule in `CLAUDE.md` (i18n dictionary, cache tags, facets, no
   `.github/workflows`, brand via `brandName()`, no *propia*, no email).
2. **No invented figures anywhere** — no counts, ratings, response times.
3. Autonomous merge is authorised for P1, P2, P3, P5 (UI/copy/docs) once
   `npm run verify:local` is green. **P4 is never merged by a session**: it
   touches the schema; Anton runs `npm run db:status` before and after.
4. CSS is append-only per phase, one `/* == <phase> == */` block at the end of
   `app/globals.css`. On `git merge main` conflicts: main wins, re-apply your
   block. Never edit another phase's block.
5. Shared components never branch on the vertical key. Door-specific looks go
   through theme tokens or a wrapper class the door-specific branch already
   sets.
6. Reviews/ratings and the owner inbox are decisions, not build work here.

## §4 Autonomy protocol (short form)

Work until the exit list passes; open one PR per phase against `main` from
branch `claude/<phase-id>`; minor issues → `docs/log/<phase>.md` Known issues;
stop-and-ask = append to `docs/decisions-needed.md`, commit, push, end. Never
message another session. Fable is never spawned (`fable-cost-guardrail`).
Phase log ≤ 12/8/8 lines + one Verification line. Add the §9 line.

## §9 Build log index

(one line per phase as it lands)

- **P5 — docs truth pass**: D8 owner inbox found already built (only owner
  lead notification is open, not the inbox itself); directory/rentparaguay
  rows corrected to live; `alquiler.com.py` marked not-purchased; README
  domain section rewritten; reviews decision logged to
  `docs/decisions-needed.md`. `docs/log/p5.md`.
- **P1 — operation hubs: compact hero, listings first, chips for types**:
  hero shrunk to title/lead/search bar with no min-height; count badge
  dropped, its number folded into the latest-listings heading; section
  order is hero → latest listings → by city → by type (types last, as
  chips, hidden under 2); search button now follows the door's button
  tokens. `docs/log/p1.md`.
