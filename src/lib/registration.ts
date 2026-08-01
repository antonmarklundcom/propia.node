/**
 * Self-service sign-up for agencies and independent agents (ARCHITECTURE.md
 * M5). Until now every account was founder-created — a `users` row typed into
 * phpMyAdmin, then an `agents` row to link it. This is that sequence, done
 * safely and in one transaction-shaped call.
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

/** Registering as a company creates an agencies row; an agent stands alone. */
export type AccountKind = "agency" | "independent";

export interface RegistrationInput {
  kind: AccountKind;
  /** The person signing up. */
  name: string;
  email: string;
  password: string;
  whatsapp: string | null;
  /** Company name — required for kind === "agency", ignored otherwise. */
  agencyName: string | null;
}

export type RegistrationError =
  | "name"
  | "email"
  | "email_taken"
  | "password"
  | "agency_name";

export type RegistrationResult =
  | { ok: true; userId: number }
  | { ok: false; error: RegistrationError };

export const MIN_PASSWORD_LENGTH = 8;

/** Deliberately permissive: real addresses vary more than any regex allows. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Same idea for agents.slug, which is also unique. */
async function uniqueAgentSlug(name: string, userId: number): Promise<string> {
  const base = slugify(name) || "agente";
  const withId = `${base}-${userId}`;
  const [clash] = await db
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

  // An agency owner administers the company; an independent agent is an agent.
  // Both are agency roles, so both land in /agencia (see auth/roles.ts).
  const role = input.kind === "agency" ? "agency_admin" : "agent";

  await db.insert(users).values({
    name,
    email,
    role,
    locale: "es",
    passwordHash: await hashPassword(input.password),
    // whatsapp is unique in the schema; a blank string would collide on the
    // second signup, so an absent number stays NULL.
    whatsapp: input.whatsapp?.trim() || null,
  });

  const [created] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!created) return { ok: false, error: "email" };

  let agencyId: number | null = null;
  if (input.kind === "agency") {
    const slug = await uniqueAgencySlug(agencyName);
    await db.insert(agencies).values({
      name: agencyName,
      slug,
      email,
      whatsapp: input.whatsapp?.trim() || null,
      // Pending your approval — this is the ✓ badge, and it starts off.
      isVerified: false,
    });
    const [agency] = await db
      .select({ id: agencies.id })
      .from(agencies)
      .where(eq(agencies.slug, slug))
      .limit(1);
    agencyId = agency?.id ?? null;
  }

  // The agents row is the join requireAgencyContext() reads — without it the
  // new account would log in to an /agencia panel that resolves no agency.
  await db.insert(agents).values({
    agencyId,
    userId: created.id,
    name,
    slug: await uniqueAgentSlug(name, created.id),
    whatsapp: input.whatsapp?.trim() || null,
    isVerified: false,
  });

  return { ok: true, userId: created.id };
}
