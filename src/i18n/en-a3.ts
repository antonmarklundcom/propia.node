/**
 * English peer of `es-a3.ts` (seekers: favourites, compare, who receives an
 * enquiry, report a listing, what "verified" means). Same keys, same arity —
 * `index.ts` checks it with `satisfies Dictionary` and `verify:i18n` walks
 * both side by side.
 */
export const enA3 = {
  favorites: {
    save: "Save",
    saved: "Saved",
    addLabel: "Save to favourites",
    removeLabel: "Remove from favourites",
    metaTitle: "Favourites",
    metaDescription: "The properties you saved in this browser.",
    kicker: "No account needed",
    title: "Your favourites",
    intro:
      "They are stored in this browser only. If you clear your browser data or visit from another device, they will not be there.",
    empty:
      "You have not saved any property yet. Tap “Save” on a listing and it will show up here.",
    emptyCta: "Browse properties",
    unavailable: (n: number) =>
      n === 1
        ? "One property you saved is no longer listed."
        : `${n} properties you saved are no longer listed.`,
    headerLink: (n: number) => `Favourites (${n})`,
    clearAll: "Clear all",
  },
  compare: {
    add: "Compare",
    added: "Comparing",
    addLabel: "Add to comparison",
    removeLabel: "Remove from comparison",
    full: (max: number) => `You can compare up to ${max} properties at a time.`,
    barLabel: "Property comparison",
    barCount: (n: number, max: number) => `${n} of ${max} to compare`,
    barCta: "Compare",
    barClear: "Clear",
    metaTitle: "Compare properties",
    metaDescription: "Up to three properties side by side.",
    kicker: "Compare",
    title: "Compare properties",
    intro:
      "Up to three listings side by side. The list is stored in this browser only.",
    empty:
      "Pick two or three properties with “Compare” on the listings to see them here.",
    emptyCta: "Browse properties",
    needMore: "Add at least one more property to compare.",
    rowLabel: "Detail",
    rowPrice: "Price",
    rowUsdM2: "US$ per m²",
    rowArea: "Floor area",
    rowLand: "Lot size",
    rowBedrooms: "Bedrooms",
    rowBathrooms: "Bathrooms",
    rowZone: "Area",
    rowType: "Type",
    rowOperation: "Listed for",
    rowCuota: "Estimated monthly payment",
    remove: "Remove",
    view: "View listing",
    missing: "—",
    unavailable: (n: number) =>
      n === 1
        ? "One property in the list is no longer listed."
        : `${n} properties in the list are no longer listed.`,
  },
  enquiry: {
    toAgent: (name: string) =>
      `Your enquiry went to ${name}, the agent handling this listing.`,
    toAgency: (name: string) =>
      `Your enquiry went to ${name}, the agency that published this listing.`,
    toAgentUnnamed: "Your enquiry went to the agent handling this listing.",
    toAgencyUnnamed: "Your enquiry went to the agency that published this listing.",
    toOwner: "Your enquiry went to the private owner who published this listing.",
    toInternal: (brand: string) =>
      `Your enquiry went to the ${brand} team, who pass it on to the right person.`,
    waFallback: "If you prefer, you can also write directly on WhatsApp:",
  },
  report: {
    open: "Report this listing",
    title: "Report this listing",
    intro:
      "Something wrong? Your report goes to the site team, not to whoever published the listing.",
    reasonLabel: "Reason",
    reasons: {
      sold: "Already sold or rented",
      wrong_price: "The price is wrong",
      fake: "Looks fake or misleading",
      other: "Something else",
    },
    detailLabel: "Tell us more (optional)",
    phoneLabel: "Your WhatsApp",
    phoneHint: "In case we need to ask you about the report.",
    submit: "Send report",
    sending: "Sending…",
    sent: "Thank you. The site team will review this listing.",
    error: "We could not send the report. Please try again in a few minutes.",
    cancel: "Cancel",
  },
  verified: {
    sectionTitle: "What “Verified” means",
    sectionSubtitle:
      "The mark appears next to some agencies, agents and listings. This is what it tells you today, and what it does not.",
    points: [
      {
        title: "Set by hand by the site team",
        text: "For agencies and agents, the site team switches the mark on from its own panel, one account at a time. It cannot be bought and never turns on by itself.",
      },
      {
        title: "Private sellers: WhatsApp confirmed",
        text: "On a private seller's listing, the mark only appears when the publisher's WhatsApp number was confirmed with a code.",
      },
      {
        title: "It does not certify the property",
        text: "It does not mean we checked the title, debts, measurements or asking price. Before paying any deposit, ask for the paperwork and have it checked by a notary (escribano).",
      },
    ],
    linkLabel: "What “Verified” means",
  },
  admin: {
    reportsChip: "Reports",
    reportBadge: "Listing report",
    reportReason: {
      sold: "Sold / rented",
      wrong_price: "Wrong price",
      fake: "Fake or misleading",
      other: "Other",
    },
    alertReportTitle: "New listing report",
    alertReportDetail: (reason: string, listingTitle: string) =>
      `${reason} · ${listingTitle}`,
  },
};
