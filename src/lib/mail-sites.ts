/**
 * The mail-site registry — **the only module on `mail_sites`, `mailboxes` and
 * `mailbox_members`** (same rule as `inbox.ts` for `email_messages`).
 *
 * What it answers, and where the rules live:
 *
 * - *Which mailboxes may this user read, and reply from?* — `memberMailboxes()`
 *   (active sites only). `inbox-viewer.ts` folds the answer into the
 *   `InboxViewer` that `inbox.ts`'s queries take; **that** is where visibility
 *   is enforced, so a forged thread key outside the user's mailboxes matches no
 *   row. Nothing here widens what staff or the super-admin see.
 * - *May a reply go out AS `<mailbox>@<domain>`?* — `sitesSending()` feeds the
 *   pure `mayBeSentAsMailbox()`; only a site the founder marked
 *   `sending_enabled` (Email Sending onboarded in Cloudflare) sends as itself.
 * - *What is arriving that nobody owns?* — `unassignedAddresses()`: mail to a
 *   registered domain whose local part has no mailbox. Super-admin only.
 *
 * Writes are for the super-admin's /admin/correo (the actions re-check the
 * guard). Never throws on a duplicate: a result says what happened.
 */
import "server-only";
import { and, asc, count, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { emailMessages, mailboxMembers, mailboxes, mailSites, users } from "@/db/schema";
import {
  cleanDisplayName,
  mailboxAddress,
  normalizeDomain,
  normalizeLocalPart,
  splitMailbox,
  type SiteSending,
} from "@/lib/mail-address";
import { normalizeAddress } from "@/lib/inbox-address";

function isDuplicateKey(e: unknown): boolean {
  for (let cur: unknown = e, depth = 0; cur && depth < 4; depth++) {
    const err = cur as { code?: string; errno?: number; cause?: unknown };
    if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) return true;
    cur = err.cause;
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export interface MailMemberRow {
  id: number;
  userId: number;
  name: string | null;
  email: string | null;
  canReply: boolean;
}
export interface MailboxRow {
  id: number;
  localPart: string;
  label: string | null;
  address: string;
  members: MailMemberRow[];
}
export interface MailSiteRow {
  id: number;
  domain: string;
  displayName: string;
  sendingEnabled: boolean;
  active: boolean;
  mailboxes: MailboxRow[];
}

/** Every site with its mailboxes and their members, for /admin/correo. Small tables: three reads, joined here. */
export async function listMailSites(): Promise<MailSiteRow[]> {
  const [sites, boxes, members] = await Promise.all([
    db.select().from(mailSites).orderBy(asc(mailSites.domain)),
    db.select().from(mailboxes).orderBy(asc(mailboxes.localPart)),
    db
      .select({
        id: mailboxMembers.id,
        mailboxId: mailboxMembers.mailboxId,
        userId: mailboxMembers.userId,
        canReply: mailboxMembers.canReply,
        name: users.name,
        email: users.email,
      })
      .from(mailboxMembers)
      .leftJoin(users, eq(users.id, mailboxMembers.userId))
      .orderBy(asc(mailboxMembers.id)),
  ]);
  const membersByBox = new Map<number, MailMemberRow[]>();
  for (const m of members) {
    const list = membersByBox.get(m.mailboxId) ?? [];
    list.push({ id: m.id, userId: m.userId, name: m.name, email: m.email, canReply: m.canReply });
    membersByBox.set(m.mailboxId, list);
  }
  return sites.map((s) => ({
    id: s.id,
    domain: s.domain,
    displayName: s.displayName,
    sendingEnabled: s.sendingEnabled,
    active: s.active,
    mailboxes: boxes
      .filter((b) => b.siteId === s.id)
      .map((b) => ({
        id: b.id,
        localPart: b.localPart,
        label: b.label,
        address: mailboxAddress(b.localPart, s.domain),
        members: membersByBox.get(b.id) ?? [],
      })),
  }));
}

/** What the sending decisions need to know about every site. */
export async function sitesSending(): Promise<SiteSending[]> {
  const rows = await db
    .select({
      domain: mailSites.domain,
      displayName: mailSites.displayName,
      sendingEnabled: mailSites.sendingEnabled,
      active: mailSites.active,
    })
    .from(mailSites);
  return rows;
}

export interface MemberMailbox {
  address: string;
  canReply: boolean;
}

/** The mailboxes this user is a member of, on active sites only. */
export async function memberMailboxes(userId: number): Promise<MemberMailbox[]> {
  if (!Number.isInteger(userId) || userId <= 0) return [];
  const rows = await db
    .select({ localPart: mailboxes.localPart, domain: mailSites.domain, canReply: mailboxMembers.canReply })
    .from(mailboxMembers)
    .innerJoin(mailboxes, eq(mailboxes.id, mailboxMembers.mailboxId))
    .innerJoin(mailSites, and(eq(mailSites.id, mailboxes.siteId), eq(mailSites.active, true)))
    .where(eq(mailboxMembers.userId, userId));
  return rows.map((r) => ({ address: mailboxAddress(r.localPart, r.domain), canReply: r.canReply }));
}

export interface UnassignedAddress {
  address: string;
  count: number;
}

/**
 * Inbound mail addressed to a registered domain at a local part that has no
 * mailbox — someone mistyped, or a mailbox nobody has created yet. Newest
 * first, capped; the operator turns a real one into a mailbox.
 */
export async function unassignedAddresses(limit = 30): Promise<UnassignedAddress[]> {
  const [sites, boxes] = await Promise.all([
    db.select({ id: mailSites.id, domain: mailSites.domain }).from(mailSites),
    db.select({ siteId: mailboxes.siteId, localPart: mailboxes.localPart }).from(mailboxes),
  ]);
  if (sites.length === 0) return [];
  const known = new Set(
    boxes.map((b) => mailboxAddress(b.localPart, sites.find((s) => s.id === b.siteId)?.domain ?? "")),
  );
  const domains = new Set(sites.map((s) => s.domain));
  const rows = await db
    .select({ mailbox: emailMessages.mailbox, n: count() })
    .from(emailMessages)
    .where(and(eq(emailMessages.direction, "in"), isNull(emailMessages.leadId)))
    .groupBy(emailMessages.mailbox)
    .orderBy(sql`max(${emailMessages.id}) desc`)
    .limit(500);
  const out: UnassignedAddress[] = [];
  for (const r of rows) {
    const parts = splitMailbox(r.mailbox);
    if (!parts || !domains.has(parts.domain) || known.has(r.mailbox)) continue;
    out.push({ address: r.mailbox, count: Number(r.n) });
    if (out.length >= limit) break;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Writes (super-admin, from /admin/correo)                                    */
/* -------------------------------------------------------------------------- */

export type WriteResult<E extends string = never> = { ok: true; id?: number } | { ok: false; error: E | "not_found" };

export async function createMailSite(p: {
  domain: unknown;
  displayName: unknown;
}): Promise<WriteResult<"invalid_domain" | "invalid_name" | "exists">> {
  const domain = normalizeDomain(p.domain);
  if (!domain) return { ok: false, error: "invalid_domain" };
  const displayName = cleanDisplayName(p.displayName);
  if (!displayName) return { ok: false, error: "invalid_name" };
  try {
    const [res] = await db.insert(mailSites).values({ domain, displayName });
    return { ok: true, id: Number(res.insertId) };
  } catch (e) {
    if (isDuplicateKey(e)) return { ok: false, error: "exists" };
    throw e;
  }
}

export async function updateMailSite(
  id: number,
  patch: { sendingEnabled?: boolean; active?: boolean; displayName?: unknown },
): Promise<WriteResult<"invalid_name">> {
  const set: { sendingEnabled?: boolean; active?: boolean; displayName?: string } = {};
  if (patch.sendingEnabled !== undefined) set.sendingEnabled = patch.sendingEnabled;
  if (patch.active !== undefined) set.active = patch.active;
  if (patch.displayName !== undefined) {
    const name = cleanDisplayName(patch.displayName);
    if (!name) return { ok: false, error: "invalid_name" };
    set.displayName = name;
  }
  if (Object.keys(set).length === 0) return { ok: true };
  const [res] = await db.update(mailSites).set(set).where(eq(mailSites.id, id));
  return res.affectedRows > 0 ? { ok: true } : { ok: false, error: "not_found" };
}

/** A site with mailboxes is not deleted: remove them first (their members go with them). */
export async function deleteMailSite(id: number): Promise<WriteResult<"has_mailboxes">> {
  const [{ n }] = await db.select({ n: count() }).from(mailboxes).where(eq(mailboxes.siteId, id));
  if (Number(n) > 0) return { ok: false, error: "has_mailboxes" };
  const [res] = await db.delete(mailSites).where(eq(mailSites.id, id));
  return res.affectedRows > 0 ? { ok: true } : { ok: false, error: "not_found" };
}

export async function createMailbox(p: {
  siteId: number;
  localPart: unknown;
  label?: unknown;
}): Promise<WriteResult<"invalid_local" | "exists">> {
  const localPart = normalizeLocalPart(p.localPart);
  if (!localPart) return { ok: false, error: "invalid_local" };
  const [site] = await db.select({ id: mailSites.id }).from(mailSites).where(eq(mailSites.id, p.siteId)).limit(1);
  if (!site) return { ok: false, error: "not_found" };
  const label = typeof p.label === "string" ? p.label.replace(/\s+/g, " ").trim().slice(0, 120) || null : null;
  try {
    const [res] = await db.insert(mailboxes).values({ siteId: p.siteId, localPart, label });
    return { ok: true, id: Number(res.insertId) };
  } catch (e) {
    if (isDuplicateKey(e)) return { ok: false, error: "exists" };
    throw e;
  }
}

/** Removes the mailbox and its memberships. Stored messages stay: they are the sender's mail, not ours to delete. */
export async function deleteMailbox(id: number): Promise<WriteResult> {
  await db.delete(mailboxMembers).where(eq(mailboxMembers.mailboxId, id));
  const [res] = await db.delete(mailboxes).where(eq(mailboxes.id, id));
  return res.affectedRows > 0 ? { ok: true } : { ok: false, error: "not_found" };
}

/** Adds an existing user (by email) to a mailbox. An unknown email is refused, never an account created. */
export async function addMailboxMember(p: {
  mailboxId: number;
  email: unknown;
  canReply: boolean;
}): Promise<WriteResult<"invalid_email" | "no_user" | "exists">> {
  const email = normalizeAddress(typeof p.email === "string" ? p.email : "");
  if (!email) return { ok: false, error: "invalid_email" };
  const [box] = await db.select({ id: mailboxes.id }).from(mailboxes).where(eq(mailboxes.id, p.mailboxId)).limit(1);
  if (!box) return { ok: false, error: "not_found" };
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) return { ok: false, error: "no_user" };
  try {
    const [res] = await db.insert(mailboxMembers).values({ mailboxId: p.mailboxId, userId: user.id, canReply: p.canReply });
    return { ok: true, id: Number(res.insertId) };
  } catch (e) {
    if (isDuplicateKey(e)) return { ok: false, error: "exists" };
    throw e;
  }
}

export async function removeMailboxMember(id: number): Promise<WriteResult> {
  const [res] = await db.delete(mailboxMembers).where(eq(mailboxMembers.id, id));
  return res.affectedRows > 0 ? { ok: true } : { ok: false, error: "not_found" };
}
