# WhatsApp taps + "Pedir datos antes de WhatsApp" (plan-admin-next O9)

2026-10-02 · branch `claude/whatsapp-taps-gate` · no migration

## The founder's answer

Not the paid template messages: "Can we track button clicks per listing /
agent etc? see data in super admin and agent / agencies see click data for
their assets … i guess we could also do a form to fill before the WhatsApp
button … so they fill out all info and can track save leads in our system and
connect what click gave this".

## What landed

**Tap counting (already half there).** The beacon already counted every
wa.me click as a `wa_click` with its path and listing. /agencia and
/mis-avisos already showed taps per listing (30 days). New:

- `data-wa-tap` on a link makes the beacon count it as a tap even though it
  is not a wa.me URL — used by the gated listing buttons and by the agent
  profile's WhatsApp link, which always went to `#contacto` and was never
  counted.
- `src/lib/wa-taps.ts` — the only reader of these numbers:
  - `waTapsByPublisher(window)`: /admin/analitica → "WhatsApp por anunciante".
    It groups the following by who published the listing (agency, else
    independent agent, else owner):
    - listing taps;
    - profile taps on `/inmobiliaria/<slug>` and `/agente/<slug>` (an agent
      inside an agency counts under the agency);
    - leads saved through the gate.

    Raw days come from `analytics_events`, older days from the
    `analytics_daily` rollup (`listing` / `path` dimensions), so no day is
    counted twice.
  - `getProfileWaTaps()` + `profileSlugsFor()`: the /agencia dashboard line.
    It shows taps on the agency profile (to its responsable only) and on the
    member's own agent profile, using the same raw events and 30-day window as
    the per-listing column.

**The gate (off by default).**

- /admin/ajustes → "WhatsApp en los avisos" sets `site_settings.wa_gate_enabled`
  (super-admin only, logged as `setting.change`). `getWaGateEnabled()` is the
  only reader.
- When it is on, on the listing page:
  - The seller-card and mobile CTA-bar WhatsApp buttons link to `#contacto`
    (with `data-wa-tap`), and the "o" divider is hidden.
  - `ContactForm` gets `waGate`:
    - its submit button reads "Enviar y abrir WhatsApp";
    - its separate WhatsApp link is hidden;
    - it sends `channel: "whatsapp"`;
    - after a saved lead it navigates the same tab to wa.me with the same
      message. Same tab means no popup blocker; the "Continuar en WhatsApp"
      link stays as the fallback.
  - If saving fails, the existing fallback (direct WhatsApp link) applies. A
    broken API never blocks a visitor from reaching the seller.
- `/api/leads` takes `channel: z.enum(["whatsapp"])` and stamps
  `utm.channel`. It does not do this on a report or a brief. Any `channel` key
  in the client's own utm is removed first (`withLeadChannel()`), so the count
  cannot be faked from a URL.
- /admin/leads cards show "Llegó por el botón de WhatsApp".

The listing's taps keep counting while the gate is on (the button click), and
the lead is the conversion. Comparing the two on /admin/analitica, before and
after switching the gate on, shows how many visitors the form loses. That
trade-off is written next to the switch.

## Not done, on purpose

- No badge on /agencia/leads cards: `getPanelLeads()` does not select `utm`,
  and the open #274 rewrites that query. A one-line follow-up after #274 merges.
- Taps on a profile page's wa.me link (the marketplace agency profile) are
  counted by path, not by the clicked element. Two WhatsApp links on one
  profile page would be one bucket — there is one today.
- Paid WhatsApp templates (writing to a customer after the 24 h window) are not
  built. Meta prices them per message by country and category.

## Verified

- `npm run verify:local` green (pre-push hook).
- Local `mariadb:11.8`, `next start` on :3100,
  `tests/e2e/wa-gate.spec.ts` — 7/7:
  - gate off → wa.me links;
  - the switch is saved and logged;
  - gate on → the buttons go to `#contacto`, and the beacon sends `{e:"wa"}`
    for the listing path;
  - the form saves an `agency`-lane lead with `utm.channel = "whatsapp"` and
    lands on wa.me;
  - a spoofed `utm.channel` is dropped;
  - the /admin/analitica row reads 3 / 3 / 1, and the lead card is marked;
  - /agencia reads "2 en el perfil de la inmobiliaria · 1 en tu perfil de
    agente";
  - switching off restores wa.me.
- `verify:scopes` not run: no panel scope or listing scope query changed (the
  /agencia line reads public analytics by the member's own slugs).

## Not verified

- Production. The gate stays off until the founder switches it on.
- Real phones opening wa.me from the same-tab navigation (desktop Chromium
  only).
