"use server";

/**
 * Agency listing edit. Identical to the admin action except for the scope: the
 * agencyId is re-derived from the session via requireAgencyContext() and never
 * read from the form, so a forged listingId simply matches no row instead of
 * editing another agency's property.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgencyContext } from "@/lib/auth/guards";
import { updateListing } from "@/lib/listing-edit";
import { readListingForm } from "@/lib/listing-form-input";

export async function agencyUpdateListingAction(formData: FormData): Promise<void> {
  const { agencyId } = await requireAgencyContext();

  const parsed = readListingForm(formData);
  if (!parsed.ok) redirect(`/agencia/propiedad/${parsed.id}?msg=invalid`);

  // No agency link yet → nothing this user may edit.
  if (agencyId == null) redirect(`/agencia/propiedad/${parsed.id}?msg=not_found`);

  const affected = await updateListing({
    id: parsed.id,
    scope: { kind: "agency", agencyId },
    input: parsed.input,
  });

  revalidatePath("/agencia");
  revalidatePath(`/agencia/propiedad/${parsed.id}`);
  redirect(
    `/agencia/propiedad/${parsed.id}?msg=${affected ? "saved" : "not_found"}`,
  );
}
