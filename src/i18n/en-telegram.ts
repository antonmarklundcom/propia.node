/**
 * Peer of `es-telegram.ts` — partner alerts on Telegram, the bot's replies,
 * the reminder and the partner note. Checked against the Spanish shape with
 * `satisfies` in `index.ts`, and walked side by side by `npm run verify:i18n`.
 *
 * What reaches a partner in English today: the Telegram alerts and the bot's
 * replies, picked per recipient from `users.locale`. The panel screens and
 * the operator's own alert still read the Spanish namespace.
 *
 * **No buyer data in any message**, same rule as the Spanish: what happened,
 * at most the listing's title, and where to look.
 */
export const enTelegram = {
  /** /agencia/perfil — the "Telegram alerts" card. */
  card: {
    title: "Telegram alerts",
    intro:
      "Get a Telegram message when an enquiry is shared with you, when the buyer replies by email, and a reminder if an enquiry goes unanswered. The messages carry no buyer details: they only tell you to check your panel.",
    connect: "Connect Telegram",
    connectHint:
      "Telegram opens with our bot: tap «Start» and you are done. The link is yours alone and expires after one hour; if more time has passed, reload this page.",
    connected: "Connected",
    connectedHint:
      "Alerts go to the Telegram chat you connected. To use another one, disconnect and connect again from that phone.",
    disconnect: "Disconnect",
    disabled:
      "The site operator has not turned on Telegram alerts yet. Enquiries shared with you still appear under Enquiries in this panel.",
    flashDisconnected: "Telegram disconnected. You will no longer get alerts there.",
  },

  /** What the bot answers in the chat (the webhook's reply). */
  bot: {
    linked: "Done: enquiries shared with you will be announced here.",
    invalidLink:
      "That link is not valid or has expired (it lasts one hour). Open «Connect Telegram» from your profile in the panel and try again.",
    otherChat:
      "Your account already has another Telegram chat connected. To use this one, first tap «Disconnect» on your profile in the panel, then connect again from here.",
    stopped: "Done: this chat will no longer receive alerts.",
    notLinked: "This chat was not connected to any account.",
    help:
      "This bot only sends panel alerts. To connect it, use «Connect Telegram» on your profile. To stop them, send /stop.",
  },

  /** Partner alerts. `url` is the absolute /agencia/leads link. */
  alert: {
    shared: (count: number) =>
      count === 1
        ? "A new enquiry was shared with you."
        : `${count} new enquiries were shared with you.`,
    emailReply: "The buyer of an enquiry shared with you replied by email.",
    reminder: (count: number, hours: number) =>
      count === 1
        ? `You have a shared enquiry with no answer for more than ${hours} hours.`
        : `You have ${count} shared enquiries with no answer for more than ${hours} hours.`,
    listing: (title: string) => `Listing: ${title}`,
    open: (url: string) => `Open it in your panel: ${url}`,
  },

  /** The one operator alert a reminder run sends. */
  operator: {
    remindersTitle: (count: number) =>
      count === 1
        ? "A shared enquiry is still unanswered by the partner"
        : `${count} shared enquiries are still unanswered by the partner`,
    /** `sent` = Telegram reminders Telegram actually accepted, never the attempted count. */
    remindersDetail: (hours: number, sent: number) =>
      `More than ${hours} hours have passed since you shared them. Reminders that reached partners on Telegram: ${sent}.`,
  },

  /** The partner's own note on a shared-lead card (/agencia/leads). */
  note: {
    label: "Your note",
    hint: "Seen by whoever has this enquiry in their panel and by the site team. Never by the buyer.",
    save: "Save note",
    saved: "Note saved.",
    invalid: "The note could not be saved.",
  },

  /** /admin/leads, next to a share. */
  admin: {
    partnerNote: "Partner's note:",
  },

  /** /admin/operaciones card. */
  ops: {
    label: "Partner reminders",
    description: (hours: number) =>
      `Finds shared enquiries still «pending» more than ${hours} hours after they were shared and not yet reminded. Every partner with Telegram connected gets one reminder, and you get a single alert with the total. Runs by itself every hour (Cloudflare Worker).`,
    writes: "Marks each enquiry as reminded (once only) and sends the messages.",
  },
} as const;
