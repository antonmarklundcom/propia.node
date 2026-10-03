/**
 * Partner reviews (plan-admin-next O7) — /admin copy, Spanish only like the
 * rest of the panels. The buyer-facing copy is `review` (es-review.ts / en-review.ts).
 */
export const esReviewsAdmin = {
  tab: "Reseñas",
  title: "Reseñas de inmobiliarias y agentes",
  hint: "Solo puede opinar un comprador cuya consulta trabajó ese socio (negocio, consulta compartida que tomó, o consulta directa que marcaste contactada o cerrada), con el enlace que le mandás desde Consultas. Nada se publica hasta que lo aprobás: completas en inmobiliarios.com.py, solo las estrellas en inmobiliaria.com.py.",
  disabled: "Los enlaces de reseña necesitan AUTH_TOKEN_SECRET (al menos 32 caracteres) en hPanel. Sin él, «Pedir reseña» no aparece.",
  empty: "Todavía no hay reseñas.",
  status: { pending: "Por aprobar", approved: "Publicada", rejected: "Rechazada" } as Record<string, string>,
  approve: "Aprobar",
  reject: "Rechazar",
  takeDown: "Despublicar",
  approved: "Reseña publicada.",
  rejected: "Reseña rechazada.",
  notFound: "Esa reseña ya no existe.",
  about: (kind: "agency" | "agent", name: string) => `${kind === "agency" ? "Inmobiliaria" : "Agente"}: ${name}`,
  fromLead: (id: number, name: string | null) => `Consulta #${id}${name ? ` (${name})` : ""}`,
  noText: "(sin texto)",

  /** /admin/leads card. */
  askTitle: "Pedir reseña",
  askHint: "Mandale este enlace al comprador. Vale 60 días y una sola vez.",
  askWhatsApp: "Enviar por WhatsApp",
  askMessage: (partner: string, url: string) =>
    `¡Hola! ¿Nos contás cómo te fue con ${partner}? Tu reseña ayuda a otras personas a elegir: ${url}`,
  askDone: "Ya dejó su reseña.",
};
