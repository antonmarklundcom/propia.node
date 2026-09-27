/**
 * Plan-agency batch 4: partner alerts on Telegram, the unanswered-lead
 * reminder, and the partner's own note on a shared lead. Panel and bot copy;
 * nothing here reaches a visitor. Its own file so parallel builds don't
 * collide in es.ts. `en-telegram.ts` is its peer: the alerts and the bot's
 * replies go out in each partner's own `users.locale`
 * (`src/lib/partner-alerts.ts`); the panel screens still read the Spanish
 * (`fable/KNOWN-ISSUES.md`, "Panel and owner copy is Spanish-only").
 * `index.ts` wires both in as `telegram`, so `verify:i18n` walks them.
 *
 * **No buyer data in any message.** A Telegram chat is not a panel: it sits on
 * a phone, in notification previews, possibly on a shared device. So every
 * alert says only what happened, at most the listing's title, and where to
 * look — never a name, phone, email or message text.
 */
export const esTelegram = {
  /** /agencia/perfil — the "Alertas por Telegram" card. */
  card: {
    title: "Alertas por Telegram",
    intro:
      "Recibí en Telegram un aviso cuando te compartan una consulta, cuando el comprador responda por correo, y un recordatorio si una consulta queda sin respuesta. Los mensajes no incluyen datos del comprador: solo te avisan que mires tu panel.",
    connect: "Conectar Telegram",
    connectHint:
      "Se abre Telegram con nuestro bot: tocá «Iniciar» y listo. El enlace es solo tuyo y vence en una hora; si pasó más tiempo, recargá esta página.",
    connected: "Conectado",
    connectedHint:
      "Las alertas llegan al chat de Telegram que conectaste. Para usar otro, desconectá y volvé a conectar desde ese teléfono.",
    disconnect: "Desconectar",
    disabled:
      "El operador del sitio todavía no activó las alertas por Telegram. Las consultas que te compartan igual aparecen en Consultas, en este panel.",
    flashDisconnected: "Telegram desconectado. Ya no vas a recibir alertas ahí.",
  },

  /** What the bot answers in the chat (the webhook's reply). */
  bot: {
    linked: "Listo: vas a recibir aquí las consultas que te compartan.",
    invalidLink:
      "Ese enlace no es válido o ya venció (dura una hora). Abrí «Conectar Telegram» desde tu perfil en el panel y probá de nuevo.",
    otherChat:
      "Tu cuenta ya tiene otro chat de Telegram conectado. Para usar este, primero tocá «Desconectar» en tu perfil del panel y después volvé a conectar desde aquí.",
    stopped: "Listo: ya no vas a recibir alertas en este chat.",
    notLinked: "Este chat no estaba conectado a ninguna cuenta.",
    help:
      "Este bot solo envía alertas del panel. Para conectarlo, usá «Conectar Telegram» en tu perfil. Para dejar de recibirlas, escribí /stop.",
  },

  /** Partner alerts. `url` is the absolute /agencia/leads link. */
  alert: {
    shared: (count: number) =>
      count === 1
        ? "Te compartieron una consulta nueva."
        : `Te compartieron ${count} consultas nuevas.`,
    emailReply: "El comprador de una consulta que te compartieron respondió por correo.",
    reminder: (count: number, hours: number) =>
      count === 1
        ? `Tenés una consulta compartida sin responder hace más de ${hours} horas.`
        : `Tenés ${count} consultas compartidas sin responder hace más de ${hours} horas.`,
    listing: (title: string) => `Aviso: ${title}`,
    open: (url: string) => `Abrila en tu panel: ${url}`,
  },

  /** The one operator alert a reminder run sends. */
  operator: {
    remindersTitle: (count: number) =>
      count === 1
        ? "Una consulta compartida sigue sin respuesta del socio"
        : `${count} consultas compartidas siguen sin respuesta del socio`,
    /** `sent` = Telegram reminders Telegram actually accepted, never the attempted count. */
    remindersDetail: (hours: number, sent: number) =>
      `Pasaron más de ${hours} horas desde que las compartiste. Recordatorios que llegaron a socios por Telegram: ${sent}.`,
  },

  /** The partner's own note on a shared-lead card (/agencia/leads). */
  note: {
    label: "Tu nota",
    hint: "La ven quienes tienen esta consulta en su panel y el equipo del sitio. Nunca el comprador.",
    save: "Guardar nota",
    saved: "Nota guardada.",
    invalid: "No se pudo guardar la nota.",
  },

  /** /admin/leads, next to a share. */
  admin: {
    partnerNote: "Nota del socio:",
  },

  /** /admin/operaciones card. */
  ops: {
    label: "Recordatorios a socios",
    description: (hours: number) =>
      `Busca consultas compartidas que siguen «pendientes» más de ${hours} horas después de compartirlas y todavía no tuvieron recordatorio. A cada socio con Telegram conectado le manda un recordatorio, y a vos una sola alerta con el total. Corre sola cada hora (Worker de Cloudflare).`,
    writes: "Marca cada consulta como recordada (una sola vez) y envía los mensajes.",
  },
} as const;
