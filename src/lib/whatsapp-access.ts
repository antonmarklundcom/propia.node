/**
 * The lead-card WhatsApp form every panel posts (reply, or mark read), after
 * the panel's own guard has run — the WhatsApp twin of `handleLeadEmailForm()`
 * in `inbox-access.ts`. The lead id comes from the form, so visibility is
 * re-checked here with `userMaySeeLead()`, never trusted. No new rule.
 *
 * Who may **send** is the caller's decision (`canSend`): the business number
 * is the founder's, so /admin (staff and super-admin, within their lead
 * visibility) sends and /agencia reads. See docs/decisions-needed.md.
 */
import "server-only";
import { userMaySeeLead } from "@/lib/inbox-access";
import {
  leadWhatsAppPhone,
  markLeadWhatsAppRead,
  sendAndRecordWhatsApp,
  sendAndRecordWhatsAppTemplate,
} from "@/lib/whatsapp-inbox";
import { esWhatsApp } from "@/i18n/es-whatsapp";

export type WaFlash =
  | "wa_sent"
  | "wa_not_sent"
  | "wa_empty"
  | "wa_outside_window"
  | "wa_no_recipient"
  | "wa_not_configured"
  | "wa_template_off"
  | "wa_template_invalid"
  | "wa_not_found"
  | "wa_marked";

export async function handleLeadWhatsAppForm(
  user: Parameters<typeof userMaySeeLead>[0],
  formData: FormData,
  canSend: boolean,
): Promise<WaFlash> {
  const leadId = Number(formData.get("leadId"));
  if (!(await userMaySeeLead(user, leadId))) return "wa_not_found";
  if (formData.get("mode") === "read") {
    await markLeadWhatsAppRead(leadId);
    return "wa_marked";
  }
  if (!canSend) return "wa_not_found";
  if (formData.get("mode") === "template") {
    return waOutcomeFlash(
      await sendAndRecordWhatsAppTemplate({
        to: await leadWhatsAppPhone(leadId),
        ...templateFormFields(formData),
        leadId,
        userId: user.id,
      }),
    );
  }
  const out = await sendAndRecordWhatsApp({
    to: await leadWhatsAppPhone(leadId),
    body: String(formData.get("body") ?? ""),
    leadId,
    userId: user.id,
  });
  return waOutcomeFlash(out);
}

/** The template name and its numbered variables (`p1`, `p2`, …) as the panel form posts them. */
export function templateFormFields(formData: FormData): { templateName: unknown; values: unknown[] } {
  const values: unknown[] = [];
  for (let i = 1; i <= 10; i++) values.push(formData.get(`p${i}`));
  return { templateName: formData.get("template"), values };
}

export function waOutcomeFlash(
  out: Awaited<ReturnType<typeof sendAndRecordWhatsApp>> | Awaited<ReturnType<typeof sendAndRecordWhatsAppTemplate>>,
): WaFlash {
  if (out.ok) return out.sent ? "wa_sent" : "wa_not_sent";
  switch (out.error) {
    case "template_off":
      return "wa_template_off";
    case "template_invalid":
      return "wa_template_invalid";
    case "empty":
      return "wa_empty";
    case "outside_window":
      return "wa_outside_window";
    case "no_recipient":
      return "wa_no_recipient";
    default:
      return "wa_not_configured";
  }
}

const f = esWhatsApp.flash;

/** Flash text for the pages' flash maps. */
export const LEAD_WHATSAPP_FLASH: Record<string, { text: string; error?: boolean }> = {
  wa_sent: { text: f.sent },
  wa_not_sent: { text: f.notSent, error: true },
  wa_empty: { text: f.empty, error: true },
  wa_outside_window: { text: f.outsideWindow, error: true },
  wa_no_recipient: { text: f.noRecipient, error: true },
  wa_not_configured: { text: f.notConfigured, error: true },
  wa_template_off: { text: f.templateOff, error: true },
  wa_template_invalid: { text: f.templateInvalid, error: true },
  wa_not_found: { text: f.notFound, error: true },
  wa_marked: { text: f.marked },
  wa_converted: { text: f.converted },
  wa_convert_invalid: { text: f.convertInvalid, error: true },
};
