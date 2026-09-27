/**
 * Evergreen page: /venta/fernando-de-la-mora/casas — "casas en venta fernando
 * de la mora" and its merged variants (docs/seo-evergreen-keywords.md, table
 * A #24).
 *
 * Venta page: the financing section covers how a purchase gets paid for, and
 * links to /financiamiento.
 */
import type { EvergreenPage } from "./types";

export const ventaFernandoDeLaMoraCasas: EvergreenPage = {
  path: "/venta/fernando-de-la-mora/casas",
  door: "inmobiliaria",
  keyword: "casas en venta fernando de la mora",
  secondaryKeywords: [
    "casas en fernando de la mora zona norte",
    "casa en venta en fernando de la mora",
    "casas en venta en fernando de la mora zona sur",
    "casas en venta en fernando dela mora",
  ],
  h1: "Casas en venta en Fernando de la Mora",
  lede: "Comparás precios pedidos hoy por casas en Fernando de la Mora según la zona, y dejás tu búsqueda para enterarte de lo que entra nuevo.",
  metaDescription:
    "Casas en venta en Fernando de la Mora: precios publicados por zona norte y sur, filtros por presupuesto y aviso de lo nuevo.",
  priceBands: [
    { max: 60_000 },
    { min: 60_001, max: 100_000 },
    { min: 100_001, max: 180_000 },
    { min: 180_001 },
  ],
  barrios: {
    title: "Zona norte, zona sur y la cercanía con Asunción",
    intro:
      "Al comprar una casa en Fernando de la Mora, la mitad de la ciudad donde está ubicada pesa tanto como el tamaño del terreno. Estas son las diferencias que más se notan al comparar precios.",
    items: [
      {
        name: "Zona norte",
        text:
          "En la mitad norte conviven casas antiguas sobre lotes consolidados con alguna construcción más reciente sobre terrenos subdivididos; el movimiento de comercio suele mantener el precio del metro cuadrado más firme que en otras zonas.",
      },
      {
        name: "Zona sur",
        text:
          "Hacia la mitad sur el precio por el mismo tamaño de terreno tiende a ser algo más bajo, aunque conviene confirmar el estado de las calles internas y de los servicios antes de comprometer una seña.",
      },
      {
        name: "El sector que limita con Asunción",
        text:
          "En el tramo pegado a la capital, la distancia hasta el centro de Asunción se mide en cuadras y no en kilómetros, y esa cercanía suele pesar en el precio final de la casa.",
      },
      {
        name: "Hacia San Lorenzo y Ñemby",
        text:
          "En el sector que conecta con San Lorenzo y Ñemby los terrenos suelen ser algo más amplios por el mismo presupuesto, a cambio de estar un poco más lejos del casco comercial de Fernando de la Mora.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los precios de arriba salen de los avisos publicados hoy en el portal: son montos pedidos por quien vende, no el valor final de cierre, que se negocia entre comprador y vendedor.",
      "En Fernando de la Mora se ven avisos en dólares y en guaraníes; el portal filtra y ordena por el equivalente en dólares, así que conviene convertir tu presupuesto antes de mover los filtros de precio.",
      "Comparar casas solo por metros construidos puede engañar: en esta ciudad el tamaño del terreno y la mitad donde está ubicado explican buena parte de la diferencia de precio.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar una casa en Fernando de la Mora",
    intro: "No conviene entregar una seña sin tener respuesta clara para cada uno de estos puntos:",
    items: [
      "El título de propiedad a nombre de quien vende, cotejado con la cédula al momento de la firma, y un informe de condiciones de dominio vigente.",
      "Si el impuesto inmobiliario está al día y coincide con el nombre de quien firma la venta.",
      "Si las ampliaciones de la casa tienen planos aprobados por la municipalidad o se hicieron sin permiso.",
      "Si el agua llega por red pública o depende de un tanque propio, y cómo cambia esa cobertura entre zona norte y zona sur.",
      "El tipo de desagüe de la vivienda, tomando en cuenta que no toda la ciudad tiene la misma cobertura de red cloacal.",
      "Si la calle de acceso se inunda con lluvias fuertes, algo que conviene chequear después de una tormenta y no solo con buen tiempo.",
      "Cuánto se tarda en llegar a Asunción en hora pico desde esa cuadra, un dato que conviene medir vos mismo antes de decidir.",
      "Quién hace la escritura y qué gastos de transferencia van a tu cargo, antes de comprometer cualquier adelanto.",
    ],
  },
  financing: {
    title: "Cómo se financia una casa en Fernando de la Mora",
    paragraphs: [
      "Comprar una casa en Fernando de la Mora se paga al contado en algunos casos y con crédito hipotecario en otros; entre esas opciones están las líneas para primera vivienda que algunos bancos y financieras ofrecen con fondos de la Agencia Financiera de Desarrollo.",
      "Para calcular qué cuota mensual podrías pagar, la página de financiamiento del portal cruza los programas vigentes que conocemos con el precio de la casa que te interesa; la aprobación final y sus condiciones dependen siempre de la entidad prestamista.",
    ],
  },
  faq: [
    {
      q: "¿Es más cara la zona norte o la zona sur de Fernando de la Mora?",
      a: "En general la zona norte mantiene precios algo más firmes por su cercanía al comercio y al transporte, mientras que en la zona sur el mismo presupuesto suele rendir un terreno más grande. Conviene comparar cuadra por cuadra.",
    },
    {
      q: "¿Cuánto cuesta una casa en Fernando de la Mora?",
      a: "Depende de la zona, del tamaño del terreno y del estado de la construcción. Arriba mostramos el rango de precios pedidos hoy en los avisos publicados, no un promedio de la ciudad.",
    },
    {
      q: "¿Las casas se venden en dólares o en guaraníes?",
      a: "Las dos monedas aparecen en los avisos. Cada aviso muestra la moneda que fijó quien vende, y la moneda final de la operación se acuerda entre las partes antes de firmar.",
    },
    {
      q: "¿Conviene comprar cerca del límite con Asunción?",
      a: "Si tu prioridad es la cercanía a la capital, sí, aunque esas casas suelen tener precios más firmes. Otras zonas de Fernando de la Mora pueden ofrecer más terreno por el mismo presupuesto.",
    },
    {
      q: "¿Qué documentos le pido al vendedor antes de comprar?",
      a: "Pedile el título de propiedad, un informe de condiciones de dominio reciente, el comprobante del impuesto inmobiliario y los planos de cualquier ampliación. Un escribano de tu confianza puede revisarlos antes de firmar.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Dejá en el formulario de esta página tu presupuesto y la zona que te interesa. En cuanto entra una casa en Fernando de la Mora que encaje con lo que buscás, te escribimos por WhatsApp para avisarte.",
    },
  ],
  claimsToVerify: [
    "Fernando de la Mora is commonly divided by locals into 'zona norte' and 'zona sur', with zona norte generally perceived as having firmer prices due to proximity to commerce and transport.",
    "Fernando de la Mora directly borders Asunción, close enough that the distance to it is measured in city blocks rather than kilometres.",
    "Fernando de la Mora borders San Lorenzo and Ñemby.",
    "A property sale deed is signed before an escribano público; an 'informe de condiciones de dominio' shows embargos and hipotecas.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house appears.",
  ],
};
