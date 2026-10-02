"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect } from "react";
import { isVitalMetricName } from "@/lib/web-vitals-shared";
import { parseVisitSource, VISIT_SOURCE_KEY } from "@/lib/visit-source";

/**
 * Queues page views and WhatsApp clicks and sends them in one
 * `navigator.sendBeacon` when the tab is hidden (the visitor left, switched
 * app, or opened WhatsApp) or ten events have queued. No cookies, no storage,
 * no identifier (the visit's source lives in this tab's sessionStorage): the server derives a daily visitor hash from the request
 * itself (src/lib/analytics.ts). Staff and account pages are never queued.
 *
 * Page speed rides the same queue: each Core Web Vital the browser measures
 * for the page it loaded (`{e:"wv", m, v}`, src/lib/web-vitals.ts) — one
 * value per metric per full page load, credited to the path that was loaded.
 */
type BeaconEvent = {
  e: "pv" | "wa" | "wv";
  p: string;
  r?: string;
  us?: string;
  um?: string;
  uc?: string;
  m?: string;
  v?: number;
};

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
// Shared with the lead forms, which fall back to it (src/lib/visit-source.ts).
const SOURCE_KEY = VISIT_SOURCE_KEY;
let visitSource: VisitSource | null = null;

function loadVisitSource(): VisitSource | null {
  try {
    return parseVisitSource(sessionStorage.getItem(SOURCE_KEY));
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
  queue.push(ev.e === "wv" ? ev : { ...ev, ...(visitSource ?? {}) });
  if (queue.length >= 10) flush();
}

/**
 * The path of the full page load the vitals describe. The browser measures
 * one load; INP and CLS are reported when the tab is hidden, possibly after
 * client-side navigations, and still belong to the page that was loaded.
 */
let loadedPath: string | null = null;

/** Module scope, so the hook's callback is stable across renders. */
function reportVital(metric: { name: string; value: number }): void {
  const path = loadedPath ?? window.location.pathname;
  if (!tracked(path) || !isVitalMetricName(metric.name) || !Number.isFinite(metric.value)) return;
  push({ e: "wv", p: path, m: metric.name, v: Math.round(metric.value * 10_000) / 10_000 });
}

export function AnalyticsBeacon() {
  const pathname = usePathname();
  if (loadedPath === null && typeof window !== "undefined") loadedPath = window.location.pathname;
  // Before the effects below on purpose: web-vitals registers its own
  // visibilitychange listener first, so INP and CLS are queued before
  // `onHide` flushes the queue (checked in a browser on 2026-09-28).
  useReportWebVitals(reportVital);

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
      // `data-wa-tap`: a WhatsApp button that goes through the contact form
      // first ("Pedir datos antes de WhatsApp", plan-admin-next O9) — still a
      // tap, though its href is `#contacto`.
      if (!/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href) && !a?.hasAttribute("data-wa-tap")) return;
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
