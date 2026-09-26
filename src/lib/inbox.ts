/**
 * The email inbox (plan-build-2026-09-26 §6, waves E2 + E3): storing what the
 * Cloudflare Email Worker posts, threading it, and every read and write the
 * panels make on `email_messages` / `email_attachments`. The only module that
 * touches those two tables.
 *
 * Rules it keeps:
 *
 * - **Nothing is ever lost.** `storeInbound()` either commits the message and
 *   all of its attachment bytes, or throws — and the route then answers 5xx,
 *   so the Worker forwards the original to `FALLBACK_FORWARD` (the founder's
 *   Gmail) instead. A duplicate (same mailbox + Message-ID) is a success.
 * - **No new visibility rule.** A lead thread is shown to exactly who may see
 *   the lead: /admin/leads' rows (staff: internal lane only),
 *   `panelCanSeeLead()` for /agencia, `getPanelLeads()` for /mis-avisos.
 *   Callers check first and pass only lead ids they may see; the one inbox
 *   rule added here is staff → `SHARED_MAILBOXES` only (the founder's own
 *   mailbox is his).
 * - **Outbound goes through `sendEmail()`** (src/lib/email.ts) — the one
 *   sender. A failed send is still stored, with `send_error`, so the thread
 *   says "not sent" rather than pretending (the `alertOperator()` rule).
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { emailAttachments, emailMessages, leads } from "@/db/schema";
import { escapeHtml, sendEmail, senderAddress, senderFor, type EmailResult } from "@/lib/email";
import {
  defaultMailbox,
  leadReplyAddress,
  machineDomain,
  messageIdsIn,
  normalizeAddress,
  normalizeSubject,
  parseLeadAddress,
  replySubject,
  rootDomain,
  rootMailboxLocal,
  SHARED_MAILBOXES,
} from "@/lib/inbox-address";
import { sanitizeEmailHtml } from "@/lib/inbox-html";
import { deletePrivateObjects, isR2Configured, putPrivateObject } from "@/lib/r2";

/* -------------------------------------------------------------------------- */
/* The Worker's payload                                                        */
/* -------------------------------------------------------------------------- */

/** Largest request body the route reads. The Worker's inline caps keep a real message under it. */
export const INBOUND_BODY_MAX_BYTES = 16 * 1024 * 1024;

const addr = z.object({
  address: z.string().max(320),
  name: z.string().max(400).nullish(),
});

/**
 * What `workers/inbound-email` posts (`v: 1`). Bounds here are the route's,
 * not the Worker's: the Worker truncates to smaller ones before sending.
 */
export const inboundPayloadSchema = z.object({
  v: z.literal(1),
  envelope: z.object({ from: z.string().max(320), to: z.string().max(320) }),
  messageId: z.string().max(2000).nullish(),
  inReplyTo: z.string().max(2000).nullish(),
  references: z.string().max(20_000).nullish(),
  autoSubmitted: z.string().max(100).nullish(),
  subject: z.string().max(4000).nullish(),
  from: addr.nullish(),
  replyTo: z.array(addr).max(20).default([]),
  to: z.array(addr).max(200).default([]),
  cc: z.array(addr).max(200).default([]),
  text: z.string().max(2_000_000).nullish(),
  html: z.string().max(4_000_000).nullish(),
  attachments: z
    .array(
      z.object({
        filename: z.string().max(1000).nullish(),
        contentType: z.string().max(255).nullish(),
        size: z.number().int().nonnegative(),
        /** base64, or null when the Worker kept metadata only (over its cap). */
        content: z.string().nullish(),
      }),
    )
    .max(100)
    .default([]),
  rawSha256: z.string().regex(/^[0-9a-f]{64}$/),
  rawSize: z.number().int().nonnegative(),
});

export type InboundPayload = z.infer<typeof inboundPayloadSchema>;

/* -------------------------------------------------------------------------- */
/* Small helpers                                                               */
/* -------------------------------------------------------------------------- */

const TEXT_MAX_CHARS = 1_000_000;

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function clip(s: string | null | undefined, max: number): string | null {
  const t = (s ?? "").replace(/\u0000/g, "").trim();
  return t ? t.slice(0, max) : null;
}

function oneLine(s: string | null | undefined, max: number): string {
  return (s ?? "").replace(/[\r\n\t]+/g, " ").replace(/\u0000/g, "").trim().slice(0, max);
}

function addressList(list: { address: string }[]): string | null {
  const out = [...new Set(list.map((a) => normalizeAddress(a.address)).filter(Boolean))];
  return out.length ? out.join(", ").slice(0, 60_000) : null;
}

