/**
 * Evergreen page: /alquiler/asuncion — "alquiler en asuncion" (1300/mo) and
 * its merged variants (docs/seo-evergreen-keywords.md, table A #1).
 *
 * Untyped: every rental in Asunción — houses, apartments and monoambientes
 * together. The barrio section is written for choosing a zone by lifestyle,
 * not for one property type's amenities; the typed pages
 * (/alquiler/asuncion/departamentos, /alquiler/asuncion/casas) cover towers
 * and lots respectively.
 */
import type { EvergreenPage } from "./types";

export const alquilerAsuncion: EvergreenPage = {
  path: "/alquiler/asuncion",
  door: "inmobiliaria",
  keyword: "alquiler en asuncion",
  secondaryKeywords: [
    "alquileres en asunción baratos",
    "alquileres en asuncion paraguay",
    "alquiler amoblado asuncion",
    "alquiler de casas y departamentos en asuncion paraguay",
  ],
  h1: "Alquiler en Asunción",
  lede: "Casas, departamentos y monoambientes en alquiler en Asunción en un solo lugar: elegí la zona que te conviene y dejá tu búsqueda si hoy no aparece lo que necesitás.",
  metaDescription:
    "Alquiler en Asunción: casas, departamentos y monoambientes filtrados por precio y zona. Dejá tu búsqueda y te avisamos por WhatsApp.",
  priceBands: [{ max: 300 }, { min: 301, max: 600 }, { min: 601, max: 1000 }, { min: 1001 }],
  barrios: {
    title: "Cómo elegir zona para alquilar en Asunción",
    intro:
      "En Asunción el alquiler cambia mucho según la zona, no solo según el tipo de propiedad. Antes de filtrar por precio, conviene pensar en qué zona se ajusta a tu rutina diaria.",
    items: [
      {
        name: "Centro y Casco Histórico",
        text:
          "Es la zona con más oferta de monoambientes y departamentos chicos, muchos en edificios antiguos remodelados. Vivís cerca de oficinas públicas, bancos y comercios, pero el tránsito y el ruido se sienten fuerte en las horas de más movimiento.",
      },
      {
        name: "Villa Morra y Recoleta",
        text:
          "El corredor con más oficinas, shoppings y restaurantes de la ciudad. Conviene a quien trabaja cerca o no quiere depender del auto para salir a comer o hacer compras, aunque el alquiler acá suele pedir más presupuesto que en otras zonas.",
      },
      {
        name: "Barrio Obrero y Ciudad Nueva",
        text:
          "Barrios más tradicionales, con casas de patio y calles más tranquilas que el corredor comercial. Suelen rendir mejor el presupuesto, aunque conviene recorrer la cuadra en distintos horarios antes de decidir.",
      },
      {
        name: "Costanera y Sajonia",
        text:
          "La franja que mira hacia la bahía, con edificios más nuevos y algo de vista al agua en los pisos altos. Es una zona en crecimiento: preguntá bien por los servicios antes de comparar precios con otras partes de la ciudad.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados en alquiler",
    paragraphs: [
      "Los precios que ves arriba salen de los avisos publicados hoy en el portal, sean casas, departamentos o monoambientes: son lo que pide cada propietario, no un promedio cerrado de la ciudad.",
      "En Asunción convive el alquiler pactado en guaraníes con el pactado en dólares, sobre todo en departamentos de edificios más nuevos. El portal ordena y filtra por el equivalente en dólares, así que conviene tener tu presupuesto pasado a esa moneda antes de mover los filtros.",
      "El tipo de propiedad también pesa en el precio: una casa con patio suele salir distinto que un departamento del mismo tamaño en el mismo barrio, porque el mantenimiento y los gastos comunes no son los mismos.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar en Asunción",
    intro:
      "Sea casa, departamento o monoambiente, hay puntos que conviene confirmar antes de comprometerte con una seña:",
    items: [
      "Qué exige el propietario como garantía: un garante con propiedad a su nombre, un seguro de caución o un depósito, y qué diferencia de costo hay entre esas opciones.",
      "Si los gastos comunes o de mantenimiento del edificio están incluidos en el alquiler o se pagan por separado, y cuánto suelen variar de un mes a otro.",
      "Quién figura como titular del contrato de alquiler y si coincide con quien te muestra la propiedad.",
      "Cómo llegan las facturas de ANDE y de agua: a nombre de quién quedan durante el contrato y quién las paga.",
      "Si la zona se inunda con lluvia fuerte: conviene visitar después de una tormenta y no solo en un día despejado.",
      "Cuánto dura el contrato y qué pasa si necesitás dejar la propiedad antes de que termine.",
      "El estado de las aberturas, el techo y las instalaciones eléctricas, sobre todo en construcciones más antiguas del centro.",
      "El trayecto real hasta tu trabajo o el colegio de tus hijos, hecho en el horario en que lo vas a hacer todos los días.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en un alquiler en Asunción",
    paragraphs: [
      "Antes de mudarte se suele pedir una garantía —un garante propietario, un seguro de caución o un depósito—, además del primer mes de alquiler. Qué combinación acepta cada propietario varía de un contrato a otro.",
      "Los gastos comunes, cuando existen, casi siempre los paga quien alquila, aparte del monto del alquiler. Confirmá antes de firmar qué cubren exactamente y si suben junto con el alquiler o por su cuenta.",
      "El contrato suele fijarse por un plazo determinado con la posibilidad de renovarlo; leelo completo antes de firmar, en especial la parte sobre depósito, mejoras y qué pasa si te vas antes de tiempo.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar en Asunción?",
      a: "Depende mucho de la zona y del tipo de propiedad: un monoambiente en el centro y una casa con patio en un barrio residencial no compiten por el mismo presupuesto. Arriba mostramos el rango de lo publicado hoy, sin promediar toda la ciudad.",
    },
    {
      q: "¿Los alquileres se pactan en guaraníes o en dólares?",
      a: "Las dos monedas convivan en la ciudad, según el propietario y el tipo de edificio. El portal filtra por el equivalente en dólares para que puedas comparar avisos publicados en distintas monedas.",
    },
    {
      q: "¿Qué garantía piden para alquilar en Asunción?",
      a: "Cambia según el propietario: algunos aceptan un garante con propiedad a su nombre, otros un seguro de caución y otros prefieren un depósito. Preguntá esto antes de visitar, para no perder tiempo con una opción que no vas a poder cumplir.",
    },
    {
      q: "¿Los gastos comunes están incluidos en el alquiler?",
      a: "Casi nunca. Cuando el edificio o el barrio cerrado tiene gastos comunes, se pagan aparte del alquiler, así que conviene sumarlos al presupuesto antes de comparar precios entre zonas.",
    },
    {
      q: "¿Qué hago si hoy no hay nada que me sirva en Asunción?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y la zona que te interesa. El equipo te escribe por WhatsApp cuando entra un alquiler en Asunción que encaje.",
    },
  ],
  claimsToVerify: [
    "Villa Morra and Recoleta form a corridor with a concentration of offices, shopping malls and restaurants in Asunción.",
    "The Centro/Casco Histórico of Asunción has many older buildings converted into small apartments and monoambientes, and hosts government offices and banks.",
    "Barrio Obrero and Ciudad Nueva are traditional residential barrios of Asunción with houses that typically have patios.",
    "The Costanera de Asunción runs along the bay (bahía), and Sajonia is near that riverside strip with some newer apartment buildings, some with water views from higher floors.",
    "Rental guarantees in Paraguay are typically a guarantor who owns property, a seguro de caución (rental guarantee insurance), or a cash deposit — terms are set by each landlord.",
    "ANDE (electricity) and water utility billing for a rented property can remain under different names depending on the terms agreed with the landlord.",
    "Rental contracts in Paraguay are typically written for a fixed term with a renewal option.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching rental in Asunción appears.",
  ],
};
