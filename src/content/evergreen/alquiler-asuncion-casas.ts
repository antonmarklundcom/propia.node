/**
 * Evergreen page: /alquiler/asuncion/casas — "casas en alquiler asuncion"
 * (590/mo) and its merged variants (docs/seo-evergreen-keywords.md, table A
 * #3).
 *
 * The barrio section covers lot size, garage and patio by zone — distinct
 * from /alquiler/asuncion/departamentos (towers, amenities, gastos comunes)
 * and from the untyped /alquiler/asuncion (lifestyle by zone).
 */
import type { EvergreenPage } from "./types";

export const alquilerAsuncionCasas: EvergreenPage = {
  path: "/alquiler/asuncion/casas",
  door: "inmobiliaria",
  keyword: "casas en alquiler asuncion",
  secondaryKeywords: [
    "alquiler casa asunción",
    "alquiler de casa asuncion",
    "alquiler de casa independiente en asunción",
    "alquiler de casas en asunción baratos",
    "alquiler de casa en asunción 3 dormitorios",
    "alquiler casa asuncion paraguay",
    "alquiler casa barrio pinoza asunción",
    "alquiler casa con piscina asuncion",
    "alquiler de casa en barrio ciudad nueva asuncion",
    "alquiler de casa en barrio santa maria asuncion",
    "alquiler de casa zona barrio obrero asuncion",
    "alquiler de casas baratas asunción",
    "alquiler de casas economicas en asuncion",
  ],
  h1: "Casas en alquiler en Asunción",
  lede: "Casas con patio en alquiler en Asunción: filtrá por precio y por zona, y dejá tu búsqueda si hoy no encontrás la que necesitás.",
  metaDescription:
    "Casas en alquiler en Asunción: filtrá por precio y zona, con o sin piscina. Dejá tu búsqueda y te avisamos por WhatsApp cuando entre una casa.",
  priceBands: [{ max: 400 }, { min: 401, max: 700 }, { min: 701, max: 1200 }, { min: 1201 }],
  barrios: {
    title: "Zonas de Asunción para alquilar una casa con patio",
    intro:
      "Quien busca casa y no departamento suele priorizar el patio, el garaje y el tamaño del terreno por sobre la torre con amenities. Así se reparten esas cualidades entre las zonas con más oferta de casas.",
    items: [
      {
        name: "Barrio Obrero",
        text:
          "Predominan las casas de construcción más antigua, muchas con patio y algún espacio para el auto, cerca del Mercado Cuatro y del movimiento comercial de la zona. El tamaño del garaje varía mucho de una casa a otra: confirmalo antes de descartar por precio.",
      },
      {
        name: "Ciudad Nueva",
        text:
          "Cerca de la zona portuaria, con casas de terrenos de distinto tamaño y una mezcla de construcciones renovadas y otras que piden trabajo. Conviene mirar el estado del techo y de las instalaciones antes de fijarte solo en el patio.",
      },
      {
        name: "Santa María",
        text:
          "Calles más tranquilas que las de Barrio Obrero o Ciudad Nueva, con casas pensadas para vivir en familia y patios que suelen alcanzar para un espacio de juego o una huerta chica.",
      },
      {
        name: "San Vicente",
        text:
          "Casas más cercanas al centro, con terrenos más chicos y garajes que no siempre entran en el precio; a cambio, se llega caminando a los trámites del casco histórico.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios de las casas en alquiler",
    paragraphs: [
      "El rango de arriba sale de las casas publicadas hoy en el portal: lo que pide cada propietario según el terreno, el estado de la casa y si tiene piscina o no.",
      "Una casa con garaje techado y patio grande casi siempre pide más que una de terreno chico en la misma cuadra, aunque tengan la misma cantidad de ambientes. El terreno pesa tanto como la construcción en el precio.",
      "Los gastos de mantenimiento del patio, de la piscina si la tiene, y de reparaciones menores suelen quedar a cargo de quien alquila; confirmá ese punto antes de comparar dos casas solo por el monto del alquiler.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar una casa en Asunción",
    intro:
      "Una casa trae más para revisar que un departamento: además del contrato, conviene confirmar estos puntos sobre la construcción y el terreno:",
    items: [
      "El estado del techo y de las canaletas, sobre todo si la casa es antigua.",
      "Si el garaje es techado o descubierto, y si entra el auto que realmente vas a usar.",
      "De dónde viene el agua y cómo es la presión en la casa, no solo en el barrio.",
      "Si hay pozo ciego o conexión a desagüe cloacal, y en qué estado está esa instalación.",
      "Cómo drena el patio con lluvia fuerte: visitá la casa después de una tormenta si podés.",
      "Si la piscina, cuando la casa tiene, incluye el mantenimiento o queda enteramente a tu cargo.",
      "Quién se hace responsable de la poda de los árboles grandes del patio.",
      "El trayecto real hasta tu trabajo, en el horario en que lo vas a hacer todos los días, porque muchas casas quedan más lejos de las líneas de colectivo que un departamento céntrico.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en una casa en alquiler",
    paragraphs: [
      "Para entrar a una casa en alquiler en Asunción, junto con el primer mes se suele pedir una garantía: un garante propietario, un seguro de caución o un depósito, según lo que acepte cada propietario.",
      "A diferencia de un departamento, una casa alquilada rara vez tiene gastos comunes, pero sí trae mantenimiento propio: patio, piscina si la tiene y reparaciones menores. Conversá con el propietario quién se hace cargo de cada cosa antes de firmar.",
      "El contrato fija un plazo y las condiciones para renovarlo o para dejar la casa antes de tiempo; conviene leerlo completo, en especial la parte sobre el depósito y sobre mejoras que hagas en el patio.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar una casa en Asunción?",
      a: "Depende del terreno, del barrio y del estado de la construcción; una casa con piscina o garaje techado pide más que una casa chica en la misma zona. Arriba mostramos el rango de lo publicado hoy en el portal.",
    },
    {
      q: "¿Las casas en alquiler en Asunción tienen patio?",
      a: "La gran mayoría sí, aunque el tamaño varía mucho entre barrios y entre casas de la misma cuadra. Cada aviso indica el tamaño del terreno para que puedas comparar antes de visitar.",
    },
    {
      q: "¿Quién paga el mantenimiento del patio y de la piscina?",
      a: "Se acuerda con el propietario antes de firmar: en algunos contratos queda a cargo de quien alquila y en otros el propietario cubre parte del mantenimiento. Confirmalo por escrito en el contrato.",
    },
    {
      q: "¿Hay casas con garaje en alquiler en Asunción?",
      a: "Sí, aunque no todas lo tienen techado ni con el mismo tamaño. Fijate en la descripción del aviso cuántos autos entran realmente antes de descartar una casa por precio.",
    },
    {
      q: "¿Qué garantía piden para alquilar una casa?",
      a: "Cambia según el propietario: puede ser un garante con propiedad a su nombre, un seguro de caución o un depósito. Preguntá esto antes de visitar para no perder tiempo con una opción que no podés cumplir.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Dejá tu búsqueda con tu presupuesto y la zona que te interesa. El equipo te escribe por WhatsApp cuando entra una casa en alquiler en Asunción que encaje.",
    },
  ],
  claimsToVerify: [
    "Barrio Obrero has predominantly older house construction and is close to the Mercado Cuatro market.",
    "Ciudad Nueva is near Asunción's port area, with houses of varying lot sizes and a mix of renovated and older construction.",
    "Santa María is a quieter residential barrio of Asunción with houses suited to family living.",
    "San Vicente has houses close to the historic center, generally on smaller lots than outer barrios.",
    "Rental guarantees for houses in Paraguay are typically a guarantor who owns property, a seguro de caución, or a cash deposit, set by the landlord.",
    "Rented houses in Paraguay typically do not carry gastos comunes (building common expenses), unlike apartments.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house for rent in Asunción appears.",
  ],
};
