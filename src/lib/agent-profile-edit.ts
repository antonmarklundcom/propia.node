/**
 * Editing a public agent profile from /agencia/perfil (plan-build A4,
 * Realtor 6): name, WhatsApp, photo, and the D3 directory fields — bio,
 * declared zones, licence number, years active.
 *
 * **An authorisation boundary, not a form helper.** Who may edit which
 * `agents` row is one predicate, `agentEditWhere()`, and every read and write
 * in this module is built on it — the same rule `listingScopeWhere` follows
 * for listings:
 *
 * - anyone with an agency-panel login edits the row linked to their own user;
 * - an `agency_admin` *with an agency* also edits the rows of that agency's
 *   agents (colleagues who never set up their profile, imported profiles with
 *   no login yet);
 * - nobody else's, ever. The agent id comes from the form, so a forged id must
 *   match no row rather than another agency's agent.
 *
 * The editor is always the session-resolved `AgencyContext`, never a value
 * read from the request. `npm run verify:scopes` exercises both halves.
 *
 * Slugs are never rewritten (profile-queries.ts, same reason: inbound links).
 */
import "server-only";
import { and, asc, eq, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { agents, locations } from "@/db/schema";
import type { UserRole } from "@/lib/auth/roles";
import { safeImageUrl } from "@/lib/external-image";
import { normalizeZones } from "@/lib/directory-queries";

/** Who is editing — the session-resolved agency context, reduced. */
export interface AgentEditor {
  userId: number;
  role: UserRole;
  agencyId: number | null;
}

export const BIO_MAX = 1500;
export const LICENSE_MAX = 60;
export const ZONES_MAX = 12;
export const YEARS_MAX = 70;

export interface EditableAgentProfile {
  id: number;
  userId: number | null;
  agencyId: number | null;
  name: string;
  slug: string;
  photoUrl: string | null;
  whatsapp: string | null;
  isVerified: boolean;
  bio: string | null;
  licenseNo: string | null;
  yearsActive: number | null;
  zones: string[];
}

/**
 * The one ownership predicate. An agency admin without an agency (an
 * independent registered as a company, later unlinked) gets the own-row half
 * only — `agency_id = NULL` would otherwise never match, but spelling it out
 * keeps the rule readable rather than accidental.
 */
export function agentEditWhere(editor: AgentEditor): SQL {
  const own = eq(agents.userId, editor.userId);
  if (editor.role === "agency_admin" && editor.agencyId != null) {
    return or(own, eq(agents.agencyId, editor.agencyId))!;
  }
  return own;
}

const PROFILE_COLUMNS = {
  id: agents.id,
  userId: agents.userId,
  agencyId: agents.agencyId,
  name: agents.name,
  slug: agents.slug,
  photoUrl: agents.photoUrl,
  whatsapp: agents.whatsapp,
  isVerified: agents.isVerified,
  bio: agents.bio,
  licenseNo: agents.licenseNo,
  yearsActive: agents.yearsActive,
  zones: agents.zones,
};

type ProfileRow = {
  [K in keyof typeof PROFILE_COLUMNS]: (typeof agents.$inferSelect)[K];
};

function toProfile(row: ProfileRow): EditableAgentProfile {
  // mysql2 hands a json column back as a raw string on this stack.
  return { ...row, zones: normalizeZones(row.zones) };
}

/** Every agent row this editor may edit — their own first, then by name. */
export async function listEditableAgents(
  editor: AgentEditor,
): Promise<EditableAgentProfile[]> {
  const rows = await db
    .select(PROFILE_COLUMNS)
    .from(agents)
    .where(agentEditWhere(editor))
    .orderBy(asc(agents.name));
  return rows
    .map(toProfile)
    .sort(
      (a, b) =>
        Number(b.userId === editor.userId) - Number(a.userId === editor.userId),
    );
}

/**
 * One row inside the editor's reach, or null. `agentId` null = the editor's
 * own row, which is what a plain /agencia/perfil shows.
 */
export async function getEditableAgent(
  editor: AgentEditor,
  agentId: number | null,
): Promise<EditableAgentProfile | null> {
  const target =
    agentId == null ? eq(agents.userId, editor.userId) : eq(agents.id, agentId);
  const [row] = await db
    .select(PROFILE_COLUMNS)
    .from(agents)
    .where(and(target, agentEditWhere(editor)))
    .limit(1);
  return row ? toProfile(row) : null;
}

/** Ciudad slugs, uncached — scripts reach this, and a stale list is a lie. */
async function validCitySlugs(candidates: string[]): Promise<Set<string>> {
  if (candidates.length === 0) return new Set();
  const rows = await db
    .select({ slug: locations.slug })
    .from(locations)
    .where(and(eq(locations.level, "ciudad"), inArray(locations.slug, candidates)));
  return new Set(rows.map((r) => r.slug));
}

export interface AgentProfileEdit {
  name: string;
  whatsapp: string;
  photoUrl: string;
  bio: string;
  licenseNo: string;
  yearsActive: string;
  zones: string[];
}

export type AgentProfileEditResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "invalid" | "photo" | "years" };

function orNull(value: string, max: number): string | null {
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Save one agent row, scoped by `agentEditWhere()` in the WHERE clause as
 * well as by the lookup before it — a row outside reach is `not_found`, the
 * same answer as a row that does not exist.
 *
 * Zones are city slugs checked against `locations` at ciudad level: an
 * unknown slug is dropped rather than refusing the save, because a city
 * removed from the table must not lock somebody out of fixing their bio.
 */
export async function updateAgentProfile(
  editor: AgentEditor,
  agentId: number,
  input: AgentProfileEdit,
): Promise<AgentProfileEditResult> {
  const current = await getEditableAgent(editor, agentId);
  if (!current) return { ok: false, error: "not_found" };

  const name = input.name.trim().slice(0, 140);
  if (name.length < 2) return { ok: false, error: "invalid" };

  const photo = orNull(input.photoUrl, 500);
  const photoUrl = photo == null ? null : safeImageUrl(photo);
  if (photo != null && photoUrl == null) return { ok: false, error: "photo" };

  const yearsRaw = input.yearsActive.trim();
  let yearsActive: number | null = null;
  if (yearsRaw) {
    const n = Number(yearsRaw);
    if (!Number.isInteger(n) || n < 0 || n > YEARS_MAX) {
      return { ok: false, error: "years" };
    }
    yearsActive = n;
  }

  const wanted = [
    ...new Set(input.zones.map((z) => z.trim()).filter(Boolean)),
  ].slice(0, ZONES_MAX);
  const known = await validCitySlugs(wanted);
  const zones = wanted.filter((z) => known.has(z));

  await db
    .update(agents)
    .set({
      name,
      photoUrl,
      whatsapp: orNull(input.whatsapp, 30),
      bio: orNull(input.bio, BIO_MAX),
      licenseNo: orNull(input.licenseNo, LICENSE_MAX),
      yearsActive,
      zones: zones.length > 0 ? zones : null,
    })
    .where(and(eq(agents.id, agentId), agentEditWhere(editor)));
  return { ok: true };
}
