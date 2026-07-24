"use server";

/**
 * Super-admin listing actions. requireSuperAdmin() runs before every write, and
 * the scope passed to the query layer is `admin` — the only scope that may
 * touch a listing it does not own, or delete one outright.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { deleteListing, updateListing } from "@/lib/listing-edit";
import { readListingForm } from "@/lib/listing-form-input";

export async function adminUpdateListingAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const parsed = readListingForm(formData);
  if (!parsed.ok) {
    revalidatePath("/admin/propiedades");
    redirect(`/admin/propiedades/${parsed.id}?msg=invalid`);
  }

  const affected = await updateListing({
    id: parsed.id,
    scope: { kind: "admin" },
    input: parsed.input,
  });

  revalidatePath("/admin/propiedades");
  revalidatePath(`/admin/propiedades/${parsed.id}`);
  redirect(
    `/admin/propiedades/${parsed.id}?msg=${affected ? "saved" : "not_found"}`,
  );
}

export async function adminDeleteListingAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const id = Number(formData.get("listingId"));
  if (Number.isInteger(id) && id > 0) await deleteListing(id);

  revalidatePath("/admin/propiedades");
  redirect("/admin/propiedades?msg=deleted");
}