export function leadThreadKey(leadId: number): string {
  return `lead-${leadId}`;
}

export function isThreadKey(s: string): boolean {
  return /^(lead-\d{1,12}|m-[0-9a-f]{16,40})$/.test(s);
}

/** A filename safe to store and to put in a Content-Disposition header. */
export function safeFilename(raw: string | null | undefined): string {
  const base = (raw ?? "").split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f"<>|:*?]+/g, "_").trim().slice(0, 200);
  return clean || "adjunto";
}

function safeContentType(raw: string | null | undefined): string {
  const t = (raw ?? "").split(";")[0].trim().toLowerCase();
  return /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(t) ? t.slice(0, 127) : "application/octet-stream";
}

/** mysql2's duplicate-key error, whether drizzle hands it over bare or wrapped (`cause`). */
function isDuplicateKey(e: unknown): boolean {
  for (let cur: unknown = e, depth = 0; cur && depth < 4; depth++) {
    const err = cur as { code?: string; errno?: number; cause?: unknown };
    if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) return true;
    cur = err.cause;
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/* Storing inbound mail                                                        */
/* -------------------------------------------------------------------------- */

export interface StoredInbound {
  status: "stored" | "duplicate";
  id: number;
  leadId: number | null;
  threadKey: string;
  mailbox: string;
  fromAddress: string;
  fromName: string | null;
  subject: string;
  /** False for our own machine mail and auto-generated mail — never alert on those (mail loops). */
  alert: boolean;
}

/**
 * Which thread a new inbound message belongs to, in order of certainty:
 * 1. its envelope recipient is a signed `lead-<id>-<sig>@` address of a lead
 *    that exists → that lead's thread;
 * 2. its In-Reply-To / References name a message we have → that thread (and
 *    that thread's lead, if any);
 * 3. inbox only: same mailbox, same counterpart, same subject without Re:,
 *    within 60 days → that thread (a client that drops References);
 * 4. otherwise a new thread.
 */
async function resolveThread(p: {
  mailbox: string;
  from: string;
  subject: string;
  messageId: string | null;
  refIds: string[];
  rawSha256: string;
}): Promise<{ threadKey: string; leadId: number | null }> {
  const addressed = parseLeadAddress(p.mailbox);
  if (addressed) {
    const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, addressed)).limit(1);
    if (lead) return { threadKey: leadThreadKey(lead.id), leadId: lead.id };
  }

  if (p.refIds.length) {
    const [hit] = await db
      .select({ threadKey: emailMessages.threadKey, leadId: emailMessages.leadId })
      .from(emailMessages)
      .where(inArray(emailMessages.messageId, p.refIds.slice(-50)))
      .orderBy(desc(emailMessages.id))
      .limit(1);
    if (hit) return { threadKey: hit.threadKey, leadId: hit.leadId ?? null };
  }

  const subject = normalizeSubject(p.subject);
  if (subject && p.from) {
    const since = new Date(Date.now() - 60 * 24 * 3600_000);
    const recent = await db
      .select({ threadKey: emailMessages.threadKey, subject: emailMessages.subject })
      .from(emailMessages)
      .where(
        and(
          eq(emailMessages.mailbox, p.mailbox),
          isNull(emailMessages.leadId),
          gte(emailMessages.createdAt, since),
          or(
            and(eq(emailMessages.direction, "in"), eq(emailMessages.fromAddress, p.from)),
            and(eq(emailMessages.direction, "out"), eq(emailMessages.toAddresses, p.from)),
          ),
        ),
      )
      .orderBy(desc(emailMessages.id))
      .limit(20);
    const same = recent.find((r) => normalizeSubject(r.subject) === subject);
    if (same) return { threadKey: same.threadKey, leadId: null };
  }

  return { threadKey: `m-${sha256(p.messageId ?? p.rawSha256).slice(0, 40)}`, leadId: null };
}

/**
 * Store one message the Worker posted. Throws on any failure that could lose
 * data (the route turns that into a 5xx, and the Worker forwards the original
 * to the fallback address instead).
 */
