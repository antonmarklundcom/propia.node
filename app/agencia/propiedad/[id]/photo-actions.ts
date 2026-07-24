"use server";

/**
 * Agency photo actions. Identical to the admin ones except for the scope: the
 * agencyId is re-derived from the session on every call and never read from
 * the form, so a forged listingId or imageId matches no row instead of
 * touching another agency's photos.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgencyContext } from "@/lib/auth/guards";
import {
  handleCover,
  handleDelete,
  handleMove,
  handleUpload,
  readListingId,
  type PhotoFlash,
} from "@/lib/photo-form-input";
import type { EditScope } from "@/lib/listing-edit";

async function scope(): Promise<EditScope | null> {
  const { agencyId } = await requireAgencyContext();
  // An unlinked user owns no agency rows, so there is nothing to reach.
  return agencyId == null ? null : { kind: "agency", agencyId };
}

async function finish(listingId: number, flash: PhotoFlash): Promise<never> {
  revalidatePath(`/agencia/propiedad/${listingId}`);
  revalidatePath("/agencia");
  redirect(`/agencia/propiedad/${listingId}?msg=${flash}`);
}

export async function agencyUploadPhotosAction(formData: FormData): Promise<void> {
  const s = await scope();
  const id = readListingId(formData);
  await finish(id, s ? await handleUpload(formData, s) : "not_found");
}

export async function agencyDeletePhotoAction(formData: FormData): Promise<void> {
  const s = await scope();
  const id = readListingId(formData);
  await finish(id, s ? await handleDelete(formData, s) : "not_found");
}

export async function agencyMovePhotoAction(formData: FormData): Promise<void> {
  const s = await scope();
  const id = readListingId(formData);
  await finish(id, s ? await handleMove(formData, s) : "not_found");
}

export async function agencySetCoverAction(formData: FormData): Promise<void> {
  const s = await scope();
  const id = readListingId(formData);
  await finish(id, s ? await handleCover(formData, s) : "not_found");
}
