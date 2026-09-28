/**
 * The WhatsApp inbox: every read and write on `whatsapp_messages` /
 * `whatsapp_contacts`. The only module that touches those two tables;
 * `src/lib/whatsapp.ts` is the only Graph API caller, and this module calls it
 * for sends and media.
 *
 * Rules it keeps (the email inbox's, `src/lib/inbox.ts`):
 *
 * - **No new visibility rule for leads.** A message with `lead_id` is shown
 *   under that lead to exactly who may see the lead — callers check
 *   `userMaySeeLead()` first and pass only ids they may see. A message without
 *   one is the business number's chat in /admin/inbox, which staff and the
 *   super-admin read (it is the business's shared number, like hola@).
 * - **Idempotent.** `wa_message_id` is unique: a webhook retry is a duplicate,
 *   not a second row.
 * - **Never pretend.** A send Meta refused is stored with `error` and shown as
 *   not sent; the 24-hour window is checked before a send is attempted.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, isNull, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { leads, whatsappContacts, whatsappMessages } from "@/db/schema";
import { isR2Configured, putPrivateObject } from "@/lib/r2";
import { fetchWhatsAppMedia, sendWhatsAppText, whatsappConfig } from "@/lib/whatsapp";
import {
  normalizeWaPhone,
  statusAdvances,
  waPhoneKey,
  withinWindow,
  WHATSAPP_TEXT_MAX,
  type WaInbound,
  type WaStatus,
} from "@/lib/whatsapp-webhook";

function isDuplicateKey(e: unknown): boolean {
  const err = e as { code?: string; errno?: number; cause?: { code?: string; errno?: number } };
  return err?.code === "ER_DUP_ENTRY" || err?.errno === 1062 || err?.cause?.code === "ER_DUP_ENTRY" || err?.cause?.errno === 1062;
}

/** The last-nine-digits key of `leads.whatsapp`, in SQL — `leadPhoneKey()`'s rule. */
const LEAD_PHONE_KEY_SQL = sql`right(regexp_replace(${leads.whatsapp}, '[^0-9]', ''), 9)`;

/**
 * The newest lead from this number, if any. Not sargable (it scans `leads`),
 * the same trade `countLeadsByPhoneKey()` makes at the portal's volume.
 */
export async function findLeadIdByPhone(phone: string): Promise<number | null> {
  const key = waPhoneKey(phone);
  if (!/^\d{6,9}$/.test(key)) return null;
  const [row] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(LEAD_PHONE_KEY_SQL, key))
    .orderBy(desc(leads.id))
    .limit(1);
  return row?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/* Inbound                                                                     */
/* -------------------------------------------------------------------------- */

export interface StoredWhatsApp {
  status: "stored" | "duplicate";
  id: number;
  contactPhone: string;
  leadId: number | null;
  /** True when this contact had never written before — PR 3's greeting keys on it. */
  firstContact: boolean;
  profileName: string | null;
  body: string | null;
  type: string;
  mediaId: string | null;
}

/**
 * Store one inbound message and bump the contact's window. Returns
 * `duplicate` (with the existing id) on a webhook retry. Throws on a database
 * failure, so the route answers 5xx and Meta retries.
 */
export async function storeInboundWhatsApp(m: WaInbound): Promise<StoredWhatsApp> {
  const [existing] = await db
    .select({ id: whatsappMessages.id, leadId: whatsappMessages.leadId })
    .from(whatsappMessages)
    .where(eq(whatsappMessages.waMessageId, m.waMessageId))
    .limit(1);
  const base = {
    contactPhone: m.from,
    profileName: m.profileName,
    body: m.body,
    type: m.type,
    mediaId: m.mediaId,
  };
  if (existing) return { ...base, status: "duplicate", id: existing.id, leadId: existing.leadId, firstContact: false };

  const [contact] = await db
    .select({ id: whatsappContacts.id })
    .from(whatsappContacts)
    .where(eq(whatsappContacts.phone, m.from))
    .limit(1);
  // Meta's own send time, but never in the future: it decides the 24 h window.
  const at = m.sentAt && m.sentAt.getTime() <= Date.now() ? m.sentAt : new Date();
  if (contact) {
    await db
      .update(whatsappContacts)
      .set({
        // A delayed retry must not move the window backwards.
        lastInboundAt: sql`greatest(coalesce(${whatsappContacts.lastInboundAt}, '1970-01-01'), ${at})`,
        ...(m.profileName ? { name: m.profileName } : {}),
        updatedAt: sql`now()`,
      })
      .where(eq(whatsappContacts.id, contact.id));
  } else {
    try {
      await db.insert(whatsappContacts).values({ phone: m.from, name: m.profileName, lastInboundAt: at, updatedAt: sql`now()` });
    } catch (e) {
      // Two messages from a new number in one burst: the other one created it.
      if (!isDuplicateKey(e)) throw e;
      await db.update(whatsappContacts).set({ lastInboundAt: at }).where(eq(whatsappContacts.phone, m.from));
    }
  }

  const leadId = await findLeadIdByPhone(m.from);
  const ours = m.displayPhone ?? m.phoneNumberId;
  try {
    const [res] = await db.insert(whatsappMessages).values({
      waMessageId: m.waMessageId,
      direction: "in",
      fromPhone: m.from,
      toPhone: ours.slice(0, 20),
      contactPhone: m.from,
      phoneNumberId: m.phoneNumberId,
      leadId,
      body: m.body?.slice(0, 60_000) ?? null,
      type: m.type,
      mediaMime: m.mediaMime,
      mediaFilename: m.mediaFilename?.slice(0, 255) ?? null,
      createdAt: at,
    });
    const id = Number((res as unknown as { insertId: number }).insertId);
    return { ...base, status: "stored", id, leadId, firstContact: !contact };
  } catch (e) {
    if (!isDuplicateKey(e)) throw e;
    const [row] = await db
      .select({ id: whatsappMessages.id, leadId: whatsappMessages.leadId })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.waMessageId, m.waMessageId))
      .limit(1);
    return { ...base, status: "duplicate", id: row?.id ?? 0, leadId: row?.leadId ?? null, firstContact: false };
  }
}

