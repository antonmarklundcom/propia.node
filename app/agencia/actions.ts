"use server";

/**
 * Agency dashboard actions. requireAgencyContext() re-resolves the caller's
 * agencyId from their session on every call, and the status mutation is scoped
 * to that agencyId in its WHERE clause — an agency can only ever touch its own
 * listings, whatever the form claims.
 */
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { revalidateListings } from "@/lib/cache";
import { panelScope, requireAgencyContext } from "@/lib/auth/guards";
import { setPanelListingStatus } from "@/lib/panel-queries";
import { isListingStatus } from "@/lib/listing-edit";
import { JOIN_NOTICE_COOKIE, parseSeenId } from "./join-notice";

/**
 * There is no agency-specific allow-list here any more.
 *
 * There used to be, duplicated from listing-edit.ts, and it drifted: this copy
 * allowed `published`, which is what made the review queue optional (audit
 * F1). Permission now lives in exactly one place — setPanelListingStatus() ->
 * maySetStatus() — so a second caller cannot disagree with the first. All this
 * check does is reject a form value that is not a status at all.
 */

export async function setListingStatusAction(formData: FormData): Promise<void> {
  const scope = panelScope(await requireAgencyContext());

  const listingId = Number(formData.get("listingId"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(listingId) || listingId <= 0) return;
  if (!isListingStatus(status)) return;

  await setPanelListingStatus({ listingId, scope, status });
  revalidatePath("/agencia");
  // paused / sold / rented all remove the listing from the published set the
  // public pages cache, so the tag has to drop with the row.
  revalidateListings();
}

/**
 * Dismiss the "listings that moved in" notice (bug 6). Only a cookie: the
 * notice is read from admin_events, which stays untouched, and the id is a
 * lower bound on what to show — a forged value can hide the notice from its
 * own browser and nothing else.
 */
export async function dismissJoinNoticeAction(formData: FormData): Promise<void> {
  await requireAgencyContext();
  const seen = parseSeenId(String(formData.get("seen") ?? ""));
  if (!seen) return;
  const jar = await cookies();
  jar.set(JOIN_NOTICE_COOKIE, String(seen), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/agencia",
    maxAge: 60 * 60 * 24 * 60,
  });
  revalidatePath("/agencia");
}
