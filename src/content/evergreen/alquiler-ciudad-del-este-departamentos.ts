/**
 * Evergreen page: /alquiler/ciudad-del-este/departamentos — "alquiler
 * departamento ciudad del este" (110/mo) and its merged variants
 * (docs/seo-evergreen-keywords.md, table A #14).
 *
 * Prose only, no numbers (the page counts those from its own rows); every
 * factual claim is listed in claimsToVerify.
 */
import type { EvergreenPage } from "./types";

export const alquilerCiudadDelEsteDepartamentos: EvergreenPage = {
  path: "/alquiler/ciudad-del-este/departamentos",
  door: "inmobiliaria",
  keyword: "alquiler departamento ciudad del este",
  secondaryKeywords: [
    "alquiler de departamento en cde",
    "alquiler de departamentos cde",
    "alquiler de departamento en ciudad del este",
    "alquiler de departamentos ciudad del este",
    "departamentos en alquiler ciudad del este",
    "alquiler de apartamentos en ciudad del este",
  ],
  h1: "Departamentos en alquiler en Ciudad del Este",
  lede: "Filtrá los departamentos en alquiler de Ciudad del Este por precio mensual y por zona, y contanos qué buscás si ninguno de los publicados te sirve todavía.",
  metaDescription:
    "Departamentos en alquiler en Ciudad del Este: filtrá por precio y zona, mirá lo publicado hoy y dejá tu búsqueda para lo nuevo.",
  priceBands: [
    { max: 250 },
    { min: 251, max: 400 },
    { min: 401, max: 600 },
    { min: 601 },
  ],
  barrios: {
    title: "Zonas de Ciudad del Este para alquilar un departamento",
    intro:
      "Para un departamento en Ciudad del Este pesan otras cosas que para una casa: la cercanía al comercio, si el edificio tiene seguridad propia y qué tan lejos queda de donde trabajás o estudiás.",
    items: [
      {
        name: "Microcentro y galerías",
        text: "Es la zona con más edificios y también la que ofrece los trayectos más cortos a pie hacia el comercio. A cambio, el movimiento de gente y de carga se siente a toda hora, incluso de noche en las cuadras más próximas al puente.",
      },
      {
        name: "Barrios con edificios más nuevos",
        text: "En los últimos años se levantaron edificios con seguridad propia, cochera y áreas comunes algo más alejados del microcentro. Suelen tener expensa, así que conviene preguntar el monto y qué cubre antes de comparar precios entre edificios.",
      },
      {
        name: "Zonas cercanas a institutos y oficinas",
        text: "Los departamentos chicos, de uno o dos ambientes, se concentran cerca de los institutos y de las oficinas del centro administrativo de la ciudad. Son los primeros en alquilarse entre estudiantes y entre quienes llegan solos a trabajar.",
      },
      {
        name: "Barrios más alejados, sobre las rutas de salida",
        text: "Hay edificios más chicos y departamentos en casas divididas hacia las salidas de la ciudad, con alquileres más bajos pero trayectos más largos hasta el microcentro en las horas de más tránsito.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los alquileres publicados",
    paragraphs: [
      "Los montos que ves arriba salen de los departamentos publicados hoy en este portal para Ciudad del Este: son valores pedidos por quien alquila, no contratos firmados, y cambian a medida que se publican o se retiran avisos.",
      "Como en el resto de la ciudad, buena parte de los departamentos en Ciudad del Este se publica en dólares por el peso del comercio de frontera en la economía local. El portal filtra y ordena por ese equivalente en dólares.",
      "El alquiler del aviso no incluye la expensa: antes de comparar dos departamentos por el mismo precio, fijate cuánto cobra cada edificio y qué cubre — portería, ascensor, limpieza de áreas comunes.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar un departamento en Ciudad del Este",
    intro: "Un departamento se visita rápido, pero conviene resolver estos puntos antes de firmar:",
    items: [
      "Cuánto es la expensa del edificio y qué cubre exactamente: portería, ascensor, agua del tanque, limpieza de los pasillos.",
      "Si el edificio cuenta con generador o tanque de reserva para los cortes de luz o de agua, algo para preguntar en los edificios más antiguos del centro.",
      "El estado del ascensor y si funciona todos los días, algo importante en los pisos altos del microcentro.",
      "Si se permite compartir el departamento con otra persona, una práctica habitual entre estudiantes que cursan cerca de los institutos.",
      "El ruido que sube desde la calle en los departamentos de los primeros pisos, más marcado cerca de las galerías.",
      "Si el edificio tiene cochera propia o si el auto queda en la calle, un punto importante en las cuadras con más movimiento de carga.",
      "A quién le pide garante la inmobiliaria que administra el edificio, o si acepta un seguro de alquiler en su lugar.",
      "La duración mínima del contrato y si se puede renovar por períodos cortos, algo que suelen pedir quienes llegan por trabajo temporal.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en un departamento alquilado en Ciudad del Este",
    paragraphs: [
      "Además del garante o el seguro de alquiler, en un edificio hay que sumar la expensa a tu presupuesto mensual desde el primer mes: no es un gasto aparte, es parte del costo real de vivir ahí.",
      "Al firmar suele pedirse depósito y el primer mes por adelantado. Conviene pedir por escrito qué pasa con ese depósito si te vas antes de terminar el contrato, para no discutirlo recién al momento de la devolución.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar un departamento en Ciudad del Este?",
      a: "Depende del tamaño, de si el edificio es nuevo y de qué tan cerca esté del microcentro. Arriba mostramos el rango de los departamentos publicados hoy en el portal.",
    },
    {
      q: "¿Los departamentos incluyen expensa en el precio publicado?",
      a: "Casi nunca. El aviso muestra el alquiler y la expensa se paga aparte; preguntala siempre antes de decidirte por un edificio.",
    },
    {
      q: "¿Conviene un departamento cerca del microcentro?",
      a: "Depende de qué priorices: cerca del microcentro ganás en trayectos cortos y perdés en tranquilidad, sobre todo de noche cerca del puente.",
    },
    {
      q: "¿Piden garante para alquilar un departamento?",
      a: "La mayoría de los propietarios o de las inmobiliarias que administran el edificio piden garante o un seguro de alquiler en su lugar.",
    },
    {
      q: "¿Qué hago si hoy no hay un departamento que me sirva?",
      a: "Dejá cargada tu búsqueda en el formulario con tu presupuesto y la zona que preferís. Te avisamos por WhatsApp la primera vez que se publique un departamento en Ciudad del Este que encaje.",
    },
  ],
  claimsToVerify: [
    "Ciudad del Este's microcentro concentrates most commerce-related foot and cargo traffic, including at night near the bridge.",
    "Newer apartment buildings in Ciudad del Este offer amenities like their own security and parking, typically with an expensa fee.",
    "Small one- or two-room apartments in Ciudad del Este cluster near institutos and the city's administrative offices, popular with students and single workers.",
    "Some older downtown buildings in Ciudad del Este have generators or reserve water tanks because of power or water cuts.",
    "Landlords or building-managing real estate agencies in Ciudad del Este commonly require a guarantor or rental-guarantee insurance.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching apartment in Ciudad del Este appears.",
  ],
};