/**
 * Download a stored message's media into the private inbox bucket (same rules
 * as email attachments: random key, never a public URL). Runs in `after()`;
 * a failure leaves the row with its type and caption and no file.
 */
export async function storeWhatsAppMedia(messageId: number, mediaId: string): Promise<boolean> {
  if (!isR2Configured()) return false;
  const file = await fetchWhatsAppMedia(mediaId);
  if (!file) return false;
  const key = `inbox/wa/${randomBytes(16).toString("hex")}`;
  try {
    await putPrivateObject(key, file.bytes, file.mime);
  } catch {
    return false;
  }
  await db
    .update(whatsappMessages)
    .set({ mediaR2Key: key, mediaMime: file.mime.slice(0, 127) })
    .where(eq(whatsappMessages.id, messageId));
  return true;
}

/** A delivery/read/failed callback for one of our sends. Only moves forward. */
export async function applyWhatsAppStatus(s: WaStatus): Promise<void> {
  const [row] = await db
    .select({ id: whatsappMessages.id, status: whatsappMessages.status })
    .from(whatsappMessages)
    .where(and(eq(whatsappMessages.waMessageId, s.waMessageId), eq(whatsappMessages.direction, "out")))
    .limit(1);
  if (!row || !statusAdvances(row.status, s.status)) return;
  await db
    .update(whatsappMessages)
    .set({ status: s.status, ...(s.error ? { error: s.error } : {}) })
    .where(eq(whatsappMessages.id, row.id));
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                     */
/* -------------------------------------------------------------------------- */

export interface WhatsAppMessage {
  id: number;
  direction: "in" | "out";
  contactPhone: string;
  leadId: number | null;
  body: string | null;
  type: string;
  hasMedia: boolean;
  mediaMime: string | null;
  mediaFilename: string | null;
  status: "sent" | "delivered" | "read" | "failed" | null;
  error: string | null;
  sentByUserId: number | null;
  autoKind: string | null;
  readAt: Date | null;
  createdAt: Date;
}

const columns = {
  id: whatsappMessages.id,
  direction: whatsappMessages.direction,
  contactPhone: whatsappMessages.contactPhone,
  leadId: whatsappMessages.leadId,
  body: whatsappMessages.body,
  type: whatsappMessages.type,
  mediaR2Key: whatsappMessages.mediaR2Key,
  mediaMime: whatsappMessages.mediaMime,
  mediaFilename: whatsappMessages.mediaFilename,
  status: whatsappMessages.status,
  error: whatsappMessages.error,
  sentByUserId: whatsappMessages.sentByUserId,
  autoKind: whatsappMessages.autoKind,
  readAt: whatsappMessages.readAt,
  createdAt: whatsappMessages.createdAt,
};

function toMessage(r: { mediaR2Key: string | null } & Omit<WhatsAppMessage, "hasMedia">): WhatsAppMessage {
  const { mediaR2Key, ...rest } = r;
  return { ...rest, hasMedia: !!mediaR2Key };
}

export interface WhatsAppContact {
  phone: string;
  name: string | null;
  lastInboundAt: Date | null;
}

export async function getWhatsAppContact(phone: string): Promise<WhatsAppContact | null> {
  const [row] = await db
    .select({ phone: whatsappContacts.phone, name: whatsappContacts.name, lastInboundAt: whatsappContacts.lastInboundAt })
    .from(whatsappContacts)
    .where(eq(whatsappContacts.phone, phone))
    .limit(1);
  return row ?? null;
}

/** Contacts by phone, for a page of lead cards — one query, not one per card. */
export async function getWhatsAppContacts(phones: string[]): Promise<Map<string, WhatsAppContact>> {
  const wanted = [...new Set(phones.filter((p) => /^\d{8,15}$/.test(p)))];
  if (wanted.length === 0) return new Map();
  const rows = await db
    .select({ phone: whatsappContacts.phone, name: whatsappContacts.name, lastInboundAt: whatsappContacts.lastInboundAt })
    .from(whatsappContacts)
    .where(inArray(whatsappContacts.phone, wanted));
  return new Map(rows.map((r) => [r.phone, r]));
}

export interface WhatsAppThreadSummary {
  phone: string;
  name: string | null;
  count: number;
  unread: number;
  last: { body: string | null; type: string; direction: "in" | "out"; createdAt: Date };
}

/** The business number's chats not attached to a lead, newest first. */
export async function listWhatsAppChats(limit = 100): Promise<WhatsAppThreadSummary[]> {
  const groups = await db
    .select({
      phone: whatsappMessages.contactPhone,
      lastId: max(whatsappMessages.id),
      count: sql<string>`count(*)`,
      unread: sql<string>`sum(case when ${whatsappMessages.direction} = 'in' and ${whatsappMessages.readAt} is null then 1 else 0 end)`,
    })
    .from(whatsappMessages)
    .where(isNull(whatsappMessages.leadId))
    .groupBy(whatsappMessages.contactPhone)
    .orderBy(desc(max(whatsappMessages.id)))
    .limit(limit);
  if (groups.length === 0) return [];
  const lastIds = groups.map((g) => Number(g.lastId)).filter((n) => n > 0);
  const [lastRows, contacts] = await Promise.all([
    db
      .select({ id: whatsappMessages.id, body: whatsappMessages.body, type: whatsappMessages.type, direction: whatsappMessages.direction, createdAt: whatsappMessages.createdAt })
      .from(whatsappMessages)
      .where(inArray(whatsappMessages.id, lastIds)),
    db
      .select({ phone: whatsappContacts.phone, name: whatsappContacts.name })
      .from(whatsappContacts)
      .where(inArray(whatsappContacts.phone, groups.map((g) => g.phone))),
  ]);
  const lastById = new Map(lastRows.map((r) => [r.id, r]));
  const nameByPhone = new Map(contacts.map((c) => [c.phone, c.name]));
  return groups.flatMap((g) => {
    const last = lastById.get(Number(g.lastId));
    if (!last) return [];
    return [{
      phone: g.phone,
      name: nameByPhone.get(g.phone) ?? null,
      count: Number(g.count),
      unread: Number(g.unread ?? 0),
      last: { body: last.body, type: last.type, direction: last.direction, createdAt: last.createdAt },
    }];
  });
}

export async function countUnreadWhatsAppChats(): Promise<number> {
  const [row] = await db
    .select({ n: sql<string>`count(*)` })
    .from(whatsappMessages)
    .where(and(isNull(whatsappMessages.leadId), eq(whatsappMessages.direction, "in"), isNull(whatsappMessages.readAt)));
  return Number(row?.n ?? 0);
}

/** One unattached chat, oldest first (newest 200), or null when there is none. */
export async function getWhatsAppChat(phone: string): Promise<WhatsAppMessage[] | null> {
  const p = normalizeWaPhone(phone);
  if (!p) return null;
  const rows = await db
    .select(columns)
    .from(whatsappMessages)
    .where(and(eq(whatsappMessages.contactPhone, p), isNull(whatsappMessages.leadId)))
    .orderBy(desc(whatsappMessages.id))
    .limit(200);
  return rows.length ? rows.reverse().map(toMessage) : null;
}

/**
 * The WhatsApp messages of these leads, oldest first per lead. The caller has
 * already decided the viewer may see every lead in `leadIds`.
 */
export async function listLeadWhatsApp(leadIds: number[]): Promise<Map<number, WhatsAppMessage[]>> {
  const ids = [...new Set(leadIds)].filter((n) => Number.isInteger(n) && n > 0);
  const out = new Map<number, WhatsAppMessage[]>();
  if (ids.length === 0) return out;
  const rows = await db
    .select(columns)
    .from(whatsappMessages)
    .where(inArray(whatsappMessages.leadId, ids))
    .orderBy(desc(whatsappMessages.id))
    .limit(2000);
  for (const r of rows.reverse()) {
    const list = out.get(r.leadId!) ?? [];
    list.push(toMessage(r));
    out.set(r.leadId!, list);
  }
  return out;
}

export async function markWhatsAppChatRead(phone: string): Promise<void> {
  await db
    .update(whatsappMessages)
    .set({ readAt: sql`now()` })
    .where(and(eq(whatsappMessages.contactPhone, phone), isNull(whatsappMessages.leadId), eq(whatsappMessages.direction, "in"), isNull(whatsappMessages.readAt)));
}

export async function markLeadWhatsAppRead(leadId: number): Promise<void> {
  await db
    .update(whatsappMessages)
    .set({ readAt: sql`now()` })
    .where(and(eq(whatsappMessages.leadId, leadId), eq(whatsappMessages.direction, "in"), isNull(whatsappMessages.readAt)));
}

/** A media row for the download route — with what its visibility check needs. */
export async function getWhatsAppMedia(id: number) {
  const [row] = await db
    .select({
      leadId: whatsappMessages.leadId,
      mediaR2Key: whatsappMessages.mediaR2Key,
      mediaMime: whatsappMessages.mediaMime,
      mediaFilename: whatsappMessages.mediaFilename,
      type: whatsappMessages.type,
    })
    .from(whatsappMessages)
    .where(eq(whatsappMessages.id, id))
    .limit(1);
  return row ?? null;
}

/** The phone a lead's WhatsApp replies go to, in WhatsApp's form. */
export async function leadWhatsAppPhone(leadId: number): Promise<string | null> {
  const [row] = await db.select({ whatsapp: leads.whatsapp }).from(leads).where(eq(leads.id, leadId)).limit(1);
  return normalizeWaPhone(row?.whatsapp);
}

/**
 * "Convertir en consulta": attach every unattached message of this contact to
 * the new lead, so the chat moves under it. Returns the rows moved.
 */
export async function attachWhatsAppChatToLead(phone: string, leadId: number): Promise<number> {
  const [res] = await db
    .update(whatsappMessages)
    .set({ leadId })
    .where(and(eq(whatsappMessages.contactPhone, phone), isNull(whatsappMessages.leadId)));
  return res.affectedRows;
}

/* -------------------------------------------------------------------------- */
/* Sending                                                                     */
/* -------------------------------------------------------------------------- */

export type WaSendOutcome =
  | { ok: true; sent: boolean }
  | { ok: false; error: "not_configured" | "empty" | "no_recipient" | "outside_window" };

/**
 * Send one text to `to` and record it — the one write path for every outbound
 * message, human or automatic. Refuses outside the 24-hour window before
 * calling Meta. A send Meta refused is still stored, with `error`.
 */
export async function sendAndRecordWhatsApp(p: {
  to: string | null;
  body: string;
  leadId: number | null;
  /** NULL = automatic; then `autoKind` says which. */
  userId: number | null;
  autoKind?: "greeting" | "ai" | null;
}): Promise<WaSendOutcome> {
  const config = whatsappConfig();
  if (!config) return { ok: false, error: "not_configured" };
  const to = normalizeWaPhone(p.to);
  if (!to) return { ok: false, error: "no_recipient" };
  const body = p.body.replace(/\r\n?/g, "\n").trim().slice(0, WHATSAPP_TEXT_MAX);
  if (!body) return { ok: false, error: "empty" };
  const contact = await getWhatsAppContact(to);
  if (!withinWindow(contact?.lastInboundAt ?? null)) return { ok: false, error: "outside_window" };

  const res = await sendWhatsAppText(to, body);
  await db.insert(whatsappMessages).values({
    waMessageId: res.ok ? res.waMessageId : null,
    direction: "out",
    fromPhone: config.phoneNumberId.slice(0, 20),
    toPhone: to,
    contactPhone: to,
    phoneNumberId: config.phoneNumberId,
    leadId: p.leadId,
    body,
    type: "text",
    status: res.ok ? "sent" : "failed",
    error: res.ok ? null : res.error,
    sentByUserId: p.userId,
    autoKind: p.userId == null ? (p.autoKind ?? null) : null,
    // Written from the app clock like every inbound row, so the auto-reply
    // limits compare one clock (the pool runs with timezone "Z").
    createdAt: new Date(),
  });
  return { ok: true, sent: res.ok };
}

/** Conversation text for the AI suggester (PR 1's `draftReplyFor()`), oldest first. */
export function whatsappToAiMessages(messages: WhatsAppMessage[]) {
  return messages.map((m) => ({
    direction: m.direction,
    body: m.body ?? (m.type !== "text" ? `[${m.type}]` : ""),
    at: m.createdAt.toISOString(),
  }));
}

