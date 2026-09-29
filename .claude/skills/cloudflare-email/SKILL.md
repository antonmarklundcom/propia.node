---
name: cloudflare-email
description: Anton's Cloudflare Email Service setup (Email Routing + Email Sending, beta) for many domains on one $5 Workers Paid account. Use to answer questions about limits, pricing, quota, DNS, DMARC/SPF, inboxes or the inbound Worker, and to prepare a NEW or OLD site/domain (hospital.com.py, realestateinparaguay.com, client sites) for sending and receiving email through Cloudflare. Triggers - cloudflare email, email routing, email sending, cf-bounce, catch-all, inbound-email worker, add a domain to cloudflare, move nameservers, mailboxes per site, daily sending quota.
---

# Cloudflare email — how Anton runs it

One Cloudflare account, one $5 Workers Paid plan, many real domains. Every
domain is its own zone: it **receives** through Email Routing (catch-all to one
Worker, then the app) and **sends as itself** through Email Sending. No shared
sender domain, so each domain keeps its own reputation.

Details live in `references/`. Read only the file the task needs:

| Need | File |
| --- | --- |
| A limit, price, quota or "is X allowed?" | `references/facts.md` |
| Preparing a domain / site (new or old), step by step | `references/onboard-site.md` |
| How the pieces fit, this repo's code, what is not built | `references/architecture.md` |
| Which domains are done, pilot results | `references/site-log.md` |

## Rules for answering

1. **Check `references/facts.md` first**, and quote its verified date. It is a
   beta product: pricing, quota and API paths can change with no notice. For
   anything money- or limit-related that matters to a decision, re-check live
   (`developers.cloudflare.com/changelog/product/email-service/`, or search
   "Cloudflare Email Service limits") and update `facts.md` if it moved.
2. **Never state an undocumented thing as fact.** `facts.md` has an "Unknown"
   list. Say "not documented" and give the test that settles it.
3. **Do not touch DNS, nameservers or the Cloudflare dashboard yourself.** Give
   Anton the exact steps; he does them. Never ask for or store API tokens,
   account IDs or secrets in a file.
4. If a question is really a code change (per-site sender, mailbox tables),
   the app's own rules apply: `AGENTS.md`. A schema change is a
   `MIGRATION REQUIRED —` PR that an agent never merges.

## Preparing a domain (short form)

Full checklist with commands and rollback: `references/onboard-site.md`.

1. Classify: **new** (nothing to lose) or **old** (live website and/or mail).
2. Old domain: snapshot DNS first, disable DNSSEC and wait out the DS TTL, let
   Cloudflare import records, compare them one by one, only then change
   nameservers.
3. Email Routing on: merge any existing root SPF, keep the auto MX records,
   catch-all to the `inbound-email` Worker.
4. Email Sending onboard the **apex** (a subdomain is a separate sending
   domain). Check `_dmarc` was not overwritten.
5. Test: receive, send, reply threading, one 3-recipient send to see whether
   the quota counts messages or recipients (still unknown).
6. Record the result in `references/site-log.md`.

## Keep this skill small

New knowledge goes into the reference files, not into this body. If a file
grows past a screen or two per topic, split it. Update the "verified" date
whenever a fact is re-checked.
