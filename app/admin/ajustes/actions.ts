"use server";

/**
 * /admin/ajustes — site-wide switches in `site_settings`. Super-admin only:
 * the business mode changes what every public page renders.
 */
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { recordAdminEvent } from "@/lib/admin-events";
import {
  getAnalyticsRawDays,
  getBusinessMode,
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
