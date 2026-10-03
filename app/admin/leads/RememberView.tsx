"use client";

import { useEffect } from "react";

/**
 * Remembers the "Mis consultas / Todas" choice for the next visit to
 * /admin/leads (and /agencia/leads' "Mis consultas / Todo el equipo", with
 * `path="/agencia"`). A server component cannot set a cookie, and this is a
 * display preference only — the role still decides what staff may read.
 */
export function RememberView({ name, value, path = "/admin" }: { name: string; value: string; path?: string }) {
  useEffect(() => {
    try {
      document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}; max-age=31536000; samesite=lax`;
    } catch {
      /* cookies blocked: the default view applies next time */
    }
  }, [name, value, path]);
  return null;
}
