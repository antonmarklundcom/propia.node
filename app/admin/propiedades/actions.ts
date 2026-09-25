"use server";

/**
 * Admin listing actions. requireStaffOrAbove() runs before every write, and
 * the scope passed to the query layer is `admin` — the only scope that may
 * touch a listing it does not own.
 *
 * Two things stay with the super-admin even here: granting `published` (that
 * is the review decision, Approve on /admin) and the hard DELETE. A `staff`
 * user can edit, pause, unpublish or soft-remove, never publish or destroy.
 */
import { revalidatePath } from "next/cache";
import { revalidateListings } from "@/lib/cache";
import { redirect } from "next/navigation";
import { requireStaffOrAbove, requireSuperAdmin } from "@/lib/auth/guards";
import { isStaff } from "@/lib/auth/roles";
import {
  ADMIN_STATUSES,
  deleteListing,
  getEditableListing,
  staffMaySetStatus,
  updateListing,
  type ListingStatusValue,
} from "@/lib/listing-edit";
import { readListingForm } from "@/lib/listing-form-input";
import { setPanelListingStatus } from "@/lib/panel-queries";

export async function adminUpdateListingAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();

  const parsed = readListingForm(formData);
  if (!parsed.ok) {
    revalidatePath("/admin/propiedades");
    redirect(`/admin/propiedades/${parsed.id}?msg=invalid`);
  }

  if (isStaff(user.role)) {
    const current = await getEditableListing(parsed.id, { kind: "admin" });
    if (!staffMaySetStatus(current?.status, parsed.input.status)) {
      redirect(`/admin/propiedades/${parsed.id}?msg=staff_publish`);
    }
  }

  const affected = await updateListing({
    id: parsed.id,
    scope: { kind: "admin" },
    input: parsed.input,
  });

  revalidatePath("/admin/propiedades");
  revalidatePath(`/admin/propiedades/${parsed.id}`);
  revalidateListings();
  redirect(
    `/admin/propiedades/${parsed.id}?msg=${affected ? "saved" : "not_found"}`,
  );
}

export async function adminDeleteListingAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const id = Number(formData.get("listingId"));
  if (Number.isInteger(id) && id > 0) await deleteListing(id);

  revalidatePath("/admin/propiedades");
  revalidateListings();
  redirect("/admin/propiedades?msg=deleted");
}


/**
 * Bulk actions for the listing table.
 *
 * One form wraps every row, so `formData.getAll("ids")` is the selection.
 * Two destructive levels, deliberately distinct:
 *   status=removed  — soft delete. The row keeps its leads, photos and import
 *                     history and simply stops being public. This is what
 *                     "delete" should mean nearly always.
 *   op=delete       — the real DELETE, behind a typed confirmation, because
 *                     leads attached to a deleted listing lose the thing they
 *                     were asking about.
 */
/** Cap per submit: a runaway select-all shouldn't fire 10k statements. */
const MAX_BULK = 500;

function selectedIds(formData: FormData): number[] {
  const ids = formData
    .getAll("ids")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)].slice(0, MAX_BULK);
}

function isAdminStatus(v: string): v is ListingStatusValue {
  return (ADMIN_STATUSES as readonly string[]).includes(v);
}

export async function bulkListingAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();

  const ids = selectedIds(formData);
  const op = String(formData.get("op") ?? "");
  if (ids.length === 0 || !op) return;

  // Staff: no hard delete and no publishing — both stay with the super-admin.
  if (isStaff(user.role) && (op === "delete" || op === "published")) {
    redirect("/admin/propiedades?msg=staff_forbidden");
  }

  if (op === "delete") {
    // Typed confirmation, not a checkbox: the browser's confirm() can be
    // dismissed by a stray Enter, and this one is not undoable.
    if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "BORRAR")
      return;
    for (const id of ids) await deleteListing(id);
  } else if (isAdminStatus(op)) {
    for (const id of ids) {
      // scope: "admin" — no agency guard, this is the super-admin table.
      await setPanelListingStatus({
        listingId: id,
        scope: { kind: "admin" },
        status: op,
      });
    }
  } else {
    return;
  }

  revalidatePath("/admin/propiedades");
  revalidatePath("/admin");
  revalidateListings();
}
