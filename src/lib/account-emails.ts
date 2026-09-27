/**
 * Account emails: the password-reset link and a new partner's welcome.
 *
 * Same contract as `lead-emails.ts`: copy from the recipient's dictionary
 * (`authReset`), `sendEmail()` underneath — a silent no-op without Cloudflare
 * Email Sending, never throws — and callers run these inside `after()`.
 * Brand and links come from the caller, who read them off the request; this
 * module never names a domain.
 *
 * Neither message repeats anything the visitor typed. The address was typed
 * by whoever filled in the form, not proven to belong to them, so the only
 * content is ours: a stranger's name or agency name never lands in somebody
 * else's inbox under our brand.
 */
import "server-only";
import { getDictionary, type Locale } from "@/i18n";
import { renderEmail, sendEmail, type EmailResult } from "@/lib/email";
import { RESET_TOKEN_TTL_SECONDS } from "@/lib/auth/reset-token";

export async function emailPasswordReset(p: {
  to: string;
  locale: Locale;
  brand: string;
  /** Absolute `/recuperar/<token>` URL on one of our own doors. */
  url: string;
}): Promise<EmailResult> {
  const t = getDictionary(p.locale);
  const minutes = Math.round(RESET_TOKEN_TTL_SECONDS / 60);
  const { html, text } = renderEmail({
    heading: t.authReset.email.heading,
    paragraphs: [t.authReset.email.body(minutes), t.authReset.email.notYou],
    cta: { label: t.authReset.email.cta, url: p.url },
    footer: t.email.footerAutomatic(p.brand),
  });
  return sendEmail({
    to: p.to,
    subject: t.authReset.email.subject(p.brand),
    html,
    text,
    fromName: p.brand,
  });
}

export async function emailPartnerWelcome(p: {
  to: string;
  locale: Locale;
  brand: string;
  /** Absolute `/agencia` URL. */
  url: string;
}): Promise<EmailResult> {
  const t = getDictionary(p.locale);
  const w = t.authReset.welcome;
  const { html, text } = renderEmail({
    heading: w.heading,
    paragraphs: [w.body, w.verify, w.notYou],
    cta: { label: w.cta, url: p.url },
    footer: t.email.footerAutomatic(p.brand),
  });
  return sendEmail({ to: p.to, subject: w.subject(p.brand), html, text, fromName: p.brand });
}
