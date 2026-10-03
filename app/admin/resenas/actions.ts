"use server";

/** /admin/resenas — approve, reject or take down a partner review (O7). Staff and super-admin. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffOrAbove } from "@/lib/auth/guards";
import { moderateReview } from "@/lib/reviews";

export async function moderateReviewAction(formData: FormData): Promise<void> {
  const user = await requireStaffOrAbove();
  const id = Number(formData.get("id"));
  const decision = formData.get("decision");
  if (!Number.isInteger(id) || id <= 0 || (decision !== "approved" && decision !== "rejected")) {
    redirect("/admin/resenas");
  }
  const ok = await moderateReview({ id, decision, userId: user.id });
  revalidatePath("/admin/resenas");
  redirect(`/admin/resenas?msg=${ok ? decision : "not_found"}#resena-${id}`);
}
