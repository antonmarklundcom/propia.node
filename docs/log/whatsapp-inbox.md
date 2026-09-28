# WhatsApp Cloud API inbox (PR 2 of the AI + WhatsApp track) — MIGRATION 0021

Branch `claude/whatsapp-inbox-nh27nk`, stacked on `claude/ai-reply-suggestions-nh27nk`
(PR 1, AI reply suggestions — its "Sugerir respuesta" is wired into WhatsApp
threads here). **Migration `drizzle/0021_tiresome_newton_destine.sql`** —
`MIGRATION REQUIRED`, not merged by the agent.

## What landed

- **Schema** — `whatsapp_messages` (`wa_message_id` unique, direction,
  from/to/contact phone, `phone_number_id`, `lead_id`, body, type, private R2
  media key + mime + filename, status sent/delivered/read/failed, error,
  `sent_by_user_id`, `auto_kind` for PR 3's automatic messages, `read_at`,
  `created_at`) and `whatsapp_contacts` (phone E.164 unique, profile name,
  `last_inbound_at` — the 24-hour window). Beyond the brief: `contact_phone`
  (threading without an OR on from/to), `media_mime`/`media_filename`,
  `read_at` (unread badges) and `auto_kind` (PR 3 needs it and must not need a
  second migration).
- **`/api/whatsapp`** — GET: Meta's handshake (`hub.verify_token` compared in
  constant time). POST: body read capped at 1 MB, `X-Hub-Signature-256`
  verified timing-safe over the raw bytes before parsing; messages and status
  callbacks for our `phone_number_id` only. Rows are written before the 200
  (milliseconds; a database error answers 500 so Meta retries, and the unique
  `wa_message_id` makes a retry a no-op). Media download to the private inbox
  bucket and `alertOperator()` (Telegram / email / webhook, `kind:
  "new_whatsapp"`) run in `after()`. A signed body of an unknown shape is
  acknowledged, not 4xx'd (Meta would retry it for days). Unconfigured → 503.
- **`src/lib/whatsapp.ts`** — the only Graph API caller: `sendWhatsAppText()`
  (15 s) and `fetchWhatsAppMedia()` (30 s, 16 MB cap, Meta hosts only, no
  redirects). Never throws; the token is never logged.
- **`src/lib/whatsapp-inbox.ts`** — store, statuses (forward-only: a late
  "delivered" never overwrites "read"), threads, unread counts,
  `sendAndRecordWhatsApp()` (refuses outside the 24-hour window before calling
  Meta; a refused send is stored with its error and shown "no enviado").
