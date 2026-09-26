/**
 * The lead-related emails of wave E1: the FSBO owner's "new enquiry", the
 * seeker's confirmation, and the partner's "a lead was shared with you".
 *
 * Each builds its copy from the `email` namespace of the recipient's
 * dictionary and hands it to `sendEmail()`, which is a silent no-op when
 * email is not configured and never throws. Callers run these inside
 * `after()`: the lead or the share is already in MySQL.
 *
 * Brand and links are passed in by the caller, who knows the request (the
 * lead's own door, or `BRAND_NAME` on a staff surface) — this module never
 * names a domain.
 */
import "server-only";
import { getDictionary, type Locale } from "@/i18n";
import { renderEmail, sendEmail, type EmailResult } from "@/lib/email";

export async function emailOwnerNewLead(p: {
  to: string;
  locale: Locale;
  brand: string;
  listingTitle: string | null;
  name: string | null;
  whatsapp: string;
  /** Absolute URL of the owner's inbox (`/mis-avisos/consultas`). */
  url: string;
}): Promise<EmailResult> {
  const t = getDictionary(p.locale).email;
  const { html, text } = renderEmail({
    heading: t.ownerHeading,
    paragraphs: [t.ownerIntro(p.listingTitle), t.ownerContact(p.name, p.whatsapp), t.ownerAdvice],
    cta: { label: t.ownerCta, url: p.url },
    footer: t.footerAutomatic(p.brand),
  });
  return sendEmail({ to: p.to, subject: t.ownerSubject(p.listingTitle), html, text, fromName: p.brand });
}

/**
 * The seeker's confirmation. Deliberately repeats nothing the visitor typed
 * (see `esEmail`): the address is unverified, so the only content is ours.
 */
export async function emailSeekerConfirmation(p: {
  to: string;
  locale: Locale;
  brand: string;
  listingTitle: string | null;
  /** Absolute canonical URL of the listing, when the enquiry had one. */
  listingUrl: string | null;
}): Promise<EmailResult> {
  const t = getDictionary(p.locale).email;
  const { html, text } = renderEmail({
    heading: t.seekerHeading,
    paragraphs: [t.seekerBody(p.listingTitle), t.seekerNotYou],
    cta: p.listingUrl ? { label: t.seekerCta, url: p.listingUrl } : undefined,
    footer: t.footerAutomatic(p.brand),
  });
  return sendEmail({ to: p.to, subject: t.seekerSubject(p.brand), html, text, fromName: p.brand });
}

/**
 * "A lead was shared with you" — a go-look, not the lead. No name, phone or
 * message in the email: the partner reads those in `/agencia/leads`, behind
 * their login, where a revoke still hides them (the privacy wording for
 * sharing is an open founder decision, docs/decisions-needed.md).
 */
export async function emailShareNotice(p: {
  to: string;
  locale: Locale;
  brand: string;
  count: number;
  /** Absolute URL of `/agencia/leads`. */
  url: string;
}): Promise<EmailResult> {
  const t = getDictionary(p.locale).email;
  const { html, text } = renderEmail({
    heading: t.shareHeading,
    paragraphs: [t.shareBody(p.count)],
    cta: { label: t.shareCta, url: p.url },
    footer: t.footerAutomatic(p.brand),
  });
  return sendEmail({ to: p.to, subject: t.shareSubject(p.brand, p.count), html, text, fromName: p.brand });
}
