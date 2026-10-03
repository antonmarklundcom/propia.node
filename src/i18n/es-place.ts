/**
 * Place pages (`/zonas/<ciudad>[/<barrio>]`, plan phase 4): the page chrome.
 * The guide text itself lives in `src/content/places/`.
 */
export const esPlace = {
  metaNotFound: "Zona no encontrada",
  breadcrumbHome: "Inicio",
  photosTitle: "Fotos",
  faqTitle: "Preguntas frecuentes",
  /** "Propiedades en Asunción hoy" — the live links, counted from this door's rows. */
  listingsTitle: (place: string) => `Propiedades en ${place} hoy`,
  /** "Casas en venta" */
  listingsLink: (typeLabel: string, opLabel: string) => `${typeLabel} en ${opLabel}`,
  listingsNone: (place: string) =>
    `Hoy no hay avisos publicados en ${place}. Dejanos tu búsqueda y te avisamos cuando entre algo.`,
  barriosTitle: (city: string) => `Guías de barrios de ${city}`,
  cityGuideLink: (city: string) => `Guía de ${city}`,
  briefTitle: (place: string) => `¿Buscás propiedad en ${place}?`,
  briefIntro: "Contanos qué necesitás y te avisamos cuando aparezca algo que encaje.",
  /** The category pages' box: excerpt + link. */
  excerptTitle: (place: string) => `Sobre ${place}`,
  excerptLink: (place: string) => `Leé la guía de ${place}`,
  photoCredit: (credit: string) => credit,
} as const;
