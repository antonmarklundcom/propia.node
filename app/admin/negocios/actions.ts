"use server";

/**
 * /admin/negocios/socios — a Socio's usual commission split (plan-admin-next
 * O2). Super-admin only, and `savePartnerTerms()` re-checks the role itself
 * like `upsertOperatorDeal()`. A suggestion: no deal is touched here.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { parsePartnerTermsForm } from "@/lib/deal-form";
import { getLedgerPartner, parseLedgerKey } from "@/lib/partner-ledger";
import { savePartnerTerms } from "@/lib/partner-terms";
import { recordAdminEvent } from "@/lib/admin-events";

export async function savePartnerTermsAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const ref = parseLedgerKey(String(formData.get("partner") ?? ""));
  const back = String(formData.get("back") ?? "") === "detail" && ref
    ? `/admin/negocios/socios/${ref.kind}-${ref.id}`
    : "/admin/negocios/socios";
  if (!ref || !(await getLedgerPartner(ref.kind, ref.id))) redirect(`${back}?msg=invalid`);

  const input = parsePartnerTermsForm(formData);
  if (!input) redirect(`${back}?msg=invalid#reparto-${ref.kind}-${ref.id}`);

  await savePartnerTerms({ role: user.role, userId: user.id, partner: ref, input });
  await recordAdminEvent(user.id, "partner.terms", ref.kind, ref.id, {
    partner: `${ref.kind}:${ref.id}`,
    commission_pct: input.commissionPct,
    my_share_pct: input.mySharePct,
  });
  revalidatePath("/admin/negocios/socios");
  redirect(`${back}?msg=saved#reparto-${ref.kind}-${ref.id}`);
}
