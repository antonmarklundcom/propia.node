/**
 * Evergreen page: /alquiler/ciudad-del-este/casas — "alquiler de casas
 * baratas en ciudad del este" (170/mo) and its merged variants
 * (docs/seo-evergreen-keywords.md, table A #9).
 *
 * Prose only, no numbers (the page counts those from its own rows); every
 * factual claim is listed in claimsToVerify.
 */
import type { EvergreenPage } from "./types";

export const alquilerCiudadDelEsteCasas: EvergreenPage = {
  path: "/alquiler/ciudad-del-este/casas",
  door: "inmobiliaria",
  keyword: "alquiler de casas baratas en ciudad del este",
  secondaryKeywords: [
    "alquiler de casas cde km 7",
    "alquiler de casa ciudad del este",
    "alquiler de casa cde",
    "alquiler casa ciudad del este",
    "alquiler de casa en cde",
    "casas en alquiler ciudad del este",
    "alquiler de casa en cde barato",
    "alquiler de casa en ciudad del este paraguay",
  ],
  h1: "Casas en alquiler baratas en Ciudad del Este",
  lede: "Encontrá casas para alquilar en Ciudad del Este, filtrá por lo que podés pagar cada mes y dejá tu búsqueda si todavía no aparece la que necesitás.",
  metaDescription:
    "Casas en alquiler en Ciudad del Este: filtrá por precio mensual, mirá los avisos publicados y dejá tu búsqueda para enterarte de lo nuevo.",
  priceBands: [
    { max: 250 },
    { min: 251, max: 400 },
    { min: 401, max: 600 },
    { min: 601 },
  ],
  barrios: {
    title: "Zonas de Ciudad del Este para alquilar una casa",
    intro:
      "En Ciudad del Este el alquiler de una casa cambia mucho según qué tan cerca esté del comercio fronterizo y de las rutas que salen del centro. Estas son las diferencias que más importan a la hora de elegir dónde vivir.",
    items: [
      {
        name: "Microcentro y zona del puente",
        text: "El área más próxima al puente y a las galerías concentra el movimiento del comercio fronterizo. Hay mucho tránsito y ruido durante el día, y las pocas casas que quedan ahí suelen ser depósito o local antes que vivienda familiar.",
      },
      {
        name: "Barrios sobre las rutas hacia Minga Guazú y Hernandarias",
        text: "Buena parte del crecimiento reciente se dio sobre estas rutas, donde los vecinos ubican cada tramo por su distancia sobre el camino más que por un nombre de barrio. Conviene preguntar por el estado de la calle y el tiempo real hasta el centro en hora pico.",
      },
      {
        name: "Zona cercana al aeropuerto",
        text: "Los barrios alrededor del aeropuerto son más tranquilos que el microcentro, con casas de patios más amplios. El paso de aviones cambia de una cuadra a otra, así que conviene visitar en distintos horarios antes de decidir.",
      },
      {
        name: "Barrios residenciales más alejados del centro",
        text: "Hacia las afueras las casas rinden más metros por el mismo alquiler, pero los servicios cambian de una calle a otra: agua de red o aguatería, calle asfaltada o de tierra. Eso se confirma casa por casa, no por la fama del barrio.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los alquileres publicados",
    paragraphs: [
      "Los montos de arriba corresponden solo a los avisos de alquiler publicados hoy en este portal para Ciudad del Este: los pide el propietario, no vienen de un contrato ya cerrado, y cambian a medida que se publican o se retiran casas.",
      "Por la cercanía con el comercio de frontera, acá es común pactar el alquiler en dólares además de en guaraníes. El sistema ordena y filtra por el equivalente en dólares, así que pasá tu presupuesto a esa moneda antes de mover los filtros.",
      "El alquiler mensual casi nunca incluye expensas, ANDE ni agua: confirmá con el propietario qué paga cada parte antes de comparar dos casas por el mismo número.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar una casa en Ciudad del Este",
    intro:
      "Antes de firmar un contrato de alquiler en esta ciudad, conviene tener respuesta para cada uno de estos puntos:",
    items: [
      "Qué te pide el propietario como garantía: un garante conocido o un seguro de alquiler, y qué papeles hacen falta para cada camino.",
      "Cuánto se paga de depósito y si se devuelve completo al terminar el contrato, o se descuenta por desgaste normal.",
      "Cómo llega el agua a la casa — red pública o aguatería privada — y si la presión baja en las horas de más consumo.",
      "Si la calle se inunda después de una lluvia fuerte: mejor preguntarle a un vecino que visitar solo en un día seco.",
      "Si la zona tiene mucho movimiento de comercio o de carga de día.",
      "Quién se encarga del mantenimiento del patio: conviene dejarlo escrito, no de palabra.",
      "La duración del contrato y las condiciones para renovarlo o dejarlo antes de tiempo.",
      "Si la casa está en un barrio cerrado, qué cubre la expensa y quién la paga.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en una casa alquilada en Ciudad del Este",
    paragraphs: [
      "La mayoría de los propietarios en esta ciudad pide un garante propio o, cada vez más, un seguro de alquiler que cumple esa función sin involucrar a un familiar. Antes de salir a ver casas conviene saber cuál de las dos opciones vas a poder ofrecer.",
      "Al firmar suele pedirse un depósito y el primer mes por adelantado, y en algunos casos también el último. Además del alquiler, quedan afuera los gastos de ANDE, agua y, si corresponde, la expensa del barrio cerrado: quién paga cada uno se acuerda antes de firmar, no después.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar una casa en Ciudad del Este?",
      a: "Depende de la zona, del tamaño del patio y de qué tan cerca esté del comercio. Arriba mostramos el rango de los alquileres publicados hoy; no damos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿El alquiler se paga en guaraníes o en dólares?",
      a: "Las dos monedas se usan en esta ciudad. Cada aviso muestra en qué moneda lo publicó el propietario, y la moneda final del contrato se acuerda entre las partes.",
    },
    {
      q: "¿Piden garante para alquilar una casa acá?",
      a: "La mayoría de los propietarios pide un garante o, en su reemplazo, un seguro de alquiler. Conviene preguntarlo antes de visitar, para no perder tiempo con una casa que no vas a poder cerrar.",
    },
    {
      q: "¿Las casas cerca del comercio son más ruidosas?",
      a: "Sí, en general: cuanto más cerca del puente y de las galerías, más movimiento durante el día. Si buscás tranquilidad, conviene mirar los barrios más alejados del centro o cercanos al aeropuerto.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Contanos en el formulario de esta página cuánto podés pagar por mes y qué tipo de casa buscás. Guardamos el pedido y te escribimos por WhatsApp en cuanto entra al portal una casa en Ciudad del Este que se ajuste.",
    },
  ],
  claimsToVerify: [
    "Ciudad del Este is the capital of the Alto Paraná department.",
    "Ciudad del Este borders Brazil and is linked to Foz do Iguaçu by the Puente de la Amistad (Friendship Bridge).",
    "Ciudad del Este's economy centers heavily on cross-border commerce near the bridge and the downtown commercial galerías.",
    "Areas of Ciudad del Este along the routes leaving downtown are commonly referred to informally by their distance from the center, without a formal barrio name (the basis for 'km 7'-type searches).",
    "Minga Guazú and Hernandarias are neighboring municipalities along the routes leaving Ciudad del Este.",
    "An international airport (Aeropuerto Guaraní) serves the Ciudad del Este area, though it sits in neighboring Minga Guazú.",
    "Water in Ciudad del Este comes either from the public network or from private aguateras depending on the zone.",
    "It is common in Ciudad del Este for rent to be quoted in USD as well as in PYG, given the cross-border commerce.",
    "Landlords in Paraguay typically require either a personal guarantor or a rental-guarantee insurance product before signing a lease.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house in Ciudad del Este appears.",
  ],
};
