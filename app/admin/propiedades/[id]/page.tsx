import { getAdminBadges } from "@/lib/admin-badges";
import { isStaff } from "@/lib/auth/roles";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelBar } from "@/components/panel/PanelBar";
import { ListingForm } from "@/components/panel/ListingForm";
import { PhotoManager } from "@/components/panel/PhotoManager";
import { ListingStats } from "@/components/panel/ListingStats";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import {
  ADMIN_STATUSES,
  STAFF_STATUSES,
  getEditableListing,
} from "@/lib/listing-edit";
import { listListingImages } from "@/lib/listing-images";
import {
  getListingDailyViews,
  getPanelListingStats,
} from "@/lib/stats-queries";
import { isR2Configured } from "@/lib/r2";
import { listPublishLocations } from "@/lib/publish-queries";
import { esPanel } from "@/i18n/es";
import { listingUrl } from "@/lib/urls";
import { adminTabs } from "../../tabs";
import { adminDeleteListingAction, adminSaveExclusiveAction, adminSaveFinancingAction, adminUpdateListingAction } from "../actions";
import { getListingExclusive } from "@/lib/listing-exclusive";
import { exclusiveState } from "@/lib/listing-exclusive-state";
import { analyticsDay } from "@/lib/analytics";
import { esExclusive } from "@/i18n/es-exclusive";
import {
  adminDeletePhotoAction,
  adminMovePhotoAction,
  adminSetCoverAction,
  adminUploadPhotosAction,
} from "./photo-actions";

import { SellerFinancingForm } from "@/components/panel/SellerFinancingForm";
import { getListingFinancing } from "@/lib/listing-financing";

export const metadata: Metadata = {
  title: `Editar aviso`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FLASH: Record<string, { text: string; error?: boolean }> = {
  saved: { text: esPanel.listingSaved },
  invalid: { text: esPanel.listingInvalid, error: true },
  not_found: { text: esPanel.listingNotFound, error: true },
  photos_uploaded: { text: esPanel.photosUploaded },
  photos_rejected: { text: esPanel.photosRejected, error: true },
  photos_deleted: { text: esPanel.photosDeleted },
  photos_reordered: { text: esPanel.photosReordered },
  photos_none: { text: esPanel.photosNoFiles, error: true },
  photos_too_many: { text: esPanel.photosTooManyFiles, error: true },
  photos_unconfigured: { text: esPanel.photosNotConfigured, error: true },
  staff_publish: { text: esPanel.staffCannotPublish, error: true },
  exclusive_saved: { text: esExclusive.saved },
  exclusive_invalid: { text: esExclusive.invalidUntil, error: true },
};

export default async function AdminListingEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ id }, { msg }, user] = await Promise.all([
    params,
    searchParams,
    requireStaffOrAbove(),
  ]);

  const listingId = Number(id);
  if (!Number.isInteger(listingId) || listingId <= 0) notFound();

  const [badges, listing, locations, images, daily] = await Promise.all([
    getAdminBadges(user),
    getEditableListing(listingId, { kind: "admin" }),
    listPublishLocations(),
    listListingImages(listingId, { kind: "admin" }),
    getListingDailyViews(listingId, { kind: "admin" }),
  ]);
  if (!listing) notFound();
  // Read only once the scoped load above found the listing (plan-admin-next O8).
  const [financing, exclusive] = await Promise.all([
    getListingFinancing(listing.id),
    getListingExclusive(listing.id),
  ]);
  const exclusiveNow = exclusiveState(exclusive, analyticsDay());

  // Lead count for this one listing, from the same scoped aggregate the
  // listings table uses.
  const leadCount =
    (await getPanelListingStats({ kind: "admin" }, isStaff(user.role), listing.id)).get(listing.id)?.leads ?? 0;

  const flash = msg ? FLASH[msg] : undefined;
  const staff = isStaff(user.role);

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("listings", badges)}
      />
      <main className="panel site-main">
        <p>
          <Link className="panel-btn" href="/admin/propiedades">
            {esPanel.backToListings}
          </Link>
        </p>

        {flash ? (
          <p className={flash.error ? "auth-error" : "panel-flash"}>{flash.text}</p>
        ) : null}

        <h2 className="panel-section__title">{listing.title}</h2>
        <p className="panel-card__meta">
          <span>#{listing.publicId}</span>
          {listing.status === "published" ? (
            <Link href={listingUrl(listing)} target="_blank">
              {esPanel.viewListing}
            </Link>
          ) : null}
          {listing.reviewNotes ? <span>· {listing.reviewNotes}</span> : null}
        </p>

        <ListingStats
          views={daily.reduce((sum, d) => sum + d.views, 0)}
          leads={leadCount}
          daily={daily}
        />

        <article className="panel-card">
          <ListingForm
            listing={listing}
            locations={locations}
            statuses={
              // Staff keep `published` on a row that has it; they never grant it.
              staff && listing.status !== "published" ? STAFF_STATUSES : ADMIN_STATUSES
            }
            action={adminUpdateListingAction}
            canDelete={!staff}
            deleteAction={adminDeleteListingAction}
          />
        </article>

        <form action={adminSaveExclusiveAction} className="panel-form" id="exclusiva">
          <input type="hidden" name="listingId" value={listing.id} />
          <article className="panel-card">
            <h3 className="panel-section__title">
              {esExclusive.title}{" "}
              {exclusiveNow !== "none" ? (
                <span className={`panel-kind panel-kind--${exclusiveNow === "active" ? "partner" : "none"}`}>
                  {exclusiveNow === "active" ? esExclusive.badge : esExclusive.badgeExpired}
                </span>
              ) : null}
            </h3>
            <p className="panel-note">{esExclusive.hint}</p>
            <label className="panel-form__field">
              <span>
                <input type="checkbox" name="exclusive" defaultChecked={exclusive != null} />{" "}
                <strong>{esExclusive.checkbox}</strong>
              </span>
            </label>
            <label className="panel-form__field">
              <span className="auth-field__label">{esExclusive.untilLabel}</span>
              <input className="auth-field__input" type="date" name="until" defaultValue={exclusive?.until ?? ""} />
            </label>
            <label className="panel-form__field">
              <span className="auth-field__label">{esExclusive.noteLabel}</span>
              <input
                className="auth-field__input"
                name="note"
                maxLength={280}
                placeholder={esExclusive.notePlaceholder}
                defaultValue={exclusive?.note ?? ""}
              />
            </label>
            {exclusive ? (
              <p className="auth-field__hint">{esExclusive.since(analyticsDay(new Date(exclusive.setAt)))}</p>
            ) : null}
          </article>
          <button className="panel-btn panel-btn--primary" type="submit">
            {esExclusive.save}
          </button>
        </form>

        <SellerFinancingForm
          listingId={listing.id}
          operation={listing.operation}
          financing={financing}
          action={adminSaveFinancingAction}
          msg={msg}
        />


        <PhotoManager
          listingId={listing.id}
          images={images}
          storageReady={isR2Configured()}
          uploadAction={adminUploadPhotosAction}
          deleteAction={adminDeletePhotoAction}
          moveAction={adminMovePhotoAction}
          coverAction={adminSetCoverAction}
        />
      </main>
    </>
  );
}
