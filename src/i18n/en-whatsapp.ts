/**
 * Peer of `es-whatsapp.ts` — the WhatsApp Cloud API inbox. Checked against
 * the Spanish shape with `satisfies` in `index.ts`, and walked side by side by
 * `npm run verify:i18n`.
 */
export const enWhatsApp = {
  alert: {
    chatTitle: "New WhatsApp message",
    leadTitle: "WhatsApp message on an enquiry",
    detail: (who: string, preview: string) => `${who}: ${preview.length > 120 ? `${preview.slice(0, 119)}…` : preview}`,
  },
  thread: {
    title: (n: number) => (n === 1 ? "1 WhatsApp message" : `${n} WhatsApp messages`),
    unread: (n: number) => (n === 1 ? "1 unread" : `${n} unread`),
    customer: "Customer",
    outbound: "Sent",
    automatic: "automatic",
    status: { sent: "sent", delivered: "delivered", read: "read", failed: "not sent" } as Record<string, string>,
    notSent: (error: string) => `Not sent (${error}).`,
    media: "File",
    mediaNotStored: "the file was not stored",
    noBody: "(no text)",
    types: {
      image: "Photo",
      video: "Video",
      audio: "Audio",
      document: "Document",
      sticker: "Sticker",
      location: "Location",
      reaction: "Reaction",
    } as Record<string, string>,
    replyLabel: "Reply on WhatsApp",
    replySubmit: "Send on WhatsApp",
    replyFrom: "Goes out from the portal's WhatsApp number.",
    windowOpen: (until: string) => `You can reply until ${until} (24 h after their last message).`,
    windowClosed:
      "More than 24 hours have passed since the customer's last message: WhatsApp only allows approved templates, which are not built yet. Write to them from your phone:",
    openWaMe: "Open in WhatsApp",
    markRead: "Mark as read",
    partnerReadOnly: "This conversation came in on the portal's WhatsApp. Reply to the customer from your own WhatsApp.",
  },
  flash: {
    sent: "WhatsApp message sent.",
    notSent: "WhatsApp did not accept the message. It is kept in the conversation as not sent.",
    empty: "Write a message before sending.",
    outsideWindow: "Not sent: more than 24 hours have passed since the customer's last message.",
    noRecipient: "This enquiry has no valid WhatsApp number.",
    notConfigured: "WhatsApp is not configured.",
    notFound: "That conversation does not exist or you do not have access.",
    marked: "Marked as read.",
    converted: "Enquiry created. The WhatsApp chat now sits under it.",
    convertInvalid: "Check the enquiry type.",
  },
  admin: {
    view: "WhatsApp",
    hint: "Chats on the portal's WhatsApp that are not tied to an enquiry. Those that are show under each enquiry.",
    empty: "No WhatsApp chats.",
    notConfigured: (missing: string) =>
      `WhatsApp is not connected yet: ${missing} missing in hPanel (see docs/log/whatsapp-inbox.md).`,
    back: "Back to WhatsApp",
    chatWith: (who: string) => `WhatsApp with ${who}`,
    messages: (n: number) => (n === 1 ? "1 message" : `${n} messages`),
    convertTitle: "Turn into an enquiry",
    convertHint:
      "Creates an internal enquiry with this number and moves the chat under it, so it is followed like any other enquiry.",
    convertType: "Enquiry type",
    convertName: "Name",
    convertSubmit: "Create enquiry",
  },
  /**
   * The auto-responder's messages (PR 3). Peer of the Spanish; wording is a
   * founder decision.
   */
  auto: {
    greetingFirst: (brand: string) =>
      `Hello! Thank you for writing to ${brand}. We have received your message and an advisor will reply shortly.`,
    greetingClosed: (brand: string, hours: string) =>
      `Hello! Thank you for writing to ${brand}. We are outside office hours right now (${hours}). We will reply as soon as we are back.`,
    handoff: (brand: string) => `Thank you for your message. An advisor from ${brand} will contact you about this shortly.`,
    hoursWords: { weekdays: "Monday to Friday", saturday: "Saturdays", sunday: "Sundays", separator: ", " },
  },
  settings: {
    title: "WhatsApp: automatic replies",
    hint: "Only inside WhatsApp's 24-hour window. Every automatic message stays in the conversation labelled “automatic”.",
    notConfigured: "WhatsApp is not connected yet: these settings are saved but do nothing until it is.",
    greetingLabel: "Automatic greeting",
    greetingBody:
      "A fixed message on a customer's first message and when they write outside office hours (at most one every 12 h per customer, and never after someone on the team has replied).",
    aiLabel: "Automatic AI reply",
    aiBody:
      "The AI replies on its own, with nobody reading it first. At most one message per customer every N hours, never after someone on the team replied, and it hands price, legal, document or complaint topics — or anything it is unsure about — to an advisor.",
    aiNeedsKey: "Needs GEMINI_API_KEY or ANTHROPIC_API_KEY in hPanel.",
    cooldownLabel: "Hours between AI replies to the same customer",
    hoursTitle: "Office hours (Asunción time)",
    hoursHint: "Leave both fields empty for a closed day.",
    weekdays: "Monday to Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    open: "Opens",
    close: "Closes",
    previewTitle: "Messages that are sent",
    save: "Save automatic replies",
    saved: "Automatic replies saved.",
    invalid: "Check the hours (HH:MM, opening before closing) and the hours between replies (1 to 168).",
  },
} as const;
