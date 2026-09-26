import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { requireOwnerContext } from "@/lib/auth/guards";
import { AGENCY_LOCKED_STATUSES, agencyStatusOptions } from "@/lib/listing-edit";
import { getPanelListings } from "@/lib/panel-queries";
import { getPanelListingStats } from "@/lib/stats-queries";
import { esOwner, esPanel, listingStatusLabel } from "@/i18n/es";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import { listingUrl } from "@/lib/urls";
import { esA2 } from "@/i18n/es-a2";
import { ownerWhatsapp } from "@/lib/owner-realtor-request";
import { ownerTabs } from "./tabs";
import { requestRealtorAction, setOwnerListingStatusAction } from "./actions";

const FLASH: Record<string, { text: string; error?: boolean }> = {
  welcome: { text: esA2.welcome },
  realtor_sent: { text: esA2.realtorSent },
  realtor_already: { text: esA2.realtorAlready },
  realtor_invalid: { text: esA2.realtorInvalid, error: true },
};

/** A sold, rented or removed listing has nothing left for a realtor to do. */
const REALTOR_CLOSED = new Set(["sold", "rented", "removed"]);

export const metadata: Metadata = {
  title: `Tus avisos`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OwnerListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, { user, scope }] = await Promise.all([
    searchParams,
    requireOwnerContext(),
  ]);
  // Scope-guarded reads (and the owner's own number); none depends on another.
  const [rows, stats, whatsapp] = await Promise.all([
    getPanelListings(scope),
    getPanelListingStats(scope),
    ownerWhatsapp(user.id),
  ]);
  const flash = msg ? FLASH[msg] : undefined;

  return (
    <>
      <PanelBar
        title={esOwner.panelTitle}
        role={user.role}
        userName={user.name}
        tabs={ownerTabs("listings")}
      />
      <main className="panel site-main">
        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p>
        ) : null}
        <div className="panel-section__header">
          <h2 className="panel-section__title">{esOwner.listingsTitle}</h2>
          <Link className="panel-btn panel-btn--primary" href="/publicar">
            {esOwner.addListingCta}
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="panel-empty">{esOwner.listingsEmpty}</p>
        ) : (
          <>
            <p className="panel-note">{esOwner.statusReviewNote}</p>

            <div className="panel-table__wrap">
              <table className="panel-table">
                <thead>
                  <tr>
                    <th>Propiedad</th>
                    <th>Tipo</th>
                    <th>Precio</th>
                    <th>{esOwner.statusLabel}</th>
                    <th title={esPanel.statsViewsHint}>{esPanel.statsViews}</th>
                    <th>{esPanel.statsLeads}</th>
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
                      {/* A listing with no activity is absent from the map, not 0 in it. */}
                      <td className="panel-table__num">
                        {stats.get(row.id)?.views ?? 0}
                      </td>
                      <td className="panel-table__num">
                        {stats.get(row.id)?.leads ?? 0}
                      </td>
                      <td>
                        <div className="panel-actions">
                          {/* pending_review / removed are ours to move, not
                              theirs: a select here would let one save cancel
                              the review that is already under way (F25). */}
                          {!AGENCY_LOCKED_STATUSES.includes(row.status) ? (
                            <form
                              action={setOwnerListingStatusAction}
                              className="panel-actions"
                              style={{ gap: 6 }}
                            >
                              <input type="hidden" name="listingId" value={row.id} />
                              <select
                                name="status"
                                className="panel-select"
                                defaultValue={row.status}
                              >
                                {agencyStatusOptions(row.status).map((s) => (
                                  <option key={s} value={s}>
                                    {listingStatusLabel[s]}
                                  </option>
                                ))}
                              </select>
                              <button className="panel-btn" type="submit">
                                {esOwner.saveStatus}
                              </button>
                            </form>
                          ) : (
                            <p className="panel-status-note">
                              {row.status === "pending_review"
                                ? esPanel.statusPendingNote
                                : esPanel.statusRejectedNote}
                              {row.status === "removed" && row.reviewNotes && (
                                <>
                                  {" "}
                                  {esPanel.statusRejectedReason}: {row.reviewNotes}
                                </>
                              )}
                            </p>
                          )}
                          <Link
                            className="panel-btn"
                            href={`/mis-avisos/aviso/${row.id}`}
                          >
                            {esOwner.editListing}
                          </Link>
                          {!REALTOR_CLOSED.has(row.status) ? (
                            <details className="owner-realtor">
                              <summary className="panel-btn">
                                {esA2.realtorCta(row.operation)}
                              </summary>
                              <form action={requestRealtorAction} className="panel-form">
                                <input type="hidden" name="listingId" value={row.id} />
                                <p className="panel-note">{esA2.realtorExplainer}</p>
                                <label className="panel-form__field">
                                  <span className="auth-field__label">
                                    {esA2.realtorWhatsappLabel}
                                  </span>
                                  <input
                                    className="auth-field__input"
                                    name="whatsapp"
                                    type="tel"
                                    inputMode="tel"
                                    defaultValue={whatsapp ?? ""}
                                    maxLength={30}
                                    autoComplete="tel"
                                    required
                                  />
                                </label>
                                <label className="panel-form__field">
                                  <span className="auth-field__label">
                                    {esA2.realtorMessageLabel}
                                  </span>
                                  <textarea
                                    className="auth-field__input"
                                    name="message"
                                    rows={3}
                                    maxLength={1000}
                                    placeholder={esA2.realtorMessagePlaceholder}
                                  />
                                </label>
                                <button className="panel-btn panel-btn--primary" type="submit">
                                  {esA2.realtorSubmit}
                                </button>
                              </form>
                            </details>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
