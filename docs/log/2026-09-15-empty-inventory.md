# Empty and sparse inventory

- A-D apply to PremiumHome, which replaced the audit's NordicoHome and EnHome.
  Both locales now show an honest empty message and the existing publish CTA.
- One/two-card desktop grids are centered with a 360px card-width cap. Three or
  more cards retain the previous grid, as do mobile layouts.
- C uses Latest listings / Últimas publicaciones instead of a seven-day cutoff:
  sparse but available inventory should remain visible without a freshness claim.
- E deferred: listCities lists seeded locations, not inventory. Correct tile and
  suggestion filtering needs operation/type/vertical-scoped counts, location
  resolution and appropriate caching, beyond the small navigation change here.
- The 404 uses dict(), including suggestion labels. Database-error fallback and
  all category indexability/noindex rules remain unchanged.

## Verification

- `npm.cmd run verify:local`: passed (typecheck, build, import, facets, i18n, SEO).
- `npm.cmd run verify:i18n` and `npm.cmd run verify:seo`: also passed separately.
- `git diff --check`: passed; source diff reviewed.
- PowerShell blocks npm.ps1, so commands use npm.cmd. Unmodified tsx startup
  fails with uv_os_get_passwd ENOMEM in this Windows environment, including
  attempts with `node --import tsx scripts/verify-{i18n,seo,import,facets}.ts`
  and TSX_TSCONFIG_PATH=scripts/tsconfig.json.
- Passing verification used a temporary external NODE_OPTIONS --require shim:
  only when os.userInfo throws that syscall error, it supplies USERNAME and the
  Windows uid/gid defaults for tsx's temporary-directory name. No check logic or
  repository dependency was modified. An initial shim path used backslashes and
  failed to load; the successful run used forward slashes.
- A standalone repeat build overlapped the final gate's build and failed copying
  routes-manifest.json. The final gate completed successfully after that process
  exited. Initial typecheck and build also passed without the shim.
- No browser rendering or database-backed inventory scenarios were verified.
  Scope checks and migration checks are inapplicable; no scripts were changed.
- Audit file and onboarding/signup/publish-query work were left untouched.
  No push or PR. Local commit attempted with `git commit -m "fix: make empty
  inventory intentional and localize search recovery"`, but both staging and
  committing failed: .git/index.lock permission denied (.git is read-only in
  this session). Changes remain unstaged in the working tree.
