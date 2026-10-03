/**
 * Duplicate listings (plan-admin-next O5) — the pure rule. The same property
 * published by several listers is one "group" (`listing_duplicates`); the
 * operator marks it in /admin. Founder decision 2026-10-02:
 *
 * - **The first lister keeps the slot.** Among the group's *published*
 *   members, the one published earliest (ties: lowest id) is the primary. It
 *   alone shows in grids, maps, home rails, similar listings and sitemaps.
 * - **The next takes over when it goes.** Nothing is stored about who is
 *   primary: it is recomputed from status and published_at, so a primary that
 *   is paused, sold or deleted hands the slot to the next one at once.
 * - **Visitors see it.** Every published member's page says "También
 *   publicado por …" naming the other publishers; a non-primary page keeps
 *   working (its lister's contact) but canonicalises to the primary.
 *
 * `notHiddenDuplicate()` (src/lib/facet-sql.ts) is the same rule in SQL.
 * `verify:duplicates` checks this file; tests/e2e/listing-duplicates.spec.ts
 * checks the SQL against MariaDB.
 */
export interface DuplicateMember {
  id: number;
  status: string;
  /** published_at, else created_at — ISO string or Date. */
  listedAt: string | Date | null;
}

function at(v: string | Date | null): number {
  if (v == null) return Number.POSITIVE_INFINITY;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

/** The member that holds the slot, or null when none is published. */
export function primaryOf<T extends DuplicateMember>(members: readonly T[]): T | null {
  let best: T | null = null;
  for (const m of members) {
    if (m.status !== "published") continue;
    if (!best || at(m.listedAt) < at(best.listedAt) || (at(m.listedAt) === at(best.listedAt) && m.id < best.id)) {
      best = m;
    }
  }
  return best;
}

/** Whether this member is hidden from grids: published, but not the primary. */
export function isHiddenDuplicate<T extends DuplicateMember>(member: T, group: readonly T[]): boolean {
  if (member.status !== "published") return false;
  const p = primaryOf(group);
  return p != null && p.id !== member.id;
}
