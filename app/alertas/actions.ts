"use server";

import { redirect } from "next/navigation";
import { confirmSavedSearch, deleteSavedSearch } from "@/lib/saved-searches";

/** The token is the credential; both actions are idempotent and only take it. */
export async function confirmAlertAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  await confirmSavedSearch(token);
  redirect(`/alertas?token=${encodeURIComponent(token)}`);
}

export async function unsubscribeAlertAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  await deleteSavedSearch(token);
  redirect("/alertas?baja=1");
}
