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
import { parsePartnerStageForm } from "@/lib/deal-form";
import { setPartnerDealStage } from "@/lib/deals";
import { recordAdminEvent } from "@/lib/admin-events";

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

/**
 * The partner moves the deal of a lead shared with them (plan-agency batch
 * 6). Stage and lost reason only — the form has no money field and
 * `setPartnerDealStage()` writes none; it applies `sharedWithPanel()` to the
 * read and the write, so a forged lead id that is not theirs changes nothing.
 */
export async function setDealStageAction(formData: FormData): Promise<void> {
  const ctx = await requireAgencyContext();
  const input = parsePartnerStageForm(formData);
  const res = input
    ? await setPartnerDealStage({
        viewer: { agencyId: ctx.agencyId, userId: ctx.user.id },
        input,
      })
    : "invalid";
  if (res === "ok" && input) {
    // The operator's history: which partner moved which deal, and to what.
    await recordAdminEvent(ctx.user.id, "deal.stage", "lead", input.leadId, {
      stage: input.stage,
      ...(input.lostReason ? { lost_reason: input.lostReason } : {}),
    });
  }

  revalidatePath("/agencia/leads");
  revalidatePath("/admin/negocios");
  const anchor = input ? `#shared-${input.leadId}` : "";
  redirect(`/agencia/leads?msg=${res === "ok" ? "deal_saved" : "deal_invalid"}${anchor}`);
}
