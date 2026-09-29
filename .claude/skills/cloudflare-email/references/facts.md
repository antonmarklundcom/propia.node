# Cloudflare Email Service — facts

**Verified 2026-09-29** from Cloudflare's own support assistant, which quoted
its documentation (Pricing, Limits, Domains, Subdomains, Deliverability,
Suppressions, Event Subscriptions, Troubleshooting, DNS setup). Email Service is
**in beta**: everything below can change, and Cloudflare documents no notice
period for beta users. Re-check before relying on a number.

Follow updates: `https://developers.cloudflare.com/changelog/product/email-service/`
and `https://www.cloudflarestatus.com/`.

## Money

- Email Sending is included in **Workers Paid ($5/month)**, account level.
  Zones can stay on the Free zone plan.
- **3,000 emails/month included**, then **$0.35 per 1,000**. No per-domain charge.
- Email Routing (receiving) is free and unlimited.
- Email Workers bill as normal Workers requests.
- No hard stop, spending cap or alert is documented for overage.
- What counts: hard-bounced and accepted emails. Rejected at the API boundary
  (including suppression-list blocks) do not.
- Queues (only if you want bounce/complaint events) exist on Free and Paid; not
  needed at the start. Suppressions can be polled through the API instead.

## Quota and sizes

- **Daily sending quota: 200 at the start, per ACCOUNT**, shared by every domain
  (50 domains do not get 50x). Grows automatically with sending behaviour,
  deliverability and account standing; tiers and timing are not shown.
  Increase: support or the Cloudflare Developers Discord ("Need a higher limit?").
- Anton's dashboard on 2026-09-29: 25 / 200 today, 65 sent since 11 Sep, $0.00.
- Recipients per email: **50** (To + CC + BCC combined).
- Message size, sending: **5 MiB** total incl. attachments (25 MiB only to
  verified destination addresses). Custom headers: 16 KB combined.
- Inbound message size: **25 MiB**.
- General Cloudflare API limit also applies: 1,200 requests / 5 min per token.

## Domains and zones

- **No documented cap on zones per account.** 50-100 separate domains is fine.
- **30 domains per zone** (apex + subdomains, Routing + Sending combined). Not an
  account limit.
- Catch-all: one per apex, **apex only** (not on subdomains).
- Routing rules: 200 per domain.
- One Email Worker can be the catch-all target of many zones (nothing forbids it).
- **Full Cloudflare DNS is required** (nameservers on Cloudflare). Only pointing
  MX at Cloudflare is not enough.
- `.com.py` is a valid Public Suffix List entry; no ccTLD problems documented.
- Sending must be onboarded **per domain**; any local part then works without
  per-address setup. A **subdomain is a separate sending domain**
  (`avisos.hospital.com.py` needs its own onboarding).

## DNS records

| | Email Sending | Email Routing |
| --- | --- | --- |
| MX | `cf-bounce.<domain>` | `<domain>` (root) |
| SPF | `cf-bounce.<domain>` | `<domain>` (root) |
| DKIM | `cf-bounce._domainkey` | `cf2024-1._domainkey` |
| DMARC | `_dmarc.<domain>` (added on Sending onboarding) | none |

- They do not conflict; sending and receiving as the same address is fine.
- An existing root SPF must be **merged**: one `v=spf1` record only.
- MX records are always DNS-only; the website A record can be proxied or not.
- Default DMARC seen in docs examples: `p=quarantine`; editable in DNS. Docs
  recommend starting `p=none`, then `quarantine`, then `reject`.

## Sending API

- `POST /accounts/{account_id}/email/sending/send` (already used by
  `src/lib/email.ts`).
- `from` is `{ email, name }`: the display name can vary per message.
- `replyTo` supported. Threading headers (`In-Reply-To`, `References`) as custom
  headers: not explicitly documented for Sending.
- Transactional only. Bulk/marketing is not supported yet. Unsubscribe links are
  not processed for you.

## Reputation

- Reputation with Gmail/Outlook is **per sending domain**. Suppressions
  (bounces, complaints) are scoped **per sending domain** (since 2026-09-25).
- Recommended targets: delivery > 95%, hard bounce < 2%, complaints < 0.1%.
- Warm-up: "start with small volumes" recommended, none enforced.

## Unknown — settle before scaling

| Question | How to settle |
| --- | --- |
| Quota counts a 3-recipient email as 1 or 3? | Send one to 3 recipients, watch the counter (25 -> 26 or 28). |
| Does onboarding overwrite an existing `_dmarc`? | Onboard one domain that has one; read DNS after. |
| Does one domain's abuse suspension affect the others? | Ask support in writing. |
| Real quota tiers and how fast they grow | Watch the dashboard; request an increase near ~100/day. |
| Do `In-Reply-To`/`References` survive the Sending API? | Send a threaded reply to Gmail and inspect headers. |
| Notice before beta pricing/quota changes | None documented. Keep the sender isolated in `src/lib/email.ts`. |
