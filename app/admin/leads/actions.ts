"use server";

/**
 * /admin/leads actions: follow-up state and note, D3 matching (propose up to
 * three professionals for a directory seller lead, record the hand-off), and
 * sharing a lead with a partner so it shows in their /agencia/leads.
 *
 * Matching messages nobody: the WhatsApp link is the delivery, a human
 * clicks it, and `markMatchSent` records that it happened — the same rule as
 * `alertOperator`/`sendOtp`: never write a line that pretends a message was
 * delivered. The one outbound message here is the share notice email (wave
 * E1), sent after the response and only when email is configured.
 */
import { isStaff } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import {
  markMatchSent,
  proposeMatches,
  MAX_MATCHES_PER_LEAD,
} from "@/lib/matching";
import { updateLeadFollowUp, type LeadFollowUp } from "@/lib/panel-queries";
import {
  revokeShare,
  shareLeads,
  shareRecipients,
  type ShareTarget,
} from "@/lib/lead-assignments";
import { emailShareNotice } from "@/lib/lead-emails";
import { BRAND_NAME } from "@/lib/brand";
import { siteOrigin } from "@/lib/origin";
import { recordAdminEvent } from "@/lib/admin-events";
import { handleLeadEmailForm } from "@/lib/inbox-access";

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

/** Where a share form sends the operator back to: an /admin/leads URL only. */
function backTarget(formData: FormData): string {
  const back = String(formData.get("back") ?? "");
  return back.startsWith(`${ROUTE}?`) || back === ROUTE ? back : ROUTE;
}

function withMsg(target: string, msg: string): string {
  return `${target}${target.includes("?") ? "&" : "?"}msg=${msg}`;
}

/** `agency:12` / `agent:7` from the target select — anything else is refused. */
function parseTarget(v: FormDataEntryValue | null): ShareTarget | null {
  const m = /^(agency|agent):(\d+)$/.exec(String(v ?? ""));
  if (!m) return null;
  const id = Number(m[2]);
  return id > 0 ? { kind: m[1] as ShareTarget["kind"], id } : null;
}

/**
 * Share one lead (the card's form) or many (the bulk bar: every checked
 * `leadIds`). Staff may share internal-lane leads only, verified targets only
 * — both enforced in `shareLeads()`, not by what the form offered.
 */
export async function shareLeadsAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const target = backTarget(formData);

  const who = parseTarget(formData.get("target"));
  const leadIds = formData.getAll("leadIds").map(toId).filter(Boolean);
  if (!who || leadIds.length === 0) redirect(withMsg(target, "share_invalid"));

  const note =
    String(formData.get("shareNote") ?? "").trim().slice(0, 280) || null;

  const shared = await shareLeads({
    leadIds,
    target: who,
    note,
    byUserId: user.id,
    internalOnly: isStaff(user.role),
  });
  for (const leadId of shared) {
    await recordAdminEvent(user.id, "lead.share", "lead", leadId, {
      target: `${who.kind}:${who.id}`,
    });
  }

  if (shared.length > 0) {
    // A go-look email to the partner, after the redirect is on its way. The
    // share is already saved; a failed or unconfigured email changes nothing.
    // BRAND_NAME, not brandName(): /admin is a staff surface on one host.
    const inboxUrl = `${await siteOrigin()}/agencia/leads`;
    const count = shared.length;
    after(async () => {
      try {
        const recipients = await shareRecipients(who);
        await Promise.allSettled(
          recipients.map((r) =>
            emailShareNotice({
              to: r.email,
              locale: r.locale,
              brand: BRAND_NAME,
              count,
              url: inboxUrl,
            }),
          ),
        );
      } catch {
        /* the share row is the record; an unsent notice is not an incident */
      }
    });
  }

  revalidatePath(ROUTE);
  redirect(withMsg(target, shared.length > 0 ? "shared" : "share_none"));
}

export async function revokeShareAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const target = backTarget(formData);

  const assignmentId = toId(formData.get("assignmentId"));
  const leadId = assignmentId
    ? await revokeShare({ assignmentId, internalOnly: isStaff(user.role) })
    : null;
  if (leadId) {
    await recordAdminEvent(user.id, "lead.revoke", "lead", leadId, {
      assignment: assignmentId,
    });
  }

  revalidatePath(ROUTE);
  redirect(withMsg(target, leadId ? "share_revoked" : "share_invalid"));
}

/**
 * A lead's email thread (wave E2): reply to the buyer, or mark their replies
 * read. `handleLeadEmailForm()` re-checks the lead against this user's own
 * visibility (staff: internal lane) before touching it.
 */
export async function leadEmailAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const code = await handleLeadEmailForm(user, formData);
  const target = backTarget(formData);
  revalidatePath(ROUTE);
  redirect(`${target}${target.includes("?") ? "&" : "?"}msg=${code}`);
}
