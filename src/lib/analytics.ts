/**
 * First-party analytics (docs/plan-agency-2026-09-26.md batch 5). No Google,
 * no cookies, no third party.
 *
 * - **A visitor** is `visitor_hash` = HMAC(salt, day | IP | user agent),
 *   truncated to 16 hex chars. The day is part of the input, so the same
 *   person gets a new hash every day and cannot be followed across days; the
 *   raw IP is never stored.
 * - **Nothing is written per request.** Events go into an in-memory buffer and
 *   are written as one multi-row INSERT a minute (or every 200 events). The
 *   host's limit is processes, not disk: a page view must not cost a database
 *   round-trip. A crash loses at most a minute of counts — acceptable for
 *   statistics, never for leads (which are written synchronously elsewhere).
 * - **Bots are dropped** with the same `isBotUserAgent()` the listing view
 *   counter uses, so the numbers mean people.
 */
import "server-only";
import { createHmac } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, listings } from "@/db/schema";
import { isBotUserAgent } from "./view-tracking";
import { parseListingPublicId } from "./urls";

export type AnalyticsEventName = "page_view" | "wa_click" | "lead_submit";

type Row = typeof analyticsEvents.$inferInsert;

/** Paraguay's calendar day, 'YYYY-MM-DD' — the day an operator in Asunción means. */
export function analyticsDay(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

function salt(): string {
  // Any stable server-side secret works; the day in the input is what rotates
  // the hash. DATABASE_URL is always set where this runs and never public.
  return process.env.ANALYTICS_SALT || process.env.DATABASE_URL || "analytics";
}

export function visitorHash(ip: string, userAgent: string, day: string): string {
  return createHmac("sha256", salt()).update(`${day}|${ip}|${userAgent}`).digest("hex").slice(0, 16);
}

export function deviceOf(userAgent: string): "mobile" | "tablet" | "desktop" {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(ua) || (ua.includes("android") && !ua.includes("mobile"))) return "tablet";
  if (/mobi|iphone|ipod|android|windows phone/.test(ua)) return "mobile";
  return "desktop";
}

/** Host of an external referrer, without `www.`; null for none, junk, or our own host. */
export function referrerHostOf(referrer: string | null | undefined, ownHost: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    const own = (ownHost ?? "").toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
    if (!host || host === own) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

/** Path only (no query, no fragment), bounded; null for anything that is not a path. */
export function normalizePath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/")) return null;
  const clean = path.split(/[?#]/)[0].slice(0, 255);
  return clean || "/";
}

/**
 * Staff and account surfaces are not "the site": an operator refreshing
 * /admin all day must not look like traffic.
 */
const PRIVATE_PREFIXES = ["/admin", "/agencia", "/mis-avisos", "/login", "/registro", "/api"];

export function isTrackedPath(path: string): boolean {
  return !PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function clip(value: string | null | undefined, max: number): string | null {
  const v = value?.trim();
  return v ? v.slice(0, max) : null;
}

export interface AnalyticsInput {
  event: AnalyticsEventName;
  path: string;
  vertical: string;
  ip: string;
  userAgent: string | null;
  referrer?: string | null;
  ownHost?: string | null;
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null };
  listingId?: number | null;
}

/** Past this many unflushed events, new ones are dropped rather than growing memory. */
const MAX_BUFFER = 5000;
const FLUSH_AT = 200;
const FLUSH_EVERY_MS = 60_000;

const buffer: Row[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<number> | null = null;

/** Queue one event. Synchronous and never throws: callers are request paths. */
export function recordAnalyticsEvent(input: AnalyticsInput): void {
  try {
    const ua = input.userAgent ?? "";
    if (isBotUserAgent(ua)) return;
    const path = normalizePath(input.path);
    if (!path || !isTrackedPath(path)) return;
    if (buffer.length >= MAX_BUFFER) return;
    const now = new Date();
    const day = analyticsDay(now);
    buffer.push({
      ts: now,
      day,
      vertical: input.vertical.slice(0, 20),
      event: input.event,
      path,
      listingId: input.listingId ?? null,
      referrerHost: referrerHostOf(input.referrer, input.ownHost ?? null),
      utmSource: clip(input.utm?.source, 60),
      utmMedium: clip(input.utm?.medium, 60),
      utmCampaign: clip(input.utm?.campaign, 100),
      device: deviceOf(ua),
      visitorHash: visitorHash(input.ip, ua, day),
    });
    if (buffer.length >= FLUSH_AT) void flushAnalytics();
    else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        void flushAnalytics();
      }, FLUSH_EVERY_MS);
      timer.unref?.();
    }
  } catch {
    /* a statistic is never worth an error page */
  }
}

/**
 * Write everything buffered as one INSERT. Listing ids are resolved here, in
 * one query per batch, from `/propiedad/<slug>-<publicId>` paths — never per
 * event. Returns how many rows were written (0 on failure: those counts are
 * dropped, and the failure is logged without any row content).
 */
export async function flushAnalytics(): Promise<number> {
  if (flushing) return flushing;
  flushing = (async () => {
    const rows = buffer.splice(0, buffer.length);
    if (rows.length === 0) return 0;
    try {
      const wanted = new Map<string, Row[]>();
      for (const r of rows) {
        if (r.listingId != null || !r.path.startsWith("/propiedad/")) continue;
        const publicId = parseListingPublicId(r.path.slice("/propiedad/".length));
        if (!publicId) continue;
        const list = wanted.get(publicId) ?? [];
        list.push(r);
        wanted.set(publicId, list);
      }
      if (wanted.size > 0) {
        const found = await db
          .select({ id: listings.id, publicId: listings.publicId })
          .from(listings)
          .where(inArray(listings.publicId, [...wanted.keys()]));
        for (const f of found) for (const r of wanted.get(f.publicId) ?? []) r.listingId = f.id;
      }
      await db.insert(analyticsEvents).values(rows);
      return rows.length;
    } catch (e) {
      console.warn(`[analytics] dropped ${rows.length} events: ${e instanceof Error ? e.name : "error"}`);
      return 0;
    }
  })();
  try {
    return await flushing;
  } finally {
    flushing = null;
  }
}
