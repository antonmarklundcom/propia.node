"use server";

/**
 * /admin/ajustes — site-wide switches in `site_settings`. Super-admin only:
 * the business mode changes what every public page renders.
 */
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { recordAdminEvent } from "@/lib/admin-events";
import { officeHoursFromForm, parseCooldownHours, parseOfficeHours } from "@/lib/whatsapp-auto-policy";
import {
  getAnalyticsRawDays,
  getBusinessMode,
  getWhatsAppAutoSettings,
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
