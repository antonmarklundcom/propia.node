# Preparing a domain for Cloudflare email

Anton does the dashboard/registrar steps; the agent writes the checklist for the
specific domain and records results in `site-log.md`. Do one domain at a time.
Never put tokens or account IDs in files.

## 0. Before anything

- Domain is registered and Anton controls the registrar login (NIC.py for
  `.com.py`).
- Workers Paid is active on the account (Email Sending needs it).
- Decide: is this a **new** domain (no site, no mail) or an **old** one?
- Who will use which addresses? List them (`hola@`, `anton@`, ...). They become
  `mailboxes` rows in the app later; Cloudflare only needs the catch-all.

## New domain (nothing to lose)

1. Cloudflare -> Onboard a domain -> add the zone (Free zone plan is enough).
2. Change nameservers at the registrar to the two Cloudflare ones. Wait for the
   zone to show Active (up to 24 h).
3. Continue at "Email Routing" below.

## Old domain (live website and/or mail)

1. **Snapshot first.** Export or screenshot every DNS record at the current
   provider. Note: A/AAAA/CNAME for the site, MX, every TXT (SPF, DMARC, Google
   / Microsoft verification), and where the site is hosted.
2. Add the domain to Cloudflare. Let the DNS scan import records.
3. **Compare imported records to the snapshot, one by one.** Add anything missing.
   Do not change nameservers until they match.
4. If DNSSEC is on at the registrar: remove the DS record, wait for its TTL
   (commonly 24-48 h; `dig DS <domain>`), because switching nameservers with DNSSEC
   active gives SERVFAIL.
5. Existing mailboxes elsewhere (Google Workspace, hosting mail)? Keep their MX
   until you decide they move. Routing would replace those MX records: decide
   first, do not do both by accident.
6. Change nameservers at the registrar. Keep the old provider's records alive
   until propagation is done. Check the site and any old mail still work.
7. Re-enable DNSSEC via Cloudflare once the zone is Active (optional).
8. Website A record: DNS-only or proxied both work for email.

## Email Routing (receive)

1. Zone -> Email -> Email Routing -> enable. Accept the MX/SPF records it adds.
2. **Merge SPF**: if a root `v=spf1` TXT already existed, combine into a single
   record (one `v=spf1` only).
3. Routing rules -> **Catch-all -> Send to a Worker -> `inbound-email`** (the
   Worker in `workers/inbound-email/`). Optionally named rules
   (`hola@`, `anton@`) to the same Worker or to a Gmail.
4. Worker `FALLBACK_FORWARD` must be a verified destination, so nothing is lost.
5. Unknown local parts also arrive through the catch-all; the app must file them
   in an "unassigned" queue, never under a client.

## Email Sending (send)

1. Zone -> Email Sending -> Onboard domain -> the **apex** (not `mail.`).
2. Accept the `cf-bounce.` records and the `_dmarc` record. Then open DNS and
   **read `_dmarc`**: if the domain had its own policy, make sure it is not
   overwritten (edit back, or start at `p=none` while warming up).
3. Send from `anton@<domain>` only after the status shows Enabled/Configured.

## Tests (record each in `site-log.md`)

1. From Gmail, write to `hola@<domain>`: appears in the Worker/app (or Gmail
   fallback) within seconds.
2. Send a test from the app/API as `anton@<domain>` to Gmail: not in spam; view
   original -> SPF pass, DKIM pass, DMARC pass.
3. Reply from Gmail to that message: it comes back through the catch-all.
4. Once per account: send one email with 3 recipients and note whether the daily
   counter rises by 1 or 3 (see `facts.md`, Unknown).
5. Warm-up: keep the first days small; add volume gradually.

## Rollback

- Before the nameserver change: nothing to roll back.
- After: set the registrar's nameservers back to the previous provider (its
  records are still there) and re-add the DS record if DNSSEC was on.
- Email Routing off: Zone -> Email Routing -> Disable (records are removed).

## Site-specific extras

- A client site that only needs a contact form: usually the site's own form ->
  VenderCRM (`vendercrm-lead-capture` skill) is enough; email through Cloudflare
  is for notifications and real inboxes.
- Health/patient-data sites (e.g. a hospital): do not put clinical information in
  email; treat as a founder decision before enabling any inbox.
