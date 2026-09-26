"use server";

/**
 * Super-admin user management actions. Same contract as the other panel
 * actions: every one re-checks requireSuperAdmin() before touching a row, and
 * the form is never trusted.
 *
 * Three lockout guards are enforced here rather than in the UI, because a
 * forged POST bypasses the UI entirely: you cannot change your own role, you
 * cannot delete your own account, and you cannot remove the last super-admin.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/guards";
import {
  countSuperAdmins,
  createPanelUser,
  getUserRole,
  deletePanelUser,
  linkUserToAgency,
  revokeUserSessions,
  updatePanelUser,
  type UserRoleValue,
} from "@/lib/panel-queries";
import { recordAdminEvent } from "@/lib/admin-events";

const ROUTE = "/admin/usuarios";

const ROLES: readonly UserRoleValue[] = [
  "consumer",
  "agent",
  "agency_admin",
  "developer",
  "staff",
  "admin",
];

function toId(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

function toRole(v: FormDataEntryValue | null): UserRoleValue | null {
  const s = String(v ?? "");
  return (ROLES as readonly string[]).includes(s) ? (s as UserRoleValue) : null;
}

function toLocale(v: FormDataEntryValue | null): "es" | "en" {
  return String(v ?? "") === "en" ? "en" : "es";
}

function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

/** Bounce back to the page with a flash code in the query string. */
function done(code: string): never {
  revalidatePath(ROUTE);
  redirect(`${ROUTE}?msg=${code}`);
}

export async function createUserAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const email = str(formData.get("email"));
  const password = str(formData.get("password"));
  const role = toRole(formData.get("role"));
  if (!email || !password || !role) done("invalid");

  const id = await createPanelUser({
    name: str(formData.get("name")) || null,
    email,
    role,
    locale: toLocale(formData.get("locale")),
    password,
  });

  done(id ? "created" : "email_taken");
}

export async function updateUserAction(formData: FormData): Promise<void> {
  const me = await requireSuperAdmin();

  const id = toId(formData.get("userId"));
  const email = str(formData.get("email"));
  const role = toRole(formData.get("role"));
  if (!id || !email || !role) done("invalid");

  // Changing your own role is how an admin locks themselves out of /admin.
  if (id === me.id && role !== me.role) done("self_role");

  // Demoting the only remaining admin leaves nobody who can promote one back.
  // The check is on the user being edited, read from the database: editing
  // anybody else (a staff member's name, a new password for an agent) must
  // not trip it just because there is one admin.
  const current = await getUserRole(id);
  if (!current) done("invalid");
  if (current === "admin" && role !== "admin" && (await countSuperAdmins()) <= 1) {
    done("last_admin");
  }

  const password = str(formData.get("password"));
  const ok = await updatePanelUser(id, {
    name: str(formData.get("name")) || null,
    email,
    role,
    locale: toLocale(formData.get("locale")),
    password: password || undefined,
  });

  if (!ok) done("email_taken");

  if (current !== role) {
    await recordAdminEvent(me.id, "user.role", "user", id, { from: current, to: role });
  }

  // A password change should not leave old cookies working elsewhere.
  if (password) {
    await revokeUserSessions(id);
    await recordAdminEvent(me.id, "user.password", "user", id);
    done("password_reset");
  }

  done("saved");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const me = await requireSuperAdmin();

  const id = toId(formData.get("userId"));
  if (!id) done("invalid");
  if (id === me.id) done("self_delete");

  // The role comes from the database, never from the form.
  const role = await getUserRole(id);
  if (!role) done("invalid");
  if (role === "admin" && (await countSuperAdmins()) <= 1) done("last_admin");

  await deletePanelUser(id);
  await recordAdminEvent(me.id, "user.delete", "user", id, { role });
  done("deleted");
}

export async function linkAgencyAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const userId = toId(formData.get("userId"));
  if (!userId) done("invalid");

  const raw = str(formData.get("agencyId"));
  const agencyId = raw === "" ? null : toId(raw) || null;

  await linkUserToAgency({
    userId,
    agencyId,
    fallbackName: str(formData.get("name")) || str(formData.get("email")) || "Agente",
  });

  done("agency_linked");
}
