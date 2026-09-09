# Phase O1 — doors, families and routing. Paste into a fresh OPUS session. First of three Opus phases in this session.

Read `fable/plan-rentparaguay.md` FIRST, in full — plus its §9 and
`fable/KNOWN-ISSUES.md` — then `CLAUDE.md` ("Domains", "Listing filters",
i18n) and `fable/plan.md` §1 and §4 (the rules this plan inherits). Execute
plan §5.1 under the autonomy protocol §4. Build nothing outside the plan.

Read the mechanisms before editing them: `src/config/verticals.ts`,
`src/lib/alternates.ts`, `src/lib/origin.ts`, `src/lib/sitemap.ts`,
`src/design/sections.ts`, `scripts/verify-seo.ts`, `src/lib/facet-sql.ts`.

Phase rules:
- `git fetch origin main && git reset --hard origin/main`, then branch
  `claude/fable-o1-rental-doors`.
- Load skill `propia-dev` before editing.
- **This phase opens its PR and does not merge it.** A new `VerticalKey`
  plus new rules for hreflang, canonical and sitemap ownership is structural
  — not auth, payments or schema, but the founder looks at it first, the way
  `docs/prompts/rentparaguay-vertical.md` already ruled. Title prefix
  `[routing — flag before merge]`; body states the family model, why both
  doors are `enabled: true` (plan §1 item 3), and the detail-canonical rule
  (§1 item 5).
- Decisions in plan §1 items 1–5, 9, 12 are made. Do not reopen the key
  shape, the family field, the filters or the brands.
- **No visible change on any live door.** Registry functions gain family
  branches but no component consumes them yet; `app/page.tsx` and the
  chrome fall through to today's default for the new keys. Prove it with the
  `<head>` curl diff in §5.1.
- `AlternateInput.family` is required, not optional — an optional field
  defaulting to marketplace is how a future rental page silently pairs with
  the wrong doors. Update every `languageAlternates()` caller.
- `verify:seo` gains the "families" block in §5.1 (a)–(g) **before** the
  table is edited, watched failing, then passing. Never weaken an existing
  check.
- Do not touch `schema.ts`, `crm.ts`, `src/db/**`, `themes.ts`, any
  component. `CLAUDE.md` gets only the two domain-table rows.
- Re-runnable; minor issues → `fable/KNOWN-ISSUES.md`; stop only per §4.4.

Exit: `npm run verify:local` green (`verify:seo` and `verify:facets`
included); `grep -n "family" src/config/verticals.ts` shows every entry;
every `languageAlternates()` call site in `app/` and `src/` passes `family` (grep them and list them in the PR); the three
live-door `<head>` diffs are empty; PR **open**, flagged, linked in §9 with
the words "awaiting founder merge".

## After this phase — wait, then O2 in this same session
Gates: PR open and flagged (this phase's substitute for "merged"); exit list
passed; pre-handoff audit done (re-run `verify:local`, adversarially re-read
your own diff, fix findings); §9 entry committed. **O2 stacks on O1's
decisions and must branch from a main that contains them.** If the O1 PR is
merged while this session is open: reset to `origin/main` and continue with
`fable/prompts/opus-2-rental-shell.md` in this window (same model). If it is
not merged: stop here with the report (PR link, the family model in three
sentences, the §7 items it needs — domain ownership confirmation and DNS).
O2 then starts in a fresh Opus session once O1 is on main. Never start O2 on
top of the unmerged O1 branch.
