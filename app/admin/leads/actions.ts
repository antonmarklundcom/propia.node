"use server";

/**
 * Super-admin: propose up to three professionals for a directory seller lead,
 * and record the hand-off when one is actually opened (D3).
 *
 * Nothing here messages anybody. The WhatsApp link is the delivery, a human
 * clicks it, and `markMatchSent` records that it happened — the same rule as
 * `alertOperator`/`sendOtp`: never write a line that pretends a message was
 * delivered.
 */
import { isStaff } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import {
  markMatchSent,
  proposeMatches,
  MAX_MATCHES_PER_LEAD,
} from "@/lib/matching";
import { updateLeadFollowUp, type LeadFollowUp } from "@/lib/panel-queries";

const FOLLOW_UP: readonly LeadFollowUp[] = ["new", "contacted", "closed"];
const NOTE_MAX = 2000;

const ROUTE = "/admin/leads";

function toId(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export async function proposeMatchesAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();

  const leadId = toId(formData.get("leadId"));
  if (!leadId) {
    revalidatePath(ROUTE);
    redirect(`${ROUTE}?msg=match_invalid`);
  }

  const agentIds = formData
    .getAll("agentId")
    .map((v) => toId(v))
    .filter((n) => n > 0);

  // The cap is enforced here, not by the checkboxes: "match 3" is the product
  // rule, and a form can post anything.
  if (agentIds.length === 0 || agentIds.length > MAX_MATCHES_PER_LEAD) {
    revalidatePath(ROUTE);
    redirect(`${ROUTE}?msg=match_limit`);
  }

  const created = await proposeMatches(leadId, agentIds, isStaff(user.role));
  revalidatePath(ROUTE);
  redirect(`${ROUTE}?msg=${created > 0 ? "match_saved" : "match_none"}`);
}

/**
 * Called from the WhatsApp hand-off link (a client component), not from a
 * form: the operator opens wa.me in a new tab and the click is recorded in
 * the same gesture.
 */
export async function markMatchSentAction(matchId: number): Promise<void> {
  const user = await requireStaffOrAbove();
  if (!Number.isInteger(matchId) || matchId <= 0) return;
  await markMatchSent(matchId, isStaff(user.role));
  revalidatePath(ROUTE);
}

/**
 * Save a lead's follow-up state and note. `back` returns the operator to the
 * filtered list they were on; anything that is not an /admin/leads URL is
 * ignored rather than followed.
 */
export async function updateLeadAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();

  const back = String(formData.get("back") ?? "");
  const target = back.startsWith(`${ROUTE}?`) || back === ROUTE ? back : ROUTE;

  const leadId = toId(formData.get("leadId"));
  const status = String(formData.get("status") ?? "") as LeadFollowUp;
  if (!leadId || !FOLLOW_UP.includes(status)) {
    revalidatePath(ROUTE);
    redirect(target);
  }

  const note =
    String(formData.get("note") ?? "")
      .trim()
      .slice(0, NOTE_MAX) || null;

  await updateLeadFollowUp({
    id: leadId,
    status,
    note,
    internalOnly: isStaff(user.role),
  });
  revalidatePath(ROUTE);
  redirect(target);
}
