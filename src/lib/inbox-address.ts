/**
 * Addresses of the inbox (plan-build-2026-09-26 §6, waves E2 + E3) — pure: no
 * `next/*`, no database, so `npm run verify:inbox` imports it unchanged.
 *
 * Three addresses matter, and all of them are derived from `EMAIL_FROM`
 * rather than configured one by one, so they cannot disagree:
 *
 * - **the machine subdomain** — `EMAIL_FROM`'s domain (`mail.inmobiliaria.com.py`).
 *   Email Sending is verified for it; Email Routing's catch-all there sends
 *   `lead-…@` to the Worker.
 * - **a lead's reply address** — `lead-<id>-<sig>@<machine subdomain>`, the
 *   Reply-To of every email to a buyer about that lead. `sig` is an HMAC of
 *   the id under `INBOUND_EMAIL_SECRET`, so nobody can write into lead 123's
 *   thread by guessing `lead-123@`: a bad or missing signature is not an
 *   error, the message just lands in the general inbox, unthreaded.
 * - **the root mailboxes** — hola@ / anton@ on the root domain
 *   (`inmobiliaria.com.py`), which Email Routing owns. Replies from
 *   /admin/inbox are sent *as* them only when `EMAIL_ROOT_SENDING=true`
 *   (the founder has onboarded the root domain in Email Sending); otherwise
 *   they go from `EMAIL_FROM` with the mailbox as Reply-To.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_FROM_DOMAIN = "mail.inmobiliaria.com.py";

/** `EMAIL_FROM`'s domain, lower-cased. `EMAIL_REPLY_DOMAIN` overrides it for the lead addresses only. */
export function machineDomain(): string {
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  const m = /@([^\s<>@]+?)>?\s*$/.exec(from);
  return (m?.[1] ?? DEFAULT_FROM_DOMAIN).toLowerCase();
}

/** Where `lead-…@` addresses live. Defaults to the machine subdomain. */
export function leadReplyDomain(): string {
  return (process.env.EMAIL_REPLY_DOMAIN?.trim() || machineDomain()).toLowerCase();
}

/** The root domain the mailboxes live on: the machine subdomain minus its first label. */
export function rootDomain(): string {
  const d = machineDomain();
  const parts = d.split(".");
  // `mail.inmobiliaria.com.py` → `inmobiliaria.com.py`. A two-label domain is
  // already a root; never strip down to a bare TLD.
  return parts.length > 2 ? parts.slice(1).join(".") : d;
}

/**
 * The mailboxes staff may read in /admin/inbox. Everything else (anton@) is
 * the founder's own and only the super-admin sees it. Local parts, lower-case.
 */
export const SHARED_MAILBOXES = ["hola", "contacto"] as const;

/** The mailbox /admin/inbox composes from by default. */
export function defaultMailbox(): string {
  return `${SHARED_MAILBOXES[0]}@${rootDomain()}`;
}

export function inboundSecret(): string | null {
  const s = process.env.INBOUND_EMAIL_SECRET?.trim();
  // A short secret is a configuration mistake, not a secret.
  return s && s.length >= 16 ? s : null;
}

/**
 * Whether inbound mail is wired at all. Until it is, no email may carry a
 * `lead-…@` Reply-To: a reply to it would bounce, since nothing receives it.
 * The founder sets the secret in hPanel only after the Worker and the Email
 * Routing rules are live (PR body, step order).
 */
export function isInboundConfigured(): boolean {
  return inboundSecret() !== null;
}

function leadSig(leadId: number, secret: string): string {
  return createHmac("sha256", secret).update(`lead:${leadId}`).digest("hex").slice(0, 10);
}

/** `lead-<id>-<sig>@<domain>`, or null when inbound mail is not configured. */
export function leadReplyAddress(leadId: number, secret = inboundSecret()): string | null {
  if (!secret || !Number.isInteger(leadId) || leadId <= 0) return null;
  return `lead-${leadId}-${leadSig(leadId, secret)}@${leadReplyDomain()}`;
}

