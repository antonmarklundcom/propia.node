/**
 * Seeker features (plan-build-2026-09-26 §3 A3): favourites, compare, "who
 * receives my enquiry", report a listing, and what "verified" means.
 *
 * Its own file so the five parallel wave-A builds do not all append to
 * `es.ts` at once; `index.ts` wires it in as `a3`. `en-a3.ts` is its peer and
 * is checked against this shape with `satisfies`.
 */

/** How many listings the compare tray holds. Copy and the store share it. */
export const COMPARE_MAX = 3;

export const esA3 = {
  favorites: {
    save: "Guardar",
    saved: "Guardado",
    addLabel: "Guardar en favoritos",
    removeLabel: "Quitar de favoritos",
    metaTitle: "Favoritos",
    metaDescription: "Las propiedades que guardaste en este navegador.",
    kicker: "Sin cuenta",
    title: "Tus favoritos",
    intro:
      "Se guardan solo en este navegador. Si borrás los datos del navegador o entrás desde otro dispositivo, no van a aparecer.",
    empty:
      "Todavía no guardaste ninguna propiedad. Tocá «Guardar» en un aviso y va a aparecer acá.",
    emptyCta: "Ver propiedades",
    unavailable: (n: number) =>
      n === 1
        ? "Una propiedad que guardaste ya no está publicada."
        : `${n} propiedades que guardaste ya no están publicadas.`,
    headerLink: (n: number) => `Favoritos (${n})`,
    clearAll: "Borrar todos",
  },
  compare: {
    add: "Comparar",
    added: "Comparando",
    addLabel: "Agregar a la comparación",
    removeLabel: "Quitar de la comparación",
    full: (max: number) => `Podés comparar hasta ${max} propiedades a la vez.`,
    barLabel: "Comparación de propiedades",
    barCount: (n: number, max: number) => `${n} de ${max} para comparar`,
    barCta: "Comparar",
    barClear: "Vaciar",
    metaTitle: "Comparar propiedades",
    metaDescription: "Hasta tres propiedades lado a lado.",
    kicker: "Comparar",
    title: "Comparar propiedades",
    intro:
      "Hasta tres avisos lado a lado. La lista se guarda solo en este navegador.",
    empty:
      "Elegí dos o tres propiedades con «Comparar» en los avisos para verlas acá.",
    emptyCta: "Ver propiedades",
    needMore: "Agregá al menos una propiedad más para comparar.",
    rowLabel: "Dato",
    rowPrice: "Precio",
    rowUsdM2: "US$ por m²",
    rowArea: "Superficie",
    rowLand: "Terreno",
    rowBedrooms: "Dormitorios",
    rowBathrooms: "Baños",
    rowZone: "Zona",
    rowType: "Tipo",
    rowOperation: "Operación",
    rowCuota: "Cuota estimada",
    remove: "Quitar",
    view: "Ver aviso",
    missing: "—",
    unavailable: (n: number) =>
      n === 1
        ? "Una propiedad de la lista ya no está publicada."
        : `${n} propiedades de la lista ya no están publicadas.`,
  },
  /**
   * The success message after an enquiry names who receives it, from the same
   * `routedTo` decision `/api/leads` stores. No response time: the founder has
   * not given one, so none is promised.
   */
  enquiry: {
    toAgent: (name: string) =>
      `Tu consulta le llegó a ${name}, el agente a cargo de este aviso.`,
    toAgency: (name: string) =>
      `Tu consulta le llegó a ${name}, la inmobiliaria que publica este aviso.`,
    toAgentUnnamed: "Tu consulta le llegó al agente a cargo de este aviso.",
    toAgencyUnnamed: "Tu consulta le llegó a la inmobiliaria que publica este aviso.",
    toOwner: "Tu consulta le llegó a la persona particular que publica este aviso.",
    toInternal: (brand: string) =>
      `Tu consulta le llegó al equipo de ${brand}, que la hace llegar a quien corresponda.`,
    waFallback: "Si preferís, también podés escribir directo por WhatsApp:",
  },
  report: {
    open: "Reportar este aviso",
    title: "Reportar este aviso",
    intro:
      "¿Algo no está bien? El reporte le llega al equipo del portal, no a quien publicó el aviso.",
    reasonLabel: "Motivo",
    reasons: {
      sold: "Ya se vendió o se alquiló",
      wrong_price: "El precio es incorrecto",
      fake: "Parece falso o engañoso",
      other: "Otro motivo",
    },
    detailLabel: "Contanos más (opcional)",
    phoneLabel: "Tu WhatsApp",
    phoneHint: "Por si necesitamos consultarte algo sobre el reporte.",
    submit: "Enviar reporte",
    sending: "Enviando…",
    sent: "Gracias. El equipo del portal va a revisar este aviso.",
    error: "No pudimos enviar el reporte. Probá de nuevo en unos minutos.",
    cancel: "Cancelar",
  },
  /**
   * What the "Verificado" mark means today, written from what the code does
   * (a staff toggle in /admin/inmobiliarias with no recorded checklist, and
   * the WhatsApp-code flag on a private seller's listing). Founder review
   * before merge — plan §8.2.
   */
  verified: {
    sectionTitle: "Qué significa «Verificado»",
    sectionSubtitle:
      "La marca aparece junto a algunas inmobiliarias, agentes y avisos. Esto es lo que indica hoy, y lo que no.",
    points: [
      {
        title: "La pone el equipo del portal, a mano",
        text: "En inmobiliarias y agentes, la marca la activa el equipo del portal desde su panel, cuenta por cuenta. No se compra ni se activa sola.",
      },
      {
        title: "Particulares: WhatsApp confirmado",
        text: "En el aviso de una persona particular, la marca solo aparece si el número de WhatsApp de quien publica se confirmó con un código.",
      },
      {
        title: "No certifica la propiedad",
        text: "No significa que revisamos el título, las deudas, las medidas ni el precio del aviso. Antes de pagar una seña, pedí la documentación y verificala con un escribano.",
      },
    ],
    linkLabel: "Qué significa «Verificado»",
  },
  /** Staff inbox (`/admin/leads`). */
  admin: {
    reportsChip: "Reportes",
    reportBadge: "Reporte de aviso",
    reportReason: {
      sold: "Vendido / alquilado",
      wrong_price: "Precio incorrecto",
      fake: "Falso o engañoso",
      other: "Otro",
    },
    alertReportTitle: "Nuevo reporte de aviso",
    alertReportDetail: (reason: string, listingTitle: string) =>
      `${reason} · ${listingTitle}`,
  },
} as const;

export type ReportReason = keyof typeof esA3.report.reasons;

export const REPORT_REASONS = Object.keys(esA3.report.reasons) as ReportReason[];
