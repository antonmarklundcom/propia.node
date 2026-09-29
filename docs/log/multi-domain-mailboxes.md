# Multi-domain mailboxes (2026-09-30)

**Branch `claude/multi-domain-mailboxes`, `MIGRATION REQUIRED —`. Stacked on
`claude/che-roga-project-optin` (migration 0022): merge that PR first, then this
one (migration 0023). An agent does not merge either.**

## What it does

Mail for any number of domains lands in this app's inbox, and each person sees
only the mailboxes they were given.

- **Receiving needs no code change.** The Cloudflare `inbound-email` Worker
  already forwards whatever address Email Routing hands it. Each domain is its
  own Cloudflare zone with a catch-all rule "Send to a Worker → inbound-email".
  `email_messages.mailbox` was already the full recipient address, so that table
  is untouched.
- **Registry.** `mail_sites` (domain, display name, `sending_enabled`, `active`),
  `mailboxes` (`local_part@domain`), `mailbox_members` (user, `can_reply`).
- **Who sees what** — one type, `InboxViewer`, built only by `inboxViewerFor()`:
  super-admin all; staff the shared `hola@`/`contacto@`; a member exactly their
  mailboxes (never the portal's own unless also staff), and may reply only where
  `can_reply`. Paused sites (`active = false`) vanish from their members.
- **Sending.** A registered site sends under its display name. It sends AS
  `<mailbox>@<domain>` only when `sending_enabled` (the founder's confirmation
  that Email Sending is onboarded for that domain); otherwise from `EMAIL_FROM`
  with Reply-To = the mailbox, so the customer's answer comes back.
- **Screens.** `/admin/correo` (super-admin): register domains, create mailboxes,
  add members by the email of an *existing* user, toggle "send as" and pause,
  and a list of mail that reached a registered domain at an address nobody owns
  (one click creates the mailbox). `/correo`: a member's own inbox — list,
  thread, reply, archive.
- **Privacy guard.** The operator's Telegram/email alert for mail to a
  registered domain names the mailbox only, never the sender or subject.

## Founder steps (in this order)

1. Merge the Che Róga PR after `npm run db:migrate` applied 0022, then this PR
   after 0023 (`npm run db:status` → `No drift` each time).
2. Per domain, in Cloudflare: add the zone (nameservers move to Cloudflare —
   snapshot the DNS first), Email Routing on, catch-all → Worker `inbound-email`.
3. In `/admin/correo`: register the domain and its display name; create the
   mailboxes; add each person (they must already have an account — none is
   created here).
4. Only for a domain you also onboarded in Cloudflare Email Sending: tick
   "Activar «Enviar como»". Until then replies go from the portal address with
   Reply-To = the mailbox, which works.

## Verified

- `npm run verify:inbox` (pure): address shapes, `lead-` reserved, who may send
  as whom, the verified-sender rule, the API body.
- **Against a local MariaDB 10.11** (production is 11.8; not identical): migration
  applied, `db:status` No drift; 36 checks through the real `storeInbound()` and
  the real queries — super/staff/members/outsider on list, thread-by-key,
  unread badge, compose list, read and write; forged thread keys match no row;
  pause and resume; unassigned mail; deleting a mailbox drops memberships and
  keeps messages.
- **Against the built app** with local test sessions: `/correo` as member,
  read-only member, outsider, anonymous; a member's thread as outsider and as
  staff (404); `/admin/correo` as super-admin / staff / member; `/admin/inbox`
  as staff (no leak) and as super-admin (everything).
- **Replies with a stubbed provider** (nothing left the machine): read-only
  member refused with nothing sent; staff refused on a client mailbox; sender
  and Reply-To with sending off and on; paused site refused; super-admin still
  replies. This found and fixed a missing Reply-To for a not-yet-onboarded site.

## Not verified / not built

- Never run against production MariaDB 11.8, and no real Cloudflare send or
  receive was made. The first real check is yours: one domain end to end, then
  the quota-counting and DMARC tests in the Cloudflare notes.
- **Not built:** lead reply addresses per site (`lead-…@` stay on the portal's
  machine subdomain); notifying members that mail arrived; compose (new message)
  for members; AI reply suggestions on `/correo`; a member limit or per-site
  send cap; any call to Cloudflare's API.
- Cloudflare's daily sending quota is per account (200 at first) and shared by
  every site — see the quota guard PR. Whether hosting other businesses' mail on
  this account is within Cloudflare's rules (transactional only) is in
  `docs/decisions-needed.md`.
