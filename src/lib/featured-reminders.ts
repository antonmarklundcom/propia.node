/**
 * Featured-placement expiry reminders — the pure half (no `next/*`, no
 * database; `npm run verify:listing-reminders` drives it).
 *
 * The one expiry the data really has is `listings.featured_until`: a paid
 * placement that ends on a date. A listing itself does not expire, so there is
 * no "your listing is about to expire" reminder — inventing a lifetime would be
 * a product decision, and it is recorded as a question in
 * `docs/decisions-needed.md` instead.
 *
 * A reminder goes out once per placement: it is due in the last
 * `FEATURED_REMIND_DAYS` before `featured_until`, and is not repeated for the
 * same `featured_until` value (the ledger is an `admin_events` row, see
 * `src/lib/ops/featured-reminders.ts`). Extending the placement moves
 * `featured_until`, which makes the next end date eligible again.
 */

/** Days before the end of a placement its owner is reminded. */
export const FEATURED_REMIND_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whether a placement ending at `until` is inside the reminder window at `now`. */
export function featuredReminderDue(
  until: Date | string | null | undefined,
  now: Date,
  days = FEATURED_REMIND_DAYS,
): boolean {
  if (until == null) return false;
  const t = new Date(until).getTime();
  if (!Number.isFinite(t)) return false;
  return t > now.getTime() && t - now.getTime() <= days * DAY_MS;
}

/** Whole days left, rounded up, never below 1 while the placement is still running. */
export function featuredDaysLeft(until: Date | string, now: Date): number {
  const ms = new Date(until).getTime() - now.getTime();
  return Math.max(1, Math.ceil(ms / DAY_MS));
}

/**
 * The key a reminder is remembered by: the end date, to the minute. The same
 * placement always yields the same key; a renewed one yields a new key.
 */
export function featuredReminderKey(until: Date | string): string {
  return new Date(until).toISOString().slice(0, 16);
}

/**
 * Who a listing's reminder goes to, first match wins: the private owner's
 * account, then the listing agent's account, then the agency's own address.
 * Anything without an email is skipped (and counted), never guessed.
 */
export interface FeaturedRecipientSources {
  ownerEmail?: string | null;
  agentEmail?: string | null;
  agencyEmail?: string | null;
}

export function featuredRecipient(s: FeaturedRecipientSources): { email: string; kind: "owner" | "agent" | "agency" } | null {
  const pick = (v: string | null | undefined) => (v && /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(v.trim()) ? v.trim() : null);
  const owner = pick(s.ownerEmail);
  if (owner) return { email: owner, kind: "owner" };
  const agent = pick(s.agentEmail);
  if (agent) return { email: agent, kind: "agent" };
  const agency = pick(s.agencyEmail);
  if (agency) return { email: agency, kind: "agency" };
  return null;
}
