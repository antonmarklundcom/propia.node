# AI reply suggestions (PR 1 of the AI + WhatsApp track) — no migration

Branch `claude/ai-reply-suggestions-nh27nk`. No schema change.

## What landed

- **`src/lib/ai-reply-prompt.ts`** (pure) — the system prompt and its rules,
  prompt assembly, thread trimming (newest 12 messages, 2 000 characters each,
  12 000 total, quoted history stripped), the fence that keeps customer text
  as data (`<message>` / `<context>` tags a customer types are neutralised),
  the invented-contact check, the config resolver and the cost estimate.
- **`src/lib/ai-reply.ts`** (server-only) — the only module that calls an LLM
  for replies. Gemini over REST (key in the `x-goog-api-key` header) or Claude
  through `@anthropic-ai/sdk` (`beta.messages.parse`, JSON schema output,
  effort `low`, server-side refusal fallback `fallbacks: "default"`). 30 s per
  call, no retries. Loaders for a lead (`loadLeadReplyContext()`, which asks
  `userMaySeeLead()` first) and an inbox thread (`getInboxThread(viewer)`,
  the shared-mailbox rule). `draftReplyFor()` is the single entry point PR 2
  reuses for WhatsApp.
- **UI** — `AiReplyTextarea` (client) replaces the reply textarea when the
  feature is on: `/admin/inbox/[thread]`, the lead email threads in
  `/admin/leads` and `/agencia/leads`. It fills the box and says whether the
  model was unsure; the form's own "Enviar" is the only send.
- **Server actions** — `suggestInboxReplyAction` (staff or above),
  `suggestLeadReplyAction` in both lead panels (each panel's own guard, then
  `userMaySeeLead()` in the loader).
- **Usage** — every call that reached a provider writes an `ai.reply` line to
  `admin_events` (target `lead` or `email`, detail: provider, model, tokens,
  `costMicroUsd`, outcome). `/admin/historial` hides those lines;
  `/admin/ajustes` shows provider, model and the month's calls, tokens and
  estimated cost.
- **Copy** — `src/i18n/es-ai.ts` / `en-ai.ts`, wired as `aiReply`.
- **Verify** — `npm run verify:ai-reply` (pure), in `verify:local` and the
  pre-push hook.

## Env (hPanel)

Nothing new is required: the button appears as soon as `GEMINI_API_KEY` or
`ANTHROPIC_API_KEY` is set (the `cron:translate` keys). Optional:
`AI_REPLY_PROVIDER` (`gemini` | `claude`), `AI_REPLY_MODEL`,
`AI_REPLY_DISABLED=true`. All in `.env.example`.

## Not verified

- **No real model call was made.** No key in this sandbox; the Gemini request
  shape follows `translate.ts`'s live-verified one, the Claude one typechecks
  against the installed SDK. First real click after the key is set is the test.
- **No database was available**, so the loaders, the `admin_events` insert and
  the monthly `JSON_EXTRACT` sum were not run against MariaDB.
- The pages were not rendered in a browser.
