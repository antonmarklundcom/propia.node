"use server";

/**
 * Auth server actions (login / logout). These run in the Node runtime and are
 * the trust boundary — the form only supplies credentials; lookup, password
 * verification and session issue all happen here.
 */
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/guards";
import {
  clearLoginAttempts,
  isLoginLocked,
  recordLoginFailure,
} from "@/lib/auth/rate-limit";

/** Only same-origin relative paths are honored as post-login targets. */
function safeNext(next: string): string | null {
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  const bounce = (error: "1" | "locked" = "1") =>
    redirect(`/login?error=${error}${next ? `&next=${encodeURIComponent(next)}` : ""}`);

  if (!email || !password) bounce();

  // Checked before touching the DB or scrypt: an attacker retrying the same
  // email doesn't get to burn a verify cycle once locked. Failures are
  // recorded identically below whether or not the account exists, so a
  // lockout response never discloses which emails are real.
  if (isLoginLocked(email)) bounce("locked");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    recordLoginFailure(email);
    bounce();
  }

  clearLoginAttempts(email);
  await createSession(user.id);
  redirect(
    next ??
      homeForRole({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }),
  );
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
