import { getAdminBadges } from "@/lib/admin-badges";
import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getAnalyticsRawDays, getBusinessMode } from "@/lib/site-settings";
import { CONTACT_WHATSAPP } from "@/config/contact";
import { esAgency } from "@/i18n/es-agency";
import { adminTabs } from "../tabs";
import { saveHouseAgencyAction, saveSettingsAction, saveWhatsAppAutoAction } from "./actions";
import { getHouseAgencyId } from "@/lib/site-settings";
import { listAgencies } from "@/lib/panel-queries";
import { esTriage } from "@/i18n/es-triage";
import { getWhatsAppAutoSettings } from "@/lib/site-settings";
import { describeOfficeHours, parseCooldownHours, parseOfficeHours } from "@/lib/whatsapp-auto-policy";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { isAiReplyEnabled } from "@/lib/ai-reply";
import { esWhatsApp } from "@/i18n/es-whatsapp";
import { BRAND_NAME } from "@/lib/brand";
import { aiReplyConfig, aiReplyUsageThisMonth } from "@/lib/ai-reply";
import { esAiReply } from "@/i18n/es-ai";

export const metadata: Metadata = {
  title: esAgency.title,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FLASH: Record<string, { text: string; error?: boolean }> = {
  saved: { text: esAgency.saved },
  invalid: { text: esAgency.invalid, error: true },
  wa_saved: { text: esWhatsApp.settings.saved },
  wa_invalid: { text: esWhatsApp.settings.invalid, error: true },
  house_saved: { text: esTriage.settings.houseSaved },
  house_invalid: { text: esTriage.settings.houseInvalid, error: true },
};

/**
 * Site-wide switches (`site_settings`): the business mode
 * (docs/plan-agency-2026-09-26.md batch 3) and how long raw analytics events
 * are kept. Super-admin only.
 */
export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  const [badges, mode, rawDays, aiUsage, waAuto] = await Promise.all([
    getAdminBadges(user),
    getBusinessMode(),
    getAnalyticsRawDays(),
    // A usage line is not worth an error page.
    aiReplyUsageThisMonth().catch(() => null),
    getWhatsAppAutoSettings(),
  ]);
  const [houseAgencyId, agencyOptions] = await Promise.all([getHouseAgencyId(), listAgencies()]);
  const hs = esTriage.settings;
  const ai = aiReplyConfig();
  const waHours = parseOfficeHours(waAuto.officeHoursRaw);
  const ws = esWhatsApp.settings;
  const wa = esWhatsApp.auto;
  const flash = msg ? FLASH[msg] : undefined;
  const t = esAgency;

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("settings", badges)}
      />
      <main className="panel site-main">
        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p>
        ) : null}
        <h2 className="panel-section__title">{t.title}</h2>
        <form action={saveSettingsAction} className="panel-form">
          <article className="panel-card">
            <h3 className="panel-section__title">{t.modeTitle}</h3>
            <p className="panel-note">{t.modeHint}</p>
            <p className="panel-note">
              <strong>
                {t.modeCurrent(mode === "agency" ? t.modeAgency : t.modeMarketplace)}
              </strong>
            </p>
            <label className="panel-form__field">
              <span>
                <input
                  type="radio"
                  name="businessMode"
                  value="marketplace"
                  defaultChecked={mode === "marketplace"}
                />{" "}
                <strong>{t.modeMarketplace}</strong>
              </span>
              <span className="auth-field__hint">{t.modeMarketplaceBody}</span>
            </label>
            <label className="panel-form__field">
              <span>
                <input
                  type="radio"
                  name="businessMode"
                  value="agency"
                  defaultChecked={mode === "agency"}
                />{" "}
                <strong>{t.modeAgency}</strong>
              </span>
              <span className="auth-field__hint">{t.modeAgencyBody}</span>
            </label>
            <h4>{t.checksTitle}</h4>
            <ul className="panel-note">
              <li>
                {CONTACT_WHATSAPP
                  ? t.checkWhatsappOk(CONTACT_WHATSAPP)
                  : t.checkWhatsappMissing}
              </li>
              <li>{t.checkLegal}</li>
              <li>{t.checkCopy}</li>
              <li>{t.checkPrivacy}</li>
            </ul>
          </article>

          <article className="panel-card">
            <h3 className="panel-section__title">{t.analyticsTitle}</h3>
            <label className="panel-form__field">
              <span className="auth-field__label">{t.analyticsDaysLabel}</span>
              <input
                className="auth-field__input"
                name="analyticsRawDays"
                type="number"
                min={30}
                max={3650}
                step={1}
                defaultValue={rawDays}
                required
              />
              <span className="auth-field__hint">{t.analyticsDaysHint}</span>
            </label>
          </article>

          <button className="panel-btn panel-btn--primary" type="submit">
            {t.save}
          </button>
        </form>

        <form action={saveWhatsAppAutoAction} className="panel-form" id="whatsapp">
          <article className="panel-card">
            <h3 className="panel-section__title">{ws.title}</h3>
            <p className="panel-note">{ws.hint}</p>
            {!isWhatsAppConfigured() ? <p className="panel-note">{ws.notConfigured}</p> : null}
            <label className="panel-form__field">
              <span>
                <input type="checkbox" name="greetingEnabled" defaultChecked={waAuto.greetingEnabled} /> <strong>{ws.greetingLabel}</strong>
              </span>
              <span className="auth-field__hint">{ws.greetingBody}</span>
            </label>
            <label className="panel-form__field">
              <span>
                <input type="checkbox" name="aiEnabled" defaultChecked={waAuto.aiEnabled} /> <strong>{ws.aiLabel}</strong>
              </span>
              <span className="auth-field__hint">
                {ws.aiBody}
                {!isAiReplyEnabled() ? ` ${ws.aiNeedsKey}` : ""}
              </span>
            </label>
            <label className="panel-form__field">
              <span className="auth-field__label">{ws.cooldownLabel}</span>
              <input
                className="auth-field__input"
                name="aiCooldownHours"
                type="number"
                min={1}
                max={168}
                step={1}
                defaultValue={parseCooldownHours(waAuto.cooldownRaw)}
                required
              />
            </label>
            <h4>{ws.hoursTitle}</h4>
            <p className="panel-note">{ws.hoursHint}</p>
            {(
              [
                ["weekdays", ws.weekdays, waHours.weekdays],
                ["saturday", ws.saturday, waHours.saturday],
                ["sunday", ws.sunday, waHours.sunday],
              ] as const
            ).map(([key, label, day]) => (
              <div key={key} className="panel-form" style={{ alignItems: "flex-end" }}>
                <span className="auth-field__label" style={{ minWidth: 140 }}>{label}</span>
                <label className="panel-form__field">
                  <span className="auth-field__label">{ws.open}</span>
                  <input className="auth-field__input" type="time" name={`${key}Open`} defaultValue={day?.[0] ?? ""} />
                </label>
                <label className="panel-form__field">
                  <span className="auth-field__label">{ws.close}</span>
                  <input className="auth-field__input" type="time" name={`${key}Close`} defaultValue={day?.[1] ?? ""} />
                </label>
              </div>
            ))}
            <h4>{ws.previewTitle}</h4>
            <ul className="panel-note">
              <li>{wa.greetingFirst(BRAND_NAME)}</li>
              <li>{wa.greetingClosed(BRAND_NAME, describeOfficeHours(waHours, wa.hoursWords))}</li>
              <li>{wa.handoff(BRAND_NAME)}</li>
            </ul>
          </article>
          <button className="panel-btn panel-btn--primary" type="submit">
            {ws.save}
          </button>
        </form>

        <form action={saveHouseAgencyAction} className="panel-form" id="mi-inmobiliaria">
          <article className="panel-card">
            <h3 className="panel-section__title">{hs.houseTitle}</h3>
            <p className="panel-note">{hs.houseHint}</p>
            <label className="panel-form__field">
              <span className="auth-field__label">{hs.houseLabel}</span>
              <select className="panel-select" name="houseAgencyId" defaultValue={String(houseAgencyId ?? 0)}>
                <option value="0">{hs.houseNone}</option>
                {agencyOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </article>
          <button className="panel-btn panel-btn--primary" type="submit">
            {hs.houseSave}
          </button>
        </form>

        <article className="panel-card">
          <h3 className="panel-section__title">{esAiReply.usage.title}</h3>
          <p className="panel-note">
            {ai ? esAiReply.usage.on(ai.provider === "claude" ? "Claude" : "Gemini", ai.model) : esAiReply.usage.off}
          </p>
          {aiUsage ? (
            <>
              <p className="panel-note">
                {esAiReply.usage.month(
                  aiUsage.calls,
                  (aiUsage.inputTokens + aiUsage.outputTokens).toLocaleString("es-PY"),
                  `US$ ${aiUsage.costUsd.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                )}
              </p>
              <p className="panel-note">{esAiReply.usage.estimateNote}</p>
            </>
          ) : null}
        </article>
      </main>
    </>
  );
}
