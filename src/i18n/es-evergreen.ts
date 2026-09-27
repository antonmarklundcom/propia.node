/**
 * UI strings of the evergreen category pages (`src/components/evergreen/`,
 * ARCHITECTURE.md §4.3). Only the chrome lives here — the page's own prose
 * is typed data in `src/content/evergreen/`. Its own file so parallel builds
 * don't collide in es.ts; `en-evergreen.ts` is its peer.
 */
export const esEvergreen = {
  chipsAria: "Atajos de búsqueda",
  typesLabel: "Tipo",
  pricesLabel: "Precio",
  barriosLabel: "Barrio",
  /** "Casas 12" — the count is a separate element. */
  chipZeroHint: "Sin avisos hoy: dejá tu búsqueda",
  bandUpTo: (max: string) => `Hasta ${max}`,
  bandFrom: (min: string) => `Más de ${min}`,
  bandRange: (min: string, max: string) => `${min} a ${max}`,
  /** Primary button with stock. */
  seeAll: (n: number) => `Ver ${n} ${n === 1 ? "propiedad" : "propiedades"}`,
  /** Primary button at 0 stock — opens the brief. */
  notifyMe: "Avisame cuando haya",
  /** Heading of the brief on an evergreen page. */
  briefTitle: (where: string) => `Contanos qué buscás en ${where}`,
  /** `fem`: the type's grammatical gender (casas → publicadas). */
  briefTitleEmpty: (what: string, where: string, fem: boolean) =>
    `Hoy no hay ${what} ${fem ? "publicadas" : "publicados"} en ${where}. Dejá tu búsqueda y te avisamos`,
  briefIntro:
    "Un formulario corto, sin compromiso. Lo recibe nuestro equipo y te escribe cuando aparezca algo que encaje.",
  whatsappCta: "Preguntar por WhatsApp",
  whatsappText: (what: string) => `Hola, estoy buscando ${what}.`,
  listingsTitle: (what: string, fem: boolean) => `${what} ${fem ? "publicadas" : "publicados"} hoy`,
  nearbyTitle: (what: string, where: string) => `${what} cerca de ${where}`,
  nearbyNote: (where: string, places: string) =>
    `Hoy no hay avisos en ${where}. Estos están en ciudades cercanas: ${places}.`,
  nearbyNone: (where: string) =>
    `Hoy no hay avisos en ${where} ni en ciudades cercanas. Dejá tu búsqueda arriba y te avisamos.`,
  nearbyChip: "Cerca",
  /** Live price facts at the top of the price section. */
  factsCount: (countNoun: string, where: string, fem: boolean) =>
    `Hoy hay ${countNoun} ${fem ? "publicadas" : "publicados"} en ${where} en este portal.`,
  factsRange: (min: string, max: string) =>
    min === max
      ? `El precio pedido es ${min}.`
      : `Los precios pedidos van de ${min} a ${max}.`,
  factsEmpty: (what: string, where: string, fem: boolean) =>
    `Hoy no hay ${what} ${fem ? "publicadas" : "publicados"} en ${where} en este portal, así que no mostramos precios: preferimos no darte un número que no podamos respaldar.`,
  financingCta: "Ver programas y calcular la cuota",
  faqTitle: "Preguntas frecuentes",
} as const;
