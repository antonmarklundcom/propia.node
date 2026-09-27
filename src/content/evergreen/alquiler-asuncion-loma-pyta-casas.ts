/**
 * Evergreen page: /alquiler/asuncion/loma-pyta/casas — "alquiler de casas
 * baratas en loma pyta" (90/mo) and its merged house-rental variants
 * (docs/seo-evergreen-keywords.md, table C1 / decision S10).
 *
 * Loma Pytã is new to the location tree (S10): this page 404s until
 * `npm run seed:locations` and `npm run cron:geo` run on production. Very
 * little about this barrio is published anywhere, so its `barrios` section
 * describes it by what a tenant should check — street position, access,
 * distance to a road with transport — rather than by naming sub-areas the
 * writer cannot confirm exist.
 */
import type { EvergreenPage } from "./types";

export const alquilerAsuncionLomaPytaCasas: EvergreenPage = {
  path: "/alquiler/asuncion/loma-pyta/casas",
  door: "inmobiliaria",
  keyword: "alquiler de casas baratas en loma pyta",
  secondaryKeywords: [
    "alquiler de casa en loma pyta",
    "alquiler de casa pequeña en loma pyta",
    "alquiler de casa en loma pytá",
    "alquiler de casa pequeña en loma pytá",
    "alquiler de casa en loma pyta barato",
    "alquiler de casa en loma pytá barato",
  ],
  h1: "Alquiler de casas baratas en Loma Pytã",
  lede: "Mirá las casas en alquiler publicadas hoy en Loma Pytã y dejá tu búsqueda con tu presupuesto si todavía no encontrás la tuya.",
  metaDescription:
    "Casas en alquiler en Loma Pytã, Asunción: filtrá por precio, mirá lo publicado hoy y dejá tu búsqueda para enterarte cuando entre una casa nueva.",
  priceBands: [{ max: 150 }, { min: 151, max: 250 }, { min: 251, max: 400 }, { min: 401 }],
  barrios: {
    title: "Qué mirar según la calle dentro de Loma Pytã",
    intro:
      "De Loma Pytã hay poca información publicada más allá de lo que se ve al recorrerlo, así que en vez de nombrar zonas conviene fijarse en la posición exacta de la casa dentro del barrio antes de decidir.",
    items: [
      {
        name: "Sobre la calle de entrada al barrio",
        text:
          "Las casas ubicadas sobre la calle por la que se entra desde la avenida más cercana suelen tener paso de colectivo más a mano, a cambio de algo más de tránsito y ruido durante el día.",
      },
      {
        name: "En las calles internas",
        text:
          "Alejándose de esa entrada, las casas quedan sobre calles más tranquilas pero también más lejos de la parada de colectivo: conviene medir esa distancia caminando, no solo mirarla en un mapa.",
      },
      {
        name: "Cerca del límite del barrio",
        text:
          "Las casas más próximas al borde de Loma Pytã están, por definición, más cerca de la avenida o barrio vecino que uses para moverte todos los días. Antes de decidir, hacé ese recorrido a pie en el horario en que realmente lo vas a hacer.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios de alquiler publicados",
    paragraphs: [
      "El rango de arriba corresponde solo a las casas en alquiler publicadas hoy en Loma Pytã en este portal: son valores pedidos por quien alquila, no contratos ya firmados, y cambian según qué casas tengan aviso activo.",
      "El alquiler mensual no siempre incluye ANDE ni el agua: cada aviso indica si esos servicios van por cuenta del inquilino o están incluidos, así que conviene confirmarlo antes de comparar dos casas por precio.",
      "Si tu presupuesto está pensado en guaraníes, convertilo antes de usar los filtros: el portal ordena y filtra los alquileres por su equivalente en dólares para que las casas se puedan comparar entre sí.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar una casa barata en Loma Pytã",
    intro:
      "En un alquiler económico conviene mirar con más cuidado el estado real de la casa, no solo el precio. Antes de firmar, resolvé cada uno de estos puntos:",
    items: [
      "Qué tipo de garantía te pide el propietario: un garante con propiedad a su nombre o una garantía de alquiler contratada con una aseguradora.",
      "Cuánto es el depósito y si se devuelve completo al terminar el contrato, y en qué condiciones.",
      "Si ANDE y el agua están incluidos en el alquiler o quedan a cargo tuyo, y a nombre de quién van a quedar esos servicios.",
      "El estado real de la instalación eléctrica y de las cañerías, sobre todo si la casa estuvo desocupada antes de que la publicaran.",
      "Cómo es la presión del agua y de dónde viene: red de una junta de saneamiento, ESSAP o pozo propio.",
      "El estado del techo y si hay señales de filtraciones, algo que conviene revisar después de una lluvia y no solo en un día despejado.",
      "La distancia real caminando hasta la parada de colectivo más cercana, hecha en el horario en que la vas a usar todos los días.",
      "La duración del contrato y qué pasa si necesitás dejar la casa antes de que termine.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en una casa en alquiler en Loma Pytã",
    paragraphs: [
      "Para firmar un contrato de alquiler suele pedirse una garantía: un garante propietario o una garantía de alquiler contratada con una aseguradora que cumple esa función sin involucrar a un tercero.",
      "Además de la garantía, es habitual pagar un depósito y el primer mes de alquiler antes de recibir las llaves. El depósito queda como resguardo por daños y se revisa al terminar el contrato.",
      "El contrato de alquiler define su propia duración y quién paga qué: en algunos casos ANDE y agua quedan a cargo del inquilino desde el primer día, y en otros el propietario los deja a su nombre por un tiempo. Conviene dejarlo por escrito antes de firmar.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta alquilar una casa barata en Loma Pytã?",
      a: "Depende del tamaño de la casa y de en qué calle del barrio está. Arriba mostramos el rango de lo publicado hoy en el portal; no damos un precio promedio del barrio porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿El alquiler incluye ANDE y agua?",
      a: "Varía de un aviso a otro. Algunos propietarios los incluyen en el precio y otros los dejan a cargo del inquilino desde el primer mes: conviene confirmarlo antes de comparar dos casas solo por su precio de alquiler.",
    },
    {
      q: "¿Qué me van a pedir para alquilar?",
      a: "Como mínimo un documento de identidad y algún tipo de garantía, sea un garante propietario o una garantía de alquiler contratada con una aseguradora. Cada propietario puede sumar algún requisito propio.",
    },
    {
      q: "¿Cómo llego a Loma Pytã en colectivo?",
      a: "Depende de la calle exacta dentro del barrio, así que conviene preguntarle a quien publica el aviso qué línea pasa más cerca y hacer el recorrido a pie hasta la casa en el horario en que lo vas a usar a diario.",
    },
    {
      q: "¿Qué hago si hoy no hay ninguna casa que me sirva?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y lo que necesitás. La recibe nuestro equipo, que te escribe por WhatsApp cuando entra una casa en Loma Pytã que encaje.",
    },
  ],
  claimsToVerify: [
    "Loma Pytã is a barrio of Asunción (per the task's own framing; little else about it is published to cross-check).",
    "A road/avenue borders or leads into Loma Pytã with a bus route running near or through it (stated only generically in the text, without naming the route or the bordering avenue).",
    "Rental contracts in Paraguay commonly require either a propietario guarantor or a paid rental-guarantee insurance product in place of one.",
    "A deposit plus the first month's rent is customary before receiving the keys on a rental in Paraguay.",
    "ANDE (electricity) and water service can be included in the rent or left to the tenant, and this varies by contract/landlord rather than being fixed.",
    "Water in areas without an ESSAP connection can come from a junta de saneamiento or a private well.",
    "A house left vacant before being listed is more likely to need its plumbing and electrical wiring checked before move-in.",
    "Operational promise: a search left on this page is read by the team, who write back by WhatsApp when a matching house in Loma Pytã appears.",
  ],
};
