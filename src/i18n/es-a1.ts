/**
 * Copy for build A1 (docs/plan-build-2026-09-26.md §3): lead grouping,
 * pre-filled WhatsApp replies and invites, CSV export, per-agent numbers.
 *
 * Its own file so the parallel wave-A sessions do not all append to `es.ts`.
 * `en-a1.ts` is the peer, checked by `satisfies` where the dictionaries are
 * assembled and walked by `npm run verify:i18n`.
 */
export const esA1 = {
  /* Superadmin 7 — one card per WhatsApp number on /admin/leads. */
  groupToggle: "Agrupar por número",
  groupToggleOff: "Ver una por una",
  groupOlder: (n: number) =>
    n === 1 ? "Ver 1 consulta anterior" : `Ver ${n} consultas anteriores`,

  /* Realtor 8 — the pre-filled WhatsApp reply. */
  replyText: (p: { name: string | null; listingTitle: string; listingUrl: string }) =>
    `Hola${p.name ? ` ${p.name}` : ""}, te escribo por ${p.listingTitle} (${p.listingUrl}). ¿Seguís interesado/a?`,
  replyTextGeneric: (name: string | null) =>
    `Hola${name ? ` ${name}` : ""}, te escribo por tu consulta. ¿En qué te puedo ayudar?`,

  /* Agency 5 — invite on WhatsApp. The number is never stored. */
  inviteWhatsappLabel: "WhatsApp de la persona (opcional)",
  inviteWhatsappPlaceholder: "0981 123 456",
  inviteWhatsappSend: "Enviar por WhatsApp",
  inviteWhatsappHint:
    "El número no se guarda: solo abre WhatsApp con el enlace listo para enviar.",
  inviteWhatsappText: (agencyName: string, url: string) =>
    `Hola, te invito a sumarte al equipo de ${agencyName}. Creá tu cuenta con este enlace: ${url}`,

  /* Agency 8 — CSV export. */
  exportCsv: "Descargar CSV",
  exportHint: "El archivo trae exactamente las consultas de esta lista.",
  csvSectionOwn: "Propia",
  csvSectionShared: "Compartida",
  csvLeadType: {
    buyer: "Compra",
    renter: "Alquiler",
    seller: "Venta",
    valuation: "Tasación",
    developer: "Desarrolladora",
    agent_signup: "Alta de agente",
    landlord: "Alquilar su propiedad",
    question: "Consulta",
  } as Record<string, string>,
  csvFollowUp: { new: "Nueva", contacted: "Contactada", closed: "Cerrada" } as Record<string, string>,
  csvRouted: {
    agency: "Inmobiliaria",
    agent: "Agente",
    owner: "Particular",
    internal: "Interno",
    developer: "Desarrolladora",
  } as Record<string, string>,
  csvPanelHead: [
    "Sección",
    "Fecha",
    "Tipo",
    "Nombre",
    "WhatsApp",
    "Email",
    "Mensaje",
    "Propiedad",
    "URL de la propiedad",
    "Respuesta",
  ],
  csvAdminHead: [
    "Fecha",
    "Tipo",
    "Estado",
    "Nombre",
    "WhatsApp",
    "Email",
    "Mensaje",
    "Sitio",
    "Derivada a",
    "Propiedad",
    "URL de la propiedad",
    "Nota interna",
    "Origen",
  ],

  /* Agency 4 — numbers per agent on /agencia (agency_admin only). */
  teamNumbersTitle: "Tu equipo en números",
  teamNumbersHint: (days: number) =>
    `Consultas de los últimos ${days} días. Las compartidas son las que el portal le pasó a cada agente.`,
  teamNumbersHead: [
    "Agente",
    "Publicadas",
    "Consultas",
    "Compartidas respondidas",
    "Mediana de respuesta (h)",
  ],
  teamNumbersEmpty: "Todavía no hay agentes en tu equipo.",
} as const;
