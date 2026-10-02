import { getAdminBadges } from "@/lib/admin-badges";
import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { ledgerSummary, listLedgerPartners } from "@/lib/partner-ledger";
import { getPartnerTerms } from "@/lib/partner-terms";
import { formatPct, formatUsd } from "@/lib/deal-form";
import { esLedger } from "@/i18n/es-ledger";
import { adminTabs } from "../../tabs";
import { PartnerTermsForm } from "./PartnerTermsForm";

export const metadata: Metadata = {
  title: esLedger.metaTitle,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FLASH: Record<string, { text: string; error?: boolean }> = {
  saved: { text: esLedger.saved },
  invalid: { text: esLedger.invalid, error: true },
};

/**
 * The partner lead ledger (plan-admin-next O2): per Socio, what they got from
 * the site and what became of it, plus their usual split as an editable
 * suggestion. Super-admin only, like /admin/negocios.
 */
export default async function PartnerLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, user] = await Promise.all([searchParams, requireSuperAdmin()]);
  const partners = await listLedgerPartners();
  const [badges, rows, terms] = await Promise.all([
    getAdminBadges(user),
    ledgerSummary(partners),
    getPartnerTerms(partners),
  ]);
  const t = esLedger;
  const flash = msg ? FLASH[msg] : undefined;
  const n = (v: number) => v.toLocaleString("es-PY");

  return (
    <>
      <PanelBar title="Panel de administración" role={user.role} userName={user.name} tabs={adminTabs("deals", badges)} />
      <main className="panel site-main">
        {flash ? <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p> : null}
        <p className="panel-note">
          <Link href="/admin/negocios">← Negocios</Link>
        </p>
        <h2 className="panel-section__title">{t.title}</h2>
        <p className="panel-note">{t.hint}</p>
        <p className="panel-note">{t.attributionNote}</p>

        {rows.length === 0 ? (
          <p className="panel-empty">{t.empty}</p>
        ) : (
          <div className="panel-table__wrap">
            <table className="panel-table" data-ledger>
              <thead>
                <tr>
                  {t.head.map((h, i) => (
                    <th key={h} className={i > 0 && i < t.head.length - 1 ? "panel-table__num" : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const tr = terms.get(r.partner.key);
                  return (
                    <tr key={r.partner.key} data-partner={r.partner.key}>
                      <td className="panel-table__name">
                        <Link href={`/admin/negocios/socios/${r.partner.kind}-${r.partner.id}`}>{r.partner.name}</Link>
                        <div className="panel-card__meta">
                          {r.partner.kind === "agency" ? t.agency : t.agent}
                          {r.partner.isVerified ? "" : ` · ${t.unverified}`}
                        </div>
                      </td>
                      <td className="panel-table__num">{n(r.shared)}</td>
                      <td className="panel-table__num">{n(r.fromListings)}</td>
                      <td className="panel-table__num">{n(r.buyerSide)}</td>
                      <td className="panel-table__num">{n(r.sellerSide)}</td>
                      <td className="panel-table__num">{n(r.pending)}</td>
                      <td className="panel-table__num">{n(r.taken)}</td>
                      <td className="panel-table__num">{n(r.declined)}</td>
                      <td className="panel-table__num">{n(r.deals)}</td>
                      <td className="panel-table__num">{n(r.won)}</td>
                      <td className="panel-table__num">{n(r.lost)}</td>
                      <td className="panel-table__num">{formatUsd(r.myShareWonUsd)}</td>
                      <td>
                        {tr && (tr.commissionPct || tr.mySharePct)
                          ? t.split(formatPct(tr.commissionPct), formatPct(tr.mySharePct))
                          : t.splitNone}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {partners.length > 0 ? (
          <>
            <h3 className="panel-section__title" style={{ marginTop: 28 }}>{t.termsTitle}</h3>
            <p className="panel-note">{t.termsHint}</p>
            {partners.map((p) => (
              <article key={p.key} className="panel-card">
                <h4 style={{ margin: "0 0 8px" }}>{p.name}</h4>
                <PartnerTermsForm partnerKey={p.key} terms={terms.get(p.key)} back="list" />
              </article>
            ))}
          </>
        ) : null}
      </main>
    </>
  );
}
