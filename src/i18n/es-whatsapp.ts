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
      "Pasaron más de 24 horas desde el último mensaje del cliente: WhatsApp solo permite plantillas aprobadas, que todavía no están incluidas. Escribile desde tu teléfono:",
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
} as const;
