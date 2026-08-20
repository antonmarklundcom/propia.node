"use server";

/**
 * Agency dashboard actions. requireAgencyContext() re-resolves the caller's
 * agencyId from their session on every call, and the status mutation is scoped
 * to that agencyId in its WHERE clause — an agency can only ever touch its own
 * listings, whatever the form claims.
 */
import { revalidatePath } from "next/cache";
import { revalidateListings } from "@/lib/cache";
import { panelScope, requireAgencyContext } from "@/lib/auth/guards";
import {
  setPanelListingStatus,
  type ListingStatus,
} from "@/lib/panel-queries";

// Statuses an agency may set itself. pending_review / removed are admin-only.
const AGENCY_STATUSES: ListingStatus[] = [
  "draft",
  "published",
  "paused",
  "sold",
  "rented",
];

export async function setListingStatusAction(formData: FormData): Promise<void> {
  const scope = panelScope(await requireAgencyContext());

  const listingId = Number(formData.get("listingId"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(listingId) || listingId <= 0) return;
  if (!AGENCY_STATUSES.includes(status as ListingStatus)) return;

  await setPanelListingStatus({
    listingId,
    scope,
    status: status as ListingStatus,
  });
  revalidatePath("/agencia");
  // paused / sold / rented all remove the listing from the published set the
  // public pages cache, so the tag has to drop with the row.
  revalidateListings();
}
