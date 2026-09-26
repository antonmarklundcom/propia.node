/**
 * English peer of `es-a2.ts` (build A2 — owners). Same keys, same arity;
 * `verify:i18n` walks both side by side.
 */
import type { Dictionary } from "./index";

export const enA2 = {
  registerKindOwner: "I own the property (selling or renting it myself)",
  registerOwnerNote:
    "If you are the owner, leave the agency name empty: your account is for publishing and following your own listings.",

  accountTab: "My account",
  accountTitle: "My account",
  accountNote:
    "To change your password or email, confirm with your current password.",
  welcome:
    "Your account is ready. Publish your first property and follow the enquiries you receive here.",

  realtorCta: (operation: string) =>
    operation === "venta"
      ? "I want an agency to sell it"
      : "I want an agency to rent it out",
  realtorExplainer:
    "We pass your property to a trusted local agency and they contact you on WhatsApp. Asking costs nothing and commits you to nothing.",
  realtorWhatsappLabel: "Your WhatsApp",
  realtorMessageLabel: "Message (optional)",
  realtorMessagePlaceholder: "For example: when it can be visited, whether there is a rush…",
  realtorSubmit: "Send request",
  realtorSent:
    "We received your request. A local agency will contact you on WhatsApp.",
  realtorAlready:
    "We already received a request for this listing in the last 24 hours. We will be in touch.",
  realtorInvalid:
    "We could not send the request. Check your WhatsApp number and try again.",
  realtorLeadMessage: (listingTitle: string, note: string | null) =>
    [
      `The owner asks for an agency to handle their listing: ${listingTitle}.`,
      note ? `Message: ${note}` : null,
    ]
      .filter(Boolean)
      .join("\n"),

  priceTitle: "Your price per m² against the area",
  priceYours: "Your listing's price per m²",
  priceMedian: (zone: string) => `Median of published listings in ${zone}`,
  priceSample: (count: number, period: string) =>
    `${count} listings of the same type and operation, ${period}`,
  priceAbove: (pct: number) => `Your price per m² is ${pct}% above the median.`,
  priceBelow: (pct: number) => `Your price per m² is ${pct}% below the median.`,
  priceEqual: "Your price per m² is in line with the median.",
  priceConverted:
    "Your price is in guaraníes; we convert it to dollars at the rate the portal uses, to compare.",
  priceDisclaimer:
    "This compares asking prices of published listings. It is not a valuation or a price recommendation.",
} satisfies Dictionary["a2"];
