"use server";

/**
 * Profile actions for /agencia/perfil. Each one re-resolves the caller from the
 * session — the agency id is never read from the form, and the agency-record
 * action additionally requires the `agency_admin` role, so an agent inside the
 * agency who forges a POST is refused rather than silently allowed.
 */
import { revalidatePath } from "next/cache";
import { revalidateDirectory } from "@/lib/cache";
import { redirect } from "next/navigation";
import { requireAgencyContext } from "@/lib/auth/guards";
import { createSession } from "@/lib/auth/session";
import {
  updateAgencyProfile,
  updateOwnAccount,
} from "@/lib/profile-queries";
import { updateAgentProfile } from "@/lib/agent-profile-edit";

function finish(msg: string, agentId: number | null = null): never {
  revalidatePath("/agencia/perfil");
  revalidatePath("/agencia");
  revalidateDirectory();
  redirect(
    `/agencia/perfil?${agentId != null ? `agente=${agentId}&` : ""}msg=${msg}`,
  );
}

export async function updateAgencyProfileAction(
  formData: FormData,
): Promise<void> {
  const { user, agencyId } = await requireAgencyContext();
  // Only the company's own admin account may rename or re-contact it.
  if (user.role !== "agency_admin" || agencyId == null) finish("forbidden");

  const ok = await updateAgencyProfile(agencyId, {
    name: String(formData.get("name") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  finish(ok ? "agency_saved" : "invalid");
}

/**
 * Save a public agent profile. The target row is the form's `agentId`, but the
 * editor is the session: `updateAgentProfile()` scopes the write with
 * `agentEditWhere()`, so a forged id outside the caller's reach (another
 * agency's agent, or a colleague's when the caller is not the agency admin)
 * matches nothing and comes back `not_found`.
 */
export async function updateAgentProfileAction(
  formData: FormData,
): Promise<void> {
  const { user, agencyId } = await requireAgencyContext();
  const editor = { userId: user.id, role: user.role, agencyId };

  const agentId = Number(formData.get("agentId"));
  if (!Number.isInteger(agentId) || agentId <= 0) finish("invalid");

  const result = await updateAgentProfile(editor, agentId, {
    name: String(formData.get("name") ?? ""),
    photoUrl: String(formData.get("photoUrl") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    licenseNo: String(formData.get("licenseNo") ?? ""),
    yearsActive: String(formData.get("yearsActive") ?? ""),
    zones: formData.getAll("zones").map((z) => String(z)),
  });

  // Only picks the flash text and where to land — never a permission.
  const own = formData.get("own") === "1";
  const msg = result.ok
    ? own
      ? "saved"
      : "agent_saved"
    : result.error === "photo"
      ? "photo"
      : result.error === "years"
        ? "years"
        : result.error === "not_found"
          ? "agent_not_found"
          : "invalid";
  // A colleague's profile stays open after the save; a not-found one does not.
  const reopen = !own && (result.ok || result.error !== "not_found");
  finish(msg, reopen ? agentId : null);
}

export async function updateAccountAction(formData: FormData): Promise<void> {
  const { user } = await requireAgencyContext();

  const result = await updateOwnAccount(user.id, {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    // Required by updateOwnAccount whenever the email or password moves
    // (audit F21) — a session alone must not be enough to take the account.
    currentPassword: String(formData.get("currentPassword") ?? ""),
  });

  if (!result.ok) {
    finish(
      result.error === "email_taken"
        ? "taken"
        : result.error === "bad_password"
          ? "bad_password"
          : "invalid",
    );
  }

  // The password change revoked every session, this one included — reissue so
  // the person who just changed it isn't bounced to the login screen.
  if (result.passwordChanged) {
    await createSession(user.id);
    finish("password");
  }
  finish("account_saved");
}
