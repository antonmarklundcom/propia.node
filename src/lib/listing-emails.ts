/**
 * Emails about a listing itself (as opposed to `lead-emails.ts`, which is about
 * an enquiry). Same contract: copy from the recipient's dictionary, then
 * `sendEmail()`, which is a silent no-op without Cloudflare and never throws.
 * The caller knows the brand and the panel link; this module names no domain.
 */
import "server-only";
import { getDictionary, type Locale } from "@/i18n";
import { renderEmail, sendEmail, type EmailResult } from "@/lib/email";

/** "Your featured placement ends in N days" — a go-look at the panel, nothing more. */
export async function emailFeaturedEnding(p: {
  to: string;
  locale: Locale;
  brand: string;
  listingTitle: string;
  daysLeft: number;
  /** Absolute URL of the recipient's panel (`/mis-avisos` or `/agencia`). */
  url: string;
}): Promise<EmailResult> {
  const t = getDictionary(p.locale).email;
  const { html, text } = renderEmail({
    heading: t.featuredHeading,
    paragraphs: [t.featuredBody(p.listingTitle, p.daysLeft), t.featuredAdvice],
    cta: { label: t.featuredCta, url: p.url },
    footer: t.footerAutomatic(p.brand),
  });
  return sendEmail({
    to: p.to,
    subject: t.featuredSubject(p.brand, p.listingTitle),
    html,
    text,
    fromName: p.brand,
  });
}
