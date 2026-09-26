/**
 * The pre-filled WhatsApp reply on a lead card (build A1, Realtor 8):
 * "Hola <name>, te escribo por <listing> (<URL>)…", or a generic greeting when
 * the lead has no listing. Pure; the caller passes the origin, which on a
 * server page is `listingCanonicalOrigin()` — the door that owns the detail
 * page, so the link the visitor gets is the one search engines index.
 */
import { esA1 } from "@/i18n/es-a1";
import { listingUrl } from "@/lib/urls";
import { waLink } from "@/lib/wa";

export interface ReplyLead {
  whatsapp: string;
  name: string | null;
  listingTitle: string | null;
  listingSlug: string | null;
  listingPublicId: string | null;
}

export function leadReplyText(lead: ReplyLead, origin: string, t = esA1): string {
  if (lead.listingTitle && lead.listingSlug && lead.listingPublicId) {
    return t.replyText({
      name: lead.name,
      listingTitle: lead.listingTitle,
      listingUrl: `${origin}${listingUrl({ slug: lead.listingSlug, publicId: lead.listingPublicId })}`,
    });
  }
  return t.replyTextGeneric(lead.name);
}

/** wa.me link to the lead's own number with the reply typed in. */
export function leadReplyHref(lead: ReplyLead, origin: string, t = esA1): string {
  return (
    waLink(lead.whatsapp, leadReplyText(lead, origin, t)) ??
    `https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`
  );
}
