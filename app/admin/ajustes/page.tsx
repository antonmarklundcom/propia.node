import type { Metadata } from "next";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { countReviewQueue } from "@/lib/panel-queries";
import { getAnalyticsRawDays, getBusinessMode } from "@/lib/site-settings";
import { CONTACT_WHATSAPP } from "@/config/contact";
import { esAgency } from "@/i18n/es-agency";
import { adminTabs } from "../tabs";
import { saveSettingsAction } from "./actions";
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
  const [reviewCount, mode, rawDays, aiUsage] = await Promise.all([
    countReviewQueue(),
    getBusinessMode(),
    getAnalyticsRawDays(),
    // A usage line is not worth an error page.
    aiReplyUsageThisMonth().catch(() => null),
  ]);
  const ai = aiReplyConfig();
  const flash = msg ? FLASH[msg] : undefined;
  const t = esAgency;

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("settings", reviewCount)}
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
