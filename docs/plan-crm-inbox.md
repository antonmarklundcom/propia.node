# CRM inbox and VenderCRM integration plan

Research date: 2026-09-16. Planning only; no application changes or external setup. File paths below refer to this checkout. VenderCRM's HTTP contract is the authoritative contract supplied in the task; its account limits, commercial terms and response JSON schema were not independently established.

## 1. What exists today

**A unified superadmin inbox already exists.** `app/admin/leads/page.tsx` calls `requireSuperAdmin()` before loading `listAllLeads()` from `src/lib/panel-queries.ts`. That query reads all verticals and routing lanes, with optional lead-type and name/WhatsApp/email search filters. It left-joins listing, agency and owner context, displays messages and vertical attribution, and defaults to the newest 300 rows. It is not restricted to directory leads. Directory matching (`MatchPanel`, `src/lib/matching.ts`) is conditional on seller leads whose `utm.source` begins with `directory:`. No route move is necessary. The task background describing this page as directory-only is superseded by the checked implementation.

The shared storage is `leads` in `src/db/schema.ts`: `id`, `leadType`, `vertical`, nullable `listingId` and `projectId`, `name`, required `whatsapp`, `email`, `message`, JSON `utm`, `routedTo`, nullable `ghlContactId`, and `createdAt`. There is **no workflow status**, original host, submission-page URL, referrer, or durable delivery-attempt record. Indexes cover listing ID, type plus creation time, and creation time. `ghlContactId` is not evidence of every delivery: providers can succeed without returning a contact ID.

`middleware.ts` resolves the host and overwrites request `x-vertical`; `app/api/leads/route.ts` persists that key (with the configured default as fallback). `src/config/verticals.ts` declares:

| Domain | Key | Family | Enabled in code |
| --- | --- | --- | --- |
| inmobiliaria.com.py | inmobiliaria | marketplace | Yes |
| realestateinparaguay.com | en | marketplace | Yes |
| terreno.com.py | terreno | marketplace | Yes |
| alquiler.com.py | alquiler | rental | Yes |
| rentparaguay.com | rent | rental | Yes |
| inmobiliarios.com.py | agents | directory | Yes |
| desarrolladores.com.py | devs | directory | No |

Seven declared domains does not mean seven live domains. Enabled flags are not DNS evidence; `CLAUDE.md`'s Domains section also records outstanding rental-domain and deployment setup. This review did not verify DNS or production deployment state.

Capture and visibility:

- `app/api/leads/route.ts` validates and rate-limits submissions, resolves an explicit agent profile before an explicit agency profile, otherwise routes from the listing's agent, agency, owner, then `internal`. Unknown profile slugs fall through. Resolved profile names/slugs go into `utm`; there is no lead-level agent foreign key. Although `developer` is an allowed routing lane, this handler does not choose it merely because the lead type is developer.
- It inserts into MySQL first, obtains `leadId`, then uses Next's `after()` for an operator alert and CRM push. Only a successful push with a contact ID updates `ghlContactId`. The response acknowledges local capture, not CRM delivery.
- `app/tasacion/actions.ts` is a second lead writer: valuation contacts are inserted as `internal`, then pushed synchronously. It currently discards the insert ID and provider result; it also sends untruncated input in the provider payload after storing bounded values. Integration must cover this path as well as the API route.
- `app/agencia/leads/page.tsx` uses `requireAgencyContext()` and `panelScope()`; `app/mis-avisos/consultas/page.tsx` uses `requireOwnerContext()`. Both use `getPanelLeads()` in `src/lib/panel-queries.ts`: an inner join to listings, `listingScopeWhere()` ownership filtering, and routing lanes `agency`, `agent`, `owner`. Listing-free profile leads are therefore not automatically visible in those panels. They remain visible to superadmin.
- Some comments in `panel-queries.ts` still describe an absent owner lane; the actual schema, handler and owner panel now implement it. Executable behavior takes precedence over those comments.

Outbound delivery is centralized in `src/lib/crm.ts`. `CrmProvider` has `pushLead`, `sendOtp`, and `notifyOperator`; `WebhookProvider` posts `{ event: "lead", ...lead }`, OTP events, or operator-alert events to one global URL. `LEAD_WEBHOOK_URL` takes precedence over historical `GHL_WEBHOOK_URL`. Calls have a five-second timeout. `NoProvider` makes lead delivery a no-op success; production alerts/OTP are unavailable. There is no per-vertical provider selection or VenderCRM adapter. Although used from server code, this module does **not** currently contain an explicit `import "server-only"` guard.

