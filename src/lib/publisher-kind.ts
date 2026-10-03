/**
 * Who published a listing, as /admin reads it: the operator's own stock, a
 * partner's, another agency's, an independent agent's, a private owner's, or
 * nobody's (an import with no agency).
 *
 * One SQL expression, so the badge on a row, the chip counts and the filter can
 * never disagree — the same rule the lead classification follows
 * (src/lib/contact-kind.ts). The rule, first match wins:
 *
 * - `own`      the agency picked as "Mi inmobiliaria" in /admin/ajustes, or a
 *              listing with no agency published by an admin/staff account;
 * - `partner`  an agency on the partner plan ("Socio", /admin/inmobiliarias), or
 *              an independent agent marked "Socio" in /admin/agentes (site
 *              setting `partner_agent_ids`). Verification alone is not enough:
 *              a verified agent is trusted, not necessarily a partner;
 * - `agency`   any other agency (or an agency/developer account with none);
 * - `agent`    an independent agent who is not a partner;
 * - `private`  a private owner who published through /publicar (FSBO);
 * - `none`     no agency, agent or owner at all.
 *
 * A query that selects or filters by it must left-join `agencies` on
 * `listings.agency_id` and the two aliases below — see `listAllListings()`.
 */
import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { agencies, agents, listings, users } from "@/db/schema";

export const PUBLISHER_KINDS = ["own", "partner", "agency", "agent", "private", "none"] as const;
export type PublisherKind = (typeof PUBLISHER_KINDS)[number];

export function isPublisherKind(v: unknown): v is PublisherKind {
  return typeof v === "string" && (PUBLISHER_KINDS as readonly string[]).includes(v);
}

/** The listing's agent (`listings.agent_id`). */
export const publisherAgent = alias(agents, "publisher_agent");
/** The account that created the listing (`listings.owner_user_id`). */
export const publisherOwner = alias(users, "publisher_owner");

export function publisherKindSql(settings: {
  houseAgencyId: number | null;
  partnerAgentIds?: readonly number[];
}): SQL<PublisherKind> {
  const { houseAgencyId } = settings;
  // Validated integers spelled raw, not bound: the expression is SELECTed and
  // GROUPed BY, and ONLY_FULL_GROUP_BY cannot see two placeholders as one.
  const partnerIds = (settings.partnerAgentIds ?? []).filter((id) => Number.isSafeInteger(id) && id > 0);
  const partnerAgent = partnerIds.length
    ? sql` OR (${listings.agencyId} IS NULL AND ${listings.agentId} IN (${sql.raw(partnerIds.map(String).join(", "))}))`
    : sql``;
  const house =
    houseAgencyId && Number.isSafeInteger(houseAgencyId) && houseAgencyId > 0
      ? sql`${listings.agencyId} = ${sql.raw(String(houseAgencyId))} OR `
      : sql``;
  return sql<PublisherKind>`CASE
    WHEN ${house}(${listings.agencyId} IS NULL AND ${publisherOwner.role} IN ('admin', 'staff')) THEN 'own'
    WHEN ${agencies.plan} = 'partner'${partnerAgent} THEN 'partner'
    WHEN ${listings.agencyId} IS NOT NULL OR ${publisherOwner.role} IN ('agency_admin', 'developer') THEN 'agency'
    WHEN ${listings.agentId} IS NOT NULL OR ${publisherOwner.role} = 'agent' THEN 'agent'
    WHEN ${listings.ownerUserId} IS NOT NULL THEN 'private'
    ELSE 'none'
  END`;
}

/** Read a selected `publisherKindSql()` value back defensively. */
export function toPublisherKind(v: unknown): PublisherKind {
  return isPublisherKind(v) ? v : "none";
}
