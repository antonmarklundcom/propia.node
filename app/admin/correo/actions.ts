"use server";

/**
 * The mail-site registry's writes. Super-admin only, and the guard runs in
 * every action: a forged POST never touches the page's own checks. Each action
 * writes through `src/lib/mail-sites.ts` (the only module on the three tables)
 * and leaves one `mail.change` line in /admin/historial.
 *
 * Registering a site or a mailbox changes who can read mail. It never sends
 * anything, creates accounts or touches Cloudflare: a member must already be a
 * user, and the DNS and Email Sending steps are the founder's (the page lists
 * them).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAdminEvent } from "@/lib/admin-events";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { splitMailbox } from "@/lib/mail-address";
import {
  addMailboxMember,
  createMailbox,
  createMailSite,
  deleteMailbox,
  deleteMailSite,
  listMailSites,
  removeMailboxMember,
  updateMailSite,
} from "@/lib/mail-sites";

const ROUTE = "/admin/correo";

function done(code: string): never {
  revalidatePath(ROUTE);
  redirect(`${ROUTE}?msg=${code}`);
}

function num(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

/** A result's failure code, or `ok` — every write answers the same way. */
function code(r: { ok: boolean; error?: string }, ok: string): string {
  return r.ok ? ok : (r.error ?? "invalid");
}

async function log(userId: number, targetId: number, what: string, extra: Record<string, string | number> = {}) {
  await recordAdminEvent(userId, "mail.change", "mail", targetId, { what, ...extra });
}

export async function createSiteAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const r = await createMailSite({ domain: formData.get("domain"), displayName: formData.get("name") });
  if (r.ok && r.id) await log(user.id, r.id, "site_created", { domain: String(formData.get("domain") ?? "").trim().toLowerCase().slice(0, 100) });
  done(code(r, "site_created"));
}

export async function toggleSiteAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const id = num(formData.get("siteId"));
  const field = String(formData.get("field") ?? "");
  const on = formData.get("on") === "1";
  if (!id || (field !== "sendingEnabled" && field !== "active")) done("invalid");
  const r = await updateMailSite(id, field === "active" ? { active: on } : { sendingEnabled: on });
  if (r.ok) await log(user.id, id, `${field}=${on ? 1 : 0}`);
  done(code(r, "site_updated"));
}

export async function deleteSiteAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const id = num(formData.get("siteId"));
  if (!id) done("invalid");
  const r = await deleteMailSite(id);
  if (r.ok) await log(user.id, id, "site_deleted");
  done(code(r, "site_deleted"));
}

export async function createMailboxAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const siteId = num(formData.get("siteId"));
  if (!siteId) done("invalid");
  const r = await createMailbox({ siteId, localPart: formData.get("local"), label: formData.get("label") });
  if (r.ok && r.id) await log(user.id, r.id, "mailbox_created", { site: siteId });
  done(code(r, "mailbox_created"));
}

/** "Crear buzón" on an address that arrived with no owner: the address names its own site. */
export async function adoptAddressAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const parts = splitMailbox(formData.get("address"));
  if (!parts) done("invalid");
  const site = (await listMailSites()).find((s) => s.domain === parts.domain);
  if (!site) done("not_found");
  const r = await createMailbox({ siteId: site.id, localPart: parts.localPart });
  if (r.ok && r.id) await log(user.id, r.id, "mailbox_created", { site: site.id });
  done(code(r, "mailbox_created"));
}

export async function deleteMailboxAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const id = num(formData.get("mailboxId"));
  if (!id) done("invalid");
  const r = await deleteMailbox(id);
  if (r.ok) await log(user.id, id, "mailbox_deleted");
  done(code(r, "mailbox_deleted"));
}

export async function addMemberAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const mailboxId = num(formData.get("mailboxId"));
  if (!mailboxId) done("invalid");
  const r = await addMailboxMember({
    mailboxId,
    email: formData.get("email"),
    canReply: formData.get("canReply") === "1",
  });
  if (r.ok && r.id) await log(user.id, r.id, "member_added", { mailbox: mailboxId });
  done(code(r, "member_added"));
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const id = num(formData.get("memberId"));
  if (!id) done("invalid");
  const r = await removeMailboxMember(id);
  if (r.ok) await log(user.id, id, "member_removed");
  done(code(r, "member_removed"));
}
