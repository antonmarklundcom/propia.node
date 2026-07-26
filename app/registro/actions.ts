"use server";

/**
 * Sign-up action. The form supplies claims; everything that decides what the
 * account *is* — role, verification state, the agency link — is decided here
 * and in lib/registration.ts. A hidden field asking for `role` would be the
 * obvious hole, so no such field exists.
 *
 * On success the new user is logged straight in: making someone sign up and
 * then hunt for the login form is friction with no security value.
 */
import { redirect } from "next/navigation";
import { createSession, getSessionUser } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/guards";
import {
  registerAccount,
  type AccountKind,
  type RegistrationError,
} from "@/lib/registration";

function bounce(error: RegistrationError | "generic", kind: string): never {
  redirect(`/registro?error=${error}&kind=${encodeURIComponent(kind)}`);
}

export async function registerAction(formData: FormData): Promise<void> {
  // An already-signed-in visitor has no business creating a second account
  // from a stale tab.
  const current = await getSessionUser();
  if (current) redirect(homeForRole(current));

  const rawKind = String(formData.get("kind") ?? "");
  const kind: AccountKind = rawKind === "agency" ? "agency" : "independent";

  const result = await registerAccount({
    kind,
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? "") || null,
    agencyName: String(formData.get("agencyName") ?? "") || null,
  });

  if (!result.ok) bounce(result.error, kind);

  await createSession(result.userId);
  redirect("/agencia?msg=welcome");
}
