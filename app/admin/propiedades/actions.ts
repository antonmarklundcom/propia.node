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
import { markDuplicate, removeFromDuplicateGroup } from "@/lib/listing-duplicates";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { parseListingRef } from "@/lib/urls";
import { exclusiveFromForm } from "@/lib/listing-exclusive-state";
import { saveListingExclusive } from "@/lib/listing-exclusive";
import { revalidateListings } from "@/lib/cache";
import { redirect } from "next/navigation";
import { requireStaffOrAbove, requireSuperAdmin } from "@/lib/auth/guards";
import { handleFinancingForm } from "@/lib/listing-financing-action";
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
import { recordAdminEvent } from "@/lib/admin-events";

export async function adminUpdateListingAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();

  const parsed = readListingForm(formData);
  if (!parsed.ok) {
    revalidatePath("/admin/propiedades");
    redirect(`/admin/propiedades/${parsed.id}?msg=invalid`);
  }

  const current = await getEditableListing(parsed.id, { kind: "admin" });
  if (isStaff(user.role) && !staffMaySetStatus(current?.status, parsed.input.status)) {
    redirect(`/admin/propiedades/${parsed.id}?msg=staff_publish`);
  }

  const affected = await updateListing({
    id: parsed.id,
    scope: { kind: "admin" },
    input: parsed.input,
  });

  if (affected && parsed.input.status === "published" && current?.status !== "published") {
    await recordAdminEvent(user.id, "listing.publish", "listing", parsed.id, { via: "edit" });
  }

  revalidatePath("/admin/propiedades");
  revalidatePath(`/admin/propiedades/${parsed.id}`);
  revalidateListings();
  redirect(
    `/admin/propiedades/${parsed.id}?msg=${affected ? "saved" : "not_found"}`,
  );
}

export async function adminDeleteListingAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();

  const id = Number(formData.get("listingId"));
  if (Number.isInteger(id) && id > 0) {
    await deleteListing(id);
    await recordAdminEvent(user.id, "listing.delete", "listing", id);
  }

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
    for (const id of ids) {
      await deleteListing(id);
      await recordAdminEvent(user.id, "listing.delete", "listing", id, { via: "bulk" });
    }
  } else if (isAdminStatus(op)) {
    for (const id of ids) {
      // scope: "admin" — no agency guard, this is the super-admin table.
      await setPanelListingStatus({
        listingId: id,
        scope: { kind: "admin" },
        status: op,
      });
      if (op === "published") {
        await recordAdminEvent(user.id, "listing.publish", "listing", id, { via: "bulk" });
      }
    }
  } else {
    return;
  }

  revalidatePath("/admin/propiedades");
  revalidatePath("/admin");
  revalidateListings();
}

/**
 * "Financiación propia" (plan-admin-next O8) from /admin: staff and the
 * super-admin, like every other listing edit here. It is the publisher's
 * text, not the operator's money.
 */
export async function adminSaveFinancingAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  await handleFinancingForm({ formData, scope: { kind: "admin" }, userId: user.id, basePath: "/admin/propiedades" });
}

/**
 * Mark or unmark a listing exclusive (plan-admin-next O1). Admin only: the
 * flag is never shown to visitors. Staff may set it — they manage listings.
 */
export async function adminSaveExclusiveAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const listingId = Number(formData.get("listingId"));
  if (!Number.isInteger(listingId) || listingId <= 0) redirect("/admin/propiedades");
  const input = exclusiveFromForm((k) => formData.get(k));
  if ("error" in input) redirect(`/admin/propiedades/${listingId}?msg=exclusive_invalid#exclusiva`);
  const ok = await saveListingExclusive({ listingId, input, userId: user.id });
  if (!ok) redirect("/admin/propiedades?msg=not_found");
  revalidatePath("/admin/propiedades");
  redirect(`/admin/propiedades/${listingId}?msg=exclusive_saved#exclusiva`);
}

/**
 * Duplicate listings (plan-admin-next O5): put this listing in the same group
 * as another one, given its code or link. Staff and super-admin.
 */
export async function adminMarkDuplicateAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const listingId = Number(formData.get("listingId"));
  if (!Number.isInteger(listingId) || listingId <= 0) redirect("/admin/propiedades");
  const back = `/admin/propiedades/${listingId}`;
  const publicId = parseListingRef(String(formData.get("ref") ?? ""));
  if (!publicId) redirect(`${back}?msg=dup_bad_ref#duplicados`);
  const [other] = await db.select({ id: listings.id }).from(listings).where(eq(listings.publicId, publicId)).limit(1);
  if (!other) redirect(`${back}?msg=dup_bad_ref#duplicados`);
  const result = await markDuplicate({ listingId, ofListingId: other.id, userId: user.id });
  if (result === "same") redirect(`${back}?msg=dup_same#duplicados`);
  if (result === "not_found") redirect(`${back}?msg=dup_bad_ref#duplicados`);
  redirect(`${back}?msg=dup_saved#duplicados`);
}

/** Take one member out of its duplicate group (O5). */
export async function adminRemoveDuplicateAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const listingId = Number(formData.get("listingId"));
  const removeId = Number(formData.get("removeId"));
  if (!Number.isInteger(listingId) || listingId <= 0 || !Number.isInteger(removeId) || removeId <= 0) {
    redirect("/admin/propiedades");
  }
  await removeFromDuplicateGroup({ listingId: removeId, userId: user.id });
  redirect(`/admin/propiedades/${listingId}?msg=dup_removed#duplicados`);
}
