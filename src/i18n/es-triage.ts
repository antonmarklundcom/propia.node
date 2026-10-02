/**
 * /admin triage copy: who published a listing (src/lib/publisher-kind.ts), who
 * a lead is from (src/lib/contact-kind.ts), the review-queue filters and the
 * tab badges. Panel copy, Spanish only like the rest of the panel
 * (`fable/KNOWN-ISSUES.md`, "Panel and owner copy is Spanish-only"). Its own
 * file so parallel builds don't collide in es.ts.
 */
import type { PublisherKind } from "@/lib/publisher-kind";
import type { ContactKind } from "@/lib/contact-kind";
import type { LeadPublisherKind } from "@/lib/panel-queries";

export const esTriage = {
  publisher: {
    own: "Propia",
    partner: "Socio",
    agency: "Inmobiliaria",
    agent: "Agente independiente",
    private: "Dueño particular",
    none: "Sin asignar",
  } satisfies Record<PublisherKind, string>,

  /** Chip labels: the same kinds, as a group. */
  publisherChip: {
    own: "Propias",
    partner: "De socios",
    agency: "Inmobiliarias",
    agent: "Agentes independientes",
    private: "Dueños particulares",
    none: "Sin asignar",
  } satisfies Record<PublisherKind, string>,

  /** /admin/leads: who published the lead's listing. */
  leadPublisherChip: {
    own: "Propias",
    partner: "De socios",
    agency: "Inmobiliarias",
    agent: "Agentes independientes",
    private: "Dueños particulares",
    none: "Sin asignar",
    no_listing: "Sin propiedad",
  } satisfies Record<LeadPublisherKind, string>,
  /** The pill on a lead card: "Socio: Inmobiliaria X", "Propia", "Sin propiedad". */
  leadPublisherPill: (kind: LeadPublisherKind, name: string | null): string => {
    const label: Record<LeadPublisherKind, string> = {
      own: "Propia",
      partner: "Socio",
      agency: "Inmobiliaria",
      agent: "Agente independiente",
      private: "Dueño particular",
      none: "Sin asignar",
      no_listing: "Sin propiedad",
    };
    return name && kind !== "own" && kind !== "none" && kind !== "no_listing"
      ? `${label[kind]}: ${name}`
      : label[kind];
  },
  leadPublisherFilterLabel: "Publicó",
  leadViewLabel: "Qué consultas ver",
  leadView: {
    mias: "Mis consultas",
    todas: "Todas",
  },
  leadViewHint: {
    mias: "Solo las consultas que te tocan a vos (derivadas a «Interno»), como el número de la pestaña.",
    todas: "Todas las consultas del sitio, también las derivadas a inmobiliarias, agentes y dueños.",
  },

  publisherFilterLabel: "Filtrar por quién publicó",
  publisherAll: "Todos",
  publisherColumn: "Publicó",
  publisherHelp:
    "Propias: tu inmobiliaria (elegila en Ajustes) o lo que publicaste vos o tu equipo. Socio: inmobiliaria con plan Socio (en Inmobiliarias) o agente independiente marcado «Socio» en Agentes. Verificado no es lo mismo que socio. Particular: un dueño que publicó solo.",
  houseAgencyMissing: "Todavía no elegiste tu inmobiliaria: hacelo en Ajustes para que sus avisos salgan como «Propias».",

  contact: {
    buyer: "Posible comprador",
    renter: "Posible inquilino",
    owner_sell: "Dueño que quiere vender",
    owner_rent: "Dueño que quiere alquilar",
    maybe_seller: "Posible vendedor (tasación)",
    owner: "Dueño",
    agent: "Agente independiente",
    agency: "Inmobiliaria",
    developer: "Desarrolladora",
    other: "Otra consulta",
  } satisfies Record<ContactKind, string>,
  contactFilterLabel: "Quién escribe",
  contactAll: "Todos",
  /** The admin "Registrar consulta de WhatsApp" form's empty choice. */
  contactUnknown: "Sin indicar",
  /** Shown on a card whose WhatsApp matches a professional in the directory. */
  knownAgent: (name: string) => `Agente registrado: ${name}`,
  knownAgency: (name: string) => `Inmobiliaria registrada: ${name}`,
  leadsBadgeNote: (n: number) =>
    n === 1
      ? "1 consulta tuya sin atender (estado «Nueva»): es el número de la pestaña. Marcala como Contactada al responder."
      : `${n} consultas tuyas sin atender (estado «Nueva»): es el número de la pestaña. Marcalas como Contactadas al responder.`,
  sortLabel: "Ordenar",
  sort: {
    recent: "Más recientes",
    oldest: "Más antiguas",
    kind: "Por quién escribe",
  },

  review: {
    searchLabel: "Buscar por título o código",
    operationLabel: "Operación",
    typeLabel: "Tipo",
    anyOption: "Todas",
    anyType: "Todos",
    filterSubmit: "Filtrar",
    clearFilters: "Quitar filtros",
    colListing: "Propiedad",
    colOperation: "Operación",
    colType: "Tipo",
    colPrice: "Precio",
    colReceived: "Recibida",
    colActions: "",
    edit: "Ver y editar",
    selectRow: (title: string) => `Seleccionar ${title}`,
    showing: (shown: number, total: number) =>
      shown === total ? `${total} en la cola` : `${shown} de ${total} en la cola`,
    emptyFiltered: "Ninguna propiedad de la cola coincide con estos filtros.",
    selectedNone: "Ninguna seleccionada",
    selectedOne: "1 propiedad seleccionada",
    selectedMany: (n: number) => `${n} propiedades seleccionadas`,
    bulkHint:
      "Tildá filas en la tabla (o «Seleccionar todos») y aprobalas o rechazalas juntas. El motivo es obligatorio solo para rechazar y se guarda igual en todas.",
  },

  quality: {
    issueFilterLabel: "Filtrar por problema",
    allIssues: "Todos los problemas",
    clearIssue: "Quitar filtro",
  },

  /** Tooltip on a tab's badge. */
  badgeTitle: {
    review: (n: number) => `${n} esperando revisión`,
    leads: (n: number) => `${n} consultas sin atender`,
    deals: (n: number) => `${n} negocios ganados sin cobrar`,
    inbox: (n: number) => `${n} mensajes sin leer`,
    posts: (n: number) => `${n} borradores`,
    import: (n: number) => `${n} importaciones con error`,
    operations: (n: number) => `${n} tareas cuya última corrida falló`,
    agencies: (n: number) => `${n} inmobiliarias registradas sin verificar`,
    agents: (n: number) => `${n} agentes registrados sin verificar`,
  },

  /** /admin/agentes: the per-agent "Socio" switch (site setting partner_agent_ids). */
  agentPartner: {
    hint: "«Socio» marca a un agente independiente con quien trabajás: sus avisos salen como «Socio» en Propiedades, Cola de revisión y Consultas. Los agentes de una inmobiliaria siguen el plan de su inmobiliaria.",
    set: "Marcar como socio",
    unset: "Quitar socio",
    flashOn: "Agente marcado como socio.",
    flashOff: "El agente ya no figura como socio.",
  },

  settings: {
    houseTitle: "Mi inmobiliaria",
    houseHint:
      "Los avisos de esta inmobiliaria salen como «Propias» en Propiedades, Cola de revisión y Calidad, separados de los de socios, otras inmobiliarias, agentes y dueños particulares.",
    houseLabel: "Tu inmobiliaria",
    houseNone: "Ninguna (solo lo que publicás vos o tu equipo)",
    houseSave: "Guardar",
    houseSaved: "Guardado: tu inmobiliaria.",
    houseInvalid: "Esa inmobiliaria no existe.",
  },

  /** Admin triage 3: CSV buttons, reply templates, bulk "contactadas", shortcuts, deltas. */
  export: {
    button: "Descargar CSV",
    hint: "Descarga la vista actual, con sus filtros.",
    colTitle: "Título",
    colOperation: "Operación",
    colType: "Tipo",
    colPlace: "Zona",
    colPublisherName: "Nombre de quien publicó",
    colPrice: "Precio",
    colCurrency: "Moneda",
    colUpdated: "Actualizada",
    colUrl: "Enlace público",
  },

  templates: {
    title: "Plantillas de respuesta",
    hint: "Textos guardados para responder más rápido desde Consultas. Separá cada plantilla con una línea que tenga solo «---». Podés usar {nombre} (quien consulta) y {propiedad} (el aviso). Hasta 20 plantillas de 1000 caracteres. Nunca se envían solas: solo llenan el cuadro de respuesta.",
    label: "Plantillas",
    save: "Guardar plantillas",
    saved: "Guardado: plantillas de respuesta.",
    tooMany: "Son demasiadas plantillas: el máximo es 20.",
    tooLong: "Una plantilla pasa los 1000 caracteres.",
    pickerLabel: "Plantilla",
    pickerNone: "Elegir una plantilla…",
    replaceConfirm: "El cuadro ya tiene texto. ¿Reemplazarlo con la plantilla?",
    manage: "Editar plantillas",
  },

  bulkContacted: {
    button: "Marcar contactadas",
    hint: "Pasa las consultas tildadas de «Nueva» a «Contactada». Las que ya tienen otro estado no se tocan.",
    done: (n: number) => (n === 1 ? "1 consulta marcada como contactada." : `${n} consultas marcadas como contactadas.`),
    none: "Ninguna de las consultas tildadas estaba «Nueva».",
    invalid: "Tildá al menos una consulta.",
  },

  shortcuts: {
    hint: "Atajos: j/k · x · a · r · ?",
    title: "Atajos de teclado",
    keys: [
      ["j / k", "Bajar / subir una fila"],
      ["x", "Tildar o destildar la fila"],
      ["a", "Aprobar la fila"],
      ["r", "Abrir el cuadro para rechazar"],
      ["?", "Mostrar u ocultar esta ayuda"],
    ] as ReadonlyArray<readonly [string, string]>,
    close: "Cerrar",
  },

  delta: {
    vsPrevious: (n: number) => `Comparado con los ${n} días anteriores`,
    up: (pct: string) => `+${pct} %`,
    down: (pct: string) => `−${pct} %`,
    flat: "0 %",
    fresh: "nuevo",
    title: (prev: string) => `Período anterior: ${prev}`,
  },

  /** Thumbnail alt for listings without a photo. */
  noCover: "Sin foto",
} as const;
