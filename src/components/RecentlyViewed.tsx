"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * "Vistos recientemente" — client-only, backed by localStorage (no accounts
 * yet, ARCHITECTURE.md M5). The listing page records a compact snapshot via
 * <RecentlyViewedRecorder>; this component renders the row on the homepage.
 * Renders nothing until hydration and nothing when the visitor has no
 * history, so SSR/first-paint is unaffected.
 */

export interface RecentEntry {
  href: string;
  title: string;
  price: string;
  operation: string;
  specs: string[];
  viewedAt: number;
}

const KEY = "propia:recently-viewed";
const MAX = 8;

export function readRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function recordRecent(entry: Omit<RecentEntry, "viewedAt">) {
  try {
    const rest = readRecent().filter((e) => e.href !== entry.href);
    localStorage.setItem(
      KEY,
      JSON.stringify([{ ...entry, viewedAt: Date.now() }, ...rest].slice(0, MAX)),
    );
  } catch {
    // Private mode / quota — history is a nicety, never an error.
  }
}

export function RecentlyViewed() {
  const [entries, setEntries] = useState<RecentEntry[]>([]);

  useEffect(() => {
    setEntries(readRecent());
  }, []);

  if (entries.length === 0) return null;

  return (
    <section className="home-section">
      <div className="home-section__head">
        <h2 className="home-section__title">🕓 Vistos recientemente</h2>
      </div>
      <div className="home-row">
        {entries.map((e) => (
          <Link key={e.href} className="recent-card" href={e.href}>
            <span
              className={`recent-card__badge${e.operation !== "venta" ? " recent-card__badge--alquiler" : ""}`}
            >
              {e.operation === "venta" ? "Venta" : "Alquiler"}
            </span>
            <span className="recent-card__price">{e.price}</span>
            <span className="recent-card__title">{e.title}</span>
            {e.specs.length > 0 && (
              <span className="recent-card__specs">{e.specs.join(" · ")}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Drop-in for the listing page: records the visit, renders nothing. */
export function RecentlyViewedRecorder({
  entry,
}: {
  entry: Omit<RecentEntry, "viewedAt">;
}) {
  useEffect(() => {
    recordRecent(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.href]);
  return null;
}