export async function storeInbound(p: InboundPayload): Promise<StoredInbound> {
  const mailbox = normalizeAddress(p.envelope.to) || oneLine(p.envelope.to, 190).toLowerCase();
  const messageId = messageIdsIn(p.messageId)[0] ?? null;
  const fromAddress =
    normalizeAddress(p.from?.address) || normalizeAddress(p.envelope.from) || "desconocido@invalid";
  const fromName = clip(p.from?.name, 190);
  const subject = oneLine(p.subject, 500);
  const dedupKey = sha256(`${mailbox}|${messageId ?? `raw:${p.rawSha256}`}`);

  const [existing] = await db
    .select({ id: emailMessages.id, leadId: emailMessages.leadId, threadKey: emailMessages.threadKey })
    .from(emailMessages)
    .where(eq(emailMessages.dedupKey, dedupKey))
    .limit(1);
  const base = { mailbox, fromAddress, fromName, subject, alert: false };
  if (existing) {
    return { ...base, status: "duplicate", id: existing.id, leadId: existing.leadId ?? null, threadKey: existing.threadKey };
  }

  const refIds = [...messageIdsIn(p.references), ...messageIdsIn(p.inReplyTo)];
  const thread = await resolveThread({
    mailbox,
    from: fromAddress,
    subject,
    messageId,
    refIds,
    rawSha256: p.rawSha256,
  });

  // Bytes first, rows second: a row that points at an upload that never
  // happened would be a lost attachment the thread claims to have.
  const uploaded: string[] = [];
  const attachmentRows: Array<{ filename: string; contentType: string; sizeBytes: number; r2Key: string | null }> = [];
  const r2 = isR2Configured();
  try {
    for (const a of p.attachments) {
      const filename = safeFilename(a.filename);
      const contentType = safeContentType(a.contentType);
      let r2Key: string | null = null;
      if (r2 && a.content) {
        const bytes = Buffer.from(a.content, "base64");
        r2Key = `inbox/${new Date().toISOString().slice(0, 7)}/${randomBytes(16).toString("hex")}`;
        await putPrivateObject(r2Key, bytes, contentType);
        uploaded.push(r2Key);
      }
      attachmentRows.push({
        filename,
        contentType,
        sizeBytes: Math.min(a.size, 4_294_967_295),
        r2Key,
      });
    }
  } catch (e) {
    await deletePrivateObjects(uploaded).catch(() => {});
    throw e;
  }

  const replyTo = normalizeAddress(p.replyTo[0]?.address);
  let id: number;
  try {
    id = await db.transaction(async (tx) => {
      const [res] = await tx.insert(emailMessages).values({
        mailbox: mailbox.slice(0, 190),
        direction: "in",
        fromAddress: fromAddress.slice(0, 254),
        fromName,
        replyTo: replyTo && replyTo !== fromAddress ? replyTo : null,
        toAddresses: addressList(p.to),
        ccAddresses: addressList(p.cc),
        subject,
        textBody: clip(p.text, TEXT_MAX_CHARS),
        htmlBody: sanitizeEmailHtml(p.html),
        messageId: messageId?.slice(0, 512) ?? null,
        inReplyTo: messageIdsIn(p.inReplyTo)[0]?.slice(0, 512) ?? null,
        referencesHeader: clip(refIds.join(" "), 20_000),
        threadKey: thread.threadKey,
        leadId: thread.leadId,
        dedupKey,
      });
      const newId = Number((res as unknown as { insertId: number }).insertId);
      if (attachmentRows.length) {
        await tx.insert(emailAttachments).values(attachmentRows.map((r) => ({ ...r, emailId: newId })));
      }
      return newId;
    });
  } catch (e) {
    await deletePrivateObjects(uploaded).catch(() => {});
    // A concurrent retry of the same message won the unique index: that is a
    // duplicate, not a failure.
    if (isDuplicateKey(e)) {
      const [row] = await db
        .select({ id: emailMessages.id, leadId: emailMessages.leadId, threadKey: emailMessages.threadKey })
        .from(emailMessages)
        .where(eq(emailMessages.dedupKey, dedupKey))
        .limit(1);
      if (row) return { ...base, status: "duplicate", id: row.id, leadId: row.leadId ?? null, threadKey: row.threadKey };
    }
    throw e;
  }

  // Mail loops: an operator alert to OPERATOR_EMAIL that lands back in an
  // inbox would alert again. Our own machine mail and anything
  // auto-generated is stored, never alerted on.
  const auto = (p.autoSubmitted ?? "").trim().toLowerCase();
  const ownMachineMail = fromAddress.endsWith(`@${machineDomain()}`);
  const alert = !ownMachineMail && (auto === "" || auto === "no");

  return { ...base, status: "stored", id, leadId: thread.leadId, threadKey: thread.threadKey, alert };
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                     */
/* -------------------------------------------------------------------------- */

export interface InboxAttachment {
  id: number;
  filename: string;
  contentType: string;
  sizeBytes: number;
  stored: boolean;
}

export interface InboxMessage {
  id: number;
  mailbox: string;
  direction: "in" | "out";
  fromAddress: string;
  fromName: string | null;
  replyTo: string | null;
  toAddresses: string | null;
  ccAddresses: string | null;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  messageId: string | null;
  referencesHeader: string | null;
  threadKey: string;
  leadId: number | null;
  sendError: string | null;
  readAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  attachments: InboxAttachment[];
}

const messageColumns = {
  id: emailMessages.id,
  mailbox: emailMessages.mailbox,
  direction: emailMessages.direction,
  fromAddress: emailMessages.fromAddress,
  fromName: emailMessages.fromName,
  replyTo: emailMessages.replyTo,
  toAddresses: emailMessages.toAddresses,
  ccAddresses: emailMessages.ccAddresses,
  subject: emailMessages.subject,
  textBody: emailMessages.textBody,
  htmlBody: emailMessages.htmlBody,
  messageId: emailMessages.messageId,
  referencesHeader: emailMessages.referencesHeader,
  threadKey: emailMessages.threadKey,
  leadId: emailMessages.leadId,
  sendError: emailMessages.sendError,
  readAt: emailMessages.readAt,
  archivedAt: emailMessages.archivedAt,
  createdAt: emailMessages.createdAt,
};

async function withAttachments(rows: Omit<InboxMessage, "attachments">[]): Promise<InboxMessage[]> {
  if (rows.length === 0) return [];
  const atts = await db
    .select({
      id: emailAttachments.id,
      emailId: emailAttachments.emailId,
      filename: emailAttachments.filename,
      contentType: emailAttachments.contentType,
      sizeBytes: emailAttachments.sizeBytes,
      r2Key: emailAttachments.r2Key,
    })
    .from(emailAttachments)
    .where(inArray(emailAttachments.emailId, rows.map((r) => r.id)))
    .orderBy(asc(emailAttachments.id));
  const byEmail = new Map<number, InboxAttachment[]>();
  for (const a of atts) {
    const list = byEmail.get(a.emailId) ?? [];
    list.push({ id: a.id, filename: a.filename, contentType: a.contentType, sizeBytes: a.sizeBytes, stored: !!a.r2Key });
    byEmail.set(a.emailId, list);
  }
  return rows.map((r) => ({ ...r, attachments: byEmail.get(r.id) ?? [] }));
}

/** Who is reading /admin/inbox. Staff see the shared mailboxes only. */
export interface InboxViewer {
  userId: number;
  superAdmin: boolean;
}

function sharedMailboxAddresses(): string[] {
  return SHARED_MAILBOXES.map((l) => `${l}@${rootDomain()}`);
}

/** The inbox-thread predicate for this viewer: not a lead thread, and a mailbox they may read. */
function inboxScope(viewer: InboxViewer): SQL {
  return viewer.superAdmin
    ? isNull(emailMessages.leadId)
    : and(isNull(emailMessages.leadId), inArray(emailMessages.mailbox, sharedMailboxAddresses()))!;
}

/** Mailboxes this viewer may send from in /admin/inbox. */
export async function composeMailboxes(viewer: InboxViewer): Promise<string[]> {
  const shared = sharedMailboxAddresses();
  if (!viewer.superAdmin) return shared;
  // The founder's own mailboxes are whichever root addresses mail arrived at.
  const seen = await db
    .selectDistinct({ mailbox: emailMessages.mailbox })
    .from(emailMessages)
    .where(and(isNull(emailMessages.leadId), eq(emailMessages.direction, "in")))
    .limit(50);
  const root = seen.map((r) => r.mailbox).filter((m) => rootMailboxLocal(m) !== null);
  return [...new Set([...shared, ...root])];
}

export interface InboxThreadSummary {
  threadKey: string;
  count: number;
  unread: number;
  last: Pick<InboxMessage, "id" | "mailbox" | "direction" | "fromAddress" | "fromName" | "toAddresses" | "subject" | "createdAt"> & {
    snippet: string;
  };
}

/** Inbox threads, newest activity first. `archived` shows threads with nothing un-archived. */
export async function listInboxThreads(viewer: InboxViewer, opts: { archived: boolean; limit?: number }): Promise<InboxThreadSummary[]> {
  const groups = await db
    .select({
      threadKey: emailMessages.threadKey,
      lastId: sql<number>`max(${emailMessages.id})`,
      count: sql<number>`count(*)`,
      unread: sql<number>`sum(${emailMessages.direction} = 'in' and ${emailMessages.readAt} is null)`,
      active: sql<number>`sum(${emailMessages.archivedAt} is null)`,
    })
    .from(emailMessages)
    .where(inboxScope(viewer))
    .groupBy(emailMessages.threadKey)
    .having(opts.archived ? sql`sum(${emailMessages.archivedAt} is null) = 0` : sql`sum(${emailMessages.archivedAt} is null) > 0`)
    .orderBy(desc(sql`max(${emailMessages.id})`))
    .limit(opts.limit ?? 100);
  if (groups.length === 0) return [];
  const last = await db
    .select({
      id: emailMessages.id,
      mailbox: emailMessages.mailbox,
      direction: emailMessages.direction,
      fromAddress: emailMessages.fromAddress,
      fromName: emailMessages.fromName,
      toAddresses: emailMessages.toAddresses,
      subject: emailMessages.subject,
      createdAt: emailMessages.createdAt,
      snippet: sql<string>`left(coalesce(${emailMessages.textBody}, ''), 160)`,
    })
    .from(emailMessages)
    .where(inArray(emailMessages.id, groups.map((g) => Number(g.lastId))));
  const byId = new Map(last.map((m) => [m.id, m]));
  return groups.flatMap((g) => {
    const m = byId.get(Number(g.lastId));
    return m
      ? [{
          threadKey: g.threadKey,
          count: Number(g.count),
          unread: Number(g.unread ?? 0),
          last: { ...m, snippet: oneLine(m.snippet, 160) },
        }]
      : [];
  });
}

/**
 * Unread inbound inbox messages — the /admin badge. A failed count is 0, not
 * an error: a badge must never take the review queue down with it (the
 * /admin health box is what reports a missing table).
 */
export async function countUnreadInbox(viewer: InboxViewer): Promise<number> {
  return countUnreadInboxRaw(viewer).catch(() => 0);
}

async function countUnreadInboxRaw(viewer: InboxViewer): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(emailMessages)
    .where(
      and(
        inboxScope(viewer),
        eq(emailMessages.direction, "in"),
        isNull(emailMessages.readAt),
        isNull(emailMessages.archivedAt),
      ),
    );
  return Number(row?.n ?? 0);
}

