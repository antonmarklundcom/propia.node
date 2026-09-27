/**
 * The buyer brief ("contanos qué buscás", `src/components/BuyerBrief.tsx`,
 * `src/lib/buyer-brief.ts`). Its own file so parallel builds don't collide in
 * es.ts; `en-brief.ts` is its peer. Name / WhatsApp / email labels and the
 * consent line are NOT repeated here — the form reads them from `leadForm`, so
 * this form and the other lead forms say exactly the same thing.
 */
export const esBrief = {
  /** Heading over the form when a search found nothing. */
  titleEmpty: "¿No encontrás lo que buscás? Contanos qué necesitás",
  /** Heading when a search found only a few properties. */
  titleFew: "¿Pocas opciones? Contanos qué buscás",
  intro:
    "Dejanos los datos de tu búsqueda y te ayudamos a encontrar opciones que se ajusten.",
  /** The collapsed thin-results variant: the button that opens the form. */
  open: "Contanos qué buscás",
  operationLabel: "Operación",
  typeLabel: "Tipo de propiedad",
  typeAny: "Cualquier tipo",
  whereLabel: "Zona",
  wherePlaceholder: "Ciudad o barrio",
  budgetLabel: "Presupuesto máximo",
  budgetPlaceholder: "Ej.: 150000",
  currencyLabel: "Moneda",
  currency: { USD: "USD", PYG: "Guaraníes" } as Record<string, string>,
  bedroomsLabel: "Dormitorios (opcional)",
  bedroomsAny: "Indistinto",
  bedroomsOption: (n: number) => `${n} o más`,
  timelineLabel: "¿Para cuándo?",
  timelinePlaceholder: "Elegí una opción",
  timeline: {
    now: "Lo antes posible",
    "3m": "En los próximos 3 meses",
    "6m": "En 6 meses o más",
    browsing: "Solo estoy mirando",
  } as Record<string, string>,
  noteLabel: "Algo más (opcional)",
  notePlaceholder: "Ej.: con patio, cerca de un colegio",
  operation: {
    venta: "Comprar",
    alquiler: "Alquilar",
    alquiler_temporal: "Alquiler temporal",
  } as Record<string, string>,
  submit: "Enviar mi búsqueda",
  invalidBudget: "Ingresá el presupuesto solo con números.",
  /**
   * The operator's copy of the brief, folded into `leads.message` by
   * `/api/leads`. Always Spanish, whatever door it came from — the operator
   * reads `/admin/leads` in Spanish, the same rule as `esPanel`'s alerts.
   */
  lead: {
    heading: "Pedido de búsqueda",
    lookingFor: "Busca",
    where: "Zona",
    budget: "Presupuesto máx.",
    bedrooms: "Dormitorios",
    timeline: "Plazo",
    note: "Nota",
    from: "Desde",
    anyType: "Cualquier tipo",
    operation: {
      venta: "compra",
      alquiler: "alquiler",
      alquiler_temporal: "alquiler temporal",
    } as Record<string, string>,
    propertyType: {
      casa: "Casa",
      departamento: "Departamento",
      terreno: "Terreno",
      duplex: "Dúplex",
      comercial: "Local comercial",
      oficina: "Oficina",
      deposito: "Depósito",
      quinta: "Quinta",
    } as Record<string, string>,
    timelineOption: {
      now: "lo antes posible",
      "3m": "próximos 3 meses",
      "6m": "6 meses o más",
      browsing: "solo mirando",
    } as Record<string, string>,
    bedroomsValue: (n: number) => `${n}+`,
  },
  /** `/admin/leads` chip for a lead that came from the brief. */
  adminBadge: "Pedido de búsqueda",
} as const;
