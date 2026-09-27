/**
 * Evergreen page: /alquiler/asuncion/loma-pyta/departamentos — "alquiler de
 * departamento en loma pyta" (30/mo) and its two cheap-rent variants
 * (docs/seo-evergreen-keywords.md, table C1 / decision S10).
 *
 * Loma Pytã is new to the location tree (S10): this page 404s until
 * `npm run seed:locations` and `npm run cron:geo` run on production. Same
 * caution as the casas page in this barrio: minimal, hedged claims, no
 * invented sub-areas, and no sentence shared with that page.
 */
import type { EvergreenPage } from "./types";

export const alquilerAsuncionLomaPytaDepartamentos: EvergreenPage = {
  path: "/alquiler/asuncion/loma-pyta/departamentos",
  door: "inmobiliaria",
  keyword: "alquiler de departamento en loma pyta",
  secondaryKeywords: ["alquiler barato en loma pyta", "alquiler barato en loma pytá"],
  h1: "Alquiler de departamento en Loma Pytã",
  lede: "Encontrá los departamentos en alquiler publicados en Loma Pytã hoy y dejá tu presupuesto si por ahora no hay ninguno que te sirva.",
  metaDescription:
    "Departamentos en alquiler en Loma Pytã, Asunción: filtrá por precio y dejá tu búsqueda para que te avisemos cuando entre una unidad nueva.",
  priceBands: [{ max: 150 }, { min: 151, max: 250 }, { min: 251, max: 400 }, { min: 401 }],
  barrios: {
    title: "Qué preguntar según dónde queda el edificio o la unidad",
    intro:
      "Hay poco publicado sobre Loma Pytã más allá de sus calles, así que conviene ubicar la unidad puntual antes de comparar precio con otra: la posición dentro del barrio pesa más que un nombre de zona.",
    items: [
      {
        name: "Unidades sobre la vía de acceso",
        text:
          "Los departamentos que dan a la calle por la que se entra al barrio quedan más cerca de la parada de colectivo, pero también reciben más ruido de tránsito durante el día: preguntá si la ventana principal da justo a esa calle.",
      },
      {
        name: "Unidades hacia el interior",
        text:
          "Más adentro del barrio, lejos de esa vía de entrada, las unidades suelen ser más tranquilas de noche, aunque llegar a pie hasta el colectivo demanda una caminata más larga que conviene medir de antemano.",
      },
      {
        name: "Unidades sobre el borde del barrio",
        text:
          "Las que están pegadas al límite de Loma Pytã suman la ventaja de estar más cerca de la avenida que uses a diario, pero conviene chequear igual el estado de la calle en la última cuadra antes de llegar.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios de alquiler publicados",
    paragraphs: [
      "Los valores de arriba salen únicamente de los departamentos publicados hoy en Loma Pytã en este portal: son montos pedidos por quien alquila, no contratos firmados, y varían según la oferta activa en cada momento.",
      "En muchos edificios chicos las expensas cubren solo el mantenimiento común, mientras que ANDE y el agua se facturan por unidad; conviene pedir ese desglose antes de comparar dos unidades solo por el alquiler mensual.",
      "El portal filtra y ordena los alquileres por su equivalente en dólares, así que si pensás tu presupuesto en guaraníes convertilo primero para que el filtro de precio te sirva.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar un departamento en Loma Pytã",
    intro:
      "Un departamento se firma casi siempre más rápido que una casa, y por eso conviene mirar estos puntos antes y no después de mudarte:",
    items: [
      "Si el edificio tiene portero o algún tipo de administración, o si el mantenimiento queda directamente a cargo de los propietarios.",
      "Qué cubren exactamente las expensas, si las hay, y si ANDE y el agua se facturan por unidad o van dentro de un monto común.",
      "La presión del agua en el piso de la unidad, sobre todo si el edificio no tiene tanque de reserva propio.",
      "Qué garantía te van a exigir: un garante propietario o una garantía de alquiler contratada con una aseguradora.",
      "El depósito exigido y en qué condiciones se devuelve al terminar el contrato.",
      "El estado de las rejas, el portón de acceso y la iluminación de los pasillos o la escalera si el edificio los tiene.",
      "Si la unidad coincide con las fotos y la descripción del aviso, revisando en persona antes de señar.",
      "La duración del contrato de alquiler y qué pasa si necesitás dejar la unidad antes de que termine.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en un departamento en Loma Pytã",
    paragraphs: [
      "Antes de recibir las llaves de un departamento en alquiler suele pedirse una garantía, que puede ser un garante con propiedad a su nombre o una garantía de alquiler contratada con una aseguradora en su lugar.",
      "Junto con esa garantía es habitual abonar un depósito y el primer mes de alquiler por adelantado. El depósito funciona como resguardo por daños y se revisa cuando termina el contrato.",
      "En un edificio con varias unidades conviene preguntar también quién administra las expensas y desde cuándo corren a tu nombre los servicios como ANDE y agua, para que quede claro por escrito antes de firmar.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta alquilar un departamento en Loma Pytã?",
      a: "Depende del tamaño de la unidad y de si el edificio tiene expensas o no. Arriba mostramos el rango de lo publicado hoy en el portal; no damos un precio promedio del barrio porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿Los departamentos en Loma Pytã son de edificio o de casas divididas en unidades?",
      a: "En este barrio conviven las dos cosas: hay unidades dentro de edificios chicos y también casas adaptadas con más de una unidad para alquilar. Conviene preguntarlo directamente antes de reservar una visita.",
    },
    {
      q: "¿El alquiler incluye expensas, ANDE y agua?",
      a: "No siempre. Cada aviso indica qué está incluido y qué se factura aparte, así que conviene pedir ese detalle antes de comparar dos unidades solo por el precio del alquiler.",
    },
    {
      q: "¿Qué me van a pedir para alquilar un departamento acá?",
      a: "Como mínimo un documento de identidad y una garantía, sea un garante propietario o una garantía de alquiler contratada con una aseguradora. Algunos propietarios agregan algún requisito propio para edificios chicos.",
    },
    {
      q: "¿Qué hago si hoy no hay ningún departamento que me sirva?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto. La recibe nuestro equipo, que te escribe por WhatsApp cuando entra un departamento en Loma Pytã que encaje.",
    },
  ],
  claimsToVerify: [
    "Loma Pytã is a barrio of Asunción (per the task's own framing; little else about it is published to cross-check).",
    "Rental units in Loma Pytã include both units inside small buildings and houses adapted/divided into more than one rental unit, rather than one uniform building type.",
    "A road/avenue borders or leads into Loma Pytã with a bus route running near or through it (stated only generically, without naming the route or the bordering avenue).",
    "In smaller buildings, expensas typically cover shared-area maintenance while ANDE (electricity) and water are billed per unit.",
    "Rental contracts in Paraguay commonly require either a propietario guarantor or a paid rental-guarantee insurance product in place of one.",
    "A deposit plus the first month's rent is customary before receiving the keys on a rental in Paraguay.",
    "Operational promise: a search left on this page is read by the team, who write back by WhatsApp when a matching apartment in Loma Pytã appears.",
  ],
};
