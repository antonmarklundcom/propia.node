/**
 * The one body of the three "Guardar financiación" server actions
 * (/admin/propiedades/[id], /agencia/propiedad/[id], /mis-avisos/aviso/[id]).
 * Each action resolves its own guard and scope from the session and passes
 * them here; nothing about who may edit is read from the form.
 */
import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EditScope } from "@/lib/listing-edit";
import { saveListingFinancing } from "@/lib/listing-financing";
import { parseFinancingForm } from "@/lib/listing-financing-form";

export async function handleFinancingForm(p: {
  formData: FormData;
  scope: EditScope;
  userId: number;
  /** The edit page, e.g. `/agencia/propiedad`; the id is appended. */
  basePath: string;
}): Promise<never> {
  const raw = Number(p.formData.get("listingId"));
  const listingId = Number.isSafeInteger(raw) && raw > 0 ? raw : 0;
  const back = (msg: string) => `${p.basePath}/${listingId}?msg=${msg}#financiacion`;
  if (!listingId) redirect(`${p.basePath}`);

  const parsed = parseFinancingForm((name) => p.formData.get(name));
  if (!parsed.ok) redirect(back("financing_empty"));

  const saved = await saveListingFinancing({
    scope: p.scope,
    listingId,
    input: parsed.value,
    userId: p.userId,
  });
  revalidatePath(`${p.basePath}/${listingId}`);
  redirect(back(saved ? "financing_saved" : "financing_not_found"));
}