/** One inbox thread, oldest first, or null when it is not this viewer's to read. */
export async function getInboxThread(viewer: InboxViewer, threadKey: string): Promise<InboxMessage[] | null> {
  if (!isThreadKey(threadKey) || threadKey.startsWith("lead-")) return null;
  const rows = await db
    .select(messageColumns)
    .from(emailMessages)
    .where(and(eq(emailMessages.threadKey, threadKey), inboxScope(viewer)))
    .orderBy(asc(emailMessages.id))
    .limit(200);
  return rows.length ? withAttachments(rows) : null;
}

/** Mark a thread's inbound messages read. Scoped like the read. */
export async function markInboxThreadRead(viewer: InboxViewer, threadKey: string): Promise<void> {
  await db
    .update(emailMessages)
    .set({ readAt: sql`now()` })
    .where(
      and(
        eq(emailMessages.threadKey, threadKey),
        inboxScope(viewer),
        eq(emailMessages.direction, "in"),
        isNull(emailMessages.readAt),
      ),
    );
}

export async function setInboxThreadArchived(viewer: InboxViewer, threadKey: string, archived: boolean): Promise<number> {
  const [res] = await db
    .update(emailMessages)
    .set({ archivedAt: archived ? sql`now()` : null })
    .where(and(eq(emailMessages.threadKey, threadKey), inboxScope(viewer)));
  return res.affectedRows;
}

