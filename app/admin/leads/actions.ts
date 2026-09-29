"use server";

/**
 * /admin/leads actions: follow-up state and note, D3 matching (propose up to
 * three professionals for a directory seller lead, record the hand-off), and
 * sharing a lead with a partner so it shows in their /agencia/leads, and the
 * lead's deal (super-admin only).
 *
 * Matching messages nobody: the WhatsApp link is the delivery, a human
 * clicks it, and `markMatchSent` records that it happened — the same rule as
 * `alertOperator`/`sendOtp`: never write a line that pretends a message was
 * delivered. The one outbound message here is the share notice — by email
 * (wave E1) and on Telegram to partners who linked a chat (plan-agency batch
 * 4) — sent after the response and only on the channels that are configured.
 */
import { isStaff } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { requireStaffOrAbove, requireSuperAdmin } from "@/lib/auth/guards";
import { parseOperatorDealForm } from "@/lib/deal-form";
import { deleteOperatorDeal, upsertOperatorDeal } from "@/lib/deals";
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
import { telegramShareNotice } from "@/lib/partner-alerts";
import { BRAND_NAME } from "@/lib/brand";
import { siteOrigin } from "@/lib/origin";
import { recordAdminEvent } from "@/lib/admin-events";
import { handleLeadEmailForm } from "@/lib/inbox-access";
import { suggestLeadEmailReply, type SuggestOutcome } from "@/lib/ai-reply";
import {
  findLeadListing,
  leadLaneFor,
  leadOwnerContact,
  recordLead,
  sendLeadCopies,
  type LeadLane,
  type LeadListing,
  type LeadType,
} from "@/lib/lead-intake";
import { toInternationalPhone } from "@/lib/crm";
import { allowRequest } from "@/lib/rate-limit";
import { parseListingRef } from "@/lib/urls";
import { VERTICALS } from "@/config/verticals";
import { currentVertical } from "@/lib/vertical-context";
import { isAgencyMode } from "@/lib/site-settings";
import { esWa } from "@/i18n/es-wa";
import {
  WHATSAPP_MANUAL_SOURCE,
  type WhatsappLeadState,
} from "@/lib/whatsapp-lead";

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
        await Promise.allSettled([
          ...recipients.map((r) =>
            r.email
              ? emailShareNotice({
                  to: r.email,
                  locale: r.locale,
                  brand: BRAND_NAME,
                  count,
                  url: inboxUrl,
                })
              : null,
          ),
          // Batch 4: the same "go look" on Telegram, to whoever linked a chat.
          // No buyer data — see src/lib/partner-alerts.ts.
          telegramShareNotice({ target: who, leadIds: shared, inboxUrl }),
        ]);
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

/**
 * Save a lead's deal (plan-agency batch 6) — super-admin only. The guard
 * redirects anyone else, and `upsertOperatorDeal()` re-checks the role itself,
 * because it is the one writer of the money columns: staff and partners are
 * refused there too, whoever calls it.
 */
export async function saveDealAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const target = backTarget(formData);
  // Back to the same card, its "Negocio" block open (`negocio=`), so an
  // error is read next to the form that caused it.
  const to = (msg: string, leadId: number) =>
    leadId ? `${withMsg(target, msg)}&negocio=${leadId}#lead-${leadId}` : withMsg(target, msg);

  const input = parseOperatorDealForm(formData);
  if (!input) {
    redirect(to("deal_invalid", toId(formData.get("leadId"))));
  }

  const res = await upsertOperatorDeal(user, input);
  if (!res.ok) {
    const msg =
      res.error === "forbidden"
        ? "deal_forbidden"
        : res.error === "bad_partner"
          ? "deal_partner"
          : "deal_invalid";
    redirect(to(msg, input.leadId));
  }
  if (res.changed.length > 0) {
    await recordAdminEvent(user.id, "deal.update", "lead", input.leadId, {
      stage: input.stage,
      changed: res.changed.join(","),
    });
  }

  revalidatePath(ROUTE);
  revalidatePath("/admin/negocios");
  redirect(to("deal_saved", input.leadId));
}

/** The word the operator types to confirm a deal delete (the /admin/propiedades pattern). */
const DELETE_CONFIRM_WORD = "BORRAR";

/**
 * Delete a lead's deal — super-admin only, and only after the confirm word.
 * `deleteOperatorDeal()` re-checks the role itself. The history line keeps
 * what the deal held (money included; /admin/historial is super-admin only),
 * so a mistaken delete can be typed back in from it.
 */
export async function deleteDealAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const target = backTarget(formData);
  const leadId = toId(formData.get("leadId"));
  const to = (msg: string) =>
    leadId ? `${withMsg(target, msg)}&negocio=${leadId}#lead-${leadId}` : withMsg(target, msg);

  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== DELETE_CONFIRM_WORD) {
    redirect(to("deal_delete_confirm"));
  }

  const res = await deleteOperatorDeal(user, leadId);
  if (!res.ok) {
    redirect(to(res.error === "forbidden" ? "deal_forbidden" : "deal_gone"));
  }
  const d = res.deleted;
  await recordAdminEvent(user.id, "deal.delete", "lead", d.leadId, {
    deal_id: d.id,
    stage: d.stage,
    lost_reason: d.lostReason,
    agency_id: d.agencyId,
    agent_id: d.agentId,
    sale_price_usd: d.salePriceUsd,
    commission_pct: d.commissionPct,
    my_share_pct: d.mySharePct,
    my_share_usd: d.myShareUsd,
    paid_at: d.paidAt,
    note: d.note ? d.note.slice(0, 300) : null,
  });

  revalidatePath(ROUTE);
  revalidatePath("/admin/negocios");
  redirect(to("deal_deleted"));
}

