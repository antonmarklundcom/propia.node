import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dict } from "@/i18n/server";
import { brandName } from "@/lib/brand-server";
import { getSessionUser } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/guards";
import { loginAction } from "@/lib/auth/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await dict()).publicAuth;
  return { title: t.loginMetaTitle, robots: { index: false, follow: false } };
}

// Session state is per-request; never statically cache the login page.
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const t = (await dict()).publicAuth;
  
  const { error, next } = await searchParams;

  // Already signed in → straight to the right home.
  const user = await getSessionUser();
  if (user) redirect(homeForRole(user));

  return (
    <main className="site-main">
      <div className="auth-wrap">
        <div className="auth-card">
          <h1 className="auth-card__title">{t.loginTitle}</h1>
          <p className="auth-card__subtitle">{t.loginSubtitle}</p>

          {error === "locked" ? (
            <p className="auth-error">{t.loginLocked}</p>
          ) : error ? (
            <p className="auth-error">{t.loginError}</p>
          ) : null}

          <form action={loginAction}>
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="email">
                {t.emailLabel}
              </label>
              <input
                className="auth-field__input"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="password">
                {t.passwordLabel}
              </label>
              <input
                className="auth-field__input"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button className="auth-submit" type="submit">
              {t.loginSubmit}
            </button>
          </form>

          <p className="auth-alt">
            <Link href={next ? `/registro?next=${encodeURIComponent(next)}` : "/registro"}>{t.loginToRegister}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
