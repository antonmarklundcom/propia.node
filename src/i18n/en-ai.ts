/**
 * Peer of `es-ai.ts` — AI reply suggestions. Checked against the Spanish
 * shape with `satisfies` in `index.ts`, and walked side by side by
 * `npm run verify:i18n`.
 */
export const enAiReply = {
  button: "Suggest a reply",
  working: "Writing a suggestion…",
  replaceConfirm: "You have already typed a reply. Replace it with the suggestion?",
  filled: "Suggestion ready. Read and adjust it before sending: nothing goes out until you press “Send”.",
  lowConfidence:
    "Check this one carefully: the AI is not sure (it may be a complaint, a price negotiation, a legal matter or something the enquiry does not say).",
  hint: "The AI only uses the data in this enquiry and its listing. It never sends anything on its own.",
  error: {
    disabled: "AI suggestions are not switched on.",
    not_found: "That conversation does not exist or you do not have access.",
    rate_limited: "You asked for many suggestions in a row. Please wait a while.",
    nothing_to_answer: "There is no message from the customer to answer yet.",
    unsafe:
      "The suggestion contained a phone number, email or link that is not in the enquiry, so it is not shown. Try again or write the reply yourself.",
    failed: "The suggestion could not be generated (the AI service did not answer). Try again in a moment.",
  },
  usage: {
    title: "AI-suggested replies",
    off: "Off: GEMINI_API_KEY or ANTHROPIC_API_KEY is missing in hPanel (or AI_REPLY_DISABLED=true). The “Suggest a reply” button is hidden.",
    on: (provider: string, model: string) => `On, using ${provider} (${model}).`,
    month: (calls: number, tokens: string, cost: string) =>
      calls === 0
        ? "No suggestions requested this month yet."
        : `This month: ${calls === 1 ? "1 suggestion" : `${calls} suggestions`}, ${tokens} tokens, estimated cost ${cost}.`,
    estimateNote: "Estimated at list prices; the provider's invoice is the real figure.",
  },
  historyAction: { "ai.reply": "Asked for an AI-suggested reply" } as Record<string, string>,
  historyTargetLabel: { email: "Email", whatsapp: "WhatsApp" } as Record<string, string>,
} as const;
