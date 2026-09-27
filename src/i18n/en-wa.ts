/**
 * English peer of `es-wa.ts`. The panel these strings belong to is
 * Spanish-only today; this exists so the dictionaries keep one shape.
 */
export const enWa = {
  formTitle: "Log a WhatsApp enquiry",
  formHint:
    "For an enquiry that reached your WhatsApp: copy the number and the “Ref.” code from the message. It is saved like any enquiry from the site: same routing and the same copy to VenderCRM.",
  whatsappLabel: "Their WhatsApp",
  whatsappPlaceholder: "+595 981 123 456",
  nameLabel: "Name (optional)",
  refLabel: "Listing ref., link or the pasted message (optional)",
  refPlaceholder: "AB12CD34EF",
  messageLabel: "Message or note (optional)",
  typeLabel: "Type",
  typeAuto: "From the listing",
  siteLabel: "Site",
  submit: "Log enquiry",
  sending: "Saving…",

  saved: (lane: string) => `Enquiry logged. Routed to: ${lane}.`,
  savedListing: (lane: string, listingTitle: string) =>
    `Enquiry logged for “${listingTitle}”. Routed to: ${lane}.`,
  savedHiddenFromStaff:
    "The listing has a publisher, so the enquiry went to their inbox and does not appear in this list.",
  errorPhone: "That does not look like a valid WhatsApp number.",
  errorRef:
    "No listing matches that reference. Check the code (10 letters and digits) or leave it empty.",
  errorInvalid: "Please check the form.",
  errorRate: "You logged many enquiries in a row. Wait a few minutes.",

  sourceChip: "WhatsApp (manual)",

  historyTitle: (n: number) =>
    n === 1 ? "Also asked about 1 other" : `Also asked about ${n} others`,
  historyNoListing: "No listing",
  historySameEmail: "same email",
  historyMore: (n: number) => `and ${n} more`,
};
