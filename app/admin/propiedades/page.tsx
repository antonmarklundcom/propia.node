import { getAdminBadges } from "@/lib/admin-badges";
import type { Metadata } from "next";
import Link from "next/link";
import { PanelBar } from "@/components/panel/PanelBar";
import { isStaff } from "@/lib/auth/roles";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import {
  ADMIN_STATUSES,
  STAFF_STATUSES,
  countListingsByPublisher,
  countListingsByStatus,
  listAllListings,
  type ListingStatusValue,
} from "@/lib/listing-edit";
import { PUBLISHER_KINDS, type PublisherKind } from "@/lib/publisher-kind";
import { getHouseAgencyId } from "@/lib/site-settings";
import { isSuperAdmin } from "@/lib/auth/roles";
import { esTriage } from "@/i18n/es-triage";
import { esPanel, listingStatusLabel } from "@/i18n/es";
import { formatPrice } from "@/lib/format";
import { PROPERTY_TYPE_LABELS } from "@/lib/property-types";
import { listingUrl } from "@/lib/urls";
import { BulkCount, BulkSelectAll } from "@/components/panel/BulkSelect";
import { adminTabs } from "../tabs";
import { listingFilterQuery, parseListingFilter } from "@/lib/admin-listing-export";
import { getCoverThumbs } from "@/lib/admin-covers";
import { CoverThumb } from "@/components/panel/CoverThumb";
import { bulkListingAction } from "./actions";
import { countExclusives, exclusivesFor, type ListingExclusiveRow } from "@/lib/listing-exclusive";
import { exclusiveState } from "@/lib/listing-exclusive-state";
import { analyticsDay } from "@/lib/analytics";
import { esExclusive } from "@/i18n/es-exclusive";

export const metadata: Metadata = {
  title: `Propiedades`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const OPERATION_LABEL: Record<string, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  alquiler_temporal: "Alquiler temporal",
};

const FLASH: Record<string, string> = {
  deleted: esPanel.listingDeleted,
  staff_forbidden: esPanel.staffCannotPublish,
};

