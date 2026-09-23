/**
 * Public coordinate precision, shared by every surface that exposes a
 * listing's position (map pins, JSON-LD). A listing's own lat/lng is never
 * shown at full precision (schema.ts §2.1): a point on the exact building
 * tells a stranger which house is empty and for sale.
 *
 * 3 decimals ≈ 110 m at this latitude. Enough for "this block", not enough to
 * pick a house out of it. Bump with care: every extra decimal is ~10x more
 * precise about someone's home.
 *
 * Pure (no db, no server-only) so any module can import it.
 */
export const COORD_DECIMALS = 3;

export function roundCoord(value: number): number {
  const f = 10 ** COORD_DECIMALS;
  return Math.round(value * f) / f;
}
