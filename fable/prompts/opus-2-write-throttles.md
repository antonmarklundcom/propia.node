# Phase O2 — public-write throttles. Paste into a fresh OPUS session, ONLY after O1 is merged.

Read `fable/plan.md` FIRST, in full — plus §9 and `fable/KNOWN-ISSUES.md` —
then `CLAUDE.md`. Execute plan §5.2 under the autonomy protocol §4. Build
nothing outside the plan. `fable/REVIEW.md` R3, R4, R11 are the findings.

Phase rules:
- Reset to `origin/main`, branch `claude/fable-o2-write-throttles`.
- Load skill `propia-dev` before editing.
- This is an auth-adjacent surface: per CLAUDE.md "flag before merging", this
  phase **opens its PR and does not merge it**. Title prefix
  `[auth — flag before merge]`; body states the two limits and why the
  numbers were chosen.
- Reuse `allowRequest()` from `src/lib/rate-limit.ts` and `clientIpFrom()`;
  do not write a new limiter and do not edit `src/lib/auth/**`.
- A refused OTP request must reuse the wizard's existing cooldown result
  shape so no client change is needed.
- New user-facing copy goes into `es.ts` and `en.ts` in the same commit.
- Re-runnable; minor issues → `fable/KNOWN-ISSUES.md`; stop only per §4.4.

Exit: `npm run verify:local` green; `registerAction` and `requestOtpAction`
each call `allowRequest` before any hashing or DB write; PR **open**, flagged,
linked in §9 with the words "awaiting founder merge"; no other branch stacked
on it.

## After this phase — hand off to S1 (fresh session, model switch)
Gates: PR open and flagged (this phase's substitute for "merged"); exit list
passed; pre-handoff audit done; §9 entry committed. Then `create_session` with
the inherited environment and permission mode (never `plan`), `model` set
explicitly to **Sonnet** (never Fable), prompt exactly:
`Read fable/prompts/sonnet-1-docs-ops.md in this repo and execute it.`
No `create_session`: stop here and report — the next phase is a model switch.
