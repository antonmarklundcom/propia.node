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
import { parseReplyTemplates } from "./reply-templates";
import { CACHE_TAGS, CACHE_TTL, revalidateSettings, singleFlight } from "./cache";

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
  // WhatsApp auto-responder (src/lib/whatsapp-auto.ts). Both switches default off.
  waGreeting: "wa_greeting_enabled",
  waAi: "wa_ai_enabled",
  waHours: "wa_office_hours",
  waAiCooldown: "wa_ai_cooldown_hours",
  // The operator's own agency (/admin/ajustes): its listings read as "Propias"
  // in /admin (src/lib/publisher-kind.ts). Unset = none chosen.
  houseAgencyId: "house_agency_id",
  // Independent agents the operator works with as partners ("Socio" in
  // /admin/agentes): comma-separated agents.id. Unset = none.
  partnerAgentIds: "partner_agent_ids",
  // Saved reply texts for /admin/leads (src/lib/reply-templates.ts): JSON array of strings.
  replyTemplates: "reply_templates",
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

// Single-flighted: the header and the footer read it in the same render.
const readSiteSettingsCached = singleFlight(
  "site-settings",
  unstable_cache(readSiteSettingsRaw, ["site-settings"], {
    revalidate: CACHE_TTL.settings,
    tags: [CACHE_TAGS.settings],
  }),
);

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

export function parseHouseAgencyId(value: string | undefined): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** The agency whose listings /admin labels "Propias"; null when none is chosen. */
export async function getHouseAgencyId(): Promise<number | null> {
  return parseHouseAgencyId((await readSiteSettings())[SETTING_KEYS.houseAgencyId]);
}

/**
 * `partner_agent_ids`: the independent agents marked "Socio". Only positive
 * integers survive, de-duplicated and sorted, so the list can be spelled raw
 * into SQL (src/lib/publisher-kind.ts).
 */
export function parsePartnerAgentIds(value: string | undefined): number[] {
  if (!value) return [];
  const out = new Set<number>();
  for (const part of value.split(",")) {
    const t = part.trim();
    if (!/^\d{1,10}$/.test(t)) continue;
    const n = Number(t);
    if (Number.isSafeInteger(n) && n > 0) out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

export function formatPartnerAgentIds(ids: readonly number[]): string {
  return parsePartnerAgentIds(ids.join(",")).join(",");
}

export async function getPartnerAgentIds(opts: { uncached?: boolean } = {}): Promise<number[]> {
  if (opts.uncached) {
    try {
      return parsePartnerAgentIds((await readSiteSettingsRaw())[SETTING_KEYS.partnerAgentIds]);
    } catch {
      return [];
    }
  }
  return parsePartnerAgentIds((await readSiteSettings())[SETTING_KEYS.partnerAgentIds]);
}

/** The saved reply texts the lead cards' pickers offer (empty when none or unreadable). */
export async function getReplyTemplates(opts: { uncached?: boolean } = {}): Promise<string[]> {
  try {
    const s = opts.uncached ? await readSiteSettingsRaw() : await readSiteSettings();
    return parseReplyTemplates(s[SETTING_KEYS.replyTemplates]);
  } catch {
    return [];
  }
}

/** What `publisherKindSql()` needs: the house agency and the partner agents. */
export interface PublisherSettings {
  houseAgencyId: number | null;
  partnerAgentIds: number[];
}

export async function getPublisherSettings(): Promise<PublisherSettings> {
  const s = await readSiteSettings();
  return {
    houseAgencyId: parseHouseAgencyId(s[SETTING_KEYS.houseAgencyId]),
    partnerAgentIds: parsePartnerAgentIds(s[SETTING_KEYS.partnerAgentIds]),
  };
}

/** The auto-responder's switches, parsed; every default is "off" / the built-in hours. */
export interface WhatsAppAutoSettings {
  greetingEnabled: boolean;
  aiEnabled: boolean;
  /** Raw JSON; parse with `parseOfficeHours()` (whatsapp-auto-policy.ts). */
  officeHoursRaw: string | null;
  cooldownRaw: string | null;
}

/**
 * `uncached` is for the WhatsApp webhook's `after()`: the cached reader, run
 * there on a cold server, threw and read as "everything off" (seen on a fresh
 * `next start`), which would silently skip auto-replies after each deploy. A
 * one-row-per-setting query per inbound message is cheap. A failed read is
 * still "off" — the conservative answer.
 */
export async function getWhatsAppAutoSettings(opts: { uncached?: boolean } = {}): Promise<WhatsAppAutoSettings> {
  let s: Record<string, string>;
  if (opts.uncached) {
    try {
      s = await readSiteSettingsRaw();
    } catch {
      s = {};
    }
  } else {
    s = await readSiteSettings();
  }
  return {
    greetingEnabled: s[SETTING_KEYS.waGreeting] === "true",
    aiEnabled: s[SETTING_KEYS.waAi] === "true",
    officeHoursRaw: s[SETTING_KEYS.waHours] ?? null,
    cooldownRaw: s[SETTING_KEYS.waAiCooldown] ?? null,
  };
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
