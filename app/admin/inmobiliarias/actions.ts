"use server";

/**
 * Super-admin agency creation. Same contract as the other panel actions: the
 * guard runs again here because a forged POST never touches the UI, and the
 * form fields are re-validated rather than trusted.
 *
 * The verify/unverify toggles for this page live in ../actions.ts alongside
 * the review queue; the create form and "Invitar socio" are here.
 */
import { revalidatePath } from "next/cache";
import { revalidateDirectory } from "@/lib/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agencies } from "@/db/schema";
import { requireStaffOrAbove, requireSuperAdmin } from "@/lib/auth/guards";
import { createPanelAgency, type AgencyRow } from "@/lib/panel-queries";
import { createAgencyInvite, revokeAgencyInvite } from "@/lib/agency-invites";
import { recordAdminEvent } from "@/lib/admin-events";

const ROUTE = "/admin/inmobiliarias";

const PLANS: readonly AgencyRow["plan"][] = ["free", "destacado", "partner"];

function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

function toPlan(v: FormDataEntryValue | null): AgencyRow["plan"] {
  const s = str(v);
  return (PLANS as readonly string[]).includes(s)
    ? (s as AgencyRow["plan"])
    : "free";
}

/** Bounce back to the page with a flash code in the query string. */
function done(code: string): never {
  revalidatePath(ROUTE);
  revalidateDirectory();
  redirect(`${ROUTE}?msg=${code}`);
}

export async function createAgencyAction(formData: FormData): Promise<void> {
  await requireStaffOrAbove();

  const name = str(formData.get("name"));
  if (name.length < 2) done("invalid");

  const id = await createPanelAgency({
    name,
    // Both columns are nullable and whatsapp is matched on elsewhere; a blank
    // string would be a fake value, so an empty field stays NULL.
    email: str(formData.get("email")).toLowerCase() || null,
    whatsapp: str(formData.get("whatsapp")) || null,
    plan: toPlan(formData.get("plan")),
  });

  done(id ? "agency_created" : "invalid");
}

function toId(v: FormDataEntryValue | null): number {
  const n = Number(str(v));
  return Number.isInteger(n) && n > 0 ? n : 0;
}

/**
 * "Invitar socio": an `agency_admin` invite for one agency, minted by the
 * super-admin — how a partner gets a login while /registro is off the menus
 * (agency mode). Super-admin only, not staff: the link is a login to that
 * agency's whole panel, and staff are scoped to internal leads. The token
 * still decides the agency and the role at redemption (lib/agency-invites.ts);
 * this action only chooses which agency to mint it for.
 */
export async function invitePartnerAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();

  const agencyId = toId(formData.get("agencyId"));
  if (!agencyId) done("invalid");
  const [agency] = await db
    .select({ id: agencies.id })
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1);
  if (!agency) done("invalid");

  await createAgencyInvite({ agencyId, invitedByUserId: user.id, role: "agency_admin" });
  await recordAdminEvent(user.id, "agency.invite", "agency", agencyId, { role: "agency_admin" });
  done("invite_created");
}

/** Cancel an open partner invite. Scoped on the agency in the UPDATE's WHERE. */
export async function revokePartnerInviteAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();

  const inviteId = toId(formData.get("inviteId"));
  const agencyId = toId(formData.get("agencyId"));
  if (!inviteId || !agencyId) done("invalid");

  const ok = await revokeAgencyInvite({ inviteId, agencyId });
  if (ok) await recordAdminEvent(user.id, "agency.invite_revoke", "agency", agencyId, { inviteId });
  done(ok ? "invite_revoked" : "invalid");
}
