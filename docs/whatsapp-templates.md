# WhatsApp templates — what to submit to Meta, and how to turn them on

WhatsApp lets the business write to a customer **outside the 24-hour window**
(or first) only with a **template**: wording submitted to Meta and approved in
advance, with numbered variables. The app cannot invent one. It sends one that
already exists in WhatsApp Manager under the **same name and language**.

Inside the window nothing changes: free text, as before.

## Templates in the app

Source of truth: `src/lib/whatsapp-templates.ts` (`WA_TEMPLATES`). Submit the
wording exactly as written there; a changed word is a different template to Meta
and the send will be refused.

| Name | Category | Variables | Wording (Spanish) |
| --- | --- | --- | --- |
| `seguimiento_consulta` | Utility | 1 nombre · 2 marca · 3 tema de la consulta | Hola {{1}}, te escribimos de {{2}} por tu consulta sobre {{3}}. Si seguís interesado, respondé a este mensaje y te ayudamos. |
| `recordatorio_visita` | Utility | 1 nombre · 2 propiedad · 3 día y hora | Hola {{1}}, te recordamos tu visita a {{2}}: {{3}}. Si no podés venir, respondé a este mensaje para reprogramar. |

Sample values Meta asks for when you submit (the app uses your own at send time):
`seguimiento_consulta` → Ana · Inmobiliaria Paraguay · una casa en Luque;
`recordatorio_visita` → Ana · el departamento de Villa Morra · viernes a las 16:00.

## Turn them on (founder, in this order)

1. **WhatsApp Manager → Message templates → Create template.** Category
   *Utility*, language *Spanish* (or the variant you prefer — then set
   `WHATSAPP_TEMPLATE_LANG` to match, e.g. `es_AR`), name and body exactly as
   above, add the sample values, submit. Approval is Meta's, usually minutes to
   a day; a rejection message says why (utility templates that read as
   promotion are the usual reason — change the wording *here and in the code*
   together).
2. **hPanel → Environment variables:** `WHATSAPP_TEMPLATES` =
   `seguimiento_consulta,recordatorio_visita` (only the ones **approved**), and
   `WHATSAPP_TEMPLATE_LANG` if not `es`. Restart the app (no rebuild: neither
   is `NEXT_PUBLIC_*`).
3. Open a chat in `/admin/inbox?vista=whatsapp` whose last customer message is
   more than 24 h old: the reply box shows one small form per enabled template
   and a preview of what the customer receives.

A template name listed before Meta approves it is refused by Meta; the message
is kept in the thread as "not sent" with Meta's error, nothing is lost.

## Rules the code enforces

- Only names in `WHATSAPP_TEMPLATES` can be sent; a forged name is refused
  before any call to Meta.
- Every variable is required, single-line (Meta refuses newlines, tabs and runs
  of more than four spaces), at most 100 characters.
- Staff and the super-admin only, like every WhatsApp send; partners read.
- Human only: nothing sends a template automatically, because Meta bills per
  conversation and a loop would cost real money. Double-clicking Send sends twice.

## Cost and policy (yours to decide)

- Meta charges for business-initiated conversations by category and country;
  check the current price list for Paraguay before using these at volume.
- Consent: message only people who wrote to you or asked to be contacted
  (a lead). The two templates assume that; do not use them for cold outreach.
