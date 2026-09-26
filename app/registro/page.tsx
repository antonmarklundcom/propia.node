import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { dict } from "@/i18n/server";
import { brandName } from "@/lib/brand-server";
import { getSessionUser } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/guards";
import { MIN_PASSWORD_LENGTH } from "@/lib/registration";
import { getUsableInvite } from "@/lib/agency-invites";
import { registerAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await brandName();
  const t = (await dict()).publicAuth;
  return {
    title: t.registerMetaTitle,
    description: t.registerDescription(brand),
    // Renders per ?invite= token — keep every variant out of the index (F40).
    robots: { index: false, follow: true },
  };
}

// Session state is per-request; never statically cache the sign-up page.
export const dynamic = "force-dynamic";


export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    kind?: string;
    invite?: string;
    next?: string;
    name?: string;
    email?: string;
    agencyName?: string;
    whatsapp?: string;
  }>;
}) {
  const d = await dict();
  const t = d.publicAuth;
  const a2 = d.a2;
  const ERRORS: Record<string, string> = {
  name: t.registerErrorName,
  email: t.registerErrorEmail,
  email_taken: t.registerErrorEmailTaken,
  whatsapp_taken: t.registerErrorWhatsappTaken,
  password: t.registerErrorPassword,
  agency_name: t.registerErrorAgencyName,
  invite: t.registerErrorInvite,
  throttled: t.registerErrorThrottled,
  generic: t.registerErrorGeneric,
};

  const { error, kind, invite, next, name, email, agencyName, whatsapp } = await searchParams;

  // Already signed in → straight to the right home, unless they arrived with an
  // invitation: an existing account should be able to *join* that agency rather
  // than be told to create a second login (see /agencia/invite/[token]).
  const user = await getSessionUser();
  if (user) {
    if (invite) redirect(`/agencia/invite/${encodeURIComponent(invite)}`);
    redirect(homeForRole(user));
  }

  // Resolve the invitation before rendering, so the visitor sees *which*
  // inmobiliaria they are joining before they type anything — and so a guessed
  // or expired token simply falls back to the ordinary sign-up form.
  const invitation = invite ? await getUsableInvite(invite) : null;
  const inviteFailed = Boolean(invite) && invitation == null;

  // Keep the chosen account type across a failed submit, so an agency that
  // mistyped its email doesn't come back as an independent agent.
  const isInvite =
    invitation != null && kind !== "agency" && kind !== "independent" && kind !== "owner";
  // Someone sent here from /publicar is almost always a private owner.
  const isOwner =
    !isInvite && (kind === "owner" || (!kind && Boolean(next?.startsWith("/publicar"))));
  const isAgency = !isInvite && !isOwner && kind !== "independent";

  return (
    <main className="site-main">
      <div className="auth-wrap">
        <div className="auth-card">
          <h1 className="auth-card__title">{t.registerTitle}</h1>
          <p className="auth-card__subtitle">{t.registerSubtitle}</p>

          {error ? (
            <p className="auth-error">{ERRORS[error] ?? ERRORS.generic}</p>
          ) : null}

          {inviteFailed ? (
            <p className="auth-error">{t.registerErrorInvite}</p>
          ) : null}

          {invitation ? (
            <p className="auth-note">
              {t.registerInviteNote(
                invitation.agencyName,
                invitation.role === "agency_admin"
                  ? t.teamRoleAdmin
                  : t.teamRoleAgent,
              )}
            </p>
          ) : null}

          <form action={registerAction}>
            {next ? <input type="hidden" name="next" value={next} /> : null}
            {/* The token carries the agency and the role. The form asks for
                neither — same rule as the missing `role` field. */}
            {invitation ? (
              <input type="hidden" name="invite" value={invitation.token} />
            ) : null}

            <fieldset className="auth-choice">
              <legend className="auth-field__label">
                {t.registerKindLabel}
              </legend>
              {invitation ? (
                <label className="auth-choice__option">
                  <input
                    type="radio"
                    name="kind"
                    value="invite"
                    defaultChecked={isInvite}
                  />
                  <span>{t.registerKindInvite(invitation.agencyName)}</span>
                </label>
              ) : null}
              <label className="auth-choice__option">
                <input
                  type="radio"
                  name="kind"
                  value="agency"
                  defaultChecked={isAgency}
                />
                <span>{t.registerKindAgency}</span>
              </label>
              <label className="auth-choice__option">
                <input
                  type="radio"
                  name="kind"
                  value="independent"
                  defaultChecked={!isAgency && !isInvite && !isOwner}
                />
                <span>{t.registerKindIndependent}</span>
              </label>
              <label className="auth-choice__option">
                <input
                  type="radio"
                  name="kind"
                  value="owner"
                  defaultChecked={isOwner}
                />
                <span>{a2.registerKindOwner}</span>
              </label>
            </fieldset>

            {/* Always present: an independent agent simply leaves it empty, and
                the server ignores it for that account type. */}
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="agencyName">
                {t.registerAgencyNameLabel}
              </label>
              <input
                className="auth-field__input"
                id="agencyName"
                name="agencyName"
                defaultValue={agencyName}
                type="text"
                maxLength={160}
                autoComplete="organization"
              />
              <p className="auth-field__hint">{a2.registerOwnerNote}</p>
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="name">
                {t.registerYourNameLabel}
              </label>
              <input
                className="auth-field__input"
                id="name"
                name="name"
                defaultValue={name}
                type="text"
                maxLength={140}
                autoComplete="name"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="email">
                {t.emailLabel}
              </label>
              <input
                className="auth-field__input"
                id="email"
                name="email"
                defaultValue={email}
                type="email"
                maxLength={190}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="whatsapp">
                {t.registerWhatsappLabel}
              </label>
              <input
                className="auth-field__input"
                aria-invalid={error === "whatsapp_taken"}
                aria-describedby={error === "whatsapp_taken" ? "whatsapp-error" : undefined}
                id="whatsapp"
                name="whatsapp"
                defaultValue={whatsapp}
                type="tel"
                inputMode="tel"
                placeholder={t.phonePlaceholder}
                maxLength={30}
                autoComplete="tel"
              />
              {error === "whatsapp_taken" && (
                <p id="whatsapp-error" className="auth-error">{t.registerErrorWhatsappTaken}</p>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="password">
                {t.registerPasswordLabel}
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
              <p className="auth-field__hint">{t.registerPasswordHint}</p>
            </div>

            <button className="auth-submit" type="submit">
              {t.registerSubmit}
            </button>
          </form>

          <p className="auth-note">{t.registerPendingNote}</p>
          <p className="auth-alt">
            <Link href="/login">{t.registerToLogin}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