/**
 * The lead id a recipient address names, only when its signature verifies.
 * Any case, `+tag`s ignored; anything else is null.
 */
export function parseLeadAddress(address: string, secret = inboundSecret()): number | null {
  if (!secret) return null;
  const m = /^lead-(\d{1,12})-([0-9a-f]{10})(?:\+[^@]*)?@(.+)$/i.exec(address.trim());
  if (!m || m[3].toLowerCase() !== leadReplyDomain()) return null;
  const id = Number(m[1]);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const want = Buffer.from(leadSig(id, secret));
  const got = Buffer.from(m[2].toLowerCase());
  return want.length === got.length && timingSafeEqual(want, got) ? id : null;
}

/** Lower-cased bare address, or "" when it is not one. */
export function normalizeAddress(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  const m = /<([^<>]+)>\s*$/.exec(s);
  const a = (m ? m[1] : s).trim().toLowerCase();
  return /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(a) && a.length <= 254 ? a : "";
}

/** The local part of a root-domain mailbox (`hola`), or null when the address is not one. */
export function rootMailboxLocal(address: string): string | null {
  const a = normalizeAddress(address);
  const at = a.lastIndexOf("@");
  if (at < 1 || a.slice(at + 1) !== rootDomain()) return null;
  return a.slice(0, at);
}

/* -------------------------------------------------------------------------- */
/* The Worker → app signature                                                  */
/* -------------------------------------------------------------------------- */

/** How far a signed timestamp may be from this server's clock, either way. */
export const SIGNATURE_MAX_SKEW_S = 5 * 60;

/**
 * hex(HMAC-SHA256(secret, `${timestamp}.${body}`)). The Worker computes the
 * same thing with WebCrypto (workers/inbound-email/src/index.ts); the
 * timestamp is inside the MAC so a captured request cannot be replayed later
 * with a fresh one.
 */
export function signInbound(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export type SignatureCheck = "ok" | "missing" | "stale" | "bad";

export function verifyInbound(p: {
  secret: string;
  timestamp: string | null;
  signature: string | null;
  body: string;
  nowS?: number;
}): SignatureCheck {
  if (!p.timestamp || !p.signature) return "missing";
  if (!/^\d{9,12}$/.test(p.timestamp)) return "bad";
  const now = p.nowS ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(p.timestamp)) > SIGNATURE_MAX_SKEW_S) return "stale";
  const want = Buffer.from(signInbound(p.secret, p.timestamp, p.body), "hex");
  const sig = p.signature.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(sig)) return "bad";
  const got = Buffer.from(sig, "hex");
  return want.length === got.length && timingSafeEqual(want, got) ? "ok" : "bad";
}

/* -------------------------------------------------------------------------- */
/* Threading helpers                                                           */
/* -------------------------------------------------------------------------- */

/** Every `<…>` Message-ID in an In-Reply-To / References value, in order. */
export function messageIdsIn(header: string | null | undefined): string[] {
  return [...(header ?? "").matchAll(/<[^<>\s]{1,500}>/g)].map((m) => m[0]);
}

/** A subject without its Re:/Fwd:/RV: prefixes, lower-cased — the weak thread match. */
export function normalizeSubject(subject: string): string {
  let s = subject.trim();
  for (;;) {
    const next = s.replace(/^\s*(re|fw|fwd|rv|res|enc|aw|tr)\s*(\[\d+\])?\s*:\s*/i, "");
    if (next === s) break;
    s = next;
  }
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** `Re: <subject>` unless it already is one. */
export function replySubject(subject: string): string {
  const s = subject.trim();
  return /^\s*re\s*:/i.test(s) ? s : `Re: ${s}`.trim();
}

/**
 * A WhatsApp number written in an email, to prefill "Convertir en consulta".
 * Only a suggestion the operator confirms — never stored unseen.
 */
export function guessWhatsapp(text: string | null | undefined): string {
  const m = /(?:\+?595[\s.-]?|\b0)9\d{1,2}[\s.-]?\d{3}[\s.-]?\d{3}\b/.exec(text ?? "");
  return m ? m[0].replace(/[\s.-]/g, "") : "";
}
