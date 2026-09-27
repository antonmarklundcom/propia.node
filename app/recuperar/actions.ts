"use server";

/**
 * Password reset — the two server actions behind /recuperar and
 * /recuperar/<token>. The link itself is a stateless signed token
 * (`src/lib/auth/reset-token.ts`): no table, no migration, single use because
 * it signs over the account's current password hash.
 *
 * Server actions carry Next's own CSRF defence (POST only, Origin checked
 * against the host), and neither action trusts anything but the token and the
 * typed password: which account, and whether the link is still good, is
 * decided from the database row the token names.
 */
import { after } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { clearLoginAttempts } from "@/lib/auth/rate-limit";
import {
  isPasswordResetEnabled,
  mintResetToken,
  parseResetToken,
  resetSecret,
  verifyResetToken,
} from "@/lib/auth/reset-token";
import { emailPasswordReset } from "@/lib/account-emails";
import { recordAdminEvent } from "@/lib/admin-events";
import { brandName } from "@/lib/brand-server";
import { clientIpFrom } from "@/lib/client-ip";
import { isPlausibleEmail } from "@/lib/email";
import { emailLinkOrigin } from "@/lib/origin";
import { allowRequest } from "@/lib/rate-limit";
import { MIN_PASSWORD_LENGTH } from "@/lib/registration";
import { currentLocale } from "@/i18n/server";

/**
 * Asking for a link: per connection, and per address. The per-address count
 * is taken whether or not an account exists, so hitting it says nothing about
 * the address — it only stops one mailbox being flooded, and caps how many
 * live links a single account can have in flight. Same fixed-window helper as
 * /registro and /api/leads (per process, per `rate-limit.ts`).
 */
const REQUEST_IP_MAX = 5;
const REQUEST_IP_WINDOW_MS = 15 * 60_000;
const REQUEST_EMAIL_MAX = 5;
const REQUEST_EMAIL_WINDOW_MS = 60 * 60_000;

/** Setting the password runs scrypt: bound it like sign-up bounds its own. */
const SET_IP_MAX = 10;
const SET_IP_WINDOW_MS = 15 * 60_000;

export async function requestResetAction(formData: FormData): Promise<void> {
  const secret = resetSecret();
  if (!secret || !isPasswordResetEnabled()) redirect("/recuperar");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isPlausibleEmail(email)) redirect("/recuperar?error=email");

  const h = await headers();
  const ip = clientIpFrom(h);
  if (
    !allowRequest(`pwreset|ip|${ip}`, REQUEST_IP_MAX, REQUEST_IP_WINDOW_MS) ||
    !allowRequest(`pwreset|email|${email}`, REQUEST_EMAIL_MAX, REQUEST_EMAIL_WINDOW_MS)
  ) {
    redirect("/recuperar?error=throttled");
  }

  // The lookup runs for every address, and the send happens after the
  // response, so a real account and a made-up one answer in the same time
  // with the same page. Nothing below branches the response on `user`.
  const [user] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Read inside the request: after() runs once the headers are gone. The
  // origin is only ever one of our own doors — never whatever Host the
  // requester sent — since the requester may not be the account's owner.
  const [origin, brand, locale] = await Promise.all([
    emailLinkOrigin(),
    brandName(),
    currentLocale(),
  ]);

  if (user?.email) {
    const to = user.email;
    const url = `${origin}/recuperar/${mintResetToken({
      userId: user.id,
      passwordHash: user.passwordHash,
      secret,
    })}`;
    after(async () => {
      // sendEmail never throws and logs only a reason, never the link.
      await emailPasswordReset({ to, locale, brand, url });
    });
  }

  redirect("/recuperar?enviado=1");
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const secret = resetSecret();
  if (!secret || !isPasswordResetEnabled()) redirect("/recuperar");

  const token = String(formData.get("token") ?? "");
  const parsed = parseResetToken(token);
  if (!parsed) redirect("/recuperar?error=link");
  // `token` is now known to be base64url characters only, so it is safe to
  // put back into a same-site path: no `/`, `\`, `?`, `#` or scheme.
  const back = (error: "password" | "mismatch" | "throttled"): never =>
    redirect(`/recuperar/${token}?error=${error}`);

  const ip = clientIpFrom(await headers());
  if (!allowRequest(`pwreset|set|${ip}`, SET_IP_MAX, SET_IP_WINDOW_MS)) back("throttled");

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) back("password");
  if (password !== confirm) back("mismatch");

  const [user] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, parsed.userId))
    .limit(1);
  if (!user || !verifyResetToken(token, user, { secret }).ok) {
    redirect("/recuperar?error=link");
  }

  const passwordHash = await hashPassword(password);
  // Conditional on the hash the link was checked against, so two tabs racing
  // the same link cannot both win: the second finds the hash already moved
  // and changes nothing. Every session goes in the same transaction — a reset
  // is what someone does when they think a session might not be theirs.
  const changed = await db.transaction(async (tx) => {
    const [res] = await tx
      .update(users)
      .set({ passwordHash })
      .where(
        and(
          eq(users.id, user.id),
          user.passwordHash === null
            ? isNull(users.passwordHash)
            : eq(users.passwordHash, user.passwordHash),
        ),
      );
    if (res.affectedRows !== 1) return false;
    await tx.delete(sessions).where(eq(sessions.userId, user.id));
    return true;
  });
  if (!changed) redirect("/recuperar?error=link");

  // A lockout earned before the reset would otherwise refuse the new password
  // from this same connection for up to fifteen minutes.
  if (user.email) clearLoginAttempts(user.email, ip);
  await recordAdminEvent(user.id, "user.password", "user", user.id, { via: "reset" });

  // Back to /login rather than a fresh session: the person signs in with the
  // password they just chose (and their password manager gets to save it).
  redirect("/login?reset=1");
}
