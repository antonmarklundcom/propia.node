"use server";

/**
 * /admin/ajustes — site-wide switches in `site_settings`. Super-admin only:
 * the business mode changes what every public page renders.
 */
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { recordAdminEvent } from "@/lib/admin-events";
import { officeHoursFromForm, parseCooldownHours, parseOfficeHours } from "@/lib/whatsapp-auto-policy";
import { templatesFromText } from "@/lib/reply-templates";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agencies } from "@/db/schema";
import {
  getAnalyticsRawDays,
  getBusinessMode,
  getHouseAgencyId,
  parseHouseAgencyId,
  getWhatsAppAutoSettings,
  getReplyTemplates,
  parseBusinessMode,
  parseRawDays,
  setSiteSetting,
  SETTING_KEYS,
} from "@/lib/site-settings";

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();

  const modeRaw = String(formData.get("businessMode") ?? "");
  const daysRaw = String(formData.get("analyticsRawDays") ?? "");
  if (modeRaw !== "agency" && modeRaw !== "marketplace") redirect("/admin/ajustes?msg=invalid");
  const days = Number(daysRaw);
  if (!Number.isInteger(days) || parseRawDays(daysRaw) !== days) {
    redirect("/admin/ajustes?msg=invalid");
  }

  const [currentMode, currentDays] = await Promise.all([
    getBusinessMode(),
    getAnalyticsRawDays(),
  ]);
  const mode = parseBusinessMode(modeRaw);
  if (mode !== currentMode) {
    await setSiteSetting(SETTING_KEYS.businessMode, mode, user.id);
    await recordAdminEvent(user.id, "setting.change", "setting", 0, {
      key: SETTING_KEYS.businessMode,
      from: currentMode,
      to: mode,
    });
  }
  if (days !== currentDays) {
    await setSiteSetting(SETTING_KEYS.analyticsRawDays, String(days), user.id);
    await recordAdminEvent(user.id, "setting.change", "setting", 0, {
      key: SETTING_KEYS.analyticsRawDays,
      from: currentDays,
      to: days,
    });
  }
  redirect("/admin/ajustes?msg=saved");
}

/**
 * The WhatsApp auto-responder's switches (src/lib/whatsapp-auto.ts). Each
 * change is one `setting.change` line in /admin/historial. Both switches
 * default off; turning the AI on is the founder's call
 * (docs/decisions-needed.md).
 */
export async function saveWhatsAppAutoAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const str = (k: string) => String(formData.get(k) ?? "");
  const hours = officeHoursFromForm({
    weekdaysOpen: str("weekdaysOpen"),
    weekdaysClose: str("weekdaysClose"),
    saturdayOpen: str("saturdayOpen"),
    saturdayClose: str("saturdayClose"),
    sundayOpen: str("sundayOpen"),
    sundayClose: str("sundayClose"),
  });
  const cooldownRaw = str("aiCooldownHours").trim();
  if (!hours || parseCooldownHours(cooldownRaw) !== Number(cooldownRaw)) {
    redirect("/admin/ajustes?msg=wa_invalid#whatsapp");
  }

  const current = await getWhatsAppAutoSettings();
  const next: Array<[string, string, string | null]> = [
    [SETTING_KEYS.waGreeting, formData.get("greetingEnabled") === "on" ? "true" : "false", current.greetingEnabled ? "true" : "false"],
    [SETTING_KEYS.waAi, formData.get("aiEnabled") === "on" ? "true" : "false", current.aiEnabled ? "true" : "false"],
    [SETTING_KEYS.waHours, JSON.stringify(hours), JSON.stringify(parseOfficeHours(current.officeHoursRaw))],
    [SETTING_KEYS.waAiCooldown, String(Number(cooldownRaw)), String(parseCooldownHours(current.cooldownRaw))],
  ];
  for (const [key, value, before] of next) {
    if (value === before) continue;
    await setSiteSetting(key, value, user.id);
    await recordAdminEvent(user.id, "setting.change", "setting", 0, { key, from: before, to: value });
  }
  redirect("/admin/ajustes?msg=wa_saved#whatsapp");
}

/**
 * "Mi inmobiliaria": the agency whose listings /admin labels "Propias"
 * (src/lib/publisher-kind.ts). Display only — it changes no public page and
 * no lead routing. "0" clears it. Logged in /admin/historial like the rest.
 */
export async function saveHouseAgencyAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const raw = String(formData.get("houseAgencyId") ?? "").trim();
  const id = raw === "0" || raw === "" ? null : parseHouseAgencyId(raw);
  if (raw !== "0" && raw !== "" && id === null) redirect("/admin/ajustes?msg=house_invalid#mi-inmobiliaria");
  if (id !== null) {
    const [row] = await db.select({ id: agencies.id }).from(agencies).where(eq(agencies.id, id)).limit(1);
    if (!row) redirect("/admin/ajustes?msg=house_invalid#mi-inmobiliaria");
  }
  const current = await getHouseAgencyId();
  if (current !== id) {
    await setSiteSetting(SETTING_KEYS.houseAgencyId, id === null ? "" : String(id), user.id);
    await recordAdminEvent(user.id, "setting.change", "setting", 0, {
      key: SETTING_KEYS.houseAgencyId,
      from: current,
      to: id,
    });
  }
  redirect("/admin/ajustes?msg=house_saved#mi-inmobiliaria");
}

/**
 * "Plantillas de respuesta": up to 20 saved texts (src/lib/reply-templates.ts),
 * one JSON array in `reply_templates`. Super-admin only; logged like every
 * other setting. A template is only ever copied into a textarea client-side.
 */
export async function saveReplyTemplatesAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const parsed = templatesFromText(String(formData.get("templates") ?? ""));
  if (!parsed.ok) redirect(`/admin/ajustes?msg=${parsed.error === "too_many" ? "tpl_many" : "tpl_long"}#plantillas`);
  const current = await getReplyTemplates({ uncached: true });
  const next = JSON.stringify(parsed.templates);
  if (next !== JSON.stringify(current)) {
    await setSiteSetting(SETTING_KEYS.replyTemplates, next, user.id);
    await recordAdminEvent(user.id, "setting.change", "setting", 0, {
      key: SETTING_KEYS.replyTemplates,
      from: current.length,
      to: parsed.templates.length,
    });
  }
  redirect("/admin/ajustes?msg=tpl_saved#plantillas");
}
