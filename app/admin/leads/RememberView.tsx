"use client";

import { useEffect } from "react";

/**
 * Remembers the "Mis consultas / Todas" choice for the next visit to
 * /admin/leads. A server component cannot set a cookie, and this is a
 * display preference only — the role still decides what staff may read.
 */
export function RememberView({ name, value }: { name: string; value: string }) {
  useEffect(() => {
    try {
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/admin; max-age=31536000; samesite=lax`;
    } catch {
      /* cookies blocked: the default view applies next time */
    }
  }, [name, value]);
  return null;
}
