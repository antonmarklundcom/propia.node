"use server";

/**
 * /mis-avisos/cuenta — the private owner's own login. Same `updateOwnAccount()`
 * as /agencia/perfil and /admin/cuenta: current password required for any
 * credential change, every session revoked on a new password, and a fresh one
 * issued for this browser. One password-change path, not one per panel.
 */
import { redirect } from "next/navigation";
import { requireOwnerContext } from "@/lib/auth/guards";
import { createSession } from "@/lib/auth/session";
import { updateOwnAccount } from "@/lib/profile-queries";

function finish(msg: string): never {
  redirect(`/mis-avisos/cuenta?msg=${msg}`);
}

export async function updateOwnerAccountAction(formData: FormData): Promise<void> {
  const { user } = await requireOwnerContext();

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
