# Build the inmobiliarios.com.py agent-directory vertical — paste into a fresh session

**Priority: second, but keep it quick.** Anton's main focus is
`docs/prompts/rentparaguay-vertical.md` — get that one 100% right first.
This one doesn't need to be gated behind it the way it was in the previous
draft of this prompt: steps 1-2 below are cheap, low-risk, and can be picked
up whenever there's a session free, including in parallel with the
rentparaguay work. Step 3 (schema-shaped) explicitly waits for review
regardless of sequencing — see below.

We now own `inmobiliarios.com.py` (parked, pointed at our hosting). It's the
plural-form domain already pre-declared as a stub in
`src/config/verticals.ts` (`key: "agents"`, `mode: "directory"`,
`enabled: false`), and `CLAUDE.md`'s domain table currently calls it "not
owned" — that line is now stale.

## Context you need before touching anything

1. Read `CLAUDE.md` in full, `PLAN.md` for any existing directory/agents
   notes, and `src/config/verticals.ts`'s `inmobiliarios.com.py` entry.
2. Read `docs/inmobiliarios-com-py-competitive-analysis.md` (copied into
   this repo from `C:\Claude 1\inmobiliaria-com-py\inmobiliarios-com-py-competitive-analysis.md`
   — move/keep it under `docs/`, don't leave the only copy outside the
   repo). It's a Playwright scan of the site that used to occupy this
   domain: a broken/unfinished hittamäklare.se-style agent-directory and
   lead-gen product (property owner submits a valuation request, gets
   matched with up to 3 competing agents). **Nearly every page besides the
   homepage was a stub or a 404, and the agent directory never worked** —
   read it for the product concept and the concrete gap list, not to reuse
   anything of theirs. It also independently confirms the
   `rentparaguay.com` cross-domain redirect bug flagged during the
   rentparaguay.com content extraction — same symptom, different scan,
   worth noting in that vertical's PR too if it hasn't been addressed yet.
3. Read `src/lib/crm.ts` (`routedTo` lead routing), `/agente/[slug]` and
   `/inmobiliaria/[slug]` (existing agent/agency profile pages), and
   `/tasacion` (existing valuation flow) — this vertical should reuse all
   three rather than building parallel systems.

## Build scope

1. **Enable the vertical.** Flip `enabled: true` for `inmobiliarios.com.py`
   in `verticals.ts`, pick the right `brand` string, and update the
   `CLAUDE.md` domain table row to reflect ownership (it currently reads
   "Not owned"). Run `npm run verify:seo` and `npm run verify:facets`
   after — `mode: "directory"` isn't branched on anywhere in the render
   path yet, so check what breaks or silently falls through to portal
   defaults, and fix or flag what you find.
2. **Build the directory-mode home.** This domain's homepage should be
   seller-first (like the incumbent's "¿Quieres vender o valorar tu
   propiedad?" hero), routing into the existing `/tasacion` valuation flow
   and an `/agentes` directory rather than the standard portal
   listing-grid homepage. Check `NordicoHome.tsx` / `src/design/sections.ts`
   for how home layout is currently chosen per vertical and extend that
   switch for `mode === "directory"`.
3. **The actual product gap — competing quotes, not a single routed
   lead — is schema-shaped. Do not build this part silently.** Today
   `routedTo` in `src/lib/crm.ts` sends a lead to one destination
   (agency/agent/owner/internal/developer). The differentiator from the
   incumbent (which promises "hasta tres agentes" but never built a working
   directory to deliver it) is a real multi-agent match: a `/tasacion`
   submission on this domain should identify 2-3 candidate agents (by
   zona/coverage — check what `/agente/[slug]` already stores for service
   area) and let the seller see/compare them, not just get silently routed
   once. Per this repo's own working agreements ("flag before merging
   anything touching auth, payments, or the DB schema"), **propose this as
   a dated decision in `PLAN.md` first** (mirroring how D8's owner-inbox
   gap is tracked) and get an explicit go-ahead before landing any schema
   changes or match/compare logic. **Stop here after steps 1-2 and the
   PLAN.md proposal; hold on writing the actual multi-agent routing code
   until that's reviewed.**
4. **Cheap wins the competitor missed — get these right from day one on
   this door, they cost little:** full non-truncated `<title>` (theirs was
   literally cut off mid-word), `og:image`/`twitter:image` set, a canonical
   tag, no dead nav links (theirs had three: directory, agent signup,
   services all 404 or "under construction"), and real review/rating data
   or none at all — never a padded/fake-looking stats card like their
   2-review agent shown at the same visual weight as a 429-review one.

## Rules that apply regardless

- `git fetch origin main && git reset --hard origin/main` before branching.
  `claude/<slug>` branch name.
- No `.github/workflows/`. `npm run verify:local` green before every push.
- Steps 1-2 and the cheap-wins pass (step 4) are copy/UI/config-level —
  autonomous build + merge is fine per the repo's working agreements once
  `verify:local`/`verify:seo`/`verify:facets` are green.
- Step 3 is explicitly **plan-and-propose only** in this pass — no schema
  migration, no match/compare code, until Anton has reviewed the `PLAN.md`
  entry.

## Report back

PR link(s) and state for steps 1-2-4; what broke or fell through to portal
defaults for `mode: "directory"` before you fixed it; the `PLAN.md` entry
for step 3, flagged clearly as **awaiting Anton's go-ahead**, not started.
