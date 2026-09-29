/**
 * Mail-site and mailbox addresses — pure (no `next/*`, no database), so
 * `npm run verify:inbox` drives it and `mail-sites.ts` shares it with the
 * admin forms.
 *
 * A mailbox is `<local part>@<site domain>`, both lower-case. The inbox already
 * stores the recipient in full in `email_messages.mailbox`, so this string is
 * the join key between a message and the registry — no column on that table.
 */

const LABEL = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
const DOMAIN_RE = new RegExp(`^${LABEL}(?:\\.${LABEL})+$`);
const LOCAL_RE = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/;

/** A bare, lower-case domain, or null. Accepts a pasted `https://x.com/` or `@x.com`; never a path, port or IP. */
export function normalizeDomain(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, "").replace(/^@/, "").replace(/\/.*$/, "").replace(/\.$/, "");
  if (s.length < 4 || s.length > 190) return null;
  if (!DOMAIN_RE.test(s)) return null;
  // A bare IPv4 passes the label rule; a mailbox on an IP is never what anyone meant.
  if (/^\d+(\.\d+){3}$/.test(s)) return null;
  return s;
}

/**
 * A mailbox's local part, or null. Lower-case letters, digits and `. _ + -`,
 * starting and ending with a letter or digit, no `..`, at most 64. `lead-…`
 * is refused: those are the signed lead reply addresses, and a mailbox that
 * looked like one would confuse both.
 */
export function normalizeLocalPart(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase().replace(/@.*$/, "");
  if (!LOCAL_RE.test(s) || s.includes("..") || s.startsWith("lead-")) return null;
  return s;
}

export function mailboxAddress(localPart: string, domain: string): string {
  return `${localPart}@${domain}`;
}

/** `hola@hospital.com.py` → its two halves, only when both are well-formed. */
export function splitMailbox(address: unknown): { localPart: string; domain: string } | null {
  if (typeof address !== "string") return null;
  const a = address.trim().toLowerCase();
  const at = a.lastIndexOf("@");
  if (at < 1) return null;
  const localPart = normalizeLocalPart(a.slice(0, at));
  const domain = normalizeDomain(a.slice(at + 1));
  return localPart && domain ? { localPart, domain } : null;
}

/** The name mail from a site is sent under: one clean line, never empty. */
export function cleanDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.replace(/[\r\n\t<>"]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  return s.length >= 2 ? s : null;
}

/** A registered site, as far as sending decisions need to know it. */
export interface SiteSending {
  domain: string;
  displayName: string;
  sendingEnabled: boolean;
  active: boolean;
}

/**
 * Whether a reply from `mailbox` may go out AS that address: its domain is a
 * registered, active site whose Email Sending onboarding the founder has
 * confirmed. Everything else falls back to `EMAIL_FROM` with the mailbox as
 * Reply-To (`senderFor()`), which is correct, just less pretty.
 */
export function mayBeSentAsMailbox(sites: readonly SiteSending[], mailbox: string): boolean {
  const parts = splitMailbox(mailbox);
  if (!parts) return false;
  const site = sites.find((s) => s.domain === parts.domain);
  return !!site && site.active && site.sendingEnabled;
}

/** The display name a registered, active site sends under, or null. */
export function displayNameFor(sites: readonly SiteSending[], mailbox: string): string | null {
  const parts = splitMailbox(mailbox);
  const site = parts ? sites.find((s) => s.domain === parts.domain && s.active) : undefined;
  return site ? site.displayName : null;
}
