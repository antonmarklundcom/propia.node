# C3-c: marketplace marketing and directory editorial restyle

Date: 2026-09-13. Local working-tree changes only; no staging, commit, push,
merge, deployment, database operation, or credential access.

## What landed

1. The existing `PageHero` light/dark API is retained. `/nosotros` and
   `/contacto` now pass `tone="dark"`. Light heroes use cream; dark heroes use
   deep green and cream. Eyebrows are 11px uppercase gold with 0.14em tracking,
   titles use the display font at clamp(36px, 4.5vw, 56px), and leads use 18px
   Jost. No design token values changed.
2. Section and prose headings use 28px display type and a 40px hairline below.
   Subsection titles use 13px uppercase Jost.
3. FeatureGrid resolves Glyph names while retaining legacy ReactNode callers
   outside this group. StepList and StatRow accept optional Glyph-name icons;
   the about-page stats now supply them. Feature, step, and stat boxes became
   transparent items with top hairlines. Step numbers use gold display type.
4. CtaBand uses deep green, cream copy, a gold primary action, and an outlined
   secondary action. Marketing buttons have square corners.
5. Agency, agent, developer, and scoped project cards use cream and hairlines.
   Logo/fallback frames are 56px squares; fallback initials became building or
   home glyphs. Marketplace profile branches and the project page gained
   scoped editorial rules. Project facts and section prefixes use Glyphs.
   `/tasacion` uses PageHero and Section; its existing tool is styled only
   beneath the new page wrapper. Queries, actions, metadata, and copy remain
   unchanged apart from the explicitly allowed dictionary emoji prefixes.
6. Contact aside channel rows use doc, pin, clock, mail, and WhatsApp glyphs
   with hairlines. Existing ContactForm mounts remain untouched and inherit
   Group (a)'s styles. The `/contacto` form mismatch is recorded below.

Existing CSS edits are limited to `.mk-*` rules. New selectors live in the
appended `/* == C3-c == */` block. The dedicated directory rendering in the
profile pages is unchanged; the new profile class applies only to the
marketplace branch.

## Commands and verification

| Command/check | Result |
| --- | --- |
| `npm run typecheck` | PASS: `tsc --noEmit`, exit 0. |
| `npm run verify:i18n` | FAIL: exit 1 before verification, in tsx's temporary-directory module; real output below. |
| Node full-file scan using `/\p{Extended_Pictographic}/gu` | FAIL: `FULL FILE SCAN: 25 pictographs in 14 files`; all 25 are in untouched dictionary content, detailed below. |
| Node scoped scan using the same Unicode expression | PASS: zero in all nine page files, MarketingUI, Glyph, globals.css, and the six edited dictionary namespaces. |
| Node/PostCSS parse and comparison against `git show HEAD:app/globals.css` | PASS: CSS parses; after removing allowed-prefix rules and the new block, the remaining CSS matches HEAD. |
| `git diff --check` | PASS: no whitespace errors. Git prints the existing LF-to-CRLF conversion notices. |
| `git diff -- app/services app/servicios app/about app/contact src/components/RentalAbout.tsx src/components/RentalContact.tsx src/components/RentalServicePage.tsx src/components/RentalServicesHub.tsx src/components/ValuationTool.tsx src/components/ProjectCard.tsx` | PASS: empty output. |
| `git status --short` | PASS: only the nine pages, globals.css, MarketingUI, Glyph, both dictionaries, and this log changed. |

Both npm commands also print the pre-existing warning:

```text
npm warn Unknown project config "only-built-dependencies". This will stop working in the next major version of npm.
```

The i18n command's failure is not a failed dictionary comparison: the script
never starts. Its actual error is:

```text
SystemError [ERR_SYSTEM_ERROR]: A system error occurred: uv_os_get_passwd returned ENOMEM (not enough memory)
    at Object.userInfo (node:os:306:11)
    at file:///C:/Users/anton/propia.node/node_modules/tsx/dist/temporary-directory-BDDVQOvU.mjs:1:84
code: 'ERR_SYSTEM_ERROR'
errno: -4057
code: 'ENOMEM'
syscall: 'uv_os_get_passwd'
Node.js v24.16.0
```

## Not verified and deviations

- No browser was used. The director still needs to render both marketplace
  doors at 390 / 768 / 1024 / 1440 / 1920 and verify overflow, glyph alignment,
  empty/populated states, and form states. No live or database-backed behavior
  was exercised.
- `npm run build` and `verify:local` were not run: the task assigns the complete
  gate to the director and identifies the sandbox's EPERM readlink build
  limitation. No sandbox workaround or substitute for the failed i18n command
  was used. The director must rerun `npm run verify:i18n` and `verify:local`.
- PageHero already supported tone; no duplicate prop was added. FeatureGrid
  retains legacy nodes because restricting every existing caller to names
  would require modifying six out-of-scope pages. This group's callers use
  names. No new glyph paths were needed; Glyph gained a name guard.
- No listed page currently mounts StepList. Its optional icon support and
  hairline/number treatment are implemented without inventing page content.
- `/contacto` actually mounts LeadForm, not ContactForm. LeadForm accepts seller,
  agent-signup, developer, and buyer reasons plus a company field; ContactForm
  accepts only buyer/renter and includes listing-specific questions and copy.
  Replacing it would change content and lead routing, contrary to this task.
  LeadForm is shared beyond this group, so it was left unchanged; its form
  styling and success-state pictograph remain. Literal item 6's ContactForm
  reuse on this route is therefore not completed. No separate form CSS added.
- ProjectCard and ValuationTool were explicitly excluded. Both files remain
  unchanged. Page wrappers add the home Glyph over ProjectCard's empty frame
  and hide its existing decorative placeholder locally; its original
  pictograph remains in the shared component/source markup. This preserves
  the home and other users of ProjectCard. ValuationTool changes are CSS only.
- The full dictionary files cannot have zero pictographs without editing
  prohibited home/publishing/staff strings. Remaining counts: es.ts 13,
  en.ts 12. They are the publishing cross-marketplace note, home icon values,
  home projects/prices headings, and esPanel.adminReviewEmpty. Only
  ContactPage, ProjectPage, and AgentProfile prefixes were stripped, eight
  strings per language. No keys or words were added or removed.
- Preliminary tooling failures were recovered: `rg` is unavailable, so
  PowerShell and Node were used; one large apply_patch failed context matching
  without writing, and one Node edit command failed parsing a non-ASCII regex
  after PowerShell encoding. The latter was rerun with a Unicode escape.
