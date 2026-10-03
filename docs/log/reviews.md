# Partner reviews (plan-admin-next O7)

2026-10-03 · branch `claude/reviews` · **migration 0028**, stacked on O5 (0027), O1 (0026) and #272 (0024, 0025)

## The founder's answer

"As the plan says":
- only verified leads or deals may review, through a signed link;
- the operator approves;
- full reviews on inmobiliarios.com.py, stars on inmobiliaria.com.py.

## What landed

- **`reviews`** (`drizzle/0028_crazy_slayback.sql`):
  - fields: lead, target (agency **or** agent, the `lead_assignments`
    convention), rating 1–5, optional text, the name to show, locale, status
    (pending / approved / rejected), and who moderated it and when;
  - `uq_lead_target` allows one review per lead and partner.
- **What "verified" means** (`reviewTargetsForLeads()`, `src/lib/reviews.ts`):
  the partner actually worked the buyer's lead. That is any of:
  - a deal with that partner;
  - a share the partner took (accepted, contacted or closed, not revoked);
  - a lead routed to the listing's own agency or agent that is marked
    contacted or closed.

  A brand-new lead, a declined share or a revoked one does not count. The
  check runs again when the link is opened and when it is submitted.
- **The link** (`src/lib/review-token.ts`, pure):
  - a stateless HMAC over lead, kind, target and expiry, valid 60 days;
  - signed with `AUTH_TOKEN_SECRET` under its own `review.v1` prefix, so it
    can never verify as a password-reset link or the other way round. It
    imports nothing from auth;
  - without the secret the feature is hidden.
  - On /admin/leads, a lead with an eligible partner gets **"Pedir reseña"**:
    the link and an "Enviar por WhatsApp" button with a ready message. Once
    the buyer has reviewed, it shows "Ya dejó su reseña".
- **`/resena?t=…`** (any door, noindex):
  - five stars, a display name (prefilled with the buyer's first name), an
    optional text;
  - rate-limited to 10 per IP per 10 minutes;
  - a second use shows "ya dejaste tu reseña", and a tampered or expired link
    shows a plain message;
  - stored as **pending**, with an `alertOperator()` "partner_review" line
    (silent with no channel configured).
  - Copy: `review` namespace (es-review.ts / en-review.ts).
- **/admin/resenas** (staff and super-admin, a "Reseñas" tab badged with
  pending reviews):
  - pending first;
  - Aprobar / Rechazar, and Despublicar for an approved one;
  - logged as `review.moderate` in /admin/historial.
- **Profiles** (`ProfileReviews`, `/inmobiliaria/[slug]`, `/agente/[slug]`):
  - **directory door**: average, count and the full list (stars, name, month,
    text), plus a line saying who can review;
  - **marketplace doors** (es and en): stars, average and count only;
  - nothing shows before an approval, and every read degrades to nothing.

## Decisions taken without asking (easy to change)

- The English marketplace door also shows stars, like inmobiliaria.com.py: it
  is the same marketplace page.
- Staff can approve, as well as the super-admin (the same people who run the
  listing review queue).
- **No JSON-LD `aggregateRating`.** Google treats ratings a site shows about
  businesses it sells with as a grey zone. Better left until the founder wants
  rich-result stars.
- Agency mode does not hide reviews.

## Verified

- `npm run verify:local` green (pre-push hook), with `verify:reviews` (token
  round trip, tampering of each signed field, expiry, a reset-style MAC
  refused, form bounds).
- `npm run db:status` on the local `mariadb:11.8` after `db:migrate`:
  0 pending, 29 applied, No drift.
- `tests/e2e/reviews.spec.ts`, 7/7 (server started with a test
  `AUTH_TOKEN_SECRET`):
  - only the worked lead gets a link;
  - the buyer submits 4 stars and a text, stored as pending;
  - the link works once, and a tampered lead id is refused;
  - nothing shows before approval;
  - approve on /admin/resenas;
  - the marketplace shows stars only, and the directory door shows the full
    text;
  - Despublicar removes it, with 2 history events.
- Locally the directory door loads no CSS (its CSP upgrades asset requests to
  `https://inmobiliarios.com.py`, which does not resolve in the sandbox), so
  that screenshot is unstyled. The markup and text were checked by the spec.

## Founder steps

1. Apply 0024 → 0028 (`db:status` → `db:migrate` → `db:status`) before
   merging.
2. Set `AUTH_TOKEN_SECRET` in hPanel (at least 32 characters) if it is not set
   already.
