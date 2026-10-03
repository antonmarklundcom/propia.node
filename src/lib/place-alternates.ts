/**
 * Which host serves a place file, and the hreflang set for a place page
 * (plan decisions P-1/P-2, Opus idea 9). Pure: derived from the vertical table
 * like every other alternate (`languageAlternates()`), never hand-maintained.
 *
 * A set is emitted only between **verified** files for the same place on doors
 * of **different** locales; a draft is noindex and pairing a noindex URL asks
 * Google to weigh a page we asked it to ignore.
 */
import type { VerticalConfig, VerticalKey } from "../config/verticals";
import type { PlacePage } from "../content/places/types";
import { placePath } from "./place-path";

/** The first enabled host declared for a door key. */
export function hostForDoor(table: Record<string, VerticalConfig>, door: VerticalKey): string | null {
  return Object.entries(table).find(([, v]) => v.key === door && v.enabled)?.[0] ?? null;
}

export function placeAlternates(
  table: Record<string, VerticalConfig>,
  files: readonly PlacePage[],
): Record<string, string> | undefined {
  const byLocale = new Map<string, string>();
  for (const f of files) {
    if (f.status !== "verified") continue;
    const host = hostForDoor(table, f.door);
    if (!host) continue;
    const locale = table[host].locale;
    if (!byLocale.has(locale)) byLocale.set(locale, `https://${host}${placePath(f.city, f.barrio)}`);
  }
  if (byLocale.size < 2) return undefined;
  const out: Record<string, string> = Object.fromEntries(byLocale);
  out["x-default"] = byLocale.get("es") ?? [...byLocale.values()][0];
  return out;
}
