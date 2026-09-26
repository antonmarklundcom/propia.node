"use client";

/**
 * Favourites and compare, without an account (plan-build-2026-09-26 A3,
 * Seeker 2 and 6). Every piece here renders its "nothing saved" state on the
 * server and on first paint, then reads `localStorage` after hydration — the
 * same rule RecentlyViewed.tsx follows, so SSR output never depends on the
 * visitor's browser.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getDictionary, type Locale } from "@/i18n";
import { COMPARE_MAX } from "@/i18n/es-a3";
import {
  clearSaved,
  onSavedChange,
  readSaved,
  replaceSaved,
  toggleSaved,
  type SavedList,
} from "@/lib/saved-listings";

const EMPTY: string[] = [];

/**
 * The saved list as React state. `useSyncExternalStore` needs a stable
 * snapshot, and `readSaved()` returns a fresh array each call, so the
 * snapshot is cached by its serialised form.
 */
function useSavedList(list: SavedList): string[] {
  const [cache] = useState(() => ({ key: "", value: EMPTY }));
  const getSnapshot = useCallback(() => {
    const value = readSaved(list);
    const key = value.join(",");
    if (key !== cache.key) {
      cache.key = key;
      cache.value = value.length ? value : EMPTY;
    }
    return cache.value;
  }, [list, cache]);
  return useSyncExternalStore(onSavedChange, getSnapshot, () => EMPTY);
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.9 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.9 1.3-1.8 2.8-2.9 4.8-2.9 3.3 0 5.6 3.1 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z" />
    </svg>
  );
}

function CompareIcon({ on }: { on: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="4" width="7" height="16" />
      <rect x="14" y="4" width="7" height="16" />
      {on && <path d="m4.8 12 1.6 1.6L9 10.6" />}
    </svg>
  );
}

export function FavoriteButton({
  publicId,
  locale,
  className = "",
}: {
  publicId: string;
  locale: Locale;
  className?: string;
}) {
  const t = getDictionary(locale).a3.favorites;
  const saved = useSavedList("favorites").includes(publicId);
  return (
    <button
      type="button"
      className={`saved-btn saved-btn--fav${saved ? " saved-btn--on" : ""} ${className}`}
      aria-pressed={saved}
      aria-label={saved ? t.removeLabel : t.addLabel}
      title={saved ? t.removeLabel : t.addLabel}
      onClick={() => toggleSaved("favorites", publicId)}
    >
      <HeartIcon filled={saved} />
      <span className="saved-btn__text">{saved ? t.saved : t.save}</span>
    </button>
  );
}

export function CompareButton({
  publicId,
  locale,
  className = "",
}: {
  publicId: string;
  locale: Locale;
  className?: string;
}) {
  const t = getDictionary(locale).a3.compare;
  const list = useSavedList("compare");
  const on = list.includes(publicId);
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (!full) return;
    const timer = window.setTimeout(() => setFull(false), 3500);
    return () => window.clearTimeout(timer);
  }, [full]);
  return (
    <span className="saved-btn__wrap">
      <button
        type="button"
        className={`saved-btn saved-btn--compare${on ? " saved-btn--on" : ""} ${className}`}
        aria-pressed={on}
        aria-label={on ? t.removeLabel : t.addLabel}
        title={on ? t.removeLabel : t.addLabel}
        onClick={() => setFull(!toggleSaved("compare", publicId))}
      >
        <CompareIcon on={on} />
        <span className="saved-btn__text">{on ? t.added : t.add}</span>
      </button>
      {full && (
        <span className="saved-btn__note" role="status">
          {t.full(COMPARE_MAX)}
        </span>
      )}
    </span>
  );
}

/** The row under a listing card: save + compare. */
export function CardSaveActions({ publicId, locale }: { publicId: string; locale: Locale }) {
  return (
    <div className="listing-card-actions">
      <FavoriteButton publicId={publicId} locale={locale} />
      <CompareButton publicId={publicId} locale={locale} />
    </div>
  );
}

/** Header link to /favoritos — rendered only once something is saved. */
export function FavoritesHeaderLink({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).a3.favorites;
  const n = useSavedList("favorites").length;
  if (n === 0) return null;
  return (
    <Link className="site-header__favorites" href="/favoritos" aria-label={t.headerLink(n)}>
      <HeartIcon filled />
      <span className="site-header__favorites-count">{n}</span>
    </Link>
  );
}

/**
 * The sticky compare tray. Shows from the first pick; hidden on /comparar
 * itself, and on staff surfaces where no card renders.
 */
export function CompareBar({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).a3.compare;
  const list = useSavedList("compare");
  const pathname = usePathname() ?? "";
  if (list.length === 0) return null;
  if (
    pathname.startsWith("/comparar") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/agencia")
  ) {
    return null;
  }
  return (
    <aside className="compare-bar" aria-label={t.barLabel}>
      <span className="compare-bar__count">
        <CompareIcon on /> {t.barCount(list.length, COMPARE_MAX)}
      </span>
      <span className="compare-bar__actions">
        <button type="button" className="compare-bar__clear" onClick={() => clearSaved("compare")}>
          {t.barClear}
        </button>
        <Link className="compare-bar__cta" href={`/comparar?ids=${list.join(",")}`}>
          {t.barCta}
        </Link>
      </span>
    </aside>
  );
}

/**
 * Keeps `/favoritos?ids=…` and `/comparar?ids=…` in step with the browser's
 * list. The page is a server component that renders whatever ids the URL
 * carries; this rewrites the URL (replace, no history entry) whenever the
 * stored list differs, so un-saving a listing on the page removes it.
 *
 * Only after hydration: until then the server's render of the URL stands.
 * A browser with nothing stored that opens a URL with ids (a link someone
 * shared) adopts that list once, rather than wiping the page it was sent.
 */
export function SavedIdsSync({
  list,
  path,
  urlIds,
}: {
  list: SavedList;
  path: string;
  urlIds: string[];
}) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const adopted = useRef(false);
  const stored = useSavedList(list);
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (!hydrated) return;
    if (!adopted.current) {
      adopted.current = true;
      if (stored.length === 0 && urlIds.length > 0) {
        replaceSaved(list, urlIds);
        return;
      }
    }
    const want = stored.join(",");
    if (want === urlIds.join(",")) return;
    router.replace(want ? `${path}?ids=${want}` : path, { scroll: false });
  }, [hydrated, stored, urlIds, path, router, list]);
  return null;
}

/** "Borrar todos" on /favoritos, or "Vaciar" on /comparar. */
export function ClearSavedButton({ list, label }: { list: SavedList; label: string }) {
  return (
    <button type="button" className="panel-btn" onClick={() => clearSaved(list)}>
      {label}
    </button>
  );
}

/** "Quitar" in a compare-table column. */
export function RemoveSavedButton({
  list,
  publicId,
  label,
}: {
  list: SavedList;
  publicId: string;
  label: string;
}) {
  return (
    <button
      type="button"
      className="compare-table__remove"
      onClick={() => toggleSaved(list, publicId)}
    >
      {label}
    </button>
  );
}
