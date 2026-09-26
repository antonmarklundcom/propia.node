"use server";

/**
 * /admin/cuenta — the operator's own login. Staff and the super-admin land on
 * /admin and are redirected away from /agencia, so before this page existed
 * neither could change their own password. Same `updateOwnAccount()` as
 * /agencia/perfil: current password required for any credential change, every
 * session revoked on a new password, and a fresh one issued for this browser.
 */
import { redirect } from "next/navigation";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { createSession } from "@/lib/auth/session";
import { updateOwnAccount } from "@/lib/profile-queries";

function finish(msg: string): never {
  redirect(`/admin/cuenta?msg=${msg}`);
}

export async function updateAdminAccountAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();

  const result = await updateOwnAccount(user.id, {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
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
  if (result.passwordChanged) {
    await createSession(user.id);
    finish("password");
  }
  finish("account_saved");
}