/** The whole table is one form, so the bulk bar can live above the rows. */
const BULK_FORM_ID = "admin-bulk";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; quien?: string; exclusiva?: string; msg?: string }>;
}) {
  const [params, user] = await Promise.all([searchParams, requireStaffOrAbove()]);
  const { status, q, publisher } = parseListingFilter(params);
  const onlyExclusive = params.exclusiva === "1";

  const [badges, counts, publisherCounts, houseAgencyId, rows, exclusiveCount] = await Promise.all([
    getAdminBadges(user),
    countListingsByStatus(),
    countListingsByPublisher(status),
    getHouseAgencyId(),
    listAllListings({ status, q, publisher, exclusive: onlyExclusive }),
    countExclusives(),
  ]);
  // One read for the covers of the rows on screen.
  const covers = await getCoverThumbs(rows.map((r) => r.id));
  const exportQuery = listingFilterQuery({ status, q, publisher });
  const exclusives = await exclusivesFor(rows.map((r) => r.id));
  const today = analyticsDay();
  /** One URL builder, so the status chips, the publisher chips and the search keep each other. */
  const href = (p: { status?: string; quien?: PublisherKind | null; exclusiva?: boolean }) => {
    const sp = new URLSearchParams();
    const st = p.status ?? status;
    if (st !== "all") sp.set("status", st);
    const who = p.quien === null ? undefined : (p.quien ?? publisher);
    if (who) sp.set("quien", who);
    if (p.exclusiva ?? onlyExclusive) sp.set("exclusiva", "1");
    if (q) sp.set("q", q);
    const qs = sp.toString();
    return qs ? `/admin/propiedades?${qs}` : "/admin/propiedades";
  };
  const publisherTotal = PUBLISHER_KINDS.reduce((sum, k) => sum + publisherCounts[k], 0);

  const flash = params.msg ? FLASH[params.msg] : undefined;
  const staff = isStaff(user.role);
  const chips: (ListingStatusValue | "all")[] = ["all", ...ADMIN_STATUSES];

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("listings", badges)}
      />
      <main className="panel site-main">
        {flash ? <p className="panel-flash">{flash}</p> : null}

        <h2 className="panel-section__title">{esPanel.adminListingsTitle}</h2>
        <p className="panel-export">
          <a
            className="panel-btn"
            href={`/admin/propiedades/export${exportQuery ? `?${exportQuery}` : ""}`}
            download
          >
            {esTriage.export.button}
          </a>
          <span className="panel-card__meta">{esTriage.export.hint}</span>
        </p>

        <form action="/admin/propiedades" className="panel-form">
          {status !== "all" ? (
            <input type="hidden" name="status" value={status} />
          ) : null}
          {publisher ? <input type="hidden" name="quien" value={publisher} /> : null}
          {onlyExclusive ? <input type="hidden" name="exclusiva" value="1" /> : null}
          <label className="panel-form__field" style={{ flexBasis: "280px" }}>
            <span className="auth-field__label">{esPanel.searchListingsLabel}</span>
            <input
              className="auth-field__input"
              name="q"
              type="search"
              defaultValue={q}
            />
          </label>
          <div className="panel-form__field panel-form__field--action">
            <button className="panel-btn" type="submit">
              {esPanel.searchSubmit}
            </button>
          </div>
        </form>

        <nav className="panel-chips" aria-label="Filtrar por estado">
          {chips.map((s) => {
            const label = s === "all" ? esPanel.filterAll : listingStatusLabel[s];
            const count = counts[s] ?? 0;
            return (
              <Link
                key={s}
                href={href({ status: s })}
                className={`panel-chip${s === status ? " panel-chip--active" : ""}`}
              >
                {label}
                <span className="panel-tab__count">{count}</span>
              </Link>
            );
          })}
        </nav>

        <nav className="panel-chips" aria-label={esTriage.publisherFilterLabel}>
          <span className="panel-chips__label">{esTriage.publisherColumn}</span>
          <Link
            href={href({ quien: null })}
            className={`panel-chip${publisher ? "" : " panel-chip--active"}`}
          >
            {esTriage.publisherAll}
            <span className="panel-tab__count">{publisherTotal}</span>
          </Link>
          {PUBLISHER_KINDS.filter((k) => publisherCounts[k] > 0 || k === publisher).map((k) => (
            <Link
              key={k}
              href={href({ quien: k })}
              className={`panel-chip${k === publisher ? " panel-chip--active" : ""}`}
            >
              {esTriage.publisherChip[k]}
              <span className="panel-tab__count">{publisherCounts[k]}</span>
            </Link>
          ))}
        </nav>
        {exclusiveCount > 0 || onlyExclusive ? (
          <nav className="panel-chips" aria-label={esExclusive.filter}>
            <Link
              href={href({ exclusiva: !onlyExclusive })}
              className={`panel-chip${onlyExclusive ? " panel-chip--active" : ""}`}
              data-filter="exclusiva"
            >
              {esExclusive.filter}
              <span className="panel-tab__count">{exclusiveCount}</span>
            </Link>
          </nav>
        ) : null}
        <p className="panel-bulk__hint">
          {esTriage.publisherHelp}
          {!houseAgencyId && isSuperAdmin(user.role) ? (
            <>
              {" "}
              <Link href="/admin/ajustes#mi-inmobiliaria">{esTriage.houseAgencyMissing}</Link>
            </>
          ) : null}
        </p>

        {rows.length === 0 ? (
          <p className="panel-empty">{esPanel.adminListingsEmpty}</p>
        ) : (
          <form action={bulkListingAction} id={BULK_FORM_ID}>
            {/* Preserve the current filter so the redirect lands back on the
                same view instead of resetting to "todas". */}
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="q" value={q} />

            <div className="panel-bulk">
              <BulkCount formId={BULK_FORM_ID} />
              <label className="panel-bulk__field">
                <span className="auth-field__label">Acción</span>
                <select className="panel-select" name="op" defaultValue="">
                  <option value="" disabled>
                    Elegí una acción
                  </option>
                  {(staff ? STAFF_STATUSES : ADMIN_STATUSES).map((s) => (
                    <option key={s} value={s}>
                      Marcar como {listingStatusLabel[s] ?? s}
                    </option>
                  ))}
                  {staff ? null : (
                    <option value="delete">Borrar definitivamente</option>
                  )}
                </select>
              </label>
              <label className="panel-bulk__field">
                <span className="auth-field__label">
                  Escribí BORRAR para confirmar el borrado
                </span>
                <input className="auth-field__input" name="confirm" />
              </label>
              <button className="panel-btn" type="submit">
                Aplicar
              </button>
            </div>
            <p className="panel-bulk__hint">
              Cambiar el estado es reversible: <strong>Borrador</strong> o{" "}
              <strong>Eliminada</strong> saca la propiedad del sitio pero
              conserva la ficha, sus fotos y sus consultas.{" "}
              <strong>Borrar definitivamente</strong> no se puede deshacer y
              deja huérfanas las consultas recibidas — por eso pide la palabra
              de confirmación. Máximo 500 por vez.
            </p>

          <div className="panel-table__wrap">
            <table className="panel-table panel-table--stack">
              <thead>
                <tr>
                  <th className="panel-table__check">
                    <BulkSelectAll formId={BULK_FORM_ID} />
                  </th>
                  <th aria-label={esTriage.noCover}></th>
                  <th>Propiedad</th>
                  <th>Operación</th>
                  <th>Tipo</th>
                  <th>{esTriage.publisherColumn}</th>
                  <th>Precio</th>
                  <th>{esPanel.statusLabel}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="panel-table__check">
                      <input
                        type="checkbox"
                        name="ids"
                        value={row.id}
                        aria-label={`Seleccionar ${row.title}`}
                      />
                    </td>
                    <td className="panel-table__thumb">
                      <CoverThumb src={covers.get(row.id)} />
                    </td>
                    <td className="panel-table__name">
                      {/* The title opens the listing's full record (every
                          status); "Ver" opens the public page once published. */}
                      <Link href={`/admin/propiedades/${row.id}`}>{row.title}</Link>
                      <div className="panel-card__meta">
                        <span>#{row.publicId}</span>
                        {row.locationName ? <span>{row.locationName}</span> : null}
                        <ExclusiveBadge row={exclusives.get(row.id)} today={today} />
                      </div>
                    </td>
                    <td data-label="Operación">{OPERATION_LABEL[row.operation] ?? row.operation}</td>
                    <td data-label="Tipo">{PROPERTY_TYPE_LABELS[row.propertyType]}</td>
                    <td data-label={esTriage.publisherColumn}>
                      <span className={`panel-kind panel-kind--${row.publisherKind}`}>
                        {esTriage.publisher[row.publisherKind]}
                      </span>
                      <div className="panel-card__meta">
                        <span>{row.agencyName ?? row.publisherName ?? "—"}</span>
                      </div>
                    </td>
                    <td data-label="Precio">
                      {formatPrice({
                        priceAmount: row.priceAmount,
                        priceCurrency: row.priceCurrency,
                      })}
                    </td>
                    <td data-label={esPanel.statusLabel}>
                      <span className={`panel-status panel-status--${row.status}`}>
                        {listingStatusLabel[row.status] ?? row.status}
                      </span>
                    </td>
                    <td>
                      <div className="panel-actions">
                        <Link
                          className="panel-btn"
                          href={`/admin/propiedades/${row.id}`}
                        >
                          {esPanel.editListing}
                        </Link>
                        {row.status === "published" ? (
                          <Link
                            className="panel-btn"
                            href={listingUrl(row)}
                            target="_blank"
                          >
                            {esPanel.viewListing}
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </form>
        )}
      </main>
    </>
  );
}

/** Admin-only exclusivity marker (plan-admin-next O1). */
function ExclusiveBadge({ row, today }: { row: ListingExclusiveRow | undefined; today: string }) {
  const state = exclusiveState(row ?? null, today);
  if (state === "none") return null;
  return (
    <span className={`panel-kind panel-kind--${state === "active" ? "partner" : "none"}`} data-exclusive={state}>
      {state === "active" ? esExclusive.badge : esExclusive.badgeExpired}
      {state === "active" && row?.until ? ` ${esExclusive.badgeUntil(row.until)}` : null}
    </span>
  );
}
