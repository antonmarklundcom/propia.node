# Security review of the public entry points — 2026-10-01

Scope: every route handler under `app/api/` (14), the export routes, the login
/ password-reset / registration actions, cookie flags, redirects after login,
and raw-HTML rendering. Read by hand; no database, no production traffic.

## Fixed in this PR

| Where | Problem | Fix |
| --- | --- | --- |
| `/api/leads`, `/api/alertas`, `/api/a` | `req.json()` / `req.text()` buffered the whole body before anything checked its size. Route handlers have no framework body limit (only server actions do), so one large POST was that much memory in the shared process. The beacon checked 64 KB only *after* reading. | `readCappedText()` (`src/lib/request-body.ts`) refuses past a cap while reading, trusting neither Content-Length nor its absence. Caps: leads 32 KB, alertas 8 KB, beacon 64 KB. A refused lead/alert answers 413; the beacon stays 204. |
| `/api/leads` `utm` | `z.record(z.string())`: any number of keys of any length, stored as-is in `leads.utm` and copied to the CRM. | Trimmed, not rejected (20 keys, 40-char keys, 300-char values): the browser fills it from the landing URL, and an over-long campaign tag must never cost a lead. |
| `/api/mapa` | No rate limit; every call is an uncached query. A loop of random boxes is pool pressure for every page. | 120 per IP per minute (a person sends one per pan end); 429 is already shown by `CategoryMap` as its error state. |
| `/api/health/db` | Unauthenticated, no limit, each call takes a pool connection. | 30 per IP per minute; `verify:live` asks once. |

## Checked and sound (no change)

- **Webhooks** (`/api/inbound-email`, `/api/whatsapp`, `/api/telegram`,
  `/api/cron/tick`): signature or secret checked in constant time before the
  body is parsed, size-capped reads, off (503) until configured, idempotent
  storage, no message content in logs.
- **Attachment and WhatsApp media downloads**: session required, the same
  visibility predicate as the page that listed them, one 404 for "missing" and
  "not yours", always `attachment` + `nosniff`, active types served as
  octet-stream.
- **Lead / alert forms**: same-origin check, JSON-only content type (blocks the
  text/plain CORS dodge), per-IP limits taken from the last `x-forwarded-for`
  hop, per-address cap on outgoing mail, zod errors never echoed.
- **`x-vertical`**: the middleware overwrites it on every request including
  `/api`, so a client cannot choose a lead's door (and with it the VenderCRM key).
- **Login**: per pair / IP / email lockout before the DB or scrypt is touched,
  a dummy hash so an unknown email costs the same, `safeNext()` blocks `//`,
  `/\` and control characters. Session cookie `httpOnly`, `SameSite=Lax`,
  `Secure` in production, only a hash stored server-side.
- **Raw HTML**: the only `dangerouslySetInnerHTML` is JSON-LD, which escapes
  `<`; received email HTML is sanitized and shown in a sandboxed frame.

## Noted, not changed (low risk, or needs a decision)

- `experimental.serverActions.bodySizeLimit: "8mb"` (for the spreadsheet
  import) applies to **every** server action, the public ones included. A
  per-action limit does not exist in Next 15; the cost is memory per request,
  bounded by each action's own validation after parsing. Revisit if abuse shows.
- A Telegram link token (`/start <token>`) is reusable for its one hour. Anyone
  who sees the deep link in that hour could link their chat — but a user with a
  chat already linked is never silently re-linked. Single-use would need a
  table; not worth it today.
- `/api/og/*` is already limited (4 in flight, 40 per IP per 5 min, one render
  at a time).

## Not verified

- No load test; the limits are reasoned, not measured.
- `verify:scopes` not run (no panel query touched).
