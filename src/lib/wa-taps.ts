/**
 * WhatsApp taps per publisher and per profile (plan-admin-next O9). A tap is
 * the beacon's `wa_click` (src/components/AnalyticsBeacon.tsx): a click on a
 * wa.me link, or on a button marked `data-wa-tap` that goes through the
 * contact form first. Intent, not proof a conversation happened — every
 * screen shows it apart from leads.
 *
 * Two readers:
 * - `getProfileWaTaps()` — the /agencia dashboard line: taps on the agency's
 *   public profile and on the member's own agent profile, raw events in the
 *   panel's stats window (the same source and window as the per-listing
 *   column next to it, `getPanelListingStats()`).
 * - `waTapsByPublisher()` — /admin/analitica's "WhatsApp por anunciante":
 *   listing taps grouped by who published the listing, profile taps, and the
 *   leads stamped `utm.channel = "whatsapp"` (src/lib/lead-channel.ts). Raw
 *   days and rolled-up days, never both for one day, like every other
 *   analitica reader.
 *
 * Statistics never take a page down: every read degrades to zero.
 */
import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { agencyUrl, agentUrl } from "@/lib/urls";
import { dayMinus } from "@/lib/ops/analytics";
import type { AnalyticsWindow } from "@/lib/analytics-queries";
import { STATS_WINDOW_DAYS } from "@/lib/stats-queries";
import { analyticsDay } from "@/lib/analytics";
import { LEAD_CHANNEL_UTM_KEY } from "@/lib/lead-channel";

type Rows = Array<Record<string, unknown>>;
async function rows(query: SQL): Promise<Rows> {
  try {
    const [r] = (await db.execute(query)) as unknown as [Rows];
    return r;
  } catch (e) {
    console.warn(`[wa-taps] read skipped: ${String(e)}`);
    return [];
  }
}
const n = (v: unknown): number => Number(v ?? 0) || 0;

/**
 * Taps on the profile pages of one agency and/or one agent, in the panel
 * stats window. `null` for a profile the caller does not have.
 */
export async function getProfileWaTaps(p: {
  agencySlug: string | null;
  agentSlug: string | null;
}): Promise<{ agency: number | null; own: number | null }> {
  const paths = [p.agencySlug ? agencyUrl(p.agencySlug) : null, p.agentSlug ? agentUrl(p.agentSlug) : null].filter(
    (x): x is string => x != null,
  );
  if (paths.length === 0) return { agency: null, own: null };
  const since = dayMinus(analyticsDay(), STATS_WINDOW_DAYS);
  const counts = new Map<string, number>();
  for (const r of await rows(sql`
    SELECT path, COUNT(*) AS c FROM analytics_events
    WHERE event = 'wa_click' AND day >= ${since} AND path IN (${sql.join(
      paths.map((x) => sql`${x}`),
      sql`, `,
    )})
    GROUP BY path
  `))
    counts.set(String(r.path), n(r.c));
  return {
    agency: p.agencySlug ? (counts.get(agencyUrl(p.agencySlug)) ?? 0) : null,
    own: p.agentSlug ? (counts.get(agentUrl(p.agentSlug)) ?? 0) : null,
  };
}

/** The public profile slugs a panel member has: their agency's and their own agent page. */
export async function profileSlugsFor(userId: number, agencyId: number | null): Promise<{
  agencySlug: string | null;
  agentSlug: string | null;
}> {
  const [agent] = await rows(sql`SELECT slug FROM agents WHERE user_id = ${userId} LIMIT 1`);
  const [agency] = agencyId != null ? await rows(sql`SELECT slug FROM agencies WHERE id = ${agencyId} LIMIT 1`) : [];
  return {
    agencySlug: agency?.slug != null ? String(agency.slug) : null,
    agentSlug: agent?.slug != null ? String(agent.slug) : null,
  };
}

export type PublisherKind = "agency" | "agent" | "owner" | "none";

export interface PublisherTapRow {
  kind: PublisherKind;
  id: number;
  name: string;
  listingTaps: number;
  profileTaps: number;
  /** Leads saved by the "Pedir datos antes de WhatsApp" form. */
  waLeads: number;
}

function rawWhere(w: AnalyticsWindow): SQL {
  return sql`day BETWEEN ${w.rawFrom} AND ${w.to}${w.vertical ? sql` AND vertical = ${w.vertical}` : sql``}`;
}

function dailyWhere(w: AnalyticsWindow): SQL | null {
  if (w.from >= w.rawFrom) return null;
  const before = dayMinus(w.rawFrom, 1);
  const last = before < w.to ? before : w.to;
  return sql`day BETWEEN ${w.from} AND ${last}${w.vertical ? sql` AND vertical = ${w.vertical}` : sql``}`;
}

/**
 * Who published a listing, for grouping: its agency, else its independent
 * agent, else its owner (a /publicar seller), else nobody. The same order
 * the listing page's contact chain uses.
 */
const PUBLISHER_SQL = sql.raw(`
  CASE WHEN l.agency_id IS NOT NULL THEN 'agency'
       WHEN l.agent_id IS NOT NULL THEN 'agent'
       WHEN l.owner_user_id IS NOT NULL THEN 'owner'
       ELSE 'none' END`);
const PUBLISHER_ID_SQL = sql.raw(`COALESCE(l.agency_id, l.agent_id, l.owner_user_id, 0)`);

