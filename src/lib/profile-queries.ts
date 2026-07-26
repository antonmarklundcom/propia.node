/**
 * Profile editing for the people who supply the listings (ARCHITECTURE.md M5).
 * The columns existed from day one; the UI to change them did not, so an
 * agency that moved office or changed its WhatsApp had to ask the founder.
 *
 * Two scopes, and the difference is a real permission rather than cosmetics:
 * the *company* record belongs to the agency-admin account, while every user
 * owns their own public agent profile and their own login. An `agent` role
 * inside an agency can therefore fix their photo but not rename the company.
 *
 * Slugs are never rewritten here — `agencies.slug` and `agents.slug` address
 * public profile pages, and recomputing one on a rename would break every
 * inbound link (the same rule listing-edit.ts follows).
 */
import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, sessions, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";

export interface AgencyProfile {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  whatsapp: string | null;
  email: string | null;
  isVerified: boolean;
}

export interface AgentProfile {
  id: number;
  name: string;
  slug: string;
  photoUrl: string | null;
  whatsapp: string | null;
  isVerified: boolean;
  agencyId: number | null;
}

export async function getAgencyProfile(
  agencyId: number,
): Promise<AgencyProfile | null> {
  const [row] = await db
    .select({
      id: agencies.id,
      name: agencies.name,
      slug: agencies.slug,
      logoUrl: agencies.logoUrl,
      whatsapp: agencies.whatsapp,
      email: agencies.email,
      isVerified: agencies.isVerified,
    })
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1);
  return row ?? null;
}

/** The signed-in user's own agent row — the scope is their user id, always. */
export async function getOwnAgentProfile(
  userId: number,
): Promise<AgentProfile | null> {
  const [row] = await db
    .select({
      id: agents.id,
      name: agents.name,
      slug: agents.slug,
      photoUrl: agents.photoUrl,
      whatsapp: agents.whatsapp,
      isVerified: agents.isVerified,
      agencyId: agents.agencyId,
    })
    .from(agents)
    .where(eq(agents.userId, userId))
    .limit(1);
  return row ?? null;
}

/** Empty string → NULL, so a cleared field reads as "unset" everywhere. */
function orNull(value: string, max: number): string | null {
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

export interface AgencyProfileInput {
  name: string;
  logoUrl: string;
  whatsapp: string;
  email: string;
}

/**
 * Update the company record. `agencyId` comes from the session-resolved agency
 * context, never from the form, so this cannot be pointed at another agency.
 * Returns false when the name is empty — the one field the public site cannot
 * render without.
 */
export async function updateAgencyProfile(
  agencyId: number,
  input: AgencyProfileInput,
): Promise<boolean> {
  const name = input.name.trim().slice(0, 160);
  if (name.length < 2) return false;

  await db
    .update(agencies)
    .set({
      name,
      logoUrl: orNull(input.logoUrl, 500),
      whatsapp: orNull(input.whatsapp, 30),
      email: orNull(input.email, 190),
    })
    .where(eq(agencies.id, agencyId));
  return true;
}

export interface AgentProfileInput {
  name: string;
  photoUrl: string;
  whatsapp: string;
}

/** Update the caller's own agent row, scoped by user id in the WHERE clause. */
export async function updateOwnAgentProfile(
  userId: number,
  input: AgentProfileInput,
): Promise<boolean> {
  const name = input.name.trim().slice(0, 140);
  if (name.length < 2) return false;

  await db
    .update(agents)
    .set({
      name,
      photoUrl: orNull(input.photoUrl, 500),
      whatsapp: orNull(input.whatsapp, 30),
    })
    .where(eq(agents.userId, userId));
  return true;
}

export type AccountUpdate =
  | { ok: true; passwordChanged: boolean }
  | { ok: false; error: "invalid" | "email_taken" };

/**
 * The caller's own login: display name, email, optional new password.
 *
 * A password change drops every session row for the user — including the one
 * making the request — and the action then issues a fresh one, so a stolen
 * cookie cannot outlive the change while the person doing it stays signed in.
 */
export async function updateOwnAccount(
  userId: number,
  input: { name: string; email: string; password: string },
): Promise<AccountUpdate> {
  const name = input.name.trim().slice(0, 140);
  const email = input.email.trim().toLowerCase().slice(0, 190);
  if (name.length < 2 || !email.includes("@")) {
    return { ok: false, error: "invalid" };
  }
  if (input.password && input.password.length < 8) {
    return { ok: false, error: "invalid" };
  }

  const [clash] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, userId)))
    .limit(1);
  if (clash) return { ok: false, error: "email_taken" };

  const patch: Partial<typeof users.$inferInsert> = { name, email };
  if (input.password) patch.passwordHash = await hashPassword(input.password);
  await db.update(users).set(patch).where(eq(users.id, userId));

  if (input.password) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
    return { ok: true, passwordChanged: true };
  }
  return { ok: true, passwordChanged: false };
}
