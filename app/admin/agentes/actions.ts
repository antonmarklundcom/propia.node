"use server";

/**
 * Super-admin: move an agent between inmobiliarias (or out to independent).
 *
 * Same lockout logic as the agency panel, from the other side — moveAgentToAgency()
 * refuses to pull the last agency_admin out of an agency, so no super-admin
 * action can leave an inmobiliaria without a responsable either. The rule lives
 * in team-queries.ts, not here, so both callers get it.
 */
import { revalidatePath } from "next/cache";
import { revalidateListings } from "@/lib/cache";
import { redirect } from "next/navigation";
import { requireStaffOrAbove, requireSuperAdmin } from "@/lib/auth/guards";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { recordAdminEvent } from "@/lib/admin-events";
import {
  formatPartnerAgentIds,
  getPartnerAgentIds,
  parsePartnerAgentIds,
  setSiteSetting,
  SETTING_KEYS,
} from "@/lib/site-settings";
import { moveAgentToAgency, type TeamRole } from "@/lib/team-queries";

const ROUTE = "/admin/agentes";

function done(code: string): never {
  revalidatePath(ROUTE);
  revalidatePath("/admin/inmobiliarias");
  // Listings, not just the directory: an independent moved into an agency
  // takes their own listings with them (moveAgentToAgency), which changes the
  // agency shown on those listings' cards. revalidateListings() drops both tags.
  revalidateListings();
  redirect(`${ROUTE}?msg=${code}`);
}

function toId(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export async function moveAgentAction(formData: FormData): Promise<void> {
  const actor = await requireStaffOrAbove();

  const agentId = toId(formData.get("agentId"));
  if (!agentId) done("invalid");

  const raw = String(formData.get("agencyId") ?? "").trim();
  const agencyId = raw === "" ? null : toId(raw) || null;
  const role: TeamRole =
    String(formData.get("role") ?? "") === "agency_admin"
      ? "agency_admin"
      : "agent";

  const result = await moveAgentToAgency({ agentId, agencyId, role, actorUserId: actor.id });

  done(
    result === "ok"
      ? "agent_moved"
      : result === "last_admin"
        ? "last_admin"
        : result === "protected"
          ? "protected"
          : "invalid",
  );
}

/**
 * "Socio" on an independent agent: adds or removes the agent's id in the
 * `partner_agent_ids` site setting, which makes their listings read as
 * "Socio" in /admin (src/lib/publisher-kind.ts). Display only — no public
 * page and no lead routing changes. Super-admin only, logged in
 * /admin/historial like every other setting.
 */
export async function setAgentPartnerAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const agentId = toId(formData.get("agentId"));
  const on = formData.get("partner") === "1";
  if (!agentId) redirect(`${ROUTE}?msg=invalid`);
  const [row] = await db
    .select({ id: agents.id, agencyId: agents.agencyId })
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);
  // Only an independent agent: an agency's agents follow their agency's plan.
  if (!row || (on && row.agencyId != null)) redirect(`${ROUTE}?msg=invalid`);
  const current = await getPartnerAgentIds({ uncached: true });
  const next = on ? [...current, agentId] : current.filter((id) => id !== agentId);
  const value = formatPartnerAgentIds(next);
  if (value !== formatPartnerAgentIds(current)) {
    await setSiteSetting(SETTING_KEYS.partnerAgentIds, value, user.id);
    await recordAdminEvent(user.id, "setting.change", "setting", 0, {
      key: SETTING_KEYS.partnerAgentIds,
      agentId,
      from: current,
      to: parsePartnerAgentIds(value),
    });
  }
  revalidatePath(ROUTE);
  redirect(`${ROUTE}?msg=${on ? "partner_on" : "partner_off"}#agent-${agentId}`);
}
