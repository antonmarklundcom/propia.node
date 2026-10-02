import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { dict } from "@/i18n/server";
import {
  isPasswordResetEnabled,
  parseResetToken,
  resetSecret,
  verifyResetToken,
} from "@/lib/auth/reset-token";
import { MIN_PASSWORD_LENGTH } from "@/lib/registration";
import { resetPasswordAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await dict()).authReset;
  return {
    title: t.reset.metaTitle,
    robots: { index: false, follow: false },
    // The token is in this page's URL: never hand it to another origin in a
    // Referer (the site-wide policy would still send the origin).
    referrer: "no-referrer",
  };
}

export const dynamic = "force-dynamic";

/** Is the link still good right now? Checked again, from scratch, on submit. */
async function linkIsLive(token: string): Promise<boolean> {
  const secret = resetSecret();
  const parsed = parseResetToken(token);
  if (!secret || !parsed) return false;
  const [user] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, parsed.userId))
    .limit(1);
  return Boolean(user && verifyResetToken(token, user, { secret }).ok);
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const t = (await dict()).authReset;
  const r = t.reset;
  const [{ token }, { error }] = await Promise.all([params, searchParams]);
  const enabled = isPasswordResetEnabled();
  const live = enabled && (await linkIsLive(token));

  return (
    <main className="site-main">
      <div className="auth-wrap">
        <div className="auth-card">
          {!enabled ? (
            <>
              <h1 className="auth-card__title">{t.request.title}</h1>
              <p className="auth-note">{t.request.unavailable}</p>
            </>
          ) : !live ? (
            <>
              <h1 className="auth-card__title">{r.invalidTitle}</h1>
              <p className="auth-card__subtitle">{r.invalidBody}</p>
              <p className="auth-alt">
                <Link href="/recuperar">{r.requestNew}</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="auth-card__title">{r.title}</h1>
              <p className="auth-card__subtitle">{r.subtitle}</p>
              {error === "password" ? (
                <p className="auth-error">{r.errorPassword(MIN_PASSWORD_LENGTH)}</p>
              ) : error === "mismatch" ? (
                <p className="auth-error">{r.errorMismatch}</p>
              ) : error === "throttled" ? (
                <p className="auth-error">{r.errorThrottled}</p>
              ) : null}
              <form action={resetPasswordAction}>
                <input type="hidden" name="token" value={token} />
                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="password">
                    {r.passwordLabel}
                  </label>
                  <input
                    className="auth-field__input"
                    id="password"
                    name="password"
                    type="password"
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    required
                  />
                  <p className="auth-field__hint">{r.passwordHint(MIN_PASSWORD_LENGTH)}</p>
                </div>
                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="confirm">
                    {r.confirmLabel}
                  </label>
                  <input
                    className="auth-field__input"
                    id="confirm"
                    name="confirm"
                    type="password"
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <button className="auth-submit" type="submit">
                  {r.submit}
                </button>
              </form>
            </>
          )}

          <p className="auth-alt">
            <Link href="/login">{t.request.backToLogin}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
