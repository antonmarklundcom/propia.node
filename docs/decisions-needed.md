# docs/decisions-needed.md — founder decisions, not build work

Append-only. A phase that hits a call only the founder can make writes one
entry here and stops rather than guessing.

## Reviews on agent profiles

CLAUDE.md backlog item 4: no review/rating system exists today. Building one
needs a schema (a `reviews` table, moderation state), an anti-fake-review
design (who can leave one, what stops a self-review or a competitor's), and a
legal read on publishing a named person's review of another named person.
None of that is a code decision.

Options:

- (a) Not now — leave `/agente/[slug]` and `/inmobiliaria/[slug]` without
  reviews.
- (b) Verified-lead-only reviews — only someone who submitted a lead to that
  agent/agency (traceable in `leads`) can leave one, reducing fake-review
  surface but still needing moderation and a schema.
- (c) Operator-curated testimonials — the founder (or an admin) pastes in a
  short quote per agent/agency by hand, no visitor-submitted content, no
  moderation queue, no anti-fake design needed.

**Recommendation: (c).** It is the cheapest honest start — no new abuse
surface, no legal exposure from publishing a stranger's opinion of another
named person, and it can ship without touching `schema.ts`. (b) is the
natural next step once there is enough lead volume per agent to make it real,
and can reuse (c)'s rendering.
