/**
 * The WhatsApp auto-responder (PR 3): after an inbound message is stored, send
 * at most one automatic message — an AI reply, a hand-off line, or the static
 * greeting — when the founder's switches in /admin/ajustes allow it. Runs in
 * the webhook's `after()`, never in the request.
 *
 * Every rule is in `whatsapp-auto-policy.ts` (pure, verified). This module
 * only gathers the state, calls the model through `draftReplyFor()` (the one
 * LLM entry point, `src/lib/ai-reply.ts`) and sends through
 * `sendAndRecordWhatsApp()` (the one write path, which refuses outside the
 * 24-hour window). Automatic rows carry `sent_by_user_id` NULL and an
 * `auto_kind`, and show as "automático" in every thread.
 *
 * Never throws: a failure here must not look like a failed webhook.
 */
import "server-only";
import { DEFAULT_VERTICAL_KEY, VERTICALS, type VerticalConfig } from "@/config/verticals";
import { draftReplyFor, isAiReplyEnabled, leadContext, loadLeadContextUnchecked } from "@/lib/ai-reply";
import { rootDomain } from "@/lib/inbox-address";
import { getWhatsAppAutoSettings } from "@/lib/site-settings";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import {
  contactAutoStats,
  getWhatsAppContact,
  listContactMessages,
  sendAndRecordWhatsApp,
  whatsappToAiMessages,
  type StoredWhatsApp,
} from "@/lib/whatsapp-inbox";
import {
  decideAutoAction,
  describeOfficeHours,
  isOfficeOpen,
  parseCooldownHours,
  parseOfficeHours,
  type AutoDecision,
} from "@/lib/whatsapp-auto-policy";
import { esWhatsApp } from "@/i18n/es-whatsapp";
import { enWhatsApp } from "@/i18n/en-whatsapp";

/** The automatic sender's actor id in `admin_events` (no user). */
const AUTO_ACTOR = { id: 0 };

/**
 * One run per contact at a time in this process: two messages a second apart
 * must not both pass the cooldown check and both get an answer.
 */
const running = new Set<string>();

function businessDoor(): VerticalConfig {
  return VERTICALS[rootDomain()] ?? Object.values(VERTICALS).find((v) => v.key === DEFAULT_VERTICAL_KEY)!;
}

export interface AutoOutcome {
  decision: AutoDecision["action"] | "skipped";
  sent: boolean;
  detail?: string;
}

export async function runWhatsAppAutoResponder(msg: StoredWhatsApp): Promise<AutoOutcome> {
  if (msg.status !== "stored" || !isWhatsAppConfigured()) return { decision: "skipped", sent: false };
  const phone = msg.contactPhone;
  if (running.has(phone)) return { decision: "skipped", sent: false, detail: "busy" };
  running.add(phone);
  try {
    return await respond(msg);
  } catch (e) {
    console.warn(`[whatsapp-auto] ${e instanceof Error ? e.name : "error"}`);
    return { decision: "skipped", sent: false, detail: "error" };
  } finally {
    running.delete(phone);
  }
}

async function respond(msg: StoredWhatsApp): Promise<AutoOutcome> {
  const settings = await getWhatsAppAutoSettings({ uncached: true });
  if (!settings.greetingEnabled && !settings.aiEnabled) return { decision: "none", sent: false, detail: "off" };

  const phone = msg.contactPhone;
  const now = new Date();
  const hours = parseOfficeHours(settings.officeHoursRaw);
  const [stats, leadBase] = await Promise.all([
    contactAutoStats(phone),
    msg.leadId ? loadLeadContextUnchecked(msg.leadId) : Promise.resolve(null),
  ]);
  const door = leadBase?.door ?? businessDoor();
  const t = door.locale === "en" ? enWhatsApp.auto : esWhatsApp.auto;

  const state = {
    now,
    greetingEnabled: settings.greetingEnabled,
    aiEnabled: settings.aiEnabled,
    aiConfigured: isAiReplyEnabled(),
    officeOpen: isOfficeOpen(hours, now),
    firstContact: msg.firstContact,
    text: msg.body,
    humanReplied: stats.humanReplied,
    lastAiAt: stats.lastAiAt,
    lastGreetingAt: stats.lastGreetingAt,
    handoffSent: stats.handoffSent,
    cooldownHours: parseCooldownHours(settings.cooldownRaw),
  };
  let decision = decideAutoAction(state);

  const send = async (body: string, autoKind: "greeting" | "ai" | "handoff") => {
    const out = await sendAndRecordWhatsApp({ to: phone, body, leadId: msg.leadId, userId: null, autoKind });
    return out.ok && out.sent;
  };

  if (decision.action === "ai") {
    const messages = whatsappToAiMessages(await listContactMessages(phone));
    const contact = await getWhatsAppContact(phone);
    const ctx = leadBase
      ? { ...leadContext(leadBase, "whatsapp", messages, null), mode: "auto" as const }
      : {
          channel: "whatsapp" as const,
          brand: door.brand,
          locale: door.locale,
          lead: contact?.name ? { type: "question", name: contact.name, message: null } : null,
          listing: null,
          messages,
          agentName: null,
          mode: "auto" as const,
        };
    const draft = await draftReplyFor(AUTO_ACTOR, { type: "whatsapp", id: msg.id }, ctx);
    if (draft.ok && draft.confident) {
      return { decision: "ai", sent: await send(draft.text, "ai") };
    }
    if ((draft.ok && !draft.confident) || (!draft.ok && draft.error === "unsafe")) {
      // The model was unsure, or its draft named a contact detail it had no
      // right to: a person takes it from here.
      return { decision: "handoff", sent: await send(t.handoff(door.brand), "handoff"), detail: "model" };
    }
    // The provider failed, was rate-limited or had nothing to answer: no AI
    // message this time — the greeting rules still apply.
    decision = decideAutoAction({ ...state, aiEnabled: false });
  }

  if (decision.action === "handoff") {
    return { decision: "handoff", sent: await send(t.handoff(door.brand), "handoff"), detail: decision.reason };
  }
  if (decision.action === "greeting") {
    const described = describeOfficeHours(hours, t.hoursWords);
    // Every day closed leaves no hours to quote: say the neutral line instead.
    const body =
      decision.kind === "closed" && described ? t.greetingClosed(door.brand, described) : t.greetingFirst(door.brand);
    return { decision: "greeting", sent: await send(body, "greeting") };
  }
  return { decision: decision.action, sent: false, detail: decision.action === "none" ? decision.reason : undefined };
}
