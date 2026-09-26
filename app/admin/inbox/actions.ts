"use server";

/**
 * /admin/inbox (wave E3): reply, compose, archive, and "convertir en
 * consulta". Every action re-runs `requireStaffOrAbove()` and hands the
 * viewer to `src/lib/inbox.ts`, whose queries carry the mailbox rule (staff:
 * shared mailboxes only) — a forged thread key outside it matches no row.
 *
 * Sending goes through `sendEmail()` only (src/lib/email.ts).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { DEFAULT_VERTICAL_KEY, VERTICALS } from "@/config/verticals";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { isSuperAdmin } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/session";
import { BRAND_NAME } from "@/lib/brand";
import { deliverLead, type LeadPayload } from "@/lib/crm";
import { recordAdminEvent } from "@/lib/admin-events";
import { rootDomain } from "@/lib/inbox-address";
import {
  attachThreadToLead,
  composeInbox,
  formatEmailWhen,
  getInboxThread,
  isThreadKey,
  sendInboxReply,
  setInboxThreadArchived,
  type InboxViewer,
  type SendOutcome,
} from "@/lib/inbox";
import { esInbox } from "@/i18n/es-e2";

const ROUTE = "/admin/inbox";

function viewerOf(user: SessionUser): InboxViewer {
  return { userId: user.id, superAdmin: isSuperAdmin(user.role) };
}

function threadKeyFrom(formData: FormData): string | null {
  const k = String(formData.get("thread") ?? "");
  return isThreadKey(k) && !k.startsWith("lead-") ? k : null;
}

function outcomeCode(out: SendOutcome): string {
  if (out.ok) return out.sent ? "email_sent" : "email_not_sent";
  return out.error === "empty" ? "email_empty" : out.error === "no_recipient" ? "email_no_recipient" : "email_not_found";
}

const quoteHeader = (name: string, at: Date) => esInbox.thread.quoteHeader(name, formatEmailWhen(at));

export async function replyInboxAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const thread = threadKeyFrom(formData);
  if (!thread) redirect(`${ROUTE}?msg=email_not_found`);
  const out = await sendInboxReply({
    viewer: viewerOf(user),
    threadKey: thread,
    body: String(formData.get("body") ?? ""),
    brand: BRAND_NAME,
    quoteHeader,
  });
  revalidatePath(ROUTE);
  redirect(`${ROUTE}/${thread}?msg=${outcomeCode(out)}`);
}

export async function composeAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const cc = String(formData.get("cc") ?? "")
    .split(/[,;\s]+/)
    .map((a) => a.trim())
    .filter(Boolean);
  const out = await composeInbox({
    viewer: viewerOf(user),
    mailbox: String(formData.get("mailbox") ?? ""),
    to: String(formData.get("to") ?? ""),
    cc,
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
    brand: BRAND_NAME,
  });
  revalidatePath(ROUTE);
  if (out.ok && out.threadKey) redirect(`${ROUTE}/${out.threadKey}?msg=${outcomeCode(out)}`);
  redirect(`${ROUTE}?msg=${outcomeCode(out)}&redactar=1`);
}

export async function archiveAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const thread = threadKeyFrom(formData);
  const archive = formData.get("archive") === "1";
  const n = thread ? await setInboxThreadArchived(viewerOf(user), thread, archive) : 0;
  revalidatePath(ROUTE);
  if (n === 0) redirect(`${ROUTE}?msg=email_not_found`);
  redirect(archive ? `${ROUTE}?msg=archived` : `${ROUTE}/${thread}?msg=unarchived`);
}

const convertSchema = z.object({
  leadType: z.enum(["buyer", "renter", "seller", "valuation", "landlord", "question"]),
  name: z.string().trim().max(140).optional(),
  // The same bound the public form applies (app/api/leads/route.ts).
  whatsapp: z.string().trim().min(6).max(30),
});

/**
 * "Convertir en consulta": a lead row written the way the public form writes
 * one — internal lane (the operator's), the door the mailbox belongs to,
 * `utm.source = "email:inbox"` as the marker (there is no `leads.source`
 * column, on purpose) — then the CRM copy in `after()`, exactly like
 * `app/api/leads/route.ts`. No operator alert: the operator made it.
 */
export async function convertToLeadAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const viewer = viewerOf(user);
  const thread = threadKeyFrom(formData);
  const messages = thread ? await getInboxThread(viewer, thread) : null;
  if (!thread || !messages) redirect(`${ROUTE}?msg=email_not_found`);

  const parsed = convertSchema.safeParse({
    leadType: formData.get("leadType"),
    name: formData.get("name") || undefined,
    whatsapp: formData.get("whatsapp"),
  });
  if (!parsed.success) redirect(`${ROUTE}/${thread}?msg=convert_invalid`);

  const firstIn = messages.find((m) => m.direction === "in") ?? messages[0];
  const email = firstIn.direction === "in" ? (firstIn.replyTo ?? firstIn.fromAddress) : null;
  const message = [firstIn.subject, firstIn.textBody?.trim() ?? ""].filter(Boolean).join("\n\n").slice(0, 2000);
  const vertical = VERTICALS[rootDomain()]?.key ?? DEFAULT_VERTICAL_KEY;
  const utm = { source: "email:inbox" };

  const [res] = await db.insert(leads).values({
    leadType: parsed.data.leadType,
    vertical,
    name: parsed.data.name ?? firstIn.fromName ?? null,
    whatsapp: parsed.data.whatsapp,
    email: email && email.length <= 190 ? email : null,
    message: message || null,
    utm,
    routedTo: "internal",
  });
  const leadId = Number((res as unknown as { insertId: number }).insertId);
  await attachThreadToLead(viewer, thread, leadId);
  await recordAdminEvent(user.id, "lead.from_email", "lead", leadId, { thread });

  const payload: LeadPayload & { leadId: number } = {
    leadId,
    leadType: parsed.data.leadType,
    vertical,
    name: parsed.data.name ?? firstIn.fromName ?? undefined,
    whatsapp: parsed.data.whatsapp,
    email: email ?? undefined,
    message: message || undefined,
    utm,
    routedTo: "internal",
  };
  after(async () => {
    try {
      await deliverLead(payload);
    } catch {
      /* the lead row is the record; a failed copy is not an incident */
    }
  });

  revalidatePath(ROUTE);
  revalidatePath("/admin/leads");
  redirect(`/admin/leads?q=${encodeURIComponent(parsed.data.whatsapp)}&msg=converted`);
}
