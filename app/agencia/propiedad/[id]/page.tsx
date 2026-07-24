import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelBar } from "@/components/panel/PanelBar";
import { ListingForm } from "@/components/panel/ListingForm";
import { PhotoManager } from "@/components/panel/PhotoManager";
import { requireAgencyContext } from "@/lib/auth/guards";
import {
  AGENCY_STATUSES,
  getEditableListing,
  type EditScope,
} from "@/lib/listing-edit";
import { listListingImages } from "@/lib/listing-images";
import { isR2Configured } from "@/lib/r2";
import { listPublishLocations } from "@/lib/publish-queries";
import { esPanel } from "@/i18n/es";
import { listingUrl } from "@/lib/urls";
import { agencyTabs } from "../../tabs";
import { agencyUpdateListingAction } from "./actions";
import {
  agencyDeletePhotoAction,
  agencyMovePhotoAction,
  agencySetCoverAction,
  agencyUploadPhotosAction,
} from "./photo-actions";

export const metadata: Metadata = {
  title: "Editar aviso — Homes Paraguay",
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
  photos_unconfigured: { text: esPanel.photosNotConfigured, error: true },
};

export default async function AgencyListingEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ id }, { msg }, ctx] = await Promise.all([
    params,
    searchParams,
    requireAgencyContext(),
  ]);

  const listingId = Number(id);
  if (!Number.isInteger(listingId) || listingId <= 0) notFound();

  // An unlinked user owns no agency rows, so there is nothing to edit.
  if (ctx.agencyId == null) notFound();
  const scope: EditScope = { kind: "agency", agencyId: ctx.agencyId };

  const [listing, locations, images] = await Promise.all([
    getEditableListing(listingId, scope),
    listPublishLocations(),
    // Same scope the listing was loaded with — an agency reaches only its own.
    listListingImages(listingId, scope),
  ]);
  if (!listing) notFound();

  const flash = msg ? FLASH[msg] : undefined;

  return (
    <>
      <PanelBar
        title="Panel de la inmobiliaria"
        role={ctx.user.role}
        userName={ctx.user.name}
        tabs={agencyTabs("listings")}
      />
      <main className="panel site-main">
        <p>
          <Link className="panel-btn" href="/agencia">
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

        <article className="panel-card">
          <ListingForm
            listing={listing}
            locations={locations}
            statuses={AGENCY_STATUSES}
            action={agencyUpdateListingAction}
          />
        </article>

        <PhotoManager
          listingId={listing.id}
          images={images}
          storageReady={isR2Configured()}
          uploadAction={agencyUploadPhotosAction}
          deleteAction={agencyDeletePhotoAction}
          moveAction={agencyMovePhotoAction}
          coverAction={agencySetCoverAction}
        />
      </main>
    </>
  );
}
