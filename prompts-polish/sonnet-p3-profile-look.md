# Phase P3 — the directory door's profile pages get the "Paso a Paso" look. SONNET session, medium effort. Runs in parallel with P1/P4/P5.

Read ONLY: this file; `fable-plan-polish.md` §1, §4; `docs/style/inmobiliarios.com.py.md`
(the tokens and shape — this is your style contract); `docs/log/d1b.md`;
the **directory branch only** of `app/agente/[slug]/page.tsx` and
`app/inmobiliaria/[slug]/page.tsx`; `src/components/home/DirectoryHome.tsx`
(exemplar of the directory look); in `app/globals.css` the `.directory-home`
block D4 appended and the `.agent-profile__*` / `.agency-profile__*` rules
(read only). CLAUDE.md i18n section.

Owns: the directory branch (inside `isDirectory ? (...)`) of the two profile
pages; `/* == P3 == */` CSS block at the end of `globals.css`; new keys only in
the `directory` namespace of `es.ts` + `en.ts`; `docs/log/p3.md`; one §9 line.

Hard limits: the marketplace branch of both pages stays byte-identical. No
`/api/leads`, no queries, no `DirectoryLeadForm` changes (D4 owns its look),
no `themes.ts`, no other files.

## Decisions (final)
1. Wrap the directory branch's content in `<div className="dir-profile">` and
   scope every new rule under `.dir-profile` — no global overrides of
   `agent-profile__*`.
2. **Header as a card** on cream: white, radius 16, the D4 soft shadow, photo
   or initials at 96px round, name in Lora, the kind line and coverage line in
   Public Sans 15px `--color-ink-secondary`, the verified tick as a small
   cobalt pill "Verificado" (`listVerified` exists) instead of a bare ✓.
3. **Two columns on desktop** (≥ 960px): left = header card, "Cartera
   publicada" rail (existing `ListingCard`s in a 2-up grid), and "Equipo" on
   the agency page; right = the sticky lead form panel (`contact-panel`,
   white card, cobalt submit already via tokens). Mobile: form directly under
   the header card, then the rail.
4. **Empty portfolio**: keep `profileEmpty`, styled as a quiet hairline box,
   never a big grey block.
5. Add one breadcrumb intermediate for the directory branch only: Inicio ›
   Inmobiliarios (`/agentes`) › name, or Inicio › Inmobiliarias
   (`/inmobiliarias`) › name; the JSON-LD `crumbs` array gets the same middle
   entry on that branch. Labels from `directory.chromeNav` — no new strings.
6. No figures, no ratings, no "responde en X".

## Exit
`npx tsc --noEmit`; `verify:i18n`, `verify:seo`, `verify:facets` green; `npm
run build` clean. Marketplace branch unchanged (`git diff origin/main` shows
edits only inside the directory ternary + CSS + i18n). `git merge origin/main`
before the PR (main wins in CSS; re-apply your block). Branch
`claude/p3-profile-look`, one PR "P3 — directory profiles: Paso a Paso look".
Merge yourself when green (§1 item 3). `docs/log/p3.md` + §9 line in the PR.
