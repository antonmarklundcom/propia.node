"use server";

/**
 * The realtor's answer to a lead the portal shared with them. The viewer is
 * resolved from the session (requireAgencyContext), never from the form, and
 * `setShareState()` applies the same visibility predicate the list uses — a
 * forged assignment id that is not theirs updates nothing.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgencyContext } from "@/lib/auth/guards";
import { setShareState, REALTOR_STATES, type ShareState } from "@/lib/lead-assignments";
import { handleLeadEmailForm } from "@/lib/inbox-access";

export async function setShareStateAction(formData: FormData): Promise<void> {
  const ctx = await requireAgencyContext();
  const assignmentId = Number(formData.get("assignmentId"));
  const state = String(formData.get("state") ?? "") as ShareState;

  const ok =
    Number.isInteger(assignmentId) &&
    assignmentId > 0 &&
    REALTOR_STATES.includes(state) &&
    (await setShareState({
      assignmentId,
      state,
      viewer: { agencyId: ctx.agencyId, userId: ctx.user.id },
    })) > 0;

  revalidatePath("/agencia/leads");
  redirect(`/agencia/leads?msg=${ok ? "share_saved" : "share_invalid"}`);
}

/**
 * A lead's email thread (wave E2) — reply or mark read. The lead must be on
 * this caller's own /agencia/leads page (own inbox or shared with them);
 * `handleLeadEmailForm()` re-checks that with the page's own predicates.
 */
export async function leadEmailAction(formData: FormData): Promise<void> {
  const ctx = await requireAgencyContext();
  const code = await handleLeadEmailForm(ctx.user, formData);
  revalidatePath("/agencia/leads");
  redirect(`/agencia/leads?msg=${code}`);
}
