import { getAdminBadges } from "@/lib/admin-badges";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { leadPhoneKey } from "@/lib/panel-queries";
import { getLedgerPartner, LEDGER_LIMIT, parseLedgerKey, partnerLedger } from "@/lib/partner-ledger";
import { getPartnerTerms } from "@/lib/partner-terms";
import { formatUsd } from "@/lib/deal-form";
import { esDeals } from "@/i18n/es-deals";
import { esLedger } from "@/i18n/es-ledger";
import { adminTabs } from "../../../tabs";
import { PartnerTermsForm } from "../PartnerTermsForm";

export const metadata: Metadata = {
  title: esLedger.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FLASH: Record<string, { text: string; error?: boolean }> = {
  saved: { text: esLedger.saved },
  invalid: { text: esLedger.invalid, error: true },
};

function when(d: Date): string {
  return new Intl.DateTimeFormat("es-PY", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Asuncion" }).format(d);
}

/** One partner's ledger (plan-admin-next O2): every lead they got, newest first. */
export default async function PartnerLedgerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ key }, { msg }, user] = await Promise.all([params, searchParams, requireSuperAdmin()]);
  const ref = parseLedgerKey(decodeURIComponent(key));
  if (!ref) notFound();
  const partner = await getLedgerPartner(ref.kind, ref.id);
  if (!partner) notFound();
  const [badges, rows, terms] = await Promise.all([
    getAdminBadges(user),
    partnerLedger(ref.kind, ref.id),
    getPartnerTerms([ref]),
  ]);
  const t = esLedger;
  const flash = msg ? FLASH[msg] : undefined;

  return (
    <>
      <PanelBar title="Panel de administración" role={user.role} userName={user.name} tabs={adminTabs("deals", badges)} />
      <main className="panel site-main">
        {flash ? <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p> : null}
        <p className="panel-note">
          <Link href="/admin/negocios/socios">{t.back}</Link>
        </p>
        <h2 className="panel-section__title">{t.detailTitle(partner.name)}</h2>

        <article className="panel-card">
          <h3 className="panel-card__title">{t.termsTitle}</h3>
          <p className="panel-note">{t.termsHint}</p>
          <PartnerTermsForm partnerKey={partner.key} terms={terms.get(partner.key)} back="detail" />
        </article>

        {rows.length === 0 ? (
          <p className="panel-empty">{t.detailEmpty}</p>
        ) : (
          <div className="panel-table__wrap">
            <table className="panel-table" data-ledger-detail>
              <thead>
                <tr>
                  {t.detailHead.map((h, i) => (
                    <th key={h} className={i === t.detailHead.length - 1 ? "panel-table__num" : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const phone = leadPhoneKey(r.whatsapp);
                  const href = `/admin/leads?vista=todas${/^\d{6,9}$/.test(phone) ? `&tel=${phone}` : ""}#lead-${r.leadId}`;
                  return (
                    <tr key={`${r.source}-${r.leadId}`}>
                      <td>{when(r.at)}</td>
                      <td>{t.source[r.source]}</td>
                      <td>
                        <Link href={href}>
                          #{r.leadId} {r.name ?? ""}
                        </Link>
                        <div className="panel-card__meta">{t.leadType[r.leadType] ?? r.leadType}</div>
                      </td>
                      <td>{r.listingTitle ?? "—"}</td>
                      <td>
                        {r.shareState ? t.shareState[r.shareState] : "—"}
                        {r.revoked ? ` ${t.revoked}` : ""}
                      </td>
                      <td>{t.leadStatus[r.leadStatus] ?? r.leadStatus}</td>
                      <td>{r.dealStage ? esDeals.stage[r.dealStage] : "—"}</td>
                      <td className="panel-table__num">{formatUsd(r.myShareUsd)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.length >= LEDGER_LIMIT ? <p className="panel-note">{t.limitNote(LEDGER_LIMIT)}</p> : null}
      </main>
    </>
  );
}
