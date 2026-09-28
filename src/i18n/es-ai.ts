/**
 * AI reply suggestions — the "Sugerir respuesta" button on reply boxes in
 * /admin/inbox, /admin/leads and /agencia/leads, and its monthly usage line
 * in /admin/ajustes.
 *
 * Its own file, like `es-e2.ts`, so parallel builds do not all append to
 * `es.ts`; `index.ts` wires it in as `aiReply`. `en-ai.ts` is the peer,
 * checked by `satisfies` and walked by `npm run verify:i18n`. The panels are
 * Spanish-only today and read this directly.
 */
export const esAiReply = {
  button: "Sugerir respuesta",
  working: "Escribiendo sugerencia…",
  replaceConfirm: "Ya escribiste algo en la respuesta. ¿Reemplazarlo por la sugerencia?",
  filled: "Sugerencia lista. Leela y ajustala antes de enviar: se envía solo cuando tocás «Enviar».",
  lowConfidence:
    "Revisá con cuidado: la IA no está segura (puede ser un reclamo, una negociación de precio, un tema legal o algo que la consulta no dice).",
  hint: "La IA solo usa los datos de esta consulta y del aviso. Nunca envía nada sola.",
  error: {
    disabled: "Las sugerencias con IA no están activadas.",
    not_found: "Esa conversación no existe o no tenés acceso.",
    rate_limited: "Pediste muchas sugerencias seguidas. Esperá un rato.",
    nothing_to_answer: "Todavía no hay un mensaje del cliente para responder.",
    unsafe:
      "La sugerencia traía un teléfono, email o enlace que no está en la consulta, así que no se muestra. Probá de nuevo o escribí la respuesta.",
    failed: "No se pudo generar la sugerencia (el servicio de IA no respondió). Probá de nuevo en un momento.",
  },
  usage: {
    title: "Respuestas sugeridas con IA",
    off: "Apagado: falta GEMINI_API_KEY o ANTHROPIC_API_KEY en hPanel (o AI_REPLY_DISABLED=true). El botón «Sugerir respuesta» no aparece.",
    on: (provider: string, model: string) => `Activo con ${provider} (${model}).`,
    month: (calls: number, tokens: string, cost: string) =>
      calls === 0
        ? "Este mes todavía no se pidió ninguna sugerencia."
        : `Este mes: ${calls === 1 ? "1 sugerencia" : `${calls} sugerencias`}, ${tokens} tokens, costo estimado ${cost}.`,
    estimateNote: "Estimación con precios de lista; la factura del proveedor es la cifra real.",
  },
  historyAction: { "ai.reply": "Pidió una respuesta sugerida con IA" } as Record<string, string>,
  historyTargetLabel: { email: "Email", whatsapp: "WhatsApp" } as Record<string, string>,
} as const;

/**
 * The button's strings as a plain object: a server page hands them to the
 * client component `AiReplyTextarea`, and the namespace's functions cannot be
 * serialized across that boundary.
 */
export function aiReplyButtonLabels(t: {
  button: string;
  working: string;
  replaceConfirm: string;
  filled: string;
  lowConfidence: string;
  hint: string;
  error: Record<string, string>;
}) {
  return {
    button: t.button,
    working: t.working,
    replaceConfirm: t.replaceConfirm,
    filled: t.filled,
    lowConfidence: t.lowConfidence,
    hint: t.hint,
    error: {
      disabled: t.error.disabled,
      not_found: t.error.not_found,
      rate_limited: t.error.rate_limited,
      nothing_to_answer: t.error.nothing_to_answer,
      unsafe: t.error.unsafe,
      failed: t.error.failed,
    },
  };
}
