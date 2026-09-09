# Phase O3 — page scaffolding and lead capture. OPUS session, ONLY after O2 is merged. Last Opus phase.

Read `fable/plan-rentparaguay.md` FIRST, in full — plus §9 and
`fable/KNOWN-ISSUES.md` — then `CLAUDE.md` (i18n, "There is no portal
email", backlog item 9). Execute plan §5.3 under the autonomy protocol §4.
Build nothing outside the plan.

Read before editing: `src/lib/crm.ts` and `app/api/leads/route.ts` (read
only — this is why there is no Resend, plan §1 item 6), `src/components/LeadForm.tsx`,
`src/components/VenderForm.tsx` (the `utm.source` marker), `app/contacto/page.tsx`,
`app/nosotros/page.tsx`, `app/vender/page.tsx` (the gate + `redirect("/")`
pattern), `src/lib/sitemap.ts`, `src/lib/jsonld.ts`, `src/config/rental-services.ts`
(from O2), `docs/rentparaguay-extraction/content/rent-apartment-house.md`
(the exemplar service).

Phase rules:
- Reset to `origin/main` (must contain O1 and O2), branch
  `claude/fable-o3-rental-pages`.
- Load skill `propia-dev` before editing.
- The lead form is `LeadForm` → `/api/leads`, nothing else (plan §1 items 6
  and 7). Add a `locale` prop and a `leadForm` dictionary namespace to
  `LeadForm` with Spanish byte-identical and both existing call sites
  unchanged; add an optional `source` prop folded into `utm`. No email
  sender, no new provider, no change to `/api/leads`, `crm.ts` or
  `schema.ts`. `lead_type` mapping per §1 item 7 — do not add enum members.
- Routes are gated: `rentalPagesEnabled(vertical.key)` else `redirect("/")`;
  unknown slug → `notFound()`. `/nosotros` and `/contacto` fork on the
  registry in one line each, the way `app/page.tsx` does.
- Metadata on every new page: canonical from `siteOrigin()`, `languages`
  from `languageAlternates({ …, family: "rental" })`, `openGraph` with the
  brand, page `title` without it (layout template). Breadcrumb JSON-LD; FAQ
  JSON-LD where there is an FAQ.
- `rentalServices` ships with the plan's Appendix C shape for all seven keys:
  the exemplar (`alquiler`) filled from its content file; the other six
  carry real `metaTitle`/`metaDescription`/`h1`/`tagline`/`intro` and
  minimal real arrays so no route renders empty. No `TODO`, no lorem — S3
  fills them. `es.ts` key ⇒ `en.ts` key in the same commit.
- Contact copy: "Edificio Skytower, Asunción" may be copy; the phone number
  and any email are env only (`CONTACT_WHATSAPP` / `CONTACT_EMAIL`, null
  handled). Never write `+595 995 628 862` or `hello@rentparaguay.com` into
  a file.
- Append the seven service URLs to the rental sitemap list.
- Prove the lead row once with a localhost DB if one exists; otherwise say
  so in the PR and in §9.
- Re-runnable; minor issues → `fable/KNOWN-ISSUES.md`; stop only per §4.4.

Exit: `npm run verify:local` green; the eleven rental URLs (`/`, `/servicios`,
seven services, `/nosotros`, `/contacto`) return 200 on both rental hosts
and `/servicios/alquiler` redirects to `/` on `inmobiliaria.com.py`;
`verify:i18n` sees `rental`, `rentalServices`, `leadForm` (remove one `en`
key, watch it fail, restore, say so in the PR); PR merged green.

## After this phase — hand off to S1 (fresh session, model switch)
Gates: PR merged; exit list passed; pre-handoff audit done; §9 entry
committed. Confirm O1, O2 and O3 are all on `origin/main`. Write the Opus
closing report to Anton: three PR links, the plan §7 items now due (DNS for
both domains, the WhatsApp env var, the WordPress redirect check), anything
in `fable/KNOWN-ISSUES.md` this session added. Then `create_session` with
the inherited environment and permission mode (never `plan`), `model` set
explicitly to **Sonnet** (never Fable), prompt exactly:
`Read fable/prompts/sonnet-1-rental-assets.md in this repo and execute it.`
No `create_session`: stop here and report — the next phase is a model switch.
