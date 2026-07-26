"use server";

/**
 * Agency dashboard actions. requireAgencyContext() re-resolves the caller's
 * agencyId from their session on every call, and the status mutation is scoped
 * to that agencyId in its WHERE clause — an agency can only ever touch its own
 * listings, whatever the form claims.
 */
import { revalidatePath } from "next/cache";
import { requireAgencyContext } from "@/lib/auth/guards";
import {
  setAgencyListingStatus,
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
  const { agencyId } = await requireAgencyContext();
  if (agencyId == null) return;

  const listingId = Number(formData.get("listingId"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(listingId) || listingId <= 0) return;
  if (!AGENCY_STATUSES.includes(status as ListingStatus)) return;

  await setAgencyListingStatus({
    listingId,
    agencyId,
    status: status as ListingStatus,
  });
  revalidatePath("/agencia");
}
