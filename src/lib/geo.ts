/**
 * Map-view coordinate privacy (schema.ts: precise lat/lng is "never shown
 * publicly at full precision" — see ListingMap.tsx for the same rule on the
 * detail page). The bbox map API must not leak a listing's exact pin, so
 * every point served to the client is deterministically snapped to a coarse
 * grid first. Same listing always snaps to the same cell (stable marker
 * position across requests/pans), and distinct nearby listings collapse onto
 * shared cells rather than exposing block-level precision.
 */
const GRID_DEG = 0.0015; // ~150m at Paraguay's latitude

export function snapToGrid(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Math.round(lat / GRID_DEG) * GRID_DEG,
    lng: Math.round(lng / GRID_DEG) * GRID_DEG,
  };
}
