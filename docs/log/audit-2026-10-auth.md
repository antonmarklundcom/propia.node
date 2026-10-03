# Audit 2026-10 — auth fixes (O10, separate PR) — no migration

Branch `claude/audit-2026-10-auth`. These are the auth findings of
`docs/log/audit-2026-10.md`; that file arrives with the audit PR.
**An agent never merges this PR.**

| # | Fix | Where |
| --- | --- | --- |
| A1 | Login refuses an email over 254 characters or a password over 1 024 before anything stores them. A failed login keeps the email in the in-memory limiter's keys for up to an hour, and server actions accept 8 MB bodies, so a few IPs could fill the process's memory. | `src/lib/auth/actions.ts` |
| A2 | `/recuperar` is a private path for analytics. A reset link's token sat in `analytics_events.path`, the daily rollup and /admin/analitica's top pages, where the read-only credential could read it. | `src/lib/analytics.ts`, `src/components/AnalyticsBeacon.tsx` |
| A3 | Phone-code (OTP) checks claim an attempt with one conditional UPDATE before comparing. The code burns when the database's count reaches 5, and a correct code is consumed only once. | `src/lib/otp.ts` |
| A4 | The reset link's MAC also covers the account email (domain `pwreset.v2`), so a link sent to an old address dies when the email changes. v1 links stop working at deploy; they live an hour at most. | `src/lib/auth/reset-token.ts`, `app/recuperar/**` |
| A5 | Passwords set in /admin/usuarios need 8 characters, like every other path, and the email must look like one. | `app/admin/usuarios/actions.ts` |
| A6 | The login-limiter comment no longer claims "one process". Limits are per process, and there are several (backlog 23). | `src/lib/auth/rate-limit.ts` |

## Verified
- `npm run verify:local` passed. `verify:reset` gained three checks for the
  email binding, and its forge helper speaks v2.
- A3 against a local MariaDB 11.8 (throwaway tsx script, not committed):
  - 20 concurrent wrong guesses: exactly 4 "mismatch" and 16 "too_many".
    The database shows 5 attempts and the code burned.
  - The race was not run against the old code. Its read-then-write is what
    the audit reasoned would let each concurrent guess through.
  - Sequential behaviour is unchanged:
    - 4 wrong guesses, then the right one: ok, and a reuse is refused;
    - 5 wrong guesses: the 5th reports too_many and burns the code.

## Not verified
- A1 and A5 were not driven through a browser; each is a guard of two lines.
- The full reset email round trip: it needs Cloudflare email configured.
  The token page and the action both read the email now; `verify:reset`
  covers the MAC.

## Left to the founder (`docs/decisions-needed.md`, in the audit PR)
- Staff moving agents into agencies as `agency_admin` (D1).
- `/registro` self-assigning a paid plan (D2).
- Enumeration on `/registro`, the welcome email sent to any typed address,
  readable invite tokens and phone codes, and an unverified WhatsApp in the
  unique column (D4).
- A shared login counter, which needs a table.
