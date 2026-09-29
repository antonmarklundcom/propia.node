"use server";

/**
 * Mark a project approved (or not) for Che Róga Porã. Super-admin only, and
 * the guard runs here again: it changes the monthly payment printed on the
 * project's listings, and a forged POST never touches the page's own checks.
 *
 * After the write, the cuotas of that project's listings are recomputed by the
 * same runner as the nightly job (`runCuotas({ projectId })`), so the change
 * shows now and there is no second code path for the money math.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { recordAdminEvent } from "@/lib/admin-events";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidateListings } from "@/lib/cache";
import { runCuotas } from "@/lib/ops/cuotas";
import { getProjectName } from "@/lib/project-queries";

const ROUTE = "/admin/proyectos";

function done(code: string, name?: string, changed?: number): never {
  revalidatePath(ROUTE);
  const q = new URLSearchParams({ msg: code });
  if (name) q.set("n", name.slice(0, 160));
  if (changed != null) q.set("c", String(changed));
  redirect(`${ROUTE}?${q.toString()}`);
}

export async function setProjectCheRogaAction(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();

  const id = Number(formData.get("projectId"));
  const approve = formData.get("approve") === "1";
  if (!Number.isInteger(id) || id < 1) done("invalid");

  const name = await getProjectName(id);
  if (name == null) done("notFound");

  await db.update(projects).set({ cheRogaApproved: approve }).where(eq(projects.id, id));

  const result = await runCuotas({ dry: false, projectId: id });
  const changed = result.counts.cambian ?? 0;
  revalidateListings();
  await recordAdminEvent(user.id, "project.che_roga", "project", id, {
    approved: approve ? 1 : 0,
    listings_changed: changed,
  });
  done(approve ? "approved" : "revoked", name, changed);
}
