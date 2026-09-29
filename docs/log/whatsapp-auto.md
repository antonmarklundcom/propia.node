# WhatsApp auto-response (PR 3 of the AI + WhatsApp track) — no migration beyond 0021

Branch `claude/whatsapp-auto-reply-nh27nk`, stacked on PR 2 (`claude/whatsapp-inbox-nh27nk`).
Needs migration 0021 (PR 2) applied first. **Both switches ship OFF.**

## What landed
- `src/lib/whatsapp-auto-policy.ts` (pure, in `verify:whatsapp`): office hours
  in America/Asuncion, hand-off keywords (price negotiation, legal/documents/
  taxes, complaints — es + en), and `decideAutoAction()`.
- `src/lib/whatsapp-auto.ts`: runs in the webhook's `after()`; at most one
  automatic message per inbound: AI reply, hand-off line, or static greeting.
  Sends through `sendAndRecordWhatsApp()` (24 h window enforced) with
  `sent_by_user_id` NULL + `auto_kind` (`ai` / `handoff` / `greeting`), shown
  as "automático". AI goes through PR 1's `draftReplyFor()` with `mode: "auto"`
  (stricter prompt rules), actor id 0, own cap of 60/h per process.
- Rules: AI never after a human replied to that contact, max 1 AI message per
  contact per N hours (setting, default 12), never again after a hand-off;
  hand-off on keyword topics (model not called), on `confident: false`, or on a
  draft naming an invented contact. Greeting: first message ever or outside
  office hours, max 1 per contact per 12 h, never after a human reply.
- `/admin/ajustes` → "WhatsApp: respuestas automáticas": both toggles, cooldown
  hours, office hours per day, preview of the three texts. Changes are logged
  as `setting.change`.
- Copy: `esWhatsApp.auto` / `.settings` (+ en peers).

## Verified (local MariaDB, `next start`, fake Meta token, dummy Gemini key)
- `npm run verify:local` green, including the new policy checks.
- Greeting on, AI on: new contact + neutral text → Gemini 400 → fell back to
  the first-contact greeting (stored `auto_kind=greeting`, send refused by Meta
  → `failed`). Price text → hand-off line, model not called.
- Found and fixed: the cached settings read inside `after()` on a cold server
  threw and read as "off"; the webhook path now reads settings uncached.

## Not verified
- Real Meta sends and a real model answer (no keys). `/admin/ajustes` form not
  submitted in a browser (typechecked and built only).
