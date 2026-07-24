import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PanelBar } from "@/components/panel/PanelBar";
import { ListingForm } from "@/components/panel/ListingForm";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { countReviewQueue } from "@/lib/panel-queries";
import { ADMIN_STATUSES, getEditableListing } from "@/lib/listing-edit";
import { listPublishLocations } from "@/lib/publish-queries";
import { esPanel } from "@/i18n/es";
import { listingUrl } from "@/lib/urls";
import { adminTabs } from "../../tabs";
import { adminDeleteListingAction, adminUpdateListingAction } from "../actions";

export const metadata: Metadata = {
  title: "Editar aviso — Homes Paraguay",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FLASH: Record<string, { text: string; error?: boolean }> = {
  saved: { text: esPanel.listingSaved },
  invalid: { text: esPanel.listingInvalid, error: true },
  not_found: { text: esPanel.listingNotFound, error: true },
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
    requireSuperAdmin(),
  ]);

  const listingId = Number(id);
  if (!Number.isInteger(listingId) || listingId <= 0) notFound();

  const [reviewCount, listing, locations] = await Promise.all([
    countReviewQueue(),
    getEditableListing(listingId, { kind: "admin" }),
    listPublishLocations(),
  ]);
  if (!listing) notFound();

  const flash = msg ? FLASH[msg] : undefined;

  return (
    <>
      <PanelBar
        title="Panel de administración"
        role={user.role}
        userName={user.name}
        tabs={adminTabs("listings", reviewCount)}
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

        <article className="panel-card">
          <ListingForm
            listing={listing}
            locations={locations}
            statuses={ADMIN_STATUSES}
            action={adminUpdateListingAction}
            canDelete
            deleteAction={adminDeleteListingAction}
          />
        </article>
      </main>
    </>
  );
}
