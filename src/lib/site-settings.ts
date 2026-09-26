/**
 * `site_settings` (migration 0014): small key → value switches the super-admin
 * flips in /admin/ajustes. The first consumer is the business mode
 * (docs/plan-agency-2026-09-26.md batch 3).
 *
 * Read through one cached query (tag `settings`, writer `revalidateSettings()`
 * in `setSiteSetting()`), so a public page pays no query for it. A read that
 * fails — the table missing on a stale database, MySQL unwell — returns the
 * defaults rather than an error page: every setting's default is the
 * behaviour the site had before the setting existed.
 */
import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { CACHE_TAGS, CACHE_TTL, revalidateSettings } from "./cache";

/**
 * `marketplace`: anyone publishes, a listing's contact goes to whoever listed
 * it (the site as built). `agency`: every enquiry comes to the operator, who
 * shares it with a partner (lead_assignments); self-publishing and agency
 * sign-up close.
 */
export type BusinessMode = "marketplace" | "agency";

export const SETTING_KEYS = {
  businessMode: "business_mode",
  analyticsRawDays: "analytics_raw_days",
} as const;

/** Uncached — for scripts and jobs, which have no Next.js cache around them. */
export async function readSiteSettingsRaw(): Promise<Record<string, string>> {
  const rows = await db
    .select({ key: siteSettings.key, value: siteSettings.value })
    .from(siteSettings);
  const out: Record<string, string> = {};
  for (const r of rows) if (r.value != null) out[r.key] = r.value;
  return out;
}

const readSiteSettingsCached = unstable_cache(readSiteSettingsRaw, ["site-settings"], {
  revalidate: CACHE_TTL.settings,
  tags: [CACHE_TAGS.settings],
});

async function readSiteSettings(): Promise<Record<string, string>> {
  try {
    // NEXT_RUNTIME is set by Next and by nothing else (same rule as fx.ts):
    // a script calling this has no incremental cache to read from.
    return process.env.NEXT_RUNTIME
      ? await readSiteSettingsCached()
      : await readSiteSettingsRaw();
  } catch {
    return {};
  }
}

export function parseBusinessMode(value: string | undefined): BusinessMode {
  return value === "agency" ? "agency" : "marketplace";
}

export async function getBusinessMode(): Promise<BusinessMode> {
  return parseBusinessMode((await readSiteSettings())[SETTING_KEYS.businessMode]);
}

export async function isAgencyMode(): Promise<boolean> {
  return (await getBusinessMode()) === "agency";
}

/** Raw analytics events are pruned after this many days (daily totals are kept forever). */
export const ANALYTICS_RAW_DAYS_DEFAULT = 365;

export function parseRawDays(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 30 && n <= 3650 ? n : ANALYTICS_RAW_DAYS_DEFAULT;
}

export async function getAnalyticsRawDays(): Promise<number> {
  return parseRawDays((await readSiteSettings())[SETTING_KEYS.analyticsRawDays]);
}

/** Upsert one setting and drop the cache. Server actions only, after an auth check. */
export async function setSiteSetting(
  key: string,
  value: string,
  userId: number,
): Promise<void> {
  await db
    .insert(siteSettings)
    .values({ key, value, updatedAt: new Date(), updatedBy: userId })
    .onDuplicateKeyUpdate({
      set: { value, updatedAt: sql`CURRENT_TIMESTAMP`, updatedBy: userId },
    });
  revalidateSettings();
}

/**
 * Agency mode closes self-publishing to the public — visitors and private
 * owners go to the seller form instead — while partners (agents, agency
 * admins, developers) and staff keep /publicar to add the listings the
 * operator sells with them. Read by the page and by every publish action, so
 * a direct POST cannot get round the redirect.
 */
export async function publishingClosedFor(role: string | null | undefined): Promise<boolean> {
  if (role && role !== "consumer") return false;
  return isAgencyMode();
}
