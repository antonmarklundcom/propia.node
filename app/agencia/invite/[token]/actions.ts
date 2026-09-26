"use server";

/**
 * Accepting an invitation with an account that already exists.
 *
 * The action trusts exactly one thing from the request: the token. The agency
 * and the role are read off the invite row, the person is read off the session,
 * and the invite is claimed with a WHERE-guarded UPDATE before the membership
 * is written — so a link cannot be redeemed twice, by two tabs or two people.
 *
 * The claim, the membership, the move of the agent's own listings into the
 * agency (bug 6) and the admin_events line are one transaction:
 * redeemInviteForExistingAccount() in team-queries.ts.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { revalidateListings } from "@/lib/cache";
import { getUsableInvite } from "@/lib/agency-invites";
import { joinPreflight, redeemInviteForExistingAccount } from "@/lib/team-queries";

/** Back to the invitation screen with a reason. */
function back(token: string, msg: string): never {
  redirect(`/agencia/invite/${encodeURIComponent(token)}?msg=${msg}`);
}

export async function acceptInviteAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "").trim();
  const user = await requireUser(`/agencia/invite/${token}`);

  const invite = await getUsableInvite(token);
  if (!invite) back(token, "invalid");

  // Refuse before claiming, so an account that cannot join (already in an
  // agency, or the founder's own) does not burn a single-use link.
  const pre = await joinPreflight(user.id);
  if (pre !== "ok") back(token, pre);

  const { result } = await redeemInviteForExistingAccount({
    inviteId: invite.id,
    userId: user.id,
    agencyId: invite.agencyId,
    role: invite.role,
  });
  if (result !== "ok") back(token, result);

  // The agent's profile now names an agency, and any listings they brought
  // now show it: both cached sets change. revalidateListings() drops the
  // directory tag too.
  revalidateListings();
  revalidatePath("/agencia");
  redirect("/agencia?msg=joined");
}