`.env.example` has empty values for both webhook variables and explains that without a webhook the signal is `/admin` badges. `src/lib/crm.ts`, `AGENTS.md` and `docs/audit-2026-08.md` likewise describe optional alerts. This confirms unconfigured/default behavior, **not the current Hostinger environment**. No production configuration was inspected; “production alerts are currently silent” remains unverified. The founder should check only whether either variable is configured, without sharing its secret value.

## 2. What is missing for the superadmin unified inbox

**Extend `/admin/leads` and `listAllLeads()`; keep directory matching in place.** Reuse the existing server component, `requireSuperAdmin()`, `PanelBar`, admin tabs, typed Drizzle selects, `containsPattern()` search escaping, and defensive UTM parsing. Do not build an alternative query in the page or widen agency/owner access. Keep reads uncached and private. New copy belongs in paired `src/i18n/es.ts` and `en.ts` entries.

Proposed query input: existing `type` and `q`, plus `vertical`, `routedTo`, inclusive `dateFrom`, exclusive `dateTo`, bounded page size (50, maximum 100), and a cursor of creation time plus ID. AND all filters; order by `createdAt DESC, id DESC` for stable pagination. Interpret date inputs as America/Asuncion calendar days, convert boundaries consistently with database timestamps, and document that convention. Use the same predicate builder for filtered totals. Preserve existing all-time type counts only if clearly labeled as such.

Domain choices come from `VERTICALS`, translated to stored vertical keys rather than filtering by the host serving `/admin`. Default to all verticals. Retain access to legacy/unknown stored keys and disabled doors, so a future config change cannot hide history. The domain label is the current mapping of a saved key, not proof of the original host or referral domain. Left joins must preserve messages with no listing or deleted related context.

Return the existing contact/message/listing/routing fields, plus project ID and any approved workflow state. Paginate beyond the current 300-row ceiling so every historical lead is reachable. Preserve the batched directory candidate/match loading for directory leads on the current page. This inbox covers persisted form submissions, not conversations conducted externally through WhatsApp or email.

**Status needs an explicit schema decision.** Neither `routedTo`, `ghlContactId`, nor directory match status represents whether the lead has been worked. Proposed initial workflow: `new`, `in_progress`, `closed`, with update timestamp and actor attribution. Founder approval is required for semantics and how existing records are classified; do not silently backfill every old lead as new. Only after an approved migration should the inbox accept a validated `status` filter and guarded status actions. A read-only first increment can deliver vertical/date/routing filters and pagination without a migration, but must label workflow status unavailable; it does not fully satisfy the requested status feature.

Existing indexes support initial bounded reads; assess query plans and actual volume before proposing new composite indexes. Any status, audit or index migration is separate reviewed work under the repo's schema rules. Future implementation acceptance checks should include all routing lanes, listing-free messages, disabled/legacy verticals, date boundaries, equal timestamps, pagination past 300 records, and denial of superadmin data to other roles. Run `verify:local` and, because panel queries change, `verify:scopes` against local MySQL when implementing.

## 3. How to connect to VenderCRM

Add `VenderCrmProvider` alongside `WebhookProvider` and `NoProvider` in `src/lib/crm.ts`. Keep external HTTP details there and explicitly enforce server-only imports. Configure a server-only CRM base URL and secret site keys; never use `NEXT_PUBLIC_*`, accept keys from browser requests, or render them into a page. Do not assume the generic webhook payload is compatible.

For lead pushes, send `POST /api/v1/leads` on the configured CRM base URL with `Content-Type: application/json` and `X-Api-Key: <selected site key>`. Preserve the five-second request bound and local-write-first behavior. Required `phone` is 6–30 characters; VenderCRM normalizes Paraguayan local numbers itself.

Extend `LeadPayload` to carry the persisted lead ID. Both capture paths must obtain the insert ID and pass it with the stored, bounded field values. Derive `idempotency_key` as `portal-prod-lead:<id>` (8–100 characters), with a stable separate namespace for nonproduction data. Reuse exactly that key for retries of that submission; never use a new UUID on retry or phone-plus-hour, which can collapse legitimate repeated inquiries. This protects external replay of one saved row, not browser resubmissions that create different rows locally. Keep the destination site stable across retries; replay behavior across different CRM sites is unspecified.

