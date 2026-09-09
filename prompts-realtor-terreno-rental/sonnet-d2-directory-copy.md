# Phase D2 — inmobiliarios.com.py: copy, /para-inmobiliarios, FAQ, docs. SONNET session. Lane 2. ONLY after D1 is merged.

Read ONLY: this file, `fable-plan-realtor-terreno-rental.md` Stage 1 D, §1,
§4, §6.3; `docs/log/d1.md`; the i18n section of `CLAUDE.md`; the `directory`
namespace skeleton in `src/i18n/es.ts` + `en.ts` and D1's exemplar sentences;
`app/para-inmobiliarias/page.tsx` (marketplace version — the `agent_signup`
`LeadForm` call is the piece to reuse); `esVender` in `es.ts` as the tone
reference for seller-facing Spanish.

Owns: the `directory` namespace in `es.ts` and `en.ts`; the directory branch
of `app/para-inmobiliarias/page.tsx` (or `app/para-inmobiliarios/page.tsx`
if D1 created it — read the log); FAQ JSON-LD on the directory home;
`CLAUDE.md` / `README.md` domain rows; `fable/KNOWN-ISSUES.md`; `docs/log/d2.md`.

Hard limits (Sonnet): no `schema.ts`, `verticals.ts`, `sections.ts`,
`alternates.ts`, `origin.ts`, `sitemap.ts`, `crm.ts`, `/api/leads`, no cache
keys, no new routes. Copy only, plus the one page branch above. Load skills
`propia-dev`, `fable-directs-sonnet-builds` (fan-out only if the namespace
has ≥ 4 same-shaped page objects; otherwise write it in the session).

Budget: one session, ≤ 60 min. Branch `claude/d2-directory-copy`.

Copy rules: vos-form Spanish; the brand is always an argument
(`title(brand)`), never baked in; **no invented figures** — no agent counts,
review counts, sales volumes, response times; the "hasta 3 inmobiliarios"
promise is stated as a process, not a guarantee; the licence line reads as
CLAUDE.md's EAS/SERPLAID note allows (pending, ~Oct 2026) or is omitted; no
*propia*, no email. `en.ts` peer: translate intent, keep every key, same
arity (`verify:i18n`). The realtor page sells: leads in your zone, a verified
profile, free during launch — nothing about prices or tiers.

Exit: `npm run verify:local` green (`verify:i18n` catches missing keys,
arity, empty strings); `curl -H "Host: inmobiliarios.com.py"` on `/` and the
realtor page renders full copy and valid FAQ JSON-LD; the `agent_signup`
form posts (localhost DB or PR note); PR merged green (copy — autonomous
merge authorised).

## After this phase — last phase of this plan
`docs/log/d2.md`, plan §9 line. Closing report to Anton: PR links; plan §7
items still open (DNS for inmobiliarios.com.py, the go-live PR that flips
`ownsDirectory`, the rental DNS/WhatsApp items); §10 D3 as the next decision.
Spawn nothing.
