# Architecture — many domains, one account

```
 RECEIVE   hospital.com.py       (zone, Routing, catch-all) ─┐
           realestateinparaguay.com (zone, Routing, catch-all)├─► Worker "inbound-email" ─► app /api/inbound-email
           inmobiliaria.com.py   (zone, Routing, catch-all)  ─┘        (signed POST, FALLBACK_FORWARD on any non-2xx)
                                                                              │ look up domain + local part
                                                                              ▼
                                                              sites ─► mailboxes ─► users (who may see it)
                                                                              │
                                                              email_messages(mailbox_id) ─► per-user inbox
 SEND      From anton@<that domain>, display name per site,
           Reply-To <that domain> (answers return through RECEIVE)
```

Design choices already made (2026-09-29):

- **Each domain sends as itself.** No shared `mensajes.com.py`: per-domain
  reputation, no "via" line, no extra cost. A shared fallback sender is only for a
  domain that cannot be on Cloudflare (Sending needs Cloudflare DNS).
- **One Worker, one app.** Every zone's catch-all points at the same Worker.
- **Inboxes are in MySQL, not in Cloudflare.** Cloudflare delivers; the app
  decides who sees what.
- **Reply threading** uses signed `lead-<id>-<sig>@<domain>` addresses on the
  apex catch-all (works on any domain; subdomain catch-alls do not exist).

## What exists in this repo today

| Piece | Where |
| --- | --- |
| Outbound (REST, never throws, 5 s, no-op without env) | `src/lib/email.ts` |
| Inbound Worker + hourly cron | `workers/inbound-email/` (deployed by hand with wrangler; README has steps) |
| Inbound endpoint, HMAC-signed | `app/api/inbound-email/route.ts`, `src/lib/inbox.ts` |
| Who may see a lead thread | `userMaySeeLead()` in `src/lib/inbox-access.ts` |
| Fixed mailboxes | `SHARED_MAILBOXES` (hola@, contacto@) in the inbox code |
| Env (hPanel only) | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_TOKEN` (Email Sending: Edit), `EMAIL_FROM`, `EMAIL_REPLY_DOMAIN`, `EMAIL_ROOT_SENDING`, `INBOUND_EMAIL_SECRET`, `OPERATOR_EMAIL` |
| Sender today | `avisos@mail.inmobiliaria.com.py` (subdomain onboarded for Sending; root is Routing's) |
| Check | `npm run email:test -- --to <addr> [--dry]`, `npm run verify:inbox` |

## Not built (the gap for multi-domain)

1. `mail_sites(domain, display_name, active)`, `mailboxes(site_id, local_part)`,
   `mailbox_members(mailbox_id, user_id, role)`, `email_messages.mailbox_id`.
   This changes `src/db/schema.ts`: **PR title `MIGRATION REQUIRED —`, an agent
   never merges it**, the founder runs `db:migrate` then `db:status` (No drift).
2. Recipient lookup in the inbound route: domain -> site, local part -> mailbox;
   unknown -> unassigned queue (super-admin only).
3. Per-site sender in `email.ts` (today `EMAIL_FROM` is one global value);
   `mail.inmobiliaria.com.py` stays the fallback. Guards for 5 MiB and 50
   recipients.
4. A `userMaySeeMailbox()` predicate (separate from `userMaySeeLead()`; do not
   add visibility rules to the lead predicate).
5. Reply path from `/admin/inbox` per mailbox, sent as that mailbox's address.
6. Optional later: suppression polling or Queues events, spend/quota alerts.

## Watch-outs

- Daily quota is per account (200 now): all sites share it.
- One abuse-suspended domain's effect on the others is undocumented.
- The mail loop needs the site's zone on Cloudflare DNS: every client must be
  willing to move nameservers.
- `AGENTS.md` still applies: no new domain outside `verticals.ts` as a canonical
  or contact address in the portal; no placeholder portal email.
