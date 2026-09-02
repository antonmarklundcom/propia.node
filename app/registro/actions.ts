"use server";

/**
 * Sign-up action. The form supplies claims; everything that decides what the
 * account *is* — role, verification state, the agency link — is decided here
 * and in lib/registration.ts. A hidden field asking for `role` would be the
 * obvious hole, so no such field exists.
 *
 * On success the new user is logged straight in: making someone sign up and
 * then hunt for the login form is friction with no security value.
 */
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, getSessionUser } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/guards";
import { clientIpFrom } from "@/lib/client-ip";
import { allowRequest } from "@/lib/rate-limit";
import {
  registerAccount,
  type AccountKind,
  type RegistrationError,
} from "@/lib/registration";

/**
 * Sign-up is the one unauthenticated write that costs real CPU: `registerAccount`
 * runs scrypt at N=16384 before it touches the database, so a script hitting this
 * action in a loop burns the app process rather than the attacker's. On a host
 * that shares a 200-process cap with ~90 other sites, that is the 503 shape from
 * PLAN.md's post-mortem reached from the outside.
 *
 * Five per IP per ten minutes: an agency signing up its team from one office
 * connection is the widest honest burst anyone could describe, and it is well
 * under five. Same fixed-window helper as `/api/leads`, so the limits stay one
 * mechanism; per process, per `rate-limit.ts`.
 */
const REGISTER_MAX = 5;
const REGISTER_WINDOW_MS = 10 * 60_000;

function bounce(
  error: RegistrationError | "generic" | "throttled",
  kind: string,
  invite: string,
): never {
  const q = new URLSearchParams({ error, kind });
  // Keep the invitation across a failed submit, or the second attempt would
  // quietly create an unaffiliated account instead of joining the agency.
  if (invite) q.set("invite", invite);
  redirect(`/registro?${q.toString()}`);
}

export async function registerAction(formData: FormData): Promise<void> {
  // An already-signed-in visitor has no business creating a second account
  // from a stale tab.
  const current = await getSessionUser();
  if (current) redirect(homeForRole(current));

  const rawKind = String(formData.get("kind") ?? "");
  const invite = String(formData.get("invite") ?? "").trim();
  // "invite" only counts with a token to back it; registerAccount re-validates
  // that token and refuses the sign-up if it is spent, expired or forged.
  const kind: AccountKind =
    rawKind === "invite" && invite
      ? "invite"
      : rawKind === "agency"
        ? "agency"
        : "independent";

  // Before any hashing or insert: a refused attempt must cost nothing but this
  // Map lookup. `clientIpFrom` reads the proxy's own last hop, so the key
  // cannot be rotated by a spoofed x-forwarded-for.
  const ip = clientIpFrom(await headers());
  if (!allowRequest(`register|${ip}`, REGISTER_MAX, REGISTER_WINDOW_MS)) {
    bounce("throttled", kind, invite);
  }

  const result = await registerAccount({
    kind,
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? "") || null,
    agencyName: String(formData.get("agencyName") ?? "") || null,
    inviteToken: invite || null,
  });

  if (!result.ok) bounce(result.error, kind, invite);

  await createSession(result.userId);
  redirect("/agencia?msg=welcome");
}
