/**
 * The /agencia "listings that moved in with a new member" notice (bug 6) is
 * one-time per browser: dismissing it stores the newest admin_events id seen,
 * and the page shows only join events newer than that. No column needed.
 */
export const JOIN_NOTICE_COOKIE = "agencia_join_seen";

export function parseSeenId(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 0;
}
