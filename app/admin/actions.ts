"use server";

/**
 * Review actions are super-admin-only; agency/agent verification also permits
 * staff. Every action re-checks its role guard — the form
 * is never trusted, and an unauthorized caller who forges a POST is bounced by the guard
 * before any write. Mutations revalidate the affected panel routes.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revalidateListings } from "@/lib/cache";
import { requireSuperAdmin, requireStaffOrAbove } from "@/lib/auth/guards";
import { recordAdminEvent } from "@/lib/admin-events";
import {
  approveListing,
  rejectListing,
  setAgencyVerified,
  setAgentVerified,
} from "@/lib/panel-queries";

function toId(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export async function approveAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const id = toId(formData.get("listingId"));
  if (id) {
    await approveListing(id);
    await recordAdminEvent(user.id, "listing.publish", "listing", id, { via: "review" });
  }
  revalidatePath("/admin");
  // Approval is the write that changes which listings are published, so it is
  // the one that must drop the data cache: the home rail, the sitemap and the
  // directories all read published rows.
  revalidateListings();
}

export async function rejectAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();
  const id = toId(formData.get("listingId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (id && reason) await rejectListing(id, reason);
  revalidatePath("/admin");
  revalidateListings();
}

/** Most listings one bulk action touches — a runaway form cannot sweep the queue. */
const BULK_MAX = 100;

function bulkIds(formData: FormData): number[] {
  return [...new Set(formData.getAll("listingIds").map(toId).filter(Boolean))].slice(0, BULK_MAX);
}

/**
 * The queue's filters (`q`, `op`, `tipo`, `quien`) the bulk form carried in
 * `back`, re-encoded key by key so the redirect can only ever land on /admin
 * with those four, whatever was posted. The operator returns to the same view.
 */
function queueRedirect(formData: FormData, result: string): string {
  const posted = new URLSearchParams(String(formData.get("back") ?? ""));
  const sp = new URLSearchParams();
  for (const key of ["q", "op", "tipo", "quien"]) {
    const v = posted.get(key);
    if (v) sp.set(key, v.slice(0, 100));
  }
  const qs = sp.toString();
  return `/admin?${qs ? `${qs}&` : ""}${result}`;
}

/**
 * Approve the ticked listings. Each goes through the same `approveListing()` as
 * the single button, which only moves a `pending_review` row, so a listing
 * someone else already handled is skipped, not overwritten.
 */
export async function approveManyAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  let done = 0;
  for (const id of bulkIds(formData)) {
    if ((await approveListing(id)) > 0) {
      done += 1;
      await recordAdminEvent(user.id, "listing.publish", "listing", id, { via: "bulk" });
    }
  }
  revalidatePath("/admin");
  if (done > 0) revalidateListings();
  redirect(queueRedirect(formData, done > 0 ? `bulk=approved&n=${done}` : "bulk=none"));
}

/** Reject the ticked listings with one shared reason (required). */
export async function rejectManyAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) redirect(queueRedirect(formData, "bulk=reason"));
  let done = 0;
  for (const id of bulkIds(formData)) {
    if ((await rejectListing(id, reason)) > 0) done += 1;
  }
  revalidatePath("/admin");
  if (done > 0) revalidateListings();
  redirect(queueRedirect(formData, done > 0 ? `bulk=rejected&n=${done}` : "bulk=none"));
}

export async function toggleAgencyVerifiedAction(formData: FormData): Promise<void> {
  await requireStaffOrAbove();
  const id = toId(formData.get("agencyId"));
  const verified = formData.get("verified") === "1";
  if (id) await setAgencyVerified(id, verified);
  revalidatePath("/admin/inmobiliarias");
}

export async function toggleAgentVerifiedAction(formData: FormData): Promise<void> {
  await requireStaffOrAbove();
  const id = toId(formData.get("agentId"));
  const verified = formData.get("verified") === "1";
  if (id) await setAgentVerified(id, verified);
  revalidatePath("/admin/inmobiliarias");
}