export async function waTapsByPublisher(w: AnalyticsWindow, limit = 30): Promise<PublisherTapRow[]> {
  const out = new Map<string, PublisherTapRow>();
  const get = (kind: PublisherKind, id: number): PublisherTapRow => {
    const key = `${kind}:${id}`;
    let r = out.get(key);
    if (!r) {
      r = { kind, id, name: "", listingTaps: 0, profileTaps: 0, waLeads: 0 };
      out.set(key, r);
    }
    return r;
  };

  // Listing taps: raw events by listing_id, rolled-up days by the `listing` dimension.
  const dw = dailyWhere(w);
  const listingTaps = await rows(sql`
    SELECT ${PUBLISHER_SQL} AS kind, ${PUBLISHER_ID_SQL} AS pid, SUM(t.c) AS c FROM (
      SELECT listing_id AS lid, COUNT(*) AS c FROM analytics_events
      WHERE event = 'wa_click' AND listing_id IS NOT NULL AND ${rawWhere(w)}
      GROUP BY listing_id
      ${
        dw
          ? sql`UNION ALL
      SELECT CAST(value AS UNSIGNED) AS lid, SUM(count) AS c FROM analytics_daily
      WHERE event = 'wa_click' AND dim = 'listing' AND ${dw}
      GROUP BY value`
          : sql``
      }
    ) t JOIN listings l ON l.id = t.lid
    GROUP BY kind, pid
  `);
  for (const r of listingTaps) get(String(r.kind) as PublisherKind, n(r.pid)).listingTaps += n(r.c);

  // Profile taps: /inmobiliaria/<slug> and /agente/<slug> paths.
  const profileTaps = await rows(sql`
    SELECT t.path, SUM(t.c) AS c FROM (
      SELECT path, COUNT(*) AS c FROM analytics_events
      WHERE event = 'wa_click' AND (path LIKE '/inmobiliaria/%' OR path LIKE '/agente/%') AND ${rawWhere(w)}
      GROUP BY path
      ${
        dw
          ? sql`UNION ALL
      SELECT value AS path, SUM(count) AS c FROM analytics_daily
      WHERE event = 'wa_click' AND dim = 'path' AND (value LIKE '/inmobiliaria/%' OR value LIKE '/agente/%') AND ${dw}
      GROUP BY value`
          : sql``
      }
    ) t GROUP BY t.path
  `);
  const agencySlugs = new Map<string, number>();
  const agentSlugs = new Map<string, number>();
  for (const r of profileTaps) {
    const path = String(r.path);
    const m = /^\/(inmobiliaria|agente)\/([^/?#]+)$/.exec(path);
    if (!m) continue;
    const bucket = m[1] === "inmobiliaria" ? agencySlugs : agentSlugs;
    bucket.set(m[2], (bucket.get(m[2]) ?? 0) + n(r.c));
  }
  if (agencySlugs.size > 0) {
    for (const r of await rows(sql`SELECT id, slug FROM agencies WHERE slug IN (${sql.join(
      [...agencySlugs.keys()].map((s) => sql`${s}`),
      sql`, `,
    )})`))
      get("agency", n(r.id)).profileTaps += agencySlugs.get(String(r.slug)) ?? 0;
  }
  if (agentSlugs.size > 0) {
    // An agent inside an agency is grouped under the agency, like their listings.
    for (const r of await rows(sql`SELECT id, slug, agency_id FROM agents WHERE slug IN (${sql.join(
      [...agentSlugs.keys()].map((s) => sql`${s}`),
      sql`, `,
    )})`)) {
      const taps = agentSlugs.get(String(r.slug)) ?? 0;
      if (r.agency_id != null) get("agency", n(r.agency_id)).profileTaps += taps;
      else get("agent", n(r.id)).profileTaps += taps;
    }
  }

  // Leads saved through the WhatsApp gate, by the listing's publisher.
  const channelPath = `$.${LEAD_CHANNEL_UTM_KEY}`;
  for (const r of await rows(sql`
    SELECT ${PUBLISHER_SQL} AS kind, ${PUBLISHER_ID_SQL} AS pid, COUNT(*) AS c
    FROM leads ld JOIN listings l ON l.id = ld.listing_id
    WHERE JSON_VALUE(ld.utm, ${channelPath}) = 'whatsapp'
      AND ld.created_at >= ${`${w.from} 00:00:00`} AND ld.created_at < ${`${dayMinus(w.to, -1)} 00:00:00`}
      ${w.vertical ? sql`AND ld.vertical = ${w.vertical}` : sql``}
    GROUP BY kind, pid
  `))
    get(String(r.kind) as PublisherKind, n(r.pid)).waLeads += n(r.c);

  const ranked = [...out.values()]
    .sort((a, b) => b.listingTaps + b.profileTaps + b.waLeads * 5 - (a.listingTaps + a.profileTaps + a.waLeads * 5))
    .slice(0, limit);

  // Names, one query per kind present.
  const ids = (k: PublisherKind) => ranked.filter((r) => r.kind === k && r.id > 0).map((r) => r.id);
  const names = new Map<string, string>();
  const lookups: Array<[PublisherKind, string]> = [
    ["agency", "agencies"],
    ["agent", "agents"],
    ["owner", "users"],
  ];
  // `table` is one of the three literals above, never a request value.
  for (const [kind, table] of lookups) {
    const list = ids(kind);
    if (list.length === 0) continue;
    for (const r of await rows(sql`SELECT id, name FROM ${sql.raw(table)} WHERE id IN (${sql.join(
      list.map((x) => sql`${x}`),
      sql`, `,
    )})`))
      names.set(`${kind}:${n(r.id)}`, String(r.name ?? ""));
  }
  for (const r of ranked) r.name = names.get(`${r.kind}:${r.id}`) ?? (r.id > 0 ? `#${r.id}` : "—");
  return ranked;
}