/**
 * The email threads of these leads, oldest message first. The caller has
 * already decided the viewer may see every lead in `leadIds`.
 */
export async function listLeadThreads(leadIds: number[]): Promise<Map<number, InboxMessage[]>> {
  const ids = [...new Set(leadIds)].filter((n) => Number.isInteger(n) && n > 0);
  const out = new Map<number, InboxMessage[]>();
  if (ids.length === 0) return out;
  const rows = await db
    .select(messageColumns)
    .from(emailMessages)
    .where(inArray(emailMessages.leadId, ids))
    .orderBy(asc(emailMessages.id))
    .limit(2000);
  for (const m of await withAttachments(rows)) {
    const list = out.get(m.leadId!) ?? [];
    list.push(m);
    out.set(m.leadId!, list);
  }
  return out;
}

export async function markLeadThreadRead(leadId: number): Promise<void> {
  await db
    .update(emailMessages)
    .set({ readAt: sql`now()` })
    .where(and(eq(emailMessages.leadId, leadId), eq(emailMessages.direction, "in"), isNull(emailMessages.readAt)));
}

/**
 * Recent inbound replies on lead threads, for the /admin/inbox side list.
 * `internalOnly` is /admin/leads' staff rule, unchanged.
 */
export async function listRecentLeadReplies(internalOnly: boolean, limit = 30) {
  return db
    .select({
      id: emailMessages.id,
      leadId: emailMessages.leadId,
      fromAddress: emailMessages.fromAddress,
      fromName: emailMessages.fromName,
      subject: emailMessages.subject,
      readAt: emailMessages.readAt,
      createdAt: emailMessages.createdAt,
      leadName: leads.name,
      leadWhatsapp: leads.whatsapp,
    })
    .from(emailMessages)
    .innerJoin(leads, eq(leads.id, emailMessages.leadId))
    .where(and(eq(emailMessages.direction, "in"), internalOnly ? eq(leads.routedTo, "internal") : undefined))
    .orderBy(desc(emailMessages.id))
    .limit(limit);
}

