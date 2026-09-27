"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Queues page views and WhatsApp clicks and sends them in one
 * `navigator.sendBeacon` when the tab is hidden (the visitor left, switched
 * app, or opened WhatsApp) or ten events have queued. No cookies, no storage,
 * no identifier (the visit's source lives in this tab's sessionStorage): the server derives a daily visitor hash from the request
 * itself (src/lib/analytics.ts). Staff and account pages are never queued.
 */
type BeaconEvent = { e: "pv" | "wa"; p: string; r?: string; us?: string; um?: string; uc?: string };

const PRIVATE = ["/admin", "/agencia", "/mis-avisos", "/login", "/registro"];
const queue: BeaconEvent[] = [];
/**
 * Where this visit came from — the referrer and utm tags of its first page,
 * attached to every event, so a WhatsApp tap three pages later is still
 * credited to the campaign that brought the visitor. Kept in sessionStorage
 * (this tab only, gone when it closes, no identifier) so a full reload does
 * not turn a campaign visit into "direct".
 */
type VisitSource = Pick<BeaconEvent, "r" | "us" | "um" | "uc">;
const SOURCE_KEY = "analytics:visit-source";
let visitSource: VisitSource | null = null;

function loadVisitSource(): VisitSource | null {
  try {
    const raw = sessionStorage.getItem(SOURCE_KEY);
    return raw ? (JSON.parse(raw) as VisitSource) : null;
  } catch {
    return null;
  }
}

function saveVisitSource(v: VisitSource): void {
  try {
    sessionStorage.setItem(SOURCE_KEY, JSON.stringify(v));
  } catch {
    /* private mode: memory only */
  }
}

function tracked(path: string): boolean {
  return !PRIVATE.some((p) => path === p || path.startsWith(`${p}/`));
}

function flush(): void {
  if (queue.length === 0) return;
  const body = JSON.stringify({ events: queue.splice(0, 20) });
  try {
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/a", blob)) {
      void fetch("/api/a", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
    }
  } catch {
    /* statistics never break the page */
  }
}

function push(ev: BeaconEvent): void {
  queue.push({ ...ev, ...(visitSource ?? {}) });
  if (queue.length >= 10) flush();
}

export function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !tracked(pathname)) return;
    if (!visitSource) visitSource = loadVisitSource();
    if (!visitSource) {
      const sp = new URLSearchParams(window.location.search);
      visitSource = {};
      if (document.referrer) visitSource.r = document.referrer;
      const us = sp.get("utm_source");
      const um = sp.get("utm_medium");
      const uc = sp.get("utm_campaign");
      if (us) visitSource.us = us;
      if (um) visitSource.um = um;
      if (uc) visitSource.uc = uc;
      saveVisitSource(visitSource);
    }
    push({ e: "pv", p: pathname });
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const href = a?.getAttribute("href") ?? "";
      if (!/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return;
      const path = window.location.pathname;
      if (!tracked(path)) return;
      push({ e: "wa", p: path });
      // The visitor is leaving for WhatsApp: send now rather than hoping the
      // tab reports itself hidden.
      flush();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}
