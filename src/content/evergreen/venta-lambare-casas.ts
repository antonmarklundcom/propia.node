/**
 * Evergreen page: /venta/lambare/casas — "casas en venta lambare" (140/mo)
 * and its merged variants (docs/seo-evergreen-keywords.md, table A #12).
 *
 * Same shape as the pilot; written for buying a house in Lambaré. Different
 * concerns from the two rental pages above (título, escrituración,
 * financiamiento instead of garantía/depósito), no sentence shared with
 * them or with the pilot.
 */
import type { EvergreenPage } from "./types";

export const ventaLambareCasas: EvergreenPage = {
  path: "/venta/lambare/casas",
  door: "inmobiliaria",
  keyword: "casas en venta lambare",
  secondaryKeywords: [
    "casa venta lambare",
    "casa en venta en lambare",
    "casas en venta en lambare zona canal 13",
  ],
  h1: "Casas en venta en Lambaré",
  lede: "Mirá las casas en venta en Lambaré filtrando por precio, y dejá tu búsqueda anotada si ninguna de las publicadas hoy te termina de convencer.",
  metaDescription:
    "Casas en venta en Lambaré: filtrá por precio, mirá lo publicado hoy y dejá tu búsqueda para enterarte cuando entre una casa nueva.",
  priceBands: [
    { max: 60_000 },
    { min: 60_001, max: 100_000 },
    { min: 100_001, max: 180_000 },
    { min: 180_001 },
  ],
  barrios: {
    title: "Zonas de Lambaré para comprar una casa",
    intro:
      "Comprar en Lambaré tiene una lógica distinta a alquilar: acá pesa más el terreno, la antigüedad de la construcción y qué tan pegado a Asunción queda cada sector.",
    items: [
      {
        name: "Centro",
        text:
          "Cerca de la municipalidad, con casas más antiguas sobre terrenos que ya vienen definidos hace años. La ventaja es tener todo a mano; la contra, que muchas de esas casas piden alguna reforma.",
      },
      {
        name: "Zona sobre la costanera y el río",
        text:
          "Comprar cerca de la ribera del Paraguay tiene su atractivo por la vista, pero antes de avanzar conviene averiguar si esa cuadra puntual se inundó en años de río alto: no es parejo en toda la ciudad, y afecta directamente el valor de reventa.",
      },
      {
        name: "Zonas de loteamientos más nuevos",
        text:
          "En los últimos años se abrieron loteamientos con casas de construcción reciente, generalmente sobre terrenos más chicos que los del centro pero con menos reformas pendientes.",
      },
      {
        name: "Hacia la periferia",
        text:
          "En los límites con las ciudades vecinas el terreno rinde más por el mismo precio, aunque hay calles sin asfaltar y la conexión a la red de agua no siempre llega igual que en el centro.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los números de arriba salen solo de los avisos activos hoy en el portal: son precios pedidos por quien vende, no precios ya cerrados, y se mueven según entran y salen casas de la lista.",
      "En Lambaré es común ver casas publicadas tanto en dólares como en guaraníes; el portal ordena y filtra por el equivalente en dólares, así que si manejás tu presupuesto en guaraníes convertilo antes de usar el filtro de precio.",
      "La cercanía con Asunción hace que el terreno pese bastante en el precio de una casa en Lambaré: dos casas de tamaño construido parecido pueden pedir montos distintos solo por la superficie del lote.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar una casa en Lambaré",
    intro:
      "Antes de señar una casa en Lambaré, conviene tener respuesta para cada uno de estos puntos:",
    items: [
      "El título de propiedad a nombre de quien vende y un informe de condiciones de dominio reciente, para confirmar que no hay embargos ni hipotecas sobre el inmueble.",
      "El impuesto inmobiliario al día en la Municipalidad de Lambaré, con el comprobante del último pago.",
      "Si la calle o el terreno se inundaron alguna vez cuando subió el río, sobre todo en las cuadras más cercanas a la costanera.",
      "Si las ampliaciones de la casa tienen planos aprobados por la municipalidad o se hicieron sin ese trámite.",
      "De dónde viene el agua de la casa —red pública, junta de saneamiento o pozo propio— y si tiene desagüe cloacal o pozo ciego.",
      "El trayecto real hasta tu trabajo hecho en hora pico, no en un horario tranquilo de fin de semana.",
      "Quién va a hacer la escritura: la firma un escribano público, y conviene conocer de antemano sus honorarios y los gastos de transferencia.",
      "Si el barrio tiene alumbrado público y calle asfaltada frente a la casa, o si eso todavía está pendiente.",
    ],
  },
  financing: {
    title: "Financiar una casa en Lambaré",
    paragraphs: [
      "Una casa en Lambaré se puede pagar al contado o con un crédito hipotecario de un banco o una financiera; algunas entidades ofrecen líneas para primera vivienda con fondos de la Agencia Financiera de Desarrollo (AFD), con condiciones que fija cada entidad y que cambian con el tiempo.",
      "En la página de financiamiento juntamos los programas que conocemos junto con una estimación de la cuota mensual para comparar. Es una referencia para planificar, no una aprobación: la tasa, el plazo y el monto final los define la entidad que te preste.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta una casa en Lambaré?",
      a: "Depende sobre todo del tamaño del terreno, de la zona y del estado de la construcción. Arriba mostramos el rango de precios de las casas publicadas hoy; no damos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿Las casas en Lambaré se venden en dólares o en guaraníes?",
      a: "Las dos cosas. Cada aviso muestra la moneda en que la publicó el vendedor y su equivalente, y la moneda final de la operación se acuerda con él antes de firmar.",
    },
    {
      q: "¿Qué documentos le pido al vendedor?",
      a: "Como mínimo el título de propiedad, un informe de condiciones de dominio reciente, el impuesto inmobiliario al día y, si la casa tiene ampliaciones, los planos aprobados por la municipalidad.",
    },
    {
      q: "¿Conviene comprar cerca del río en Lambaré?",
      a: "Depende de la cuadra puntual: preguntá si esa zona se inundó en años de río alto antes de decidirte, porque no afecta parejo a toda la ciudad.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y lo que necesitás. La recibe nuestro equipo, que te escribe por WhatsApp cuando aparece una casa en venta en Lambaré que encaje.",
    },
  ],
  claimsToVerify: [
    "Lambaré is on the bank of the Paraguay river, and riverside blocks have flooded in past years when the river rose; the risk varies block by block.",
    "Lambaré borders Asunción directly, and land value there reflects that proximity.",
    "The impuesto inmobiliario for a Lambaré property is paid to the Municipalidad de Lambaré.",
    "A property sale deed is signed before an escribano público; an 'informe de condiciones de dominio' shows embargos and hipotecas.",
    "House extensions need municipally approved plans to be regularized.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Newer loteamientos in Lambaré exist with more recently built houses than the older, central part of the city.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house for sale appears.",
  ],
};
