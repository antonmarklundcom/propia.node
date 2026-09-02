# Phase O1 — request-path hardening. Paste into a fresh OPUS session.

Read `fable/plan.md` FIRST, in full — plus §9 and `fable/KNOWN-ISSUES.md` if it
exists — then `CLAUDE.md`. Execute plan §5.1 under the autonomy protocol §4.
Build nothing outside the plan. `fable/REVIEW.md` R1, R2, R9, R10 are the
findings with file:line.

Phase rules:
- `git fetch origin main && git reset --hard origin/main`, then branch
  `claude/fable-o1-request-path`.
- Load skills `propia-dev` and `nextjs-deploy-hostinger` before editing.
- Do not touch `src/db/index.ts`, `drizzle.config.ts`, `schema.ts`, or any
  pool bound. Do not add a publish-time hook to any third party.
- `sendOtp` stays synchronous; only `pushLead` and the contact-id update move
  into `after()`.
- Re-read the 503 post-mortem in `PLAN.md` before deciding the timeout value.
- Re-runnable; minor issues → `fable/KNOWN-ISSUES.md`; stop only per §4.4.

Exit: `npm run verify:local` green; `src/lib/crm.ts` uses `AbortSignal.timeout`;
`app/api/leads/route.ts` awaits nothing after the insert except the response;
`claim-import.ts` and `jobs.ts` each wrap their writes in `db.transaction(`;
both medians cache sites read `CACHE_TTL.marketMedians`; PR merged green.

## After this phase — hand off to O2 (fresh session)
Four gates (§4.9): PR merged; exit list passed; pre-handoff audit done (re-run
`verify:local`, adversarially re-read the merged diff, fix findings); §9 entry
committed. Then `create_session` with the inherited environment and permission
mode (never `plan`), `model` set explicitly to **Opus** (never Fable), prompt
exactly: `Read fable/prompts/opus-2-write-throttles.md in this repo and execute it.`
No `create_session`: continue in this window (same model). Never hand off with
a red build or an unmerged PR.
