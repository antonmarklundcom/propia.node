import type { Metadata } from "next";
import Link from "next/link";
import { dict } from "@/i18n/server";
import { isPasswordResetEnabled, RESET_TOKEN_TTL_SECONDS } from "@/lib/auth/reset-token";
import { requestResetAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await dict()).authReset;
  // Out of the index and the sitemap, and disallowed in robots.txt, like /login.
  return { title: t.request.metaTitle, robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

/**
 * Ask for a reset link. The answer after submitting is the same whether or not
 * the address has an account (`?enviado=1`), so this page cannot be used to
 * find out who is registered.
 */
export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; error?: string }>;
}) {
  const t = (await dict()).authReset;
  const r = t.request;
  const { enviado, error } = await searchParams;
  const enabled = isPasswordResetEnabled();

  return (
    <main className="site-main">
      <div className="auth-wrap">
        <div className="auth-card">
          <h1 className="auth-card__title">{r.title}</h1>

          {!enabled ? (
            <p className="auth-note">{r.unavailable}</p>
          ) : enviado ? (
            <p className="panel-flash" role="status">
              {r.sent(Math.round(RESET_TOKEN_TTL_SECONDS / 60))}
            </p>
          ) : (
            <>
              <p className="auth-card__subtitle">{r.subtitle}</p>
              {error === "link" ? (
                <p className="auth-error">{t.reset.invalidBody}</p>
              ) : error === "throttled" ? (
                <p className="auth-error">{r.errorThrottled}</p>
              ) : error === "email" ? (
                <p className="auth-error">{r.errorEmail}</p>
              ) : null}
              <form action={requestResetAction}>
                <div className="auth-field">
                  <label className="auth-field__label" htmlFor="email">
                    {r.emailLabel}
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
                <button className="auth-submit" type="submit">
                  {r.submit}
                </button>
              </form>
            </>
          )}

          <p className="auth-alt">
            <Link href="/login">{r.backToLogin}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
