/**
 * The one place an `InboxViewer` is built from a signed-in user, so the
 * /admin pages, the member inbox, the attachment route and the AI suggester
 * cannot disagree about who may read which mailbox.
 *
 * - super-admin: every inbox thread (`superAdmin: true`);
 * - staff: the shared mailboxes, as before;
 * - anyone with memberships (`mailbox_members`): those mailboxes, read-only
 *   unless `can_reply`. A member with no staff role gets `shared: false` — the
 *   founder's `hola@`/`contacto@` are never theirs.
 *
 * The registry is optional at runtime: until its migration is applied the
 * lookup fails, and the viewer falls back to exactly what staff and the
 * super-admin saw before (a warning is logged), rather than taking the inbox
 * down.
 */
import "server-only";
import type { SessionUser } from "@/lib/auth/session";
import { isStaffOrAbove, isSuperAdmin } from "@/lib/auth/roles";
import type { InboxViewer } from "@/lib/inbox";
import { memberMailboxes, type MemberMailbox } from "@/lib/mail-sites";

export async function inboxViewerFor(user: SessionUser): Promise<InboxViewer> {
  let member: MemberMailbox[] = [];
  try {
    member = await memberMailboxes(user.id);
  } catch (e) {
    console.warn(`[inbox] memberships unavailable: ${e instanceof Error ? e.name : "error"}`);
  }
  return {
    userId: user.id,
    superAdmin: isSuperAdmin(user.role),
    shared: isStaffOrAbove(user.role),
    mailboxes: member.map((m) => m.address),
    writableMailboxes: member.filter((m) => m.canReply).map((m) => m.address),
  };
}
