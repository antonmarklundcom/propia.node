/**
 * /admin triage copy: who published a listing (src/lib/publisher-kind.ts), who
 * a lead is from (src/lib/contact-kind.ts), the review-queue filters and the
 * tab badges. Panel copy, Spanish only like the rest of the panel
 * (`fable/KNOWN-ISSUES.md`, "Panel and owner copy is Spanish-only"). Its own
 * file so parallel builds don't collide in es.ts.
 */
import type { PublisherKind } from "@/lib/publisher-kind";
import type { ContactKind } from "@/lib/contact-kind";

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

  publisherFilterLabel: "Filtrar por quién publicó",
  publisherAll: "Todos",
  publisherColumn: "Publicó",
  publisherHelp:
    "Propias: tu inmobiliaria (elegila en Ajustes) o lo que publicaste vos o tu equipo. Socio: inmobiliaria con plan Partner o agente independiente verificado (los mismos con quienes compartís consultas). Particular: un dueño que publicó solo.",
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
} as const;
