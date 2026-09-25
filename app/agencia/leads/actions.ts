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
