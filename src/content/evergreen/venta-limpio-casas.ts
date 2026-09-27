/**
 * Evergreen page: /venta/limpio/casas — "casas en venta limpio" (20/mo) and
 * its merged variant (docs/seo-evergreen-keywords.md, table A #37).
 *
 * Same shape as the pilot; written for Limpio, a growing satellite city of
 * Gran Asunción bordering Luque, with no sentence shared with any other
 * file in this assignment or with the pilot.
 */
import type { EvergreenPage } from "./types";

export const ventaLimpioCasas: EvergreenPage = {
  path: "/venta/limpio/casas",
  door: "inmobiliaria",
  keyword: "casas en venta limpio",
  secondaryKeywords: ["casa en venta en limpio paraguay"],
  h1: "Casas en venta en Limpio",
  lede: "Recorré las casas en venta en Limpio filtrando por precio, y dejá tu búsqueda anotada si hoy no aparece la casa que estás buscando.",
  metaDescription:
    "Casas en venta en Limpio: filtrá por precio, mirá lo publicado hoy y dejá tu búsqueda para saber cuándo entra una casa nueva.",
  priceBands: [
    { max: 40_000 },
    { min: 40_001, max: 70_000 },
    { min: 70_001, max: 120_000 },
    { min: 120_001 },
  ],
  barrios: {
    title: "Zonas de Limpio para comprar una casa",
    intro:
      "Limpio viene creciendo como ciudad dormitorio de Asunción, y ese crecimiento no es igual en toda la ciudad: conviene mirar la zona con la misma atención que la casa.",
    items: [
      {
        name: "Centro",
        text:
          "Alrededor de la municipalidad y de la plaza, con las casas más antiguas de la ciudad y los comercios de siempre a pocas cuadras.",
      },
      {
        name: "Zona sobre la ruta hacia Luque",
        text:
          "El corredor que conecta Limpio con Luque concentra buena parte del movimiento hacia el aeropuerto y hacia Asunción, así que las casas sobre esa ruta o cerca de ella se valorizan por el acceso.",
      },
      {
        name: "Loteamientos nuevos",
        text:
          "En los últimos años se abrieron loteamientos con casas recién construidas sobre terrenos definidos de fábrica, aunque conviene revisar si la calle interna ya tiene asfalto o todavía es de tierra.",
      },
      {
        name: "Zona más alejada del centro",
        text:
          "Hacia los límites de la ciudad el terreno rinde más por el mismo precio, a cambio de una calle sin pavimentar y de servicios que todavía se están extendiendo.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los números de arriba salen únicamente de los avisos activos hoy en el portal: son precios pedidos por quien vende, no precios ya cerrados, y varían según entran y salen casas de la lista.",
      "En Limpio se publican casas tanto en dólares como en guaraníes; el portal ordena y filtra por el equivalente en dólares, así que si pensás tu presupuesto en guaraníes conviene convertirlo antes de mover el filtro de precio.",
      "Al ser una ciudad todavía en crecimiento, el precio de una casa en Limpio depende bastante de qué tan cerca está de la ruta principal y de si el loteamiento donde se encuentra ya tiene los servicios completos.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar una casa en Limpio",
    intro:
      "Antes de señar una casa en Limpio, conviene tener respuesta para cada uno de estos puntos:",
    items: [
      "El título de propiedad a nombre de quien vende y un informe de condiciones de dominio reciente, para confirmar que el inmueble no tiene embargos ni hipotecas.",
      "El impuesto inmobiliario al día en la Municipalidad de Limpio, con el comprobante del último pago.",
      "Si el loteamiento donde está la casa ya cuenta con red de agua propia o si todavía depende de un pozo particular.",
      "Si la calle interna del barrio está asfaltada, empedrada o de tierra, y cómo se pone con lluvia fuerte.",
      "Si el galpón o el cuarto extra que a veces se suma en estas casas cuenta con permiso municipal o quedó fuera de cualquier plano registrado.",
      "El trayecto real hasta tu trabajo o hasta el aeropuerto, hecho en hora pico y no un domingo.",
      "Si la casa tiene desagüe cloacal o pozo ciego, y en qué estado está.",
      "Con qué escribano vas a escriturar, y qué honorarios y gastos de transferencia te va a cobrar antes de que empieces el trámite.",
    ],
  },
  financing: {
    title: "Financiar una casa en Limpio",
    paragraphs: [
      "Una casa en Limpio se puede pagar al contado o con un crédito hipotecario de un banco o una financiera; algunas entidades ofrecen líneas para primera vivienda con fondos de la Agencia Financiera de Desarrollo (AFD), con condiciones que fija cada entidad y que cambian con el tiempo.",
      "En la página de financiamiento reunimos los programas que conocemos junto con una estimación de la cuota mensual para comparar. Es una referencia para planificar, no una aprobación: la tasa, el plazo y el monto final los define la entidad que te preste.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta una casa en Limpio?",
      a: "Depende sobre todo de la zona, del tamaño del terreno y de si el loteamiento ya tiene los servicios completos. Arriba mostramos el rango de precios de las casas publicadas hoy; no damos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿Las casas en Limpio se venden en dólares o en guaraníes?",
      a: "Se ven las dos monedas según el vendedor: el aviso siempre marca en cuál publicó y su equivalente, pero la moneda con la que finalmente vas a pagar se conversa recién al momento de acordar la venta.",
    },
    {
      q: "¿Qué documentos le pido al vendedor?",
      a: "Pedile el título de propiedad, un informe de condiciones de dominio actualizado y el comprobante de que el impuesto inmobiliario está al día; si hay algún cuarto o galpón sumado a la casa original, pedí también el plano que lo respalda.",
    },
    {
      q: "¿Limpio queda lejos de Asunción?",
      a: "Depende de la zona puntual y de la hora del día. Antes de decidirte, hacé el trayecto que vas a hacer todos los días en el horario en que realmente lo vas a hacer.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y lo que necesitás. La recibe nuestro equipo, que te escribe por WhatsApp cuando aparece una casa en venta en Limpio que encaje.",
    },
  ],
  claimsToVerify: [
    "Limpio borders Luque and sits along the road corridor toward Luque and the airport area.",
    "Limpio has been growing as a dormitory/satellite city of Asunción, with newer loteamientos being opened.",
    "Some newer loteamientos in Limpio still have unpaved internal streets and water/service networks not yet fully extended.",
    "The impuesto inmobiliario for a Limpio property is paid to the Municipalidad de Limpio.",
    "A property sale deed is signed before an escribano público; an 'informe de condiciones de dominio' shows embargos and hipotecas.",
    "House extensions need municipally approved plans to be regularized.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house for sale appears.",
  ],
};
