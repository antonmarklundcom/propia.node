"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getDictionary, parseLocale, type Locale } from "@/i18n";

/**
 * Route error boundary (audit F53): without this file a thrown render error
 * shows Next's raw production error screen. It renders inside the root
 * layout, so <html lang> already names the door's language ("en" or
 * "es-PY"); the copy follows it. reset() re-renders the segment, which
 * recovers transient DB hiccups.
 */
function documentLocale(): Locale {
  return parseLocale(document.documentElement.lang.slice(0, 2));
}
// The boundary is also server-rendered, where there is no document: the
// server snapshot is Spanish, and React re-renders with the client's value
// right after hydration (a plain useState initializer would keep the server's).
const noSubscribe = () => () => {};

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server logs carry the digest; this pairs the client view with it.
    console.error(error);
  }, [error]);
  const locale = useSyncExternalStore(noSubscribe, documentLocale, (): Locale => "es");
  const t = getDictionary(locale).common;

  return (
    <main className="error-page">
      <h1 className="error-page__title">{t.errorTitle}</h1>
      <p className="error-page__text">{t.errorText}</p>
      <div className="error-page__actions">
        <button className="mk-btn mk-btn--accent" onClick={() => reset()}>
          {t.errorRetry}
        </button>
        <a className="mk-btn mk-btn--outline" href="/">
          {t.errorHome}
        </a>
      </div>
    </main>
  );
}
