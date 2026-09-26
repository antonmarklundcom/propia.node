"use server";

/**
 * Status changes from the seller's own panel.
 *
 * The scope is re-derived from the session on every call and never read from
 * the form, so a forged listingId matches no row rather than pausing somebody
 * else's property. `published` is not a status this scope may set — maySetStatus()
 * enforces that inside setPanelListingStatus(), the same gate /agencia goes
 * through (audit F1).
 */
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { DEFAULT_VERTICAL_KEY } from "@/config/verticals";
import { revalidateListings } from "@/lib/cache";
import { requireOwnerContext } from "@/lib/auth/guards";
import { alertOperator, deliverLead } from "@/lib/crm";
import { canonPhone } from "@/lib/import/normalize";
import { isListingStatus } from "@/lib/listing-edit";
import { listingCanonicalOrigin, siteOrigin } from "@/lib/origin";
import { createRealtorRequest, OWNER_PANEL_SOURCE } from "@/lib/owner-realtor-request";
import { setPanelListingStatus } from "@/lib/panel-queries";
import { listingUrl } from "@/lib/urls";
import { esPanel } from "@/i18n/es";
import { esA2 } from "@/i18n/es-a2";

export async function setOwnerListingStatusAction(
  formData: FormData,
): Promise<void> {
  const { scope } = await requireOwnerContext();

  const listingId = Number(formData.get("listingId"));
  const status = String(formData.get("status") ?? "");
  // Is it a status at all? Whether this scope may set it is maySetStatus()'s
  // call, not this form's — one allow-list, one place (audit F1).
  if (!Number.isInteger(listingId) || listingId <= 0 || !isListingStatus(status)) {
    redirect("/mis-avisos");
  }

  await setPanelListingStatus({ listingId, scope, status });

  revalidatePath("/mis-avisos");
  revalidateListings();
  redirect("/mis-avisos");
}

/**
 * "Quiero que una inmobiliaria lo venda" (A2 Owner 4). Writes a `seller` lead
 * on the internal lane via createRealtorRequest(), then — after the response,
 * like every other lead writer — pings the operator and copies the lead to the
 * CRM. The listing and the owner come from the session scope, never the form.
 */
export async function requestRealtorAction(formData: FormData): Promise<void> {
  const { user, scope } = await requireOwnerContext();

  const listingId = Number(formData.get("listingId"));
  const whatsapp = canonPhone(String(formData.get("whatsapp") ?? ""));
  const note = String(formData.get("message") ?? "").trim().slice(0, 1000) || null;
  if (!Number.isInteger(listingId) || listingId <= 0 || whatsapp.length < 6) {
    redirect("/mis-avisos?msg=realtor_invalid");
  }

  const vertical = (await headers()).get("x-vertical") ?? DEFAULT_VERTICAL_KEY;
  const result = await createRealtorRequest({
    scope,
    listingId,
    vertical,
    name: user.name,
    email: user.email,
    whatsapp,
    message: (title) => esA2.realtorLeadMessage(title, note),
  });
  if (!result.ok) {
    redirect(
      result.reason === "duplicate"
        ? "/mis-avisos?msg=realtor_already"
        : "/mis-avisos?msg=realtor_invalid",
    );
  }

  // Read inside the request: after() runs once the headers are gone.
  const adminUrl = `${await siteOrigin()}/admin/leads`;
  const listingAbsUrl = `${await listingCanonicalOrigin()}${listingUrl(result.listing)}`;
  const { leadId, listing, message } = result;

  after(async () => {
    await alertOperator({
      kind: "new_lead",
      title: esPanel.alertNewLeadTitle,
      detail: esPanel.alertNewLeadDetail({
        leadType: "seller",
        name: user.name,
        whatsapp,
        listingTitle: listing.title,
      }),
      url: adminUrl,
      site: new URL(adminUrl).host,
    });

    try {
      await deliverLead({
        leadId,
        leadType: "seller",
        vertical,
        name: user.name ?? undefined,
        whatsapp,
        email: user.email ?? undefined,
        message,
        utm: { source: OWNER_PANEL_SOURCE },
        routedTo: "internal",
        listing: {
          publicId: listing.publicId,
          title: listing.title,
          url: listingAbsUrl,
          priceUsd: listing.priceUsd,
          operation: listing.operation,
        },
      });
    } catch {
      /* the lead row is the record; a failed copy is not an incident */
    }
  });

  revalidatePath("/mis-avisos");
  redirect("/mis-avisos?msg=realtor_sent");
}
