import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireAgencyContext } from "@/lib/auth/guards";
import { getAgencyListings } from "@/lib/panel-queries";
import { esPanel, listingStatusLabel } from "@/i18n/es";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import { listingUrl } from "@/lib/urls";
import { agencyTabs } from "./tabs";
import { setListingStatusAction } from "./actions";

export const metadata: Metadata = {
  title: "Tus propiedades — Homes Paraguay",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// The statuses an agency can set from the dashboard (mirrors actions.ts).
const AGENCY_STATUS_OPTIONS = ["draft", "published", "paused", "sold", "rented"];

export default async function AgencyListingsPage() {
  const { user, agencyId } = await requireAgencyContext();

  return (
    <>
      <PanelBar
        title="Panel de la inmobiliaria"
        role={user.role}
        userName={user.name}
        tabs={agencyTabs("listings")}
      />
      <main className="panel site-main">
        <h2 className="panel-section__title">{esPanel.agencyListingsTitle}</h2>

        {agencyId == null ? (
          <p className="panel-empty">{esPanel.agencyNoLink}</p>
        ) : (
          <AgencyListings agencyId={agencyId} />
        )}
      </main>
    </>
  );
}

async function AgencyListings({ agencyId }: { agencyId: number }) {
  const rows = await getAgencyListings(agencyId);
  if (rows.length === 0) {
    return <p className="panel-empty">{esPanel.agencyListingsEmpty}</p>;
  }

  return (
    <div className="panel-table__wrap">
      <table className="panel-table">
        <thead>
          <tr>
            <th>Propiedad</th>
            <th>Tipo</th>
            <th>Precio</th>
            <th>{esPanel.statusLabel}</th>
            <th>Cambiar estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="panel-table__name">
                {row.status === "published" ? (
                  <Link href={listingUrl(row)} target="_blank">
                    {row.title}
                  </Link>
                ) : (
                  row.title
                )}
              </td>
              <td>{PROPERTY_TYPE_LABELS[row.propertyType]}</td>
              <td>
                {formatPrice({
                  priceAmount: row.priceAmount,
                  priceCurrency: row.priceCurrency,
                })}
              </td>
              <td>
                <span className={`panel-status panel-status--${row.status}`}>
                  {listingStatusLabel[row.status] ?? row.status}
                </span>
              </td>
              <td>
                <form
                  action={setListingStatusAction}
                  className="panel-actions"
                  style={{ gap: 6 }}
                >
                  <input type="hidden" name="listingId" value={row.id} />
                  <select
                    name="status"
                    className="panel-select"
                    defaultValue={
                      AGENCY_STATUS_OPTIONS.includes(row.status)
                        ? row.status
                        : "draft"
                    }
                  >
                    {AGENCY_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {listingStatusLabel[s]}
                      </option>
                    ))}
                  </select>
                  <button className="panel-btn" type="submit">
                    {esPanel.saveStatus}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
