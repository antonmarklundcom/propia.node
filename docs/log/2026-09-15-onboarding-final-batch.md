# Onboarding final batch — local review

## Scope and choices

1. Messaging status in the publish wizard: reuse the existing `otpEnabled`
   prop to explain whether a code is required, then distinguish listing review
   from the professional verification badge. No publishing or auth behavior changed.
2. Translation status in `/admin/operaciones`: reuse the existing job metadata
   readiness flag. Explain Spanish fallback, the bounded simulation, and the
   limits of panel history. Configuration is not provider health, scheduling,
   or proof of current translation coverage. No new queries or job execution.

This order delivers the immediate publisher guidance first, then reuses the
existing operations UI for the lower-priority dependency.

Inventory-aware navigation is deferred: the current renderers are
`PremiumHome.tsx` (the equivalent of the audit's old NordicoHome/EnHome
citations) and `app/not-found.tsx`. The current plan explicitly prohibits
editing both files in this batch. No unused query plumbing was added.

## Verification

- `npm run verify:local`: blocked by PowerShell execution policy for npm.ps1;
  rerun with `npm.cmd run verify:local`.
- First `npm.cmd run verify:local`: typecheck and build passed; verify:import
  could not start because tsx calls `os.userInfo()` and Windows sandbox returns
  `uv_os_get_passwd ENOMEM`. Confirmed with
  `node -e "console.log(require('os').userInfo())"` (failed).
- Retried the gate with a temporary, process-local NODE_OPTIONS preload that
  supplies an OS username only when that specific sandbox call fails. No app
  dependency or verification assertions were changed. The shim is not committed.
- Successful command: `$env:NODE_OPTIONS = '--require="C:/Claude 1/propia.node/.verify-os-user.cjs"'`
  followed by `npm.cmd run verify:local`: exit 0. Typecheck, build,
  verify:import (pure half), verify:facets, verify:i18n, verify:seo all passed.
  DATABASE_URL was unset, so verify:import skipped its database half.
- `git diff --check`: passed. Reviewed the full diff before committing.
- No auth, schema, panel query, or script changed; `verify:scopes`, `db:status`,
  and script dry runs are not applicable to this diff.
- Production messaging delivery, provider health, translation coverage and cron
  scheduling were not accessed or verified. No database or browser UI run.
- Other onboarding branches were not merged or cherry-picked; their combined
  behavior remains for integration review. The R2 message area is untouched.
- Audit and current plan files were left unchanged and unstaged.

Requested local commit was attempted with `git commit -m "Clarify publish verification and translation readiness"`.
Both `git add` and `git commit` failed: `.git/index.lock: Permission denied`.
The session grants read-only access to `.git` and disables permission escalation.
Changes remain unstaged for local review; no push, PR, merge, or main changes.
