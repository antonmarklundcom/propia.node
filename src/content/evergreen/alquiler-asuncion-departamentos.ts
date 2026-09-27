/**
 * Evergreen page: /alquiler/asuncion/departamentos — "departamentos en
 * alquiler asuncion" (1000/mo) and its merged variants
 * (docs/seo-evergreen-keywords.md, table A #2).
 *
 * The rental long tail: dormitorios, monoambiente, amoblado, centro,
 * baratos. The barrio section covers towers, amenities and gastos comunes
 * by zone — distinct from the untyped /alquiler/asuncion page (lifestyle by
 * zone) and from /alquiler/asuncion/casas (lot, garage and patio by zone).
 * Links conceptually, in prose only, to the sale twin at
 * /venta/asuncion/departamentos — no URL, per the brief.
 */
import type { EvergreenPage } from "./types";

export const alquilerAsuncionDepartamentos: EvergreenPage = {
  path: "/alquiler/asuncion/departamentos",
  door: "inmobiliaria",
  keyword: "departamentos en alquiler asuncion",
  secondaryKeywords: [
    "departamento en asuncion",
    "departamentos en asunción alquiler",
    "alquiler de departamentos asunción",
    "alquiler departamento 1 dormitorio asunción baratos",
    "alquiler departamento 1 dormitorio asunción",
    "monoambientes baratos en asunción",
    "alquiler de departamentos de 2 dormitorios en asunción",
    "departamentos amoblados en asuncion",
    "departamentos para alquilar en asuncion",
    "departamentos amoblados baratos en asunción",
    "alquiler de departamentos en asunción baratos",
    "alquiler de monoambiente en asuncion",
    "departamentos amoblados para alquilar en asunción",
    "alquiler de departamentos asunción centro",
    "alquiler departamento amoblado asuncion",
    "alquiler de departamentos en asunción económicos",
    "alquiler apartamento asuncion paraguay",
    "alquiler de departamentos amoblados en asuncion",
    "alquiler de departamentos baratos en asuncion",
    "alquiler de departamentos centro de asuncion",
    "alquiler de departamentos economicos en asuncion",
    "alquiler de departamentos en asunción barrio obrero",
    "alquiler de departamentos zona centro asuncion",
    "alquiler de departamentos zona municipalidad de asuncion",
    "alquiler de dptos en asuncion",
    "alquiler de departamentos de un ambiente en asunción",
    "alquiler de departamentos zona ciudad nueva asuncion",
  ],
  h1: "Departamentos en alquiler en Asunción",
  lede: "Departamentos y monoambientes en alquiler en Asunción, con o sin muebles: filtrá por precio y por barrio y dejá tu búsqueda si todavía no aparece el que buscás.",
  metaDescription:
    "Departamentos y monoambientes en alquiler en Asunción: filtrá por precio, barrio y amueblado. Dejá tu búsqueda y te avisamos por WhatsApp.",
  priceBands: [{ max: 300 }, { min: 301, max: 500 }, { min: 501, max: 800 }, { min: 801 }],
  barrios: {
    title: "Zonas de Asunción y qué tipo de edificio encontrás en cada una",
    intro:
      "Alquilar un departamento en Asunción no es solo elegir un precio: el tipo de edificio, las comodidades y los gastos comunes cambian mucho según la zona.",
    items: [
      {
        name: "Villa Morra",
        text:
          "Concentra buena parte de las torres más nuevas de la ciudad, muchas con pileta, gimnasio y parrillero compartido. Esas comodidades se pagan con gastos comunes que varían bastante de un edificio a otro: pedí los últimos comprobantes antes de comparar precios.",
      },
      {
        name: "Recoleta",
        text:
          "Combina edificios más antiguos con algunas torres nuevas, en un entorno más tranquilo que el de Villa Morra. Los gastos comunes suelen ser más bajos cuando el edificio no tiene tantas áreas compartidas.",
      },
      {
        name: "Centro y Casco Histórico",
        text:
          "La zona con más monoambientes y departamentos chicos en edificios antiguos, algunos remodelados y otros no. Antes de firmar, revisá el estado del ascensor y de las cañerías, y preguntá si el edificio tiene gastos comunes o no.",
      },
      {
        name: "Sajonia y la Costanera",
        text:
          "Zona en crecimiento con edificios más nuevos, algunos con vista hacia la bahía en los pisos altos. Como son desarrollos recientes, conviene confirmar bien qué servicios y qué gastos comunes tiene cada edificio antes de decidirte.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios de los departamentos publicados",
    paragraphs: [
      "El rango de arriba sale de los departamentos y monoambientes publicados hoy en el portal: lo que pide cada propietario, no un valor cerrado por metro cuadrado.",
      "Un departamento amoblado casi siempre pide más que uno vacío del mismo tamaño y barrio, porque incluye muebles y a veces electrodomésticos. Fijate bien qué entra en la descripción antes de comparar dos avisos por precio.",
      "Los gastos comunes del edificio se pagan aparte del alquiler en la gran mayoría de los casos, así que conviene sumarlos al presupuesto antes de filtrar solo por el monto del alquiler. Si buscás comprar en lugar de alquilar, mirá los departamentos en venta: ahí la lógica de precios es distinta porque no hay un alquiler mensual de por medio.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar un departamento en Asunción",
    intro:
      "Antes de señar un departamento, conviene tener respuesta para estos puntos, más allá de si te gustó la vista:",
    items: [
      "Cuánto son los gastos comunes del edificio y qué cubren exactamente: portería, ascensor, áreas comunes, seguridad.",
      "Si el departamento se alquila amoblado o vacío, y qué muebles o electrodomésticos quedan exactamente incluidos.",
      "El estado del ascensor y de la terraza o azotea, sobre todo en edificios más antiguos del centro.",
      "Si hay cochera incluida o si se paga por separado, y dónde queda respecto de la entrada del edificio.",
      "Qué garantía pide el propietario o la administración: garante propietario, seguro de caución o depósito.",
      "Cómo llegan las expensas y la factura de ANDE del edificio: si van a tu nombre o quedan a nombre de la administración.",
      "El reglamento del edificio sobre mascotas y sobre horarios de mudanza, antes de asumir que se puede.",
      "El trayecto real hasta tu trabajo en el horario en que lo vas a hacer todos los días, no un domingo tranquilo.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en un departamento en alquiler",
    paragraphs: [
      "Para entrar a un departamento en Asunción, además del primer mes de alquiler, casi siempre se pide una garantía: un garante propietario, un seguro de caución o un depósito, según lo que acepte el propietario o la administración del edificio.",
      "Los gastos comunes se pagan aparte del alquiler y del depósito. Antes de firmar, pedí ver los últimos comprobantes para saber si suben seguido y por qué motivo.",
      "El contrato de alquiler fija un plazo y las condiciones para renovarlo o para dejar el departamento antes de tiempo; leelo completo antes de firmar, en especial la parte sobre el depósito.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar un departamento en Asunción?",
      a: "Cambia mucho según el barrio, si el edificio tiene amenities y si el departamento está amoblado. Arriba mostramos el rango de lo publicado hoy en el portal para que compares con tu presupuesto.",
    },
    {
      q: "¿Qué diferencia hay entre un monoambiente y un departamento con dormitorio separado?",
      a: "El monoambiente no separa el dormitorio del resto del living, mientras que un departamento con dormitorio aparte tiene esa habitación cerrada. La diferencia se nota sobre todo en el precio y en cuánta privacidad da el espacio.",
    },
    {
      q: "¿Los gastos comunes están incluidos en el precio del alquiler?",
      a: "Por lo general no: se pagan aparte del alquiler y varían según las áreas comunes del edificio. Pedí los últimos comprobantes antes de comparar dos departamentos por precio.",
    },
    {
      q: "¿Puedo alquilar un departamento amoblado en Asunción?",
      a: "Sí, hay oferta amoblada sobre todo en edificios más nuevos. Cada aviso indica si el departamento incluye muebles y qué queda exactamente adentro.",
    },
    {
      q: "¿Y si busco comprar en lugar de alquilar?",
      a: "Si tu plan es comprar, mirá los departamentos en venta en Asunción: la lógica de precio y de financiamiento ahí es distinta a la de un alquiler mensual.",
    },
    {
      q: "¿Qué hago si hoy no hay un departamento que me sirva?",
      a: "Dejá tu búsqueda con tu presupuesto y el barrio que te interesa. El equipo te escribe por WhatsApp cuando entra un departamento en Asunción que encaje.",
    },
  ],
  claimsToVerify: [
    "Villa Morra has a concentration of newer apartment towers, many with pool, gym and a shared parrillero, which come with variable gastos comunes.",
    "Recoleta combines older buildings with some newer towers and is generally quieter than Villa Morra.",
    "The Centro/Casco Histórico of Asunción has the most monoambientes and small apartments, many in older buildings.",
    "Sajonia and the Costanera area have newer apartment developments, some with views toward the bay (bahía) from higher floors.",
    "Gastos comunes (building common expenses) in Asunción apartment buildings are typically paid separately from the monthly rent.",
    "Rental guarantees for apartments in Paraguay are typically a guarantor who owns property, a seguro de caución, or a cash deposit, set by the landlord or building administration.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching apartment in Asunción appears.",
  ],
};
