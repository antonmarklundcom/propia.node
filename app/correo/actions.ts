"use server";

/**
 * A member's inbox actions (/correo): reply and archive. Every action needs a
 * signed-in user and hands the viewer to `src/lib/inbox.ts`, whose queries
 * carry the mailbox rule — a thread key outside the user's mailboxes matches
 * no row, and a read-only member's reply is refused before anything is sent
 * (`viewerMayWriteMailbox()` in `sendInboxReply()`).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { BRAND_NAME } from "@/lib/brand";
import { formatEmailWhen, isThreadKey, sendInboxReply, setInboxThreadArchived, type SendOutcome } from "@/lib/inbox";
import { inboxViewerFor } from "@/lib/inbox-viewer";
import { esInbox } from "@/i18n/es-e2";

const ROUTE = "/correo";

function threadKeyFrom(formData: FormData): string | null {
  const k = String(formData.get("thread") ?? "");
  return isThreadKey(k) && !k.startsWith("lead-") ? k : null;
}

function outcomeCode(out: SendOutcome): string {
  if (out.ok) return out.sent ? "email_sent" : "email_not_sent";
  return out.error === "empty" ? "email_empty" : out.error === "no_recipient" ? "email_no_recipient" : "email_not_found";
}

export async function replyMemberAction(formData: FormData): Promise<void> {
  const user = await requireUser(ROUTE);
  const thread = threadKeyFrom(formData);
  if (!thread) redirect(`${ROUTE}?msg=email_not_found`);
  const out = await sendInboxReply({
    viewer: await inboxViewerFor(user),
    threadKey: thread,
    body: String(formData.get("body") ?? ""),
    // A registered site sends under its own name (`sendAndRecordInbox()`); this is the fallback.
    brand: BRAND_NAME,
    quoteHeader: (name, at) => esInbox.thread.quoteHeader(name, formatEmailWhen(at)),
  });
  revalidatePath(ROUTE);
  redirect(`${ROUTE}/${thread}?msg=${outcomeCode(out)}`);
}

export async function archiveMemberAction(formData: FormData): Promise<void> {
  const user = await requireUser(ROUTE);
  const thread = threadKeyFrom(formData);
  const archive = formData.get("archive") === "1";
  const n = thread ? await setInboxThreadArchived(await inboxViewerFor(user), thread, archive) : 0;
  revalidatePath(ROUTE);
  if (n === 0) redirect(`${ROUTE}?msg=email_not_found`);
  redirect(archive ? `${ROUTE}?msg=archived` : `${ROUTE}/${thread}?msg=unarchived`);
}
