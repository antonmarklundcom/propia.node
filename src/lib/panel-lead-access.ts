/**
 * Which leads an /agencia caller reads: the agency's whole inbox, or only
 * their own (plan-admin-next, "Mis consultas / Todo el equipo").
 *
 * - **agent inside an agency** — only their own, always: leads on listings
 *   assigned to them (`listings.agent_id`) and shares addressed to their own
 *   `agents` row. Not a display choice: their own is all they may read.
 * - **agency_admin** — the whole agency, with a toggle. "Todo el equipo" is
 *   the default and what they may read; "Mis consultas" narrows the page and
 *   its CSV to what is assigned to them personally (their listings, shares to
 *   their agents row). Leads nobody is assigned to — agency listings with no
 *   agent, shares to the agency itself — are in "Todo el equipo" only.
 * - **independent agent** (no agency) — unchanged: the owner scope is already
 *   theirs alone.
 *
 * One resolver for every caller — the page, the CSV export, the thread and
 * WhatsApp access checks (`panelCanSeeLead()`), and the share / note / deal
 * writes — so what a member can read and what they can answer never differ.
 * Access checks ask for the widest view the role allows (`"team"`); only the
 * page and its export pass the toggle.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agents } from "@/db/schema";
import type { PanelViewer } from "@/lib/lead-assignments";

export type AgencyLeadView = "mine" | "team";
export const AGENCY_LEAD_VIEW_COOKIE = "agencia_leads_vista";

/** The URL / cookie spelling of the toggle; anything else is the default. */
export function parseAgencyLeadView(param: string | undefined, cookie: string | undefined): AgencyLeadView {
  const v = param ?? cookie;
  return v === "mias" ? "mine" : "team";
}

export function agencyLeadViewParam(view: AgencyLeadView): "mias" | "equipo" {
  return view === "mine" ? "mias" : "equipo";
}

export interface PanelLeadAccess {
  /** The share viewer: `onlyAgentId` set when the caller reads only their own. */
  viewer: PanelViewer;
  /** `getPanelLeads()`'s `onlyAgentId`: null = every lead in the scope. */
  onlyAgentId: number | null;
  /** True for an agency_admin of a real agency: the page shows the toggle. */
  canChooseView: boolean;
  /** The view in force (always "mine" for an agent). */
  view: AgencyLeadView;
}

/** No `agents` row can have this id: a restriction that matches nothing. */
const NO_AGENT = -1;

export async function panelLeadAccess(
  ctx: { agencyId: number | null; user: { id: number; role: string } },
  requested: AgencyLeadView = "team",
): Promise<PanelLeadAccess> {
  const base: PanelViewer = { agencyId: ctx.agencyId, userId: ctx.user.id };
  if (ctx.agencyId == null) {
    return { viewer: base, onlyAgentId: null, canChooseView: false, view: "team" };
  }
  const canChooseView = ctx.user.role === "agency_admin";
  const view: AgencyLeadView = canChooseView ? requested : "mine";
  if (view === "team") {
    return { viewer: base, onlyAgentId: null, canChooseView, view };
  }
  // Their own `agents` row (idx_user), the same lookup requireAgencyContext()
  // made to find the agency. A member with none reads nothing of their own.
  const [row] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.userId, ctx.user.id))
    .limit(1);
  const own = row?.id ?? NO_AGENT;
  return { viewer: { ...base, onlyAgentId: own }, onlyAgentId: own, canChooseView, view };
}
