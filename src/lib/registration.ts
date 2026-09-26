/**
 * Self-service sign-up for agencies, independent agents and private owners
 * (ARCHITECTURE.md M5; owners since plan-build 2026-09-26 A2). Until now every account was founder-created — a `users` row typed into
 * phpMyAdmin, then an `agents` row to link it. This is that sequence, done
 * atomically in one database transaction.
 *
 * What a new account may and may not do is deliberately unchanged from a
 * hand-made one: `is_verified` starts false on both the agency and the agent
 * (so no ✓ badge until you approve it), and listings still pass through the
 * review queue before they are public. Sign-up creates a *login*, not trust.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agencies, agents, users } from "@/db/schema";
import { uniqueAgencySlug } from "@/lib/agency-slug";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/slug";
import {
  consumeInvite,
  getUsableInvite,
  stampInviteUser,
} from "@/lib/agency-invites";

/**
 * Registering as a company creates an agencies row; an agent stands alone;
 * "invite" joins an agency that already exists, and is the only kind whose
 * agency and role come from somewhere other than the form.
 *
 * "owner" is the private seller (plan-build 2026-09-26, A2 Owner 1): a
 * `consumer` login with no agency and no `agents` row — the same account
 * /publicar already creates, reached without publishing first. No agents row
 * on purpose: it would put a private seller into /agente/[slug] with a
 * professional's trust signal (CLAUDE.md, FSBO loop).
 */
export type AccountKind = "agency" | "independent" | "invite" | "owner";

export interface RegistrationInput {
  kind: AccountKind;
  /** The person signing up. */
  name: string;
  email: string;
  password: string;
  whatsapp: string | null;
  /** Company name — required for kind === "agency", ignored otherwise. */
  agencyName: string | null;
  /** Invite token — required for kind === "invite", ignored otherwise. */
  inviteToken?: string | null;
}

export type RegistrationError =
  | "name"
  | "email"
  | "email_taken"
  | "whatsapp_taken"
  | "password"
  | "agency_name"
  | "invite";

export type RegistrationResult =
  | { ok: true; userId: number }
  | { ok: false; error: RegistrationError };

export const MIN_PASSWORD_LENGTH = 8;

/** Deliberately permissive: real addresses vary more than any regex allows. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

type RegistrationTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Same idea for agents.slug, which is also unique. */
async function uniqueAgentSlug(
  name: string,
  userId: number,
  tx: RegistrationTx,
): Promise<string> {
  const base = slugify(name) || "agente";
  const withId = `${base}-${userId}`;
  const [clash] = await tx
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.slug, withId))
    .limit(1);
  return clash ? `${withId}-${Date.now()}` : withId;
}

/**
 * Create the login plus its profile rows. Returns the new user id, or the
 * first field that failed — the caller maps that to a message and re-renders
 * the form, never a stack trace.
 *
 * Order matters: the users row is written first because everything else hangs
 * off its id, and the agencies row before the agents row that points at it.
 */
export async function registerAccount(
  input: RegistrationInput,
): Promise<RegistrationResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const agencyName = input.agencyName?.trim() ?? "";

  if (name.length < 2) return { ok: false, error: "name" };
  if (!looksLikeEmail(email)) return { ok: false, error: "email" };
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: "password" };
  }
  if (input.kind === "agency" && agencyName.length < 2) {
    return { ok: false, error: "agency_name" };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) return { ok: false, error: "email_taken" };

  // Hash before acquiring a transaction connection or locking an invitation.
  const passwordHash = await hashPassword(input.password);
  const whatsapp = input.whatsapp?.trim() || null;

  try {
    return await db.transaction(async (tx): Promise<RegistrationResult> => {
      let role: "agency_admin" | "agent" | "consumer" =
        input.kind === "agency"
          ? "agency_admin"
          : input.kind === "owner"
            ? "consumer"
            : "agent";
      let agencyId: number | null = null;
      let inviteId: number | null = null;
      if (input.kind === "invite") {
        const invite = await getUsableInvite(input.inviteToken?.trim() ?? "", tx);
        if (!invite || !(await consumeInvite(invite.id, tx))) {
          return { ok: false, error: "invite" };
        }
        agencyId = invite.agencyId;
        inviteId = invite.id;
        role = invite.role;
      }

      // Catch only this insert's unique constraints, never a profile slug error.
      let userId: number;
      try {
        const [created] = await tx
          .insert(users)
          .values({ name, email, role, locale: "es", passwordHash, whatsapp })
          .$returningId();
        if (!created) throw new Error("User insert did not produce a row");
        userId = created.id;
      } catch (error) {
        const field = duplicateUserField(error);
        // Throw through the transaction boundary so a claimed invite rolls back.
        if (field) throw new RegistrationConflict(field);
        throw error;
      }

      if (input.kind === "agency") {
        const [agency] = await tx
          .insert(agencies)
          .values({
            name: agencyName,
            slug: await uniqueAgencySlug(agencyName, tx),
            email,
            whatsapp,
            isVerified: false,
          })
          .$returningId();
        if (!agency) throw new Error("Agency insert did not produce a row");
        agencyId = agency.id;
      }

      // A private owner is a login and nothing more: /mis-avisos scopes on
      // owner_user_id, which needs no profile row.
      if (input.kind === "owner") return { ok: true, userId };

      await tx.insert(agents).values({
        agencyId,
        userId,
        name,
        slug: await uniqueAgentSlug(name, userId, tx),
        whatsapp,
        isVerified: false,
      });
      if (inviteId != null) await stampInviteUser(inviteId, userId, tx);
      return { ok: true, userId };
    });
  } catch (error) {
    if (error instanceof RegistrationConflict) {
      return { ok: false, error: error.field };
    }
    throw error;
  }
}

class RegistrationConflict extends Error {
  constructor(readonly field: "email_taken" | "whatsapp_taken") {
    super(field);
  }
}

/** mysql2 errors may be wrapped in DrizzleQueryError.cause. */
function duplicateUserField(error: unknown): "email_taken" | "whatsapp_taken" | null {
  if (!error || typeof error !== "object") return null;
  const e = error as {
    code?: string;
    sqlMessage?: string;
    message?: string;
    cause?: unknown;
  };
  if (e.code === "ER_DUP_ENTRY") {
    // Inspect the key name, not the duplicate value (which is user-controlled).
    const key = /for key ['"`]([^'"`]+)['"`]$/i
      .exec(e.sqlMessage ?? e.message ?? "")?.[1]?.split(".").pop();
    if (key === "users_whatsapp_unique") return "whatsapp_taken";
    if (key === "users_email_unique") return "email_taken";
  }
  return e.cause === error ? null : duplicateUserField(e.cause);
}
