/**
 * The portal's own contact identity — the ONE place the support email and
 * WhatsApp number live (audit F10: the email used to be a literal in 8
 * user-facing files, including JSON-LD and the privacy policy).
 *
 * Both values come from env so each deploy/market can set its own without a
 * code change. NEXT_PUBLIC_ prefix because client components (Newsletter
 * signup) also read them — Next inlines these at build time.
 *
 * [FOUNDER] The fallback email is on propia.com.py, a domain that is NOT
 * owned — mail to it dead-ends. Set NEXT_PUBLIC_CONTACT_EMAIL to a real
 * mailbox in the Hostinger env; until then every contact path is dead, which
 * is a business problem this module can only centralise, not fix.
 */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hola@propia.com.py";

/** Portal WhatsApp as typed (display form). Null = don't render WA CTAs. */
export const CONTACT_WHATSAPP =
  process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || null;