/* ------------------------------------------------------------------ */
/* "Registrar consulta de WhatsApp"                                    */
/* ------------------------------------------------------------------ */

/** The types an operator can pick; "auto" follows the listing's operation. */
const WA_LEAD_TYPES: readonly LeadType[] = [
  "buyer",
  "renter",
  "seller",
  "valuation",
  "landlord",
  "question",
];

/** Per operator: far above a real inbox session, far below a runaway script. */
const WA_LOG_MAX = 60;
const WA_LOG_WINDOW_MS = 10 * 60_000;

/** `routed_to` in the panel's own words, for the confirmation line. */
const WA_LANE_LABEL: Record<LeadLane, string> = {
  agency: "Inmobiliaria",
  agent: "Agente",
  owner: "Particular",
  internal: "Interno",
  developer: "Desarrolladora",
};

function field(formData: FormData, name: string, max: number): string {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

/**
 * An enquiry that arrived on the operator's WhatsApp (the listing's wa.me
 * button), typed in by hand so it becomes a `leads` row like any other:
 * shareable with a partner, counted, copied to VenderCRM.
 *
 * It goes through the public form's own writer (`src/lib/lead-intake.ts`):
 * same lane precedence, same INSERT, same after-response copies. What
 * differs is only what a hand-typed lead has to: the door is picked in the
 * form (the operator knows which site the buyer came from; the request's host
 * is just where /admin is open), the marker is `utm.source = "whatsapp"`,
 * `medium = "manual"` (there is no `leads.source` column, on purpose), there
 * is no seeker confirmation email, and the operator alert fires only when a
 * staff member logged it — the super-admin does not need a ping about a lead
 * they just typed (the inbox's "Convertir en consulta" skips it too).
 *
 * The role is re-checked here, never trusted from the page. Returns form
 * state rather than redirecting so a typo (an unknown ref) keeps what the
 * operator typed.
 */
export async function logWhatsappLeadAction(
  _prev: WhatsappLeadState,
  formData: FormData,
): Promise<WhatsappLeadState> {
  const user = await requireStaffOrAbove();
  const t = esWa;

  const values = {
    whatsapp: field(formData, "whatsapp", 40),
    name: field(formData, "name", 140),
    ref: field(formData, "ref", 1000),
    message: field(formData, "message", 2000),
    leadType: field(formData, "leadType", 20),
    vertical: field(formData, "vertical", 40),
  };
  const fail = (message: string): WhatsappLeadState => ({
    ok: false,
    message,
    nonce: Date.now(),
    values,
  });

  if (!allowRequest(`wa-lead-log|${user.id}`, WA_LOG_MAX, WA_LOG_WINDOW_MS)) {
    return fail(t.errorRate);
  }

  // Stored in one spelling (+595…), the one VenderCRM and wa.me agree on.
  // 6–15 digits: the public form's lower bound, E.164's upper one.
  const digits = values.whatsapp.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) return fail(t.errorPhone);
  const whatsapp = toInternationalPhone(values.whatsapp);

  // A ref that does not resolve is refused, never saved as a lead about
  // nothing: the operator is looking at the code and can fix it.
  let listing: LeadListing | null = null;
  if (values.ref) {
    const publicId = parseListingRef(values.ref);
    listing = publicId ? await findLeadListing(publicId) : null;
    if (!listing) return fail(t.errorRef);
  }

  let leadType: LeadType;
  if (values.leadType === "auto" || values.leadType === "") {
    leadType = listing && listing.operation !== "venta" ? "renter" : "buyer";
  } else if ((WA_LEAD_TYPES as readonly string[]).includes(values.leadType)) {
    leadType = values.leadType as LeadType;
  } else {
    return fail(t.errorInvalid);
  }

  // An enabled door's key, else the door /admin is open on.
  const door =
    Object.values(VERTICALS).find((v) => v.enabled && v.key === values.vertical) ??
    (await currentVertical());

  const routedTo = leadLaneFor({ internal: await isAgencyMode(), listing });
  const utm = { source: WHATSAPP_MANUAL_SOURCE, medium: "manual" };

  const { leadId, payload } = await recordLead({
    leadType,
    vertical: door.key,
    listing,
    name: values.name || undefined,
    whatsapp,
    message: values.message || undefined,
    utm,
    routedTo,
  });
  await recordAdminEvent(user.id, "lead.from_whatsapp", "lead", leadId, {
    listing: listing?.publicId ?? null,
  });

  const owner = await leadOwnerContact(routedTo, listing);
  const origin = await siteOrigin();
  const staffLogged = isStaff(user.role);
  after(() =>
    sendLeadCopies({
      payload,
      owner,
      adminUrl: `${origin}/admin/leads`,
      ownerUrl: `${origin}/mis-avisos/consultas`,
      brand: door.brand,
      alertOperator: staffLogged,
    }),
  );

  revalidatePath(ROUTE);
  const lane = WA_LANE_LABEL[routedTo];
  const saved = listing ? t.savedListing(lane, listing.title) : t.saved(lane);
  return {
    ok: true,
    message:
      staffLogged && routedTo !== "internal"
        ? `${saved} ${t.savedHiddenFromStaff}`
        : saved,
    nonce: Date.now(),
  };
}

/**
 * "Sugerir respuesta" on a lead's email thread: a draft for the reply box,
 * never a send. The lead id is bound on the page but still client-supplied,
 * so `suggestLeadEmailReply()` asks `userMaySeeLead()` before loading it.
 */
export async function suggestLeadReplyAction(leadId: number): Promise<SuggestOutcome> {
  const user = await requireStaffOrAbove();
  return suggestLeadEmailReply(user, Number(leadId));
}
