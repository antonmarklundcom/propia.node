import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { esPanel } from "@/i18n/es";
import { getSessionUser } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/guards";
import { MIN_PASSWORD_LENGTH } from "@/lib/registration";
import { registerAction } from "./actions";

export const metadata: Metadata = {
  title: "Creá tu cuenta — Homes Paraguay",
  description:
    "Publicá tus propiedades en Homes Paraguay. Cuentas gratuitas para inmobiliarias y agentes independientes en Paraguay.",
};

// Session state is per-request; never statically cache the sign-up page.
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  name: esPanel.registerErrorName,
  email: esPanel.registerErrorEmail,
  email_taken: esPanel.registerErrorEmailTaken,
  password: esPanel.registerErrorPassword,
  agency_name: esPanel.registerErrorAgencyName,
  generic: esPanel.registerErrorGeneric,
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; kind?: string }>;
}) {
  const { error, kind } = await searchParams;

  // Already signed in → straight to the right home.
  const user = await getSessionUser();
  if (user) redirect(homeForRole(user));

  // Keep the chosen account type across a failed submit, so an agency that
  // mistyped its email doesn't come back as an independent agent.
  const isAgency = kind !== "independent";

  return (
    <main className="site-main">
      <div className="auth-wrap">
        <div className="auth-card">
          <h1 className="auth-card__title">{esPanel.registerTitle}</h1>
          <p className="auth-card__subtitle">{esPanel.registerSubtitle}</p>

          {error ? (
            <p className="auth-error">{ERRORS[error] ?? ERRORS.generic}</p>
          ) : null}

          <form action={registerAction}>
            <fieldset className="auth-choice">
              <legend className="auth-field__label">
                {esPanel.registerKindLabel}
              </legend>
              <label className="auth-choice__option">
                <input
                  type="radio"
                  name="kind"
                  value="agency"
                  defaultChecked={isAgency}
                />
                <span>{esPanel.registerKindAgency}</span>
              </label>
              <label className="auth-choice__option">
                <input
                  type="radio"
                  name="kind"
                  value="independent"
                  defaultChecked={!isAgency}
                />
                <span>{esPanel.registerKindIndependent}</span>
              </label>
            </fieldset>

            {/* Always present: an independent agent simply leaves it empty, and
                the server ignores it for that account type. */}
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="agencyName">
                {esPanel.registerAgencyNameLabel}
              </label>
              <input
                className="auth-field__input"
                id="agencyName"
                name="agencyName"
                type="text"
                maxLength={160}
                autoComplete="organization"
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="name">
                {esPanel.registerYourNameLabel}
              </label>
              <input
                className="auth-field__input"
                id="name"
                name="name"
                type="text"
                maxLength={140}
                autoComplete="name"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="email">
                {esPanel.emailLabel}
              </label>
              <input
                className="auth-field__input"
                id="email"
                name="email"
                type="email"
                maxLength={190}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="whatsapp">
                {esPanel.registerWhatsappLabel}
              </label>
              <input
                className="auth-field__input"
                id="whatsapp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                placeholder="0981 123 456"
                maxLength={30}
                autoComplete="tel"
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="password">
                {esPanel.registerPasswordLabel}
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
              <p className="auth-field__hint">{esPanel.registerPasswordHint}</p>
            </div>

            <button className="auth-submit" type="submit">
              {esPanel.registerSubmit}
            </button>
          </form>

          <p className="auth-note">{esPanel.registerPendingNote}</p>
          <p className="auth-alt">
            <Link href="/login">{esPanel.registerToLogin}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
