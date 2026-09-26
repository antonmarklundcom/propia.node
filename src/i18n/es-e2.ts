/**
 * The email inbox (plan-build-2026-09-26 §6, waves E2 + E3): lead email
 * threads in the three panels and /admin/inbox.
 *
 * Its own file, like the wave-A namespaces, so a parallel build does not
 * append to `es.ts` at the same time; `index.ts` wires it in as `inbox`.
 * `en-e2.ts` is its peer and is checked against this shape with `satisfies`.
 * The panels read it directly (they are Spanish-only today, like `esPanel`).
 */
export const esInbox = {
  alert: {
    inboxTitle: (mailbox: string) => `Nuevo email en ${mailbox}`,
    leadReplyTitle: "Respuesta por email a una consulta",
    detail: (from: string, subject: string) => (subject ? `${from} · ${subject}` : from),
  },
  thread: {
    title: (n: number) => (n === 1 ? "1 email" : `${n} emails`),
    unread: (n: number) => (n === 1 ? "1 respuesta nueva" : `${n} respuestas nuevas`),
    outbound: "Enviado",
    to: "Para",
    cc: "CC",
    notSent: (error: string) => `No se envió (${error}).`,
    attachments: "Adjuntos",
    attachmentMetadataOnly: "solo el nombre: el archivo no se guardó",
    showImages: "Mostrar imágenes remotas",
    hideImages: "Ocultar imágenes remotas",
    imagesBlocked:
      "Las imágenes remotas están bloqueadas: avisan al remitente cuándo y desde dónde abriste el email.",
    noBody: "(sin texto)",
    quoteHeader: (name: string, when: string) => `El ${when}, ${name} escribió:`,
    replyLabel: "Responder por email",
    replyTo: (to: string) => `Se envía a ${to}. Su respuesta vuelve a esta consulta.`,
    replySubmit: "Enviar",
    replyUnavailable:
      "Para responder por email desde acá, el correo entrante tiene que estar configurado (ver PR E2/E3).",
    noRecipient: "Esta consulta no tiene email: respondé por WhatsApp.",
    markRead: "Marcar como leído",
    subjectFallback: (listing: string | null) =>
      listing ? `Tu consulta sobre ${listing}` : "Tu consulta",
  },
  flash: {
    sent: "Email enviado.",
    notSent: "No se pudo enviar el email. Quedó guardado en la conversación como no enviado.",
    empty: "Escribí un mensaje antes de enviar.",
    noRecipient: "No hay una dirección a la que responder.",
    notFound: "Esa conversación no existe o no tenés acceso.",
    archived: "Conversación archivada.",
    unarchived: "Conversación movida a la bandeja de entrada.",
    converted: "Consulta creada. La conversación ahora está bajo esa consulta.",
    convertInvalid: "Revisá el WhatsApp (mínimo 6 dígitos) y el tipo de consulta.",
    marked: "Marcado como leído.",
  },
  admin: {
    tab: "Correo",
    metaTitle: "Correo",
    title: "Correo",
    hint: (mailboxes: string) => `Lo que llega a ${mailboxes}. Las respuestas a consultas se ven debajo de cada consulta.`,
    notConfigured:
      "El correo entrante todavía no está conectado: falta INBOUND_EMAIL_SECRET en hPanel y el Worker de Cloudflare (ver el PR E2/E3).",
    sendingNotConfigured: "El envío de emails no está configurado (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_EMAIL_TOKEN).",
    viewInbox: "Bandeja de entrada",
    viewArchived: "Archivados",
    viewLeads: "Respuestas a consultas",
    compose: "Redactar",
    empty: "No hay emails.",
    emptyArchived: "No hay conversaciones archivadas.",
    unreadCount: (n: number) => (n === 1 ? "1 sin leer" : `${n} sin leer`),
    messages: (n: number) => (n === 1 ? "1 mensaje" : `${n} mensajes`),
    back: "Volver al correo",
    archive: "Archivar",
    unarchive: "Mover a la bandeja",
    composeTitle: "Nuevo email",
    from: "Desde",
    to: "Para",
    cc: "CC (opcional, separados por coma)",
    subject: "Asunto",
    body: "Mensaje",
    send: "Enviar",
    replyTitle: "Responder",
    replyTo: (to: string) => `Para ${to}`,
    rootSendingOff: (mailbox: string, sender: string) =>
      `Se envía desde ${sender}, con respuesta a ${mailbox}. Para enviar como ${mailbox}, el dominio raíz tiene que estar dado de alta en Email Sending y EMAIL_ROOT_SENDING=true.`,
    rootSendingOn: (mailbox: string) => `Se envía como ${mailbox}.`,
    convertTitle: "Convertir en consulta",
    convertHint:
      "Crea una consulta en /admin/leads como si hubiera llegado por el formulario (canal interno), y mueve esta conversación debajo de ella.",
    convertType: "Tipo",
    convertName: "Nombre",
    convertWhatsapp: "WhatsApp",
    convertSubmit: "Crear consulta",
    leadRepliesEmpty: "Todavía no llegó ninguna respuesta por email a una consulta.",
    openLead: "Ver consulta",
    leadLabel: (name: string) => `Consulta: ${name}`,
    attachmentNotFound: "Ese adjunto no existe, no se guardó o no tenés acceso.",
  },
} as const;
