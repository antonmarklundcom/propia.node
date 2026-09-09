# Fable 5.1 planning session — turn the rentparaguay.com/alquiler.com.py build into a phased Opus→Sonnet plan

You are planning, not executing. Do not write application code in this
session. Your job is to read the material below and produce a phased build
plan the way `fable/plan.md` did for the fix-and-harden work — a phase
table plus one self-contained prompt file per phase under `fable/prompts/`,
each one paste-ready into a fresh code session.

**Sequencing Anton wants:** all Opus phases run first, in one code session,
opening however many PRs that session needs — merge those before any Sonnet
phase starts. Then all Sonnet phases run in the next session/window, again
however many PRs it needs. Do not interleave Opus and Sonnet phases in the
phase table; put every Opus phase before every Sonnet phase, in dependency
order within each group.

## Read, in this order

1. `CLAUDE.md` — the whole file, but especially "Domains", "Listing
   filters", and the i18n section. This is the current-reality doc; trust
   it over `ARCHITECTURE.md` or `PLAN.md` wherever they disagree.
2. `PLAN.md`'s D6 entry (`inmobiliaria.com.py` / `realestateinparaguay.com`
   split) — it's the precedent this build follows — and its note (around
   the `alquiler`/`terreno` discussion) that `alquiler.com.py`'s
   `copy: "rental"` branch is declared but has never been consumed anywhere
   in the app. Also skim `fable/plan.md` itself for the house style of a
   phase table and prompt file, and `fable/REVIEW.md` if it still exists,
   for the standing rules a plan is expected to respect.
3. `src/config/verticals.ts` end to end — the actual current state of every
   vertical, enabled or not, and the shape of a `VerticalConfig`.
4. `docs/prompts/rentparaguay-vertical.md` — a first-pass build brief
   already written for this vertical. Treat it as raw material and a
   starting point, not a finished spec — your job is to turn it (plus
   everything else here) into the actual phased plan, correcting or
   sharpening anything in it that turns out to be wrong once you've read
   the rest of the codebase.
5. `docs/rentparaguay-extraction/SITE-SUMMARY.md` in full, then
   `docs/rentparaguay-extraction/site-content.json` for the structured
   per-page copy from the old WordPress site. This is scraped content
   staged for exactly this build — real vs. fabricated content is broken
   out clearly in the summary, don't re-derive it from the raw `pages/*.json`
   dumps.
6. `src/lib/facet-sql.ts` (`verticalConds()`), `src/lib/crm.ts`
   (`routedTo` lead routing), `src/i18n/es.ts` + `en.ts` + `index.ts` +
   `server.ts`, and `src/design/themes.ts` — the mechanisms this build
   will actually hook into. Confirm or correct the "no new listings
   feature needed" claim in `docs/prompts/rentparaguay-vertical.md` §"What's
   real vs. fabricated" against what `verticalConds()` actually does today.

## What the plan needs to decide and hand downstream (don't leave these open)

- The `VerticalKey`/domain shape for `rentparaguay.com` alongside
  `alquiler.com.py` — same-key-different-locale vs. a brand-new key, modeled
  on the `realestateinparaguay.com` precedent. Pick one and write down why;
  don't hand this decision to the build session as an open question if you
  can resolve it from the code.
- Whether the lead-capture form for this vertical routes through Resend
  only, through the existing `src/lib/crm.ts` lead pipeline, or both —
  resolve from reading `crm.ts`, don't leave it as a coin-flip for whichever
  phase builds the form.
- Whether any phase needs a `schema.ts` change. If yes, that phase must be
  called out as MIGRATION REQUIRED and explicitly **not** auto-merged, per
  the repo's standing rules — plan it as its own phase, reviewed before the
  next phase starts, regardless of the Opus-then-Sonnet ordering above.

## Phase-splitting guidance

Rough shape (adjust based on what you actually find reading the code —
this is a starting hypothesis, not a mandate):

- **Opus phase(s):** the structural work — `verticals.ts` entry/entries,
  any new `VerticalKey`, the vertical's home-layout branch (look at how
  `mode`/`copy` currently select a shell, e.g. `NordicoHome.tsx` or
  equivalent), theme token decisions in `src/design/themes.ts`, the
  lead-form's backend wiring decision from above, and anything schema-
  shaped. Structural/architectural decisions belong in Opus's hands, not
  Sonnet's — this mirrors how `fable/plan.md` split O1/O2 from S1/S2.
- **Sonnet phase(s):** the content-heavy, mechanical work once the shape
  exists — writing the `es.ts`/`en.ts` namespaces from the real copy in
  `docs/rentparaguay-extraction/`, building the actual page components for
  home/services (7 of them)/about/contact, placing the real content images
  from `docs/rentparaguay-extraction/images/` into their proper location
  and deleting the scratch extraction folder once done, and the redirect
  map for any old URL paths that don't survive 1:1 (`SITE-SUMMARY.md` has
  the old site's URL list).

Each phase's prompt file (in `fable/prompts/`, matching the existing
`opus-N-*.md` / `sonnet-N-*.md` naming) needs: what to read first, exactly
what it may and may not touch (model this on the existing prompts' "hard
limits" sections), the branch name, its exit criteria (`verify:local` at
minimum; `verify:seo` and `verify:facets` if it touches vertical routing),
and whether it opens a PR for review or is authorised to auto-merge per the
repo's own working-agreement rule ("autonomous merge... for well-verified,
low-risk work (CSS, UI, copy, docs)... flag before merging anything
touching auth, payments, or the DB schema"). New `VerticalKey`/routing work
is structural enough to open-PR-not-merge even though it's not
auth/payments/schema — say so explicitly in that phase's prompt, the way
the existing prompts do for comparable work.

## Output

1. A new plan file, `fable/plan-rentparaguay.md` (or an addition to the
   existing `fable/plan.md` if you judge it belongs there instead — your
   call, argue briefly for whichever you pick), with a phase table in the
   same shape as `fable/plan.md`'s: phase / model / prompt file / what it
   covers / merge rule. Order: every Opus phase, then every Sonnet phase.
2. One prompt file per phase under `fable/prompts/`.
3. A short report to Anton: the phase table, the three decisions above and
   what you resolved them to (with your reasoning), and anything in
   `docs/prompts/rentparaguay-vertical.md` you're deliberately overriding
   or sharpening, and why.

Do not start any phase yourself. Stop after the plan and prompt files are
written and committed (or opened as a PR, if you judge planning docs should
go through review too — either is fine, say which you chose and why).