- **Lead matching** — newest lead whose `whatsapp` has the same last nine
  digits (`leadPhoneKey()`'s rule), at arrival.
- **Panels**
  - `/admin/inbox?vista=whatsapp` — unmatched chats, unread badge on the chip.
  - `/admin/inbox/whatsapp/[phone]` — the chat, reply box (or a wa.me link
    outside the window), "Sugerir respuesta", "Convertir en consulta"
    (internal lead, `utm.source = "whatsapp:inbox"`, chat moved under it, CRM
    copy, `lead.from_whatsapp` in the history).
  - `/admin/leads` — the lead's WhatsApp thread under the card, reply +
    suggestion (staff: internal lane only, the existing rule).
  - `/agencia/leads` — own and shared leads' WhatsApp threads, **read-only**
    plus "Marcar como leído" (`userMaySeeLead()`).
  - `/api/whatsapp-media/[id]` — streams media after the same check
    (lead → `userMaySeeLead()`, chat → staff or above), always a download.
- **Copy** — `src/i18n/es-whatsapp.ts` / `en-whatsapp.ts` (`whatsappInbox`).
- **Verify** — `npm run verify:whatsapp` (pure: signature, handshake,
  parser, phones, window, status order, config), in `verify:local` and the
  pre-push hook. **`npm run whatsapp:replay`** signs and POSTs a sample webhook
  to a running app (refuses production hosts).

**Out of scope, on purpose:** message templates (the only way to write
outside the 24-hour window), sending media, reactions from the panel.

## Founder steps — Meta

1. **Business portfolio** — business.facebook.com → create or pick the
   portfolio for the business (verification raises limits; not needed to start).
2. **App** — developers.facebook.com → My apps → Create app → use case
   "Connect with customers through WhatsApp" (type Business) → link the portfolio.
3. **Number** — WhatsApp → API Setup → Add phone number. The number must not be
   active on the WhatsApp app, unless you onboard it with Meta's WhatsApp
   Business app "coexistence" option (the app keeps working on the phone).
   Verify it by SMS or call, and set the display name (Meta reviews it).
4. Copy **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`, **WhatsApp Business
   Account ID** → `WHATSAPP_WABA_ID`.
5. **Permanent token** — Business settings → Users → System users → Add
   (Admin) → Assign assets: the app and the WhatsApp account, full control →
   Generate token, expiry "Never", permissions `whatsapp_business_messaging` and
   `whatsapp_business_management` → `WHATSAPP_ACCESS_TOKEN`.
6. **App secret** — App settings → Basic → App secret → `WHATSAPP_APP_SECRET`.
7. **Verify token** — any long random string (`openssl rand -hex 24`) →
   `WHATSAPP_VERIFY_TOKEN`.
8. **hPanel** — set those five env vars (plus `WHATSAPP_GRAPH_VERSION` if the
   dashboard shows a newer version than v23.0) and restart the app. Apply
   migration 0021 first: `npm run db:status` → `npm run db:migrate` →
   `npm run db:status` (No drift).
9. **Webhook** — WhatsApp → Configuration → Webhook → Callback URL
   `https://inmobiliaria.com.py/api/whatsapp`, Verify token = step 7 → Verify
   and save → Webhook fields → subscribe **messages**. If messages still do not
   arrive, subscribe the app to the account once:
   `curl -X POST "https://graph.facebook.com/v23.0/<WABA_ID>/subscribed_apps" -H "Authorization: Bearer <TOKEN>"`.
10. **Live mode** — App settings → Basic: privacy policy URL
    `https://inmobiliaria.com.py/privacidad`, then switch the app from
    Development to **Live**. In Development only test numbers deliver.
11. Add a payment method to the WhatsApp account (Meta charges per
    business-initiated conversation; replies within 24 h to a customer who
    wrote first are the free "service" category — check Meta's current pricing).
12. **Test** — write to the number from another phone: the chat appears in
    `/admin/inbox` → WhatsApp and the operator gets the Telegram alert. Reply
    from the panel; the status moves to entregado / leído.

## Verified (local MariaDB 11.8, this sandbox)

- `npm run db:migrate` → `npm run db:status`: **0 pending, 22 applied, No drift.**
- `npm run verify:local` green (includes `verify:whatsapp`, `verify:ai-reply`).
- `next start` with fake WhatsApp env + `whatsapp:replay`: handshake 200 with
  the challenge; signed message → stored; same `wamid` again → duplicate;
  bad signature → 401; a number matching a seeded lead → `lead_id` set;
  status for an unknown `wamid` → ignored.
- Chromium, logged in as a local super-admin: `/admin/inbox?vista=whatsapp`,
  the chat page, `/admin/leads` (thread under the card) and `/admin/ajustes`
  render with no page errors. Sending with the fake token was refused by the
  Graph API (HTTP 403) and stored/shown as "no enviado" with the error.
- "Sugerir respuesta" with a dummy `GEMINI_API_KEY`: the chat and lead
  loaders ran against MariaDB, Gemini answered 400 (invalid key), the button
  showed the "no se pudo generar" message.

## Not verified

- **Nothing against a real Meta account**: no real inbound message, no real
  send, no media download, no delivered/read callbacks from Meta, no Live-mode
  review. The payload shapes follow Meta's documented Cloud API webhook format;
  the first real message is the test.
- Media storage needs R2 (`R2_*`, ideally `R2_INBOX_BUCKET`); not exercised.
- `/agencia/leads` WhatsApp block not rendered in a browser (no partner user
  seeded); it reuses the same component with `canReply={false}`.
- `verify:scopes` not run — no panel scope query changed.