/** One attachment and the message it belongs to — the download route checks the message's visibility. */
export async function getAttachment(id: number) {
  const [row] = await db
    .select({
      id: emailAttachments.id,
      filename: emailAttachments.filename,
      contentType: emailAttachments.contentType,
      r2Key: emailAttachments.r2Key,
      threadKey: emailMessages.threadKey,
      leadId: emailMessages.leadId,
      mailbox: emailMessages.mailbox,
    })
    .from(emailAttachments)
    .innerJoin(emailMessages, eq(emailMessages.id, emailAttachments.emailId))
    .where(eq(emailAttachments.id, id))
    .limit(1);
  return row ?? null;
}

/** Whether an inbox (non-lead) message in this mailbox is readable by the viewer. */
export function viewerMayReadMailbox(viewer: InboxViewer, mailbox: string): boolean {
  return viewer.superAdmin || sharedMailboxAddresses().includes(mailbox);
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                     */
/* -------------------------------------------------------------------------- */

export const REPLY_MAX_CHARS = 10_000;

/** A message's date in the panels (Spanish, like the rest of their copy). */
export function formatEmailWhen(d: Date): string {
  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Plain text → the HTML part: escaped paragraphs, the quote in a grey block. */
export function replyHtml(body: string, quote?: { header: string; text: string }): string {
  const para = (s: string) =>
    `<p style="margin:0 0 12px;line-height:1.5">${escapeHtml(s).replace(/\n/g, "<br>")}</p>`;
  const main = body.split(/\n{2,}/).map(para).join("");
  const q = quote
    ? `<div style="margin-top:16px;color:#5c5c5c"><p style="margin:0 0 6px">${escapeHtml(quote.header)}</p><blockquote style="margin:0;padding-left:10px;border-left:3px solid #d6d3cc">${escapeHtml(quote.text).replace(/\n/g, "<br>")}</blockquote></div>`
    : "";
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;color:#1c1c1c">${main}${q}</div>`;
}

function replyText(body: string, quote?: { header: string; text: string }): string {
  if (!quote) return body;
  return `${body}\n\n${quote.header}\n${quote.text.split("\n").map((l) => `> ${l}`).join("\n")}`;
}

function quoteOf(m: InboxMessage | undefined, header: (name: string, at: Date) => string) {
  if (!m?.textBody) return undefined;
  return { header: header(m.fromName ?? m.fromAddress, m.createdAt), text: m.textBody.slice(0, 4000) };
}

async function recordOutbound(p: {
  mailbox: string;
  fromAddress: string;
  fromName: string | null;
  to: string;
  cc?: string[];
  subject: string;
  text: string;
  html: string;
  inReplyTo?: string;
  references?: string[];
  threadKey: string;
  leadId: number | null;
  userId: number | null;
  result: EmailResult;
}): Promise<number> {
  const messageId = p.result.messageId ? messageIdsIn(p.result.messageId.includes("<") ? p.result.messageId : `<${p.result.messageId}>`)[0] ?? null : null;
  const [res] = await db.insert(emailMessages).values({
    mailbox: p.mailbox.slice(0, 190),
    direction: "out",
    fromAddress: p.fromAddress.slice(0, 254),
    fromName: p.fromName,
    toAddresses: normalizeAddress(p.to) || null,
    ccAddresses: p.cc?.length ? p.cc.map(normalizeAddress).filter(Boolean).join(", ") : null,
    subject: oneLine(p.subject, 500),
    textBody: p.text,
    htmlBody: sanitizeEmailHtml(p.html),
    messageId,
    inReplyTo: p.inReplyTo ?? null,
    referencesHeader: p.references?.length ? p.references.join(" ").slice(0, 20_000) : null,
    threadKey: p.threadKey,
    leadId: p.leadId,
    sentByUserId: p.userId,
    sendError: p.result.sent ? null : (p.result.error ?? "not sent").slice(0, 120),
    // Our own message is never "unread".
    readAt: sql`now()`,
  });
  return Number((res as unknown as { insertId: number }).insertId);
}

/** The Message-ID chain a reply to this thread should carry. */
function threadingFor(messages: InboxMessage[]): { inReplyTo?: string; references: string[] } {
  const withId = messages.filter((m) => m.messageId);
  const last = withId[withId.length - 1];
  if (!last) return { references: [] };
  const refs = [...messageIdsIn(last.referencesHeader), last.messageId!];
  return { inReplyTo: last.messageId!, references: [...new Set(refs)].slice(-20) };
}

/** Who a reply goes to: the last inbound message's Reply-To, else its From. */
export function replyRecipient(messages: InboxMessage[]): string | null {
  const lastIn = [...messages].reverse().find((m) => m.direction === "in");
  return lastIn ? (lastIn.replyTo ?? lastIn.fromAddress) : null;
}

/** Where a reply in a lead thread goes: the buyer's last reply address, else the lead's email. */
export function leadReplyRecipient(messages: InboxMessage[], leadEmail: string | null): string | null {
  return replyRecipient(messages) ?? (normalizeAddress(leadEmail) || null);
}

export type SendOutcome = { ok: true; sent: boolean } | { ok: false; error: "empty" | "no_recipient" | "not_found" };

/**
 * A reply in a lead thread — from /admin/leads, /agencia/leads or
 * /mis-avisos/consultas. The caller has already checked the viewer may see
 * the lead. To: the buyer's last reply address, else the lead's email.
 * From: `EMAIL_FROM` under the lead's door brand; Reply-To: the lead's signed
 * address, so the answer comes back into this same thread.
 */
export async function sendLeadReply(p: {
  leadId: number;
  body: string;
  userId: number;
  signature: string | null;
  brand: string;
  subjectFallback: string;
  quoteHeader: (name: string, at: Date) => string;
}): Promise<SendOutcome> {
  const body = p.body.trim().slice(0, REPLY_MAX_CHARS);
  if (!body) return { ok: false, error: "empty" };
  const [lead] = await db.select({ id: leads.id, email: leads.email }).from(leads).where(eq(leads.id, p.leadId)).limit(1);
  if (!lead) return { ok: false, error: "not_found" };
  const thread = (await listLeadThreads([lead.id])).get(lead.id) ?? [];
  const to = leadReplyRecipient(thread, lead.email);
  if (!to) return { ok: false, error: "no_recipient" };

  const lastSubject = [...thread].reverse().find((m) => m.subject)?.subject;
  const subject = replySubject(lastSubject || p.subjectFallback);
  const full = p.signature ? `${body}\n\n— ${p.signature}` : body;
  const quote = quoteOf([...thread].reverse().find((m) => m.direction === "in"), p.quoteHeader);
  const html = replyHtml(full, quote);
  const text = replyText(full, quote);
  const { inReplyTo, references } = threadingFor(thread);
  const replyTo = leadReplyAddress(lead.id) ?? undefined;

  const result = await sendEmail({ to, subject, html, text, fromName: p.brand, replyTo, inReplyTo, references });
  const sender = senderAddress()?.address ?? `avisos@${machineDomain()}`;
  await recordOutbound({
    mailbox: replyTo ?? sender,
    fromAddress: sender,
    fromName: p.brand,
    to,
    subject,
    text,
    html,
    inReplyTo,
    references,
    threadKey: leadThreadKey(lead.id),
    leadId: lead.id,
    userId: p.userId,
    result,
  });
  await markLeadThreadRead(lead.id);
  return { ok: true, sent: result.sent };
}

/**
 * The seeker confirmation E1 sends when a lead is created, recorded as the
 * first message of that lead's thread so a buyer's reply to it has context.
 * Only called after `sendEmail()` accepted it.
 */
export async function recordLeadConfirmation(p: {
  leadId: number;
  to: string;
  fromName: string;
  subject: string;
  text: string;
  html: string;
  result: EmailResult;
}): Promise<void> {
  const replyTo = leadReplyAddress(p.leadId);
  const sender = senderAddress()?.address ?? `avisos@${machineDomain()}`;
  await recordOutbound({
    mailbox: replyTo ?? sender,
    fromAddress: sender,
    fromName: p.fromName,
    to: p.to,
    subject: p.subject,
    text: p.text,
    html: p.html,
    threadKey: leadThreadKey(p.leadId),
    leadId: p.leadId,
    userId: null,
    result: p.result,
  });
}

/** A reply in an inbox thread (/admin/inbox), sent as — or on behalf of — the thread's mailbox. */
export async function sendInboxReply(p: {
  viewer: InboxViewer;
  threadKey: string;
  body: string;
  brand: string;
  quoteHeader: (name: string, at: Date) => string;
}): Promise<SendOutcome> {
  const body = p.body.trim().slice(0, REPLY_MAX_CHARS);
  if (!body) return { ok: false, error: "empty" };
  const thread = await getInboxThread(p.viewer, p.threadKey);
  if (!thread) return { ok: false, error: "not_found" };
  const to = replyRecipient(thread);
  if (!to) return { ok: false, error: "no_recipient" };
  // The mailbox the conversation is in: where the last inbound message arrived.
  const mailbox = [...thread].reverse().find((m) => m.direction === "in")?.mailbox ?? defaultMailbox();
  const subject = replySubject(thread[thread.length - 1].subject || thread[0].subject);
  const quote = quoteOf([...thread].reverse().find((m) => m.direction === "in"), p.quoteHeader);
  const html = replyHtml(body, quote);
  const text = replyText(body, quote);
  const { inReplyTo, references } = threadingFor(thread);
  return sendAndRecordInbox({ ...p, to, mailbox, subject, html, text, inReplyTo, references, threadKey: p.threadKey });
}

/** A new message from /admin/inbox → "Redactar". */
export async function composeInbox(p: {
  viewer: InboxViewer;
  mailbox: string;
  to: string;
  cc: string[];
  subject: string;
  body: string;
  brand: string;
}): Promise<SendOutcome & { threadKey?: string }> {
  const body = p.body.trim().slice(0, REPLY_MAX_CHARS);
  const to = normalizeAddress(p.to);
  if (!body || !oneLine(p.subject, 500)) return { ok: false, error: "empty" };
  if (!to) return { ok: false, error: "no_recipient" };
  const allowed = await composeMailboxes(p.viewer);
  const mailbox = allowed.includes(normalizeAddress(p.mailbox)) ? normalizeAddress(p.mailbox) : defaultMailbox();
  const threadKey = `m-${randomBytes(16).toString("hex")}`;
  const out = await sendAndRecordInbox({
    ...p,
    to,
    cc: p.cc.map(normalizeAddress).filter(Boolean).slice(0, 10),
    mailbox,
    subject: oneLine(p.subject, 250),
    html: replyHtml(body),
    text: body,
    references: [],
    threadKey,
  });
  return { ...out, threadKey };
}

async function sendAndRecordInbox(p: {
  viewer: InboxViewer;
  to: string;
  cc?: string[];
  mailbox: string;
  subject: string;
  html: string;
  text: string;
  inReplyTo?: string;
  references: string[];
  threadKey: string;
  brand: string;
}): Promise<SendOutcome> {
  const result = await sendEmail({
    to: p.to,
    cc: p.cc,
    subject: p.subject,
    html: p.html,
    text: p.text,
    fromName: p.brand,
    fromMailbox: p.mailbox,
    inReplyTo: p.inReplyTo,
    references: p.references,
  });
  // What the message really went out as: the mailbox itself with root
  // sending on, else `EMAIL_FROM` with the mailbox as Reply-To.
  const sentAs = senderFor({ fromName: p.brand, fromMailbox: p.mailbox }).from?.address ?? p.mailbox;
  await recordOutbound({
    mailbox: p.mailbox,
    fromAddress: sentAs,
    fromName: p.brand,
    to: p.to,
    cc: p.cc,
    subject: p.subject,
    text: p.text,
    html: p.html,
    inReplyTo: p.inReplyTo,
    references: p.references,
    threadKey: p.threadKey,
    leadId: null,
    userId: p.viewer.userId,
    result,
  });
  await markInboxThreadRead(p.viewer, p.threadKey);
  return { ok: true, sent: result.sent };
}

/**
 * "Convertir en consulta": the thread becomes a lead's thread. The lead row
 * itself is written by the caller the normal way (`createLeadFromEmail()` in
 * the action); this moves the messages under it, so a later reply that
 * references any of them threads to the lead.
 */
export async function attachThreadToLead(viewer: InboxViewer, threadKey: string, leadId: number): Promise<number> {
  const [res] = await db
    .update(emailMessages)
    .set({ leadId, threadKey: leadThreadKey(leadId), archivedAt: null })
    .where(and(eq(emailMessages.threadKey, threadKey), inboxScope(viewer)));
  return res.affectedRows;
}
