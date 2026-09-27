/**
 * The deal and commission ledger (docs/plan-agency-2026-09-26.md batch 6):
 * the "Negocio" block on /admin/leads, the partner's stage selector on
 * /agencia/leads, /admin/negocios and the history labels. Panel copy, Spanish
 * only like the rest of the panel (`fable/KNOWN-ISSUES.md`, "Panel and owner
 * copy is Spanish-only"). Its own file so parallel builds don't collide in
 * es.ts.
 *
 * Nothing here states a rate or a split: the money fields are whatever the
 * operator typed from the written agreement.
 */
export const esDeals = {
  stage: {
    open: "Abierto",
    viewing: "Visita",
    offer: "Oferta",
    reserved: "Reservado",
    won: "Cerrado (ganado)",
    lost: "Perdido",
  } as Record<string, string>,

  lostReason: {
    unavailable: "La propiedad ya no estaba disponible",
    price: "Precio",
    financing: "Financiación",
    slow_response: "Respuesta lenta",
    bought_elsewhere: "Compró o alquiló en otro lado",
    not_serious: "No era una consulta seria",
    other: "Otro motivo",
  } as Record<string, string>,

  /* ---------------------------- /admin/leads ---------------------------- */
  blockTitle: "Negocio",
  blockNone: "Sin negocio abierto",
  stageLabel: "Etapa",
  lostReasonLabel: "Motivo (si se perdió)",
  lostReasonNone: "—",
  partnerLabel: "Socio",
  partnerNone: "Ninguno",
  partnerRevoked: "(ya no compartida)",
  partnerHint: "Solo los socios con los que compartiste esta consulta.",
  salePriceLabel: "Precio de venta (US$)",
  commissionPctLabel: "Comisión total (%)",
  mySharePctLabel: "Tu parte de la comisión (%)",
  myShareUsdLabel: "Tu parte (US$)",
  myShareEstimate: (usd: string) => `Estimación: ≈ US$ ${usd} (precio × comisión × tu parte). Escribí el monto acordado.`,
  paidAtLabel: "Fecha de cobro",
  noteLabel: "Nota del negocio",
  save: "Guardar negocio",
  staffReadOnly: "Etapa del negocio",
  stageSince: (when: string) => `desde ${when}`,
  moneyHint:
    "Los montos son los del acuerdo escrito con el socio: el sistema los guarda y los suma, nunca calcula una comisión por su cuenta.",

  flash: {
    deal_saved: "Negocio guardado.",
    deal_invalid:
      "Revisá los valores: porcentajes entre 0 y 100 con hasta 2 decimales, montos desde 0, fecha válida.",
    deal_partner: "Ese socio no tiene esta consulta compartida.",
    deal_forbidden: "Solo el administrador puede editar los montos de un negocio.",
  } as Record<string, string>,

  /* --------------------------- /agencia/leads --------------------------- */
  partnerTitle: "Etapa del negocio",
  partnerHintText:
    "Contanos en qué quedó: visita, oferta, reserva, cierre o si se perdió.",
  partnerSave: "Actualizar etapa",
  partnerFlash: {
    deal_saved: "Etapa actualizada. Gracias.",
    deal_invalid: "No se pudo actualizar la etapa de esa consulta.",
  } as Record<string, string>,

  /* --------------------------- /admin/negocios -------------------------- */
  tab: "Negocios",
  metaTitle: "Negocios",
  title: "Negocios y comisiones",
  hint:
    "Lo que pasó con cada consulta que trabajaste con un socio. Los montos son los que escribiste en cada negocio desde Consultas.",
  kpiTitle: "Resumen",
  kpiHead: ["", "Este mes", "Total"],
  kpiOpenByStage: (stage: string) => `Negocios en etapa «${stage}»`,
  kpiWon: "Negocios ganados",
  kpiPaid: "Tu parte cobrada (US$)",
  kpiUnpaid: "Tu parte ganada sin cobrar (US$)",
  kpiNote:
    "Cobrada = negocios con fecha de cobro (este mes: cobrada este mes). Sin cobrar = negocios ganados sin fecha de cobro (este mes: ganados este mes). Solo suma «Tu parte (US$)» tal como la escribiste.",
  dealsTitle: "Negocios",
  dealsEmpty:
    "Todavía no hay negocios. Se abren desde el bloque «Negocio» de cada consulta, o cuando un socio actualiza la etapa.",
  dealsHead: [
    "Consulta",
    "Aviso",
    "Socio",
    "Etapa",
    "Precio (US$)",
    "Comisión %",
    "Tu parte %",
    "Tu parte (US$)",
    "Cobrado",
  ],
  openLead: "Ver consulta",
  noPartner: "Sin socio",
  lostTitle: "Motivos de pérdida",
  lostHead: ["Motivo", "Negocios"],
  lostEmpty: "Ningún negocio perdido.",
  lostUnknown: "Sin motivo",
  partnersTitle: "Por socio",
  partnersHead: ["Socio", "Negocios", "Ganados", "Tu parte cobrada (US$)", "Tu parte sin cobrar (US$)"],
  responseBoardLink: "Tiempo de respuesta de cada socio: ver el tablero en Consultas →",

  historyAction: {
    "deal.update": "Editó un negocio",
    "deal.stage": "Un socio movió la etapa de un negocio",
  } as Record<string, string>,
} as const;
