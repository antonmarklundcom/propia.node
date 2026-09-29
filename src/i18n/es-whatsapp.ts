/**
 * The WhatsApp Cloud API inbox: the business number's chats in /admin/inbox,
 * WhatsApp threads under lead cards (/admin/leads, /agencia/leads) and the
 * operator alert.
 *
 * Its own file, like `es-e2.ts`; `index.ts` wires it in as `whatsappInbox`.
 * `en-whatsapp.ts` is the peer, checked by `satisfies` and walked by
 * `npm run verify:i18n`. The panels are Spanish-only and read this directly.
 * (`es-wa.ts` is a different feature: logging a WhatsApp enquiry by hand.)
 */
export const esWhatsApp = {
  alert: {
    chatTitle: "Nuevo mensaje de WhatsApp",
    leadTitle: "WhatsApp de una consulta",
    detail: (who: string, preview: string) => `${who}: ${preview.length > 120 ? `${preview.slice(0, 119)}…` : preview}`,
  },
  thread: {
    title: (n: number) => (n === 1 ? "1 mensaje de WhatsApp" : `${n} mensajes de WhatsApp`),
    unread: (n: number) => (n === 1 ? "1 sin leer" : `${n} sin leer`),
    customer: "Cliente",
    outbound: "Enviado",
    automatic: "automático",
    status: { sent: "enviado", delivered: "entregado", read: "leído", failed: "no enviado" } as Record<string, string>,
    notSent: (error: string) => `No se envió (${error}).`,
    media: "Archivo",
    mediaNotStored: "el archivo no se guardó",
    noBody: "(sin texto)",
    types: {
      image: "Foto",
      video: "Video",
      audio: "Audio",
      document: "Documento",
      sticker: "Sticker",
      location: "Ubicación",
      reaction: "Reacción",
    } as Record<string, string>,
    replyLabel: "Responder por WhatsApp",
    replySubmit: "Enviar por WhatsApp",
    replyFrom: "Sale desde el WhatsApp del portal.",
    windowOpen: (until: string) => `Podés responder hasta el ${until} (24 h desde su último mensaje).`,
    windowClosed:
      "Pasaron más de 24 horas desde el último mensaje del cliente: WhatsApp solo permite plantillas aprobadas por Meta, y todavía no hay ninguna activada (WHATSAPP_TEMPLATES). Escribile desde tu teléfono:",
    windowClosedTemplates:
      "Pasaron más de 24 horas desde el último mensaje del cliente: WhatsApp solo permite enviar una plantilla aprobada. Elegí una; si responde, se reabre la conversación.",
    templateSubmit: "Enviar plantilla",
    templatePreview: "Así lo recibe el cliente",
    templateOr: "O escribile desde tu teléfono:",
    openWaMe: "Abrir en WhatsApp",
    markRead: "Marcar como leído",
    partnerReadOnly: "Esta conversación llegó al WhatsApp del portal. Respondé al cliente desde tu propio WhatsApp.",
  },
  flash: {
    sent: "Mensaje de WhatsApp enviado.",
    notSent: "WhatsApp no aceptó el mensaje. Quedó en la conversación como no enviado.",
    empty: "Escribí un mensaje antes de enviar.",
    outsideWindow: "No se envió: pasaron más de 24 horas desde el último mensaje del cliente.",
    noRecipient: "Esta consulta no tiene un número de WhatsApp válido.",
    notConfigured: "WhatsApp no está configurado.",
    templateOff: "Esa plantilla no está activada. Se activa listándola en WHATSAPP_TEMPLATES cuando Meta la aprobó.",
    templateInvalid: "Completá todos los campos de la plantilla.",
    notFound: "Esa conversación no existe o no tenés acceso.",
    marked: "Marcado como leído.",
    converted: "Consulta creada. El chat de WhatsApp ahora está bajo esa consulta.",
    convertInvalid: "Revisá el tipo de consulta.",
  },
  admin: {
    view: "WhatsApp",
    hint: "Chats del WhatsApp del portal que no son de una consulta. Los de una consulta se ven debajo de cada consulta.",
    empty: "No hay chats de WhatsApp.",
    notConfigured: (missing: string) =>
      `WhatsApp todavía no está conectado: faltan ${missing} en hPanel (ver docs/log/whatsapp-inbox.md).`,
    back: "Volver a WhatsApp",
    chatWith: (who: string) => `WhatsApp con ${who}`,
    messages: (n: number) => (n === 1 ? "1 mensaje" : `${n} mensajes`),
    convertTitle: "Convertir en consulta",
    convertHint:
      "Crea una consulta interna con este número y mueve el chat debajo de ella, para seguirla como cualquier otra consulta.",
    convertType: "Tipo de consulta",
    convertName: "Nombre",
    convertSubmit: "Crear consulta",
  },
  /**
   * The auto-responder's messages (PR 3). Wording is a founder decision —
   * docs/decisions-needed.md; these are the conservative defaults. They never
   * state a fact about a property, a price or a time.
   */
  auto: {
    greetingFirst: (brand: string) =>
      `¡Hola! Gracias por escribir a ${brand}. Recibimos tu mensaje y en breve te responde un asesor.`,
    greetingClosed: (brand: string, hours: string) =>
      `¡Hola! Gracias por escribir a ${brand}. En este momento estamos fuera de horario (${hours}). Te respondemos apenas volvamos.`,
    handoff: (brand: string) => `Gracias por tu mensaje. Para esto te va a contactar un asesor de ${brand} a la brevedad.`,
    hoursWords: { weekdays: "lunes a viernes", saturday: "sábados", sunday: "domingos", separator: ", " },
  },
  settings: {
    title: "WhatsApp: respuestas automáticas",
    hint: "Solo dentro de la ventana de 24 h de WhatsApp. Cada mensaje automático queda en la conversación marcado como «automático».",
    notConfigured: "WhatsApp no está conectado todavía: estos ajustes se guardan pero no hacen nada hasta que lo esté.",
    greetingLabel: "Saludo automático",
    greetingBody:
      "Un mensaje fijo al primer mensaje de un cliente y cuando escribe fuera de horario (como máximo uno cada 12 h por cliente, y nunca después de que alguien del equipo le respondió).",
    aiLabel: "Respuesta automática con IA",
    aiBody:
      "La IA responde sola, sin que nadie lo lea antes. Como máximo un mensaje por cliente cada N horas, nunca después de que alguien del equipo respondió, y pasa a un asesor cualquier tema de precio, legal, documentos o reclamos, o cuando no está segura.",
    aiNeedsKey: "Necesita GEMINI_API_KEY o ANTHROPIC_API_KEY en hPanel.",
    cooldownLabel: "Horas entre respuestas de IA al mismo cliente",
    hoursTitle: "Horario de atención (hora de Asunción)",
    hoursHint: "Dejá los dos campos vacíos para un día cerrado.",
    weekdays: "Lunes a viernes",
    saturday: "Sábado",
    sunday: "Domingo",
    open: "Abre",
    close: "Cierra",
    previewTitle: "Textos que se envían",
    save: "Guardar respuestas automáticas",
    saved: "Respuestas automáticas guardadas.",
    invalid: "Revisá los horarios (formato HH:MM, apertura antes del cierre) y las horas entre respuestas (1 a 168).",
  },
} as const;
