# C3-b — marketplace hub and category editorial restyle

Date: 2026-09-13. Local, uncommitted changes; director owns commit and deployment.

## What landed

- Group (b) 1: page-scoped search/filter rows are transparent, shadowless and
  square. Fields have separating hairlines and bottom-only input borders;
  labels use Jost 11px uppercase with 0.1em tracking. Search submit uses the
  existing gold button tokens; filter submit is outlined. Clear links remain
  text links. Mobile fields stack with bottom hairlines and 48px controls.
- Group (b) 2: list/map links form a square outlined pair with a single shared
  divider; the active link is deep green with cream text.
- Group (b) 3: category h1 uses Cormorant 36px; the 13px secondary count line
  sits 16px below it. Category and hub listing grids reuse the existing
  `ph-grid-4` (4/2/2) rhythm. Pagination links are square and outlined.
- Group (b) 4: category panel actions use outlined secondary styling, scoped
  away from staff panels.
- Both page roots enable the new styling only for `inmobiliaria` and `en`.
  Other doors retain their former layouts. All existing CSS is unchanged;
  new selectors are appended under `/* == C3-b == */`.
- SearchBar, CategoryFilterBar and Glyph needed no source changes: existing
  classes suffice, no scoped emoji were present, and all required glyph names
  already exist. Dictionaries are unchanged.

## Verification

- PASS — `npm run typecheck`: `tsc --noEmit`, exit 0.
- FAIL — `npm run verify:i18n`: exit 1 before dictionary checks. Node v24.16.0
  reports `SystemError [ERR_SYSTEM_ERROR]: A system error occurred:
  uv_os_get_passwd returned ENOMEM (not enough memory)` from
  `node_modules/tsx/dist/temporary-directory-BDDVQOvU.mjs` calling
  `node:os` userInfo. No substitute check or environment workaround used.
- Both npm commands report the existing warning: unknown project config
  `only-built-dependencies`.
- PASS — Node `/\p{Extended_Pictographic}/u` scan: 0 matches across SearchBar,
  CategoryFilterBar, both operation pages, Glyph and globals.css.
- PASS — TypeScript AST comparison against HEAD, normalizing CRLF and excluding
  only JSX `className`/`style` attributes: all five scoped TSX files match.
  Query handling, form inputs, handlers, sorting, view links, pagination links
  and render branches are unchanged. The initial comparison without CRLF
  normalization failed on every file, including untouched files; correcting
  the comparison's line-ending handling produced the passes above.
- PASS — all pre-existing globals.css content matches HEAD after line-ending
  normalization, including protected home, hub-hero, header and staff rules.
- PASS — `git diff --check`: no whitespace errors (Git emits LF-to-CRLF warnings).
- PASS — `git status --short`: only the two operation page files, globals.css
  and this new log are changed; the initial working tree was clean.

## Not verified and deviations

- No browser used: rendered appearance, overflow at 390/768/1024/1440/1920 on
  both doors, native select menus and interactive flows await director checks.
- Build / `verify:local` not run per task instruction about sandbox EPERM
  readlink on the user profile. Director must run the full gate and render.
- i18n verification remains blocked by the runtime error above.
- On the hub's existing dark photo, transparent search labels use the cream
  token at 0.8 opacity and values use cream, so they remain readable. Category
  labels use the specified secondary ink. No token values or hub-hero rules
  changed; this is the only on-dark adaptation.
- No git add, commit, push, branch/reset, production access or key changes.
