/**
 * English peer of `es-a1.ts` (build A1). The panels these strings belong to
 * are Spanish-only today; this exists so the dictionaries keep one shape.
 */
export const enA1 = {
  groupToggle: "Group by number",
  groupToggleOff: "Show one by one",
  groupOlder: (n: number) =>
    n === 1 ? "Show 1 earlier enquiry" : `Show ${n} earlier enquiries`,

  replyText: (p: { name: string | null; listingTitle: string; listingUrl: string }) =>
    `Hi${p.name ? ` ${p.name}` : ""}, I'm writing about ${p.listingTitle} (${p.listingUrl}). Are you still interested?`,
  replyTextGeneric: (name: string | null) =>
    `Hi${name ? ` ${name}` : ""}, I'm writing about your enquiry. How can I help?`,

  inviteWhatsappLabel: "Their WhatsApp (optional)",
  inviteWhatsappPlaceholder: "+595 981 123 456",
  inviteWhatsappSend: "Send on WhatsApp",
  inviteWhatsappHint:
    "The number is not saved: it only opens WhatsApp with the link ready to send.",
  inviteWhatsappText: (agencyName: string, url: string) =>
    `Hi, you're invited to join the ${agencyName} team. Create your account with this link: ${url}`,

  exportCsv: "Download CSV",
  exportHint: "The file holds exactly the enquiries in this list.",
  csvSectionOwn: "Own",
  csvSectionShared: "Shared",
  csvLeadType: {
    buyer: "Buy",
    renter: "Rent",
    seller: "Sell",
    valuation: "Valuation",
    developer: "Developer",
    agent_signup: "Agent sign-up",
    landlord: "Let their property",
    question: "Question",
  } as Record<string, string>,
  csvFollowUp: { new: "New", contacted: "Contacted", closed: "Closed" } as Record<string, string>,
  csvRouted: {
    agency: "Agency",
    agent: "Agent",
    owner: "Private owner",
    internal: "Internal",
    developer: "Developer",
  } as Record<string, string>,
  csvPanelHead: [
    "Section",
    "Date",
    "Type",
    "Name",
    "WhatsApp",
    "Email",
    "Message",
    "Property",
    "Property URL",
    "Answer",
  ],
  csvAdminHead: [
    "Date",
    "Type",
    "Status",
    "Name",
    "WhatsApp",
    "Email",
    "Message",
    "Site",
    "Routed to",
    "Property",
    "Property URL",
    "Internal note",
    "Source",
  ],

  teamNumbersTitle: "Your team in numbers",
  teamNumbersHint: (days: number) =>
    `Enquiries from the last ${days} days. Shared ones are those the portal handed to each agent.`,
  teamNumbersHead: [
    "Agent",
    "Published",
    "Enquiries",
    "Shared answered",
    "Median reply time (h)",
  ],
  teamNumbersEmpty: "There are no agents on your team yet.",
};
