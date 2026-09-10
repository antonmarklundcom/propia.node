# Phase P5 — make the docs say what the code does. SONNET session, medium effort. Runs in parallel with P1/P3/P4.

Read ONLY: this file; `fable-plan-polish.md`; `CLAUDE.md` in full (it is the
file you fix); `PLAN.md` lines around "D8"; `README.md` domain section;
`app/mis-avisos/consultas/page.tsx`; `app/api/leads/route.ts` (the `routedTo`
chain); `src/config/verticals.ts` (the table only); `docs/log/d1.md`, `d1b.md`,
`d4.md`. Verify each claim below against the code before writing it.

Owns: `CLAUDE.md`, `PLAN.md` (D8 checkbox/status lines only), `README.md`
(domain section only), `docs/decisions-needed.md`, `docs/log/p5.md`, one §9 line.

Hard limits: docs only. No code. Do not restyle or reorder CLAUDE.md; edit
the specific claims below in place and keep its voice.

## What to check and fix
1. **Owner inbox (CLAUDE.md backlog item 8, PLAN.md D8).** The code has
   `/mis-avisos/consultas` and `/api/leads` routes `"owner"`. Determine what
   is actually still missing (notifications? edit/pause? nothing?). Rewrite
   item 8 to state the real gap in ≤ 6 lines; tick or annotate D8 in PLAN.md
   accordingly. If nothing is missing, say so and move the item to "done".
2. **Directory door rows** (domain table + backlog item 11): #126 flipped
   `ownsDirectory` onto `inmobiliarios.com.py` and DNS is live; the Fable
   session already edited these rows — re-read them and fix anything still
   stale (e.g. "DNS pending", "does not own them yet").
3. **rentparaguay.com row**: DNS is live (Anton, 2026-09-10). Say so; keep the
   WhatsApp env var and the WordPress-redirect check as open founder items.
4. **alquiler.com.py row**: not purchased. Add one line: the Spanish rental
   door stays `enabled: true` but unreachable until a domain is bought
   (`alquileres.com.py` first choice); renaming the host key is a one-hour
   Sonnet task, listed in `fable-plan-polish.md`.
5. **Backlog item 4 (reviews/ratings)**: unchanged in CLAUDE.md, but append
   to `docs/decisions-needed.md` (create if missing) one entry: "Reviews on
   agent profiles — build a moderated review flow (needs schema, anti-fake
   design, and legal review of publishing named reviews)? Options: (a) not
   now, (b) verified-lead-only reviews, (c) operator-curated testimonials."
   Recommend (c) as the cheapest honest start.
6. **README** domain section: name all five served doors with one line each
   and their live/not-live state as of today.
7. Update `CLAUDE.md`'s "Last verified against the code" date.

## Exit
`npm run verify:i18n` still green (you touched no code, but run it); every
sentence you wrote is traceable to a file you read. Branch `claude/p5-docs-truth`,
one PR "P5 — docs truth pass (owner inbox, directory go-live, domains)". Merge
yourself when green (§1 item 3 — docs). `docs/log/p5.md` + §9 line in the PR.
