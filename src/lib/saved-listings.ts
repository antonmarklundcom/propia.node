/**
 * Favourites and the compare tray — the visitor's two lists of listing public
 * ids, kept in `localStorage` with no account (plan-build-2026-09-26 A3,
 * Seeker 2 and 6). Same pattern and prefix as `propia:recently-viewed`
 * (RecentlyViewed.tsx).
 *
 * Client-safe and pure: no `next/*`. Every read and write is wrapped, because
 * private mode, a full quota or a browser that blocks site data throws from
 * the accessor itself — a saved list is a nicety, never an error.
 *
 * Only public ids are stored, never a snapshot: `/favoritos` and `/comparar`
 * fetch the rows by id and show published ones only, so a listing that was
 * paused or sold since drops out instead of showing a stale price.
 */
import { COMPARE_MAX } from "@/i18n/es-a3";

export type SavedList = "favorites" | "compare";

const KEYS: Record<SavedList, string> = {
  favorites: "propia:favorites",
  compare: "propia:compare",
};

/** Favourites are capped too, so the /favoritos URL stays a sane length. */
const LIMITS: Record<SavedList, number> = {
  favorites: 60,
  compare: COMPARE_MAX,
};

/** Fired on `window` after any write, so every button and the bar re-read. */
export const SAVED_EVENT = "propia:saved-change";

/** `listings.public_id` is 10 characters of [a-z0-9] (parseListingPublicId, urls.ts). */
const PUBLIC_ID = /^[a-z0-9]{10}$/;

export function isPublicId(value: string): boolean {
  return PUBLIC_ID.test(value);
}

export function readSaved(list: SavedList): string[] {
  try {
    const raw = localStorage.getItem(KEYS[list]);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is string => typeof x === "string" && isPublicId(x))
      .slice(0, LIMITS[list]);
  } catch {
    return [];
  }
}

function writeSaved(list: SavedList, ids: string[]): void {
  try {
    localStorage.setItem(KEYS[list], JSON.stringify(ids.slice(0, LIMITS[list])));
  } catch {
    // Private mode / quota — nothing to do.
  }
  try {
    window.dispatchEvent(new Event(SAVED_EVENT));
  } catch {
    /* no window */
  }
}

/**
 * Add or remove one id. Returns false only when adding would overflow the
 * list (the compare tray is full), so the caller can say why nothing happened.
 */
export function toggleSaved(list: SavedList, id: string): boolean {
  const current = readSaved(list);
  if (current.includes(id)) {
    writeSaved(list, current.filter((x) => x !== id));
    return true;
  }
  if (current.length >= LIMITS[list]) return false;
  // Newest first for favourites; the compare table keeps the picking order.
  writeSaved(list, list === "favorites" ? [id, ...current] : [...current, id]);
  return true;
}

export function removeSaved(list: SavedList, id: string): void {
  writeSaved(list, readSaved(list).filter((x) => x !== id));
}

/** Replace the whole list (a shared /comparar link adopted by a new browser). */
export function replaceSaved(list: SavedList, ids: string[]): void {
  writeSaved(list, ids.filter(isPublicId));
}

export function clearSaved(list: SavedList): void {
  writeSaved(list, []);
}

/** Subscribe to changes from this tab (custom event) and other tabs (storage). */
export function onSavedChange(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || Object.values(KEYS).includes(e.key)) cb();
  };
  window.addEventListener(SAVED_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SAVED_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Parse `?ids=a,b,c` from a page's search params: well-formed ids only,
 * de-duplicated, capped. Shared by the two pages and their client sync so
 * both sides agree on what the URL means.
 */
export function parseIdsParam(raw: string | string[] | undefined, list: SavedList): string[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return [];
  const out: string[] = [];
  for (const part of value.split(",")) {
    const id = part.trim().toLowerCase();
    if (isPublicId(id) && !out.includes(id)) out.push(id);
    if (out.length >= LIMITS[list]) break;
  }
  return out;
}
