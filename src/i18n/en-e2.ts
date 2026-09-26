/**
 * Peer of `es-e2.ts` — the email inbox (waves E2 + E3). Checked against the
 * Spanish shape with `satisfies` in `index.ts`, and walked side by side by
 * `npm run verify:i18n`.
 */
export const enInbox = {
  alert: {
    inboxTitle: (mailbox: string) => `New email at ${mailbox}`,
    leadReplyTitle: "Email reply to an enquiry",
    detail: (from: string, subject: string) => (subject ? `${from} · ${subject}` : from),
  },
  thread: {
    title: (n: number) => (n === 1 ? "1 email" : `${n} emails`),
    unread: (n: number) => (n === 1 ? "1 new reply" : `${n} new replies`),
    outbound: "Sent",
    to: "To",
    cc: "CC",
    notSent: (error: string) => `Not sent (${error}).`,
    attachments: "Attachments",
    attachmentMetadataOnly: "name only: the file was not stored",
    showImages: "Show remote images",
    hideImages: "Hide remote images",
    imagesBlocked:
      "Remote images are blocked: they tell the sender when and from where you opened the email.",
    noBody: "(no text)",
    quoteHeader: (name: string, when: string) => `On ${when}, ${name} wrote:`,
    replyLabel: "Reply by email",
    replyTo: (to: string) => `Goes to ${to}. Their answer comes back to this enquiry.`,
    replySubmit: "Send",
    replyUnavailable:
      "Replying by email from here needs inbound email to be set up (see the E2/E3 PR).",
    noRecipient: "This enquiry has no email address: reply on WhatsApp.",
    markRead: "Mark as read",
    subjectFallback: (listing: string | null) =>
      listing ? `Your enquiry about ${listing}` : "Your enquiry",
  },
  flash: {
    sent: "Email sent.",
    notSent: "The email could not be sent. It is saved in the conversation as not sent.",
    empty: "Write a message before sending.",
    noRecipient: "There is no address to reply to.",
    notFound: "That conversation does not exist or you do not have access to it.",
    archived: "Conversation archived.",
    unarchived: "Conversation moved to the inbox.",
    converted: "Enquiry created. The conversation is now under that enquiry.",
    convertInvalid: "Check the WhatsApp number (at least 6 digits) and the enquiry type.",
    marked: "Marked as read.",
  },
  admin: {
    tab: "Email",
    metaTitle: "Email",
    title: "Email",
    hint: (mailboxes: string) =>
      `What arrives at ${mailboxes}. Replies to enquiries are shown under each enquiry.`,
    notConfigured:
      "Inbound email is not connected yet: INBOUND_EMAIL_SECRET in hPanel and the Cloudflare Worker are missing (see the E2/E3 PR).",
    sendingNotConfigured: "Email sending is not configured (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_EMAIL_TOKEN).",
    viewInbox: "Inbox",
    viewArchived: "Archived",
    viewLeads: "Replies to enquiries",
    compose: "Compose",
    empty: "No emails.",
    emptyArchived: "No archived conversations.",
    unreadCount: (n: number) => `${n} unread`,
    messages: (n: number) => (n === 1 ? "1 message" : `${n} messages`),
    back: "Back to email",
    archive: "Archive",
    unarchive: "Move to inbox",
    composeTitle: "New email",
    from: "From",
    to: "To",
    cc: "CC (optional, comma-separated)",
    subject: "Subject",
    body: "Message",
    send: "Send",
    replyTitle: "Reply",
    replyTo: (to: string) => `To ${to}`,
    rootSendingOff: (mailbox: string, sender: string) =>
      `Sent from ${sender}, with replies to ${mailbox}. To send as ${mailbox}, the root domain must be onboarded in Email Sending and EMAIL_ROOT_SENDING=true.`,
    rootSendingOn: (mailbox: string) => `Sent as ${mailbox}.`,
    convertTitle: "Turn into an enquiry",
    convertHint:
      "Creates an enquiry in /admin/leads as if it had come through the form (internal lane), and moves this conversation under it.",
    convertType: "Type",
    convertName: "Name",
    convertWhatsapp: "WhatsApp",
    convertSubmit: "Create enquiry",
    leadRepliesEmpty: "No email reply to an enquiry has arrived yet.",
    openLead: "View enquiry",
    leadLabel: (name: string) => `Enquiry: ${name}`,
    attachmentNotFound: "That attachment does not exist, was not stored, or you do not have access.",
  },
};