| VenderCRM field | Mapping / limitation |
| --- | --- |
| `phone` | `LeadPayload.whatsapp` |
| `idempotency_key` | Stable namespace plus persisted lead ID |
| `name`, `email`, `message` | Corresponding saved values; omit absent optional fields |
| `source` | `site:<vertical>`, e.g. `site:inmobiliaria` or `site:terreno` |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` | Allowlisted same-named keys from `utm`; keep marketing source separate from vertical source |
| `gclid`, `fbclid` | Omit unless actually captured and validated; current inspected forms do not collect these |
| `page_url`, `referrer` | Omit until reliable capture/storage exists; listing canonical URL is not the submission-page URL |
| `fields` | Lead ID, vertical, lead type, local `routedTo`, existing form marker `utm.source`, listing public ID/title/URL/operation/price when present; project context only when available |

`src/components/LeadForm.tsx` collects all five listed UTM parameters; `ContactForm.tsx`, `DirectoryLeadForm.tsx` and `VenderForm.tsx` collect four, omitting term. The route accepts arbitrary string UTM keys, which is not evidence that every attribution field is captured. Do not send all JSON blindly. Existing `utm.source` markers such as `vender` and `directory:*` belong in `fields` so they survive the explicit vertical `source` mapping. `LeadPayload.project` exists but the API route does not currently populate it; the row's project ID can be carried separately in a future enrichment.

**Never send `pipeline`, `stage`, `owner` or `tag`.** VenderCRM chooses routing from its site record; local `routedTo` is timeline context, not an instruction to assign CRM ownership.

Response handling:

- 201 created and 200 idempotent replay are both successful deliveries.
- 401 requires key correction; 403 requires checking site activation/billing. Preserve the lead, surface a configuration error, and avoid repeated automatic requests until corrected.
- 422 requires payload correction using the named field; sanitize diagnostics and do not log contact bodies or secrets.
- 429 is limited to 60 requests/minute/site. Throttle across every vertical sharing that site, with bounded backoff and `Retry-After` if supplied. Network errors, timeouts and server errors may be retried with the same ID and destination.

The supplied contract does not define response JSON contact-ID fields. Confirm that shape before mapping `CrmResult.contactId`; do not assume the webhook's `contact_id`. The historical 80-character `ghlContactId` column is inadequate as a delivery ledger and may not fit an unknown external identifier. Do not rename it or overwrite another provider's ID casually.

**Lead ingestion is not OTP or operator notification.** `app/publicar/actions.ts` uses `getCrm().sendOtp()` and `isMessagingConfigured()`. A VenderCRM lead API key must never make that capability check true. Keep OTP/alerts on the existing webhook/no-provider lane via composition in `crm.ts`; the new provider must not turn those methods into fake successes or send them to the leads endpoint. Select lead destinations explicitly without changing auth semantics. Avoid implicit dual delivery to webhook and VenderCRM; coexistence or intentional fan-out must be configured separately.

Delivery reliability is a separate increment. Today's `after()` call is not a durable queue, failure results are not persisted, and a process exit can leave an undelivered copy. Minimal integration is explicitly best-effort with local inbox fallback. Recommended reliable rollout adds an approved durable delivery record/outbox with lead ID, provider and site identity, stable idempotency key, state, attempts, next retry and sanitized error, created transactionally with capture. Store secret references rather than keys. Retry through one `src/lib/ops/<job>.ts` runner shared by CLI/admin with a genuine `--dry` pass, following `AGENTS.md`. That requires schema approval; it is not hidden inside a provider-only change. Local workflow status and external delivery status must remain distinct.

## 4. Per-domain routing options and recommendation

The number of Next.js servers does not determine CRM account count. An account, a VenderCRM site, a domain and a pipeline are different units. One key belongs to one CRM site and must never be reused as another site's credential. Mapping several domains intentionally into one shared CRM site is the combined-site option; it is not seven separate CRM sites sharing a key.

| Option | Routing and reporting | Configuration and lifecycle tradeoff |
| --- | --- | --- |
| One account, one CRM site per vertical | Separate site attribution and independently configured pipelines; source still identifies the vertical | Up to seven keys plus one base URL. Independent revocation and per-site rate budgets. Adding a door requires explicit site/key provisioning; retiring one can disable only that site. |
| One account, one shared CRM site | All domains use that site's routing/pipeline; `source` and `fields.vertical` retain domain context | One key plus base URL. Shared 60/minute budget and revocation blast radius. Metadata cannot itself choose different pipelines. Domain addition is easy but should still require explicit opt-in; retiring one domain requires stopping that mapping, not revoking the shared key. |
| One account, sites grouped by family | Marketplace, rental and directory each get site-level routing; domain detail stays in metadata | Typically three keys plus base URL. Shared limits/revocation within each family; splitting a door later changes destination and complicates history/replay. `devs` is currently classified as directory, but that is not approval to share its future sales process. |
| Separate accounts per family or domain | Stronger organizational separation if the product supports it; account-level consolidated reporting is no longer assured | More logins, billing and access administration, potentially separate base URLs. Still one key per CRM site. Suitable only if ownership/access/billing requires it, not because the app has multiple hosts. |

**Recommendation: one VenderCRM account with one site/key per participating vertical, introduced gradually.** Provision only approved domains first; keep `devs` disabled. This preserves separate attribution, revocation and routing without forcing separate accounts. Where several domains should share a pipeline, ask whether their separate CRM sites can target the same pipeline; do not assume that product capability. The app's existing unified inbox supplies the combined view independently of CRM account reporting.

This is a recommended topology, not a verified subscription entitlement. The supplied API contract establishes keys per site, but does not establish how many sites one account may own, cross-site contact deduplication, consolidated dashboards, allowed domains per site, or shared-pipeline support. Confirm those with the VenderCRM operator before provisioning. If site limits or cost make per-vertical sites unsuitable, prefer one site per approved business family over one undifferentiated global site, provided multi-domain intake into a site is supported.

Use an explicit server-side mapping keyed by saved `vertical`, with secrets such as `VENDERCRM_API_KEY_INMOBILIARIA`, `_EN`, `_TERRENO`, `_ALQUILER`, `_RENT`, `_AGENTS`, `_DEVS`, plus `VENDERCRM_BASE_URL`. These names are proposals, not current variables. A family configuration would map multiple keys to one named family site credential. Choose the destination immediately after the local insert from the persisted vertical, and retain it for durable retries; never select by browser-supplied CRM identifiers or the host where an operator later opens the inbox.

Unmapped/missing-key doors remain local-only with an honest configuration signal; never fall back to another vertical's credential. New doors require a deliberate mapping even in shared-site mode. Retain old keys/labels as historical attribution when a domain is retired; stop new forwarding, settle or explicitly cancel queued deliveries, then revoke the retired site key. Key rotation should retain the same CRM site identity. Changing to a different site needs an explicit cutover/backfill decision because cross-site replay could create a new contact. Renaming a host while retaining its vertical preserves local attribution, but exact historical host attribution is unavailable today.

## 5. Founder decisions, boundaries and verification gaps

Under `AGENTS.md`'s stop-and-ask convention, implementation must obtain decisions on:

1. Which domains participate, the account owner, subscription/site limits and billing; whether family grouping is desired, and each site's pipeline/stage/owner/tag settings inside VenderCRM.
2. Actual CRM base URL, site creation, key provisioning/rotation and installation in Hostinger. No keys were requested, read or used for this plan.
3. Workflow-status meanings, historical lead treatment, who may update status, and approval for any status/audit/outbox schema migration. Schema PRs require `MIGRATION REQUIRED —` titles, founder-run production migration and drift checks; agents must not merge them.
4. Whether existing leads should be exported, the date range and cutover destinations, acceptable best-effort delivery versus durable retries, and whether the generic lead webhook should remain enabled alongside VenderCRM.
5. Any user-data policy changes needed for external CRM transfer, attribution capture, retention or cross-brand access. This plan neither invents consent nor changes a policy.

These questions are recorded here rather than `docs/decisions-needed.md` because the task explicitly allows only this new file. No application code, auth, schema, panels, env examples or other decision files are changed. No sites/accounts/keys were created, messages sent, migrations run, production database contacted, or deployment attempted. Unrelated findings were not turned into implementation work.

Verified by code reading: shared storage and both writers; existing all-vertical admin inbox; scoped panels; current provider payload and optional configuration behavior; attribution gaps; absence of workflow/delivery status; seven declared verticals with six enabled. Not verified: live environment variables, DNS, deployed revision/database drift, actual lead rows, VenderCRM account capabilities or response body schema. Local UI behavior and external delivery were not exercised. The VenderCRM API details above come from the task's supplied contract, not an invented generic webhook contract.

Planning verification: `npm run verify:local` passed typecheck and compilation, then failed during build page-data collection with ENOENT for `.next/server/pages-manifest.json`; subsequent verification scripts did not run. No application repair was attempted because only this document is authorized. `git diff --check` passed. Other workspace changes appeared during research and were left untouched, so repository-wide status is not limited to this document even though this task authored only this file.
