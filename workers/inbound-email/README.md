# inbound-email — the portal's Cloudflare Email Worker

Waves E2 + E3 of `docs/plan-build-2026-09-26.md` §6. Email Routing hands this
Worker every message for **hola@ / anton@ inmobiliaria.com.py** and for the
**`lead-<id>-<sig>@mail.inmobiliaria.com.py`** reply addresses. The Worker
parses the message (postal-mime) and POSTs it, signed, to
`https://inmobiliaria.com.py/api/inbound-email`, where it shows up in
`/admin/inbox` or under its lead.

**Nothing is ever lost.** If the app does not answer 2xx (down, deploying,
misconfigured, message too big), the original message is forwarded untouched
to `FALLBACK_FORWARD` (your Gmail). An attachment over 5 MB (or over 9 MB for
all of them together) is stored in the panel as its name only, and the whole
original *also* goes to `FALLBACK_FORWARD`. The Worker bounces a message only
if both the app and the fallback forward fail.

This folder is deployed **by hand from your machine** with wrangler. It is not
part of the Next.js build, Hostinger never sees it, and there is no CI for it.

## Deploy (founder, once — in this order)

Do step 0 first: the app has to have the tables before any mail arrives.

0. **Database and app.** `npm run db:migrate` (migration 0018) and
   `npm run db:status` → `No drift`. Then merge and let Hostinger deploy.

1. **Pick the shared secret** (keep it; it goes in two places):

   ```bash
   openssl rand -hex 32
   ```

2. **Deploy the Worker** (Cloudflare account that owns `inmobiliaria.com.py`):

   ```bash
   cd workers/inbound-email
   npm install
   npx wrangler login
   npx wrangler deploy
   npx wrangler secret put INBOUND_EMAIL_SECRET   # paste the value from step 1
   npx wrangler secret put FALLBACK_FORWARD       # your Gmail — must already be a
                                                  # verified Email Routing destination
   npx wrangler secret put COPY_TO                # optional: your Gmail again, to keep a
                                                  # copy of EVERY message while the inbox is new
   ```

   `COPY_TO` is the safety net you have today (hola@ → Gmail), kept alive
   while you get used to the inbox. Remove it later with
   `npx wrangler secret delete COPY_TO`.

3. **hPanel → the Node.js app → Environment variables:**
   `INBOUND_EMAIL_SECRET` = the same value as step 1. Restart the app.
   (Not a `NEXT_PUBLIC_*` variable, so no rebuild is needed.)
   Until this is set, `/api/inbound-email` answers 503 and every message goes
   to `FALLBACK_FORWARD` — which is why the order is Worker first, then this.

4. **Cloudflare dashboard → inmobiliaria.com.py → Email → Email Routing →
   Routing rules:**
   - `hola@inmobiliaria.com.py`: edit the rule, change the action from
     *Send to an email* (Gmail) to **Send to a Worker → `inbound-email`**.
   - `anton@inmobiliaria.com.py`: the same, if you want it in `/admin/inbox`
     too (only the super-admin sees anton@; staff see hola@ and contacto@).

5. **Reply addresses on `mail.inmobiliaria.com.py`** (wave E2):
   - Email Routing → **Settings → Subdomains → Add** `mail.inmobiliaria.com.py`
     (this adds MX + SPF records on the subdomain). Email Sending already uses
     that subdomain for *sending*; the two use different records, but check
     the DNS tab shows no conflict.
   - Routing rules → **Catch-all address → Send to a Worker → `inbound-email`**,
     enabled. `lead-…@` addresses are unique per lead, so only a catch-all
     can receive them. The catch-all also catches mistyped root addresses
     (e.g. `info@`), which then land in `/admin/inbox` (super-admin view).
   - If Cloudflare will not route the `mail.` subdomain, use another one
     (e.g. `reply.inmobiliaria.com.py`): add it as in the first bullet, and
     set `EMAIL_REPLY_DOMAIN=reply.inmobiliaria.com.py` in hPanel.

6. **Test:** from a personal address, write to hola@ — it should appear in
   `/admin/inbox` within seconds, and Telegram should ping. Reply from the
   panel. Then send yourself a lead from the site with your email, answer the
   confirmation email, and check the answer appears under that lead in
   `/admin/leads`.

7. **Optional — send *as* hola@.** Email Sending → onboard the root domain
   `inmobiliaria.com.py` too (it adds DKIM/SPF records next to Email
   Routing's), then set `EMAIL_ROOT_SENDING=true` in hPanel and restart. Until
   then, replies from `/admin/inbox` are sent from `avisos@mail.…` with
   Reply-To hola@, which works but shows the `mail.` address as sender.

## Watching it

```bash
npx wrangler tail      # live log: statuses only, never addresses or bodies
```

`app answered 401` = the two secrets differ. `app answered 503` = hPanel has no
`INBOUND_EMAIL_SECRET`. `POST failed` = the app was unreachable. In every one
of those cases the message went to `FALLBACK_FORWARD`.

## How it talks to the app

`POST INBOUND_URL` with `content-type: application/json`,
`x-inbound-timestamp: <unix seconds>` and
`x-inbound-signature: hex(HMAC-SHA256(secret, "<timestamp>.<body>"))`. The app
refuses a timestamp more than 5 minutes off, compares in constant time, reads
at most 16 MB, and treats the same mailbox + Message-ID as one message (a
retry is a 200 `duplicate`). Shape: `InboundPayload` in `src/index.ts`, and
`inboundPayloadSchema` in the app's `src/lib/inbox.ts`.

Checks: `npm run typecheck` here; `npm run verify:inbox` in the app checks
that the Worker's WebCrypto signature and the app's agree.
