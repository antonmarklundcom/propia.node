/**
 * Evergreen page: /venta/encarnacion/casas — "casas en venta encarnacion"
 * (40/mo) and its merged variants (docs/seo-evergreen-keywords.md, table A
 * #32).
 *
 * Prose only, no numbers (the page counts those from its own rows); every
 * factual claim is listed in claimsToVerify.
 */
import type { EvergreenPage } from "./types";

export const ventaEncarnacionCasas: EvergreenPage = {
  path: "/venta/encarnacion/casas",
  door: "inmobiliaria",
  keyword: "casas en venta encarnacion",
  secondaryKeywords: [
    "casas en venta en encarnación paraguay",
    "casa en venta en encarnacion paraguay",
    "casas economicas en encarnación",
    "casas en encarnacion paraguay",
    "casas en venta encarnacion paraguay",
  ],
  h1: "Casas en venta en Encarnación",
  lede: "Explorá las casas en venta de Encarnación filtrando por presupuesto y dejá tu búsqueda cargada si todavía no encontrás la que buscás.",
  metaDescription:
    "Casas en venta en Encarnación: filtrá por presupuesto, mirá los avisos publicados hoy y dejá tu búsqueda para lo nuevo.",
  priceBands: [
    { max: 60_000 },
    { min: 60_001, max: 100_000 },
    { min: 100_001, max: 180_000 },
    { min: 180_001 },
  ],
  barrios: {
    title: "Zonas de Encarnación para comprar una casa",
    intro:
      "El precio de una casa en Encarnación depende sobre todo de la distancia a la costanera y de si el barrio es de los más tradicionales o de los que se expandieron hacia Cambyretá.",
    items: [
      {
        name: "Zona de la costanera",
        text: "Las casas más próximas a la costanera y a las playas reconstruidas tras la represa de Yacyretá son las que piden más por metro cuadrado de toda la ciudad.",
      },
      {
        name: "Microcentro",
        text: "Ofrece cercanía al comercio y a las oficinas, pero quedan pocas casas: la mayoría de los terrenos ya se ocupó con edificios o locales, así que las que se venden suelen tener valor también como terreno.",
      },
      {
        name: "Barrios más tradicionales, alejados de la costanera",
        text: "Son barrios más antiguos, con casas de terrenos más grandes y precios más accesibles que la zona de la costanera. Conviene revisar el estado de las construcciones más viejas antes de comparar precios.",
      },
      {
        name: "Cambyretá y zonas de expansión",
        text: "En la ciudad vecina de Cambyretá se construyen muchas de las casas más nuevas de la zona, con terrenos algo más grandes por un precio menor que cerca de la costanera de Encarnación.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los precios de arriba reflejan únicamente las casas en venta que están publicadas hoy en este portal para Encarnación: son montos pedidos por el vendedor, no operaciones ya cerradas, y cambian según entran y salen avisos de la lista.",
      "Cerca de la costanera es más frecuente ver el precio publicado en dólares, mientras que en los barrios más alejados es común encontrarlo en guaraníes. El portal ordena y filtra por ese equivalente: llevá tu presupuesto a dólares antes de revisar los rangos.",
      "El tamaño del terreno pesa mucho al comparar precios en esta ciudad: una casa chica sobre un lote grande cerca de la costanera puede valer más que una casa más nueva en un barrio alejado.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar una casa en Encarnación",
    intro: "Conviene resolver estos puntos antes de poner una seña por una casa en esta ciudad:",
    items: [
      "Que el título de propiedad esté a nombre de quien te vende, respaldado por un informe de condiciones de dominio sin embargos ni hipotecas pendientes.",
      "El comprobante de que el impuesto inmobiliario está al día en la Municipalidad de Encarnación, y si el lote quedó dentro de alguna reubicación ligada a la reconstrucción de la costanera.",
      "Las ampliaciones de las casas más antiguas —comunes en los barrios tradicionales— rara vez tienen plano aprobado por la municipalidad: preguntá si se hizo ese trámite en algún momento.",
      "De dónde viene el agua y cómo es la conexión al desagüe cloacal o al pozo ciego.",
      "El estado del terreno frente a lluvias fuertes, un punto especialmente importante en los barrios más bajos cerca del río.",
      "Si el movimiento de turistas en temporada de verano afecta el tránsito diario hacia la casa, sobre todo cerca de la costanera.",
      "Los honorarios del escribano público que va a certificar la escritura y los gastos de transferencia, que conviene tener presupuestados aparte del precio de la casa antes de cerrar la operación.",
      "Si la casa está en Cambyretá o en Encarnación propiamente, porque cambia la municipalidad a la que corresponde el trámite.",
    ],
  },
  financing: {
    title: "Financiar una casa en Encarnación",
    paragraphs: [
      "En Encarnación una casa se puede pagar al contado o a través de un crédito hipotecario gestionado en un banco o una financiera. Para quienes compran su primera vivienda, algunas entidades trabajan con fondos de la Agencia Financiera de Desarrollo (AFD), aunque las condiciones dependen de cada una y se actualizan con el tiempo.",
      "En la sección de financiamiento del portal reunimos los programas que identificamos, junto con una estimación de la cuota mensual para tener una referencia al planificar la compra. No es una aprobación: el banco o la financiera que otorgue el crédito termina de definir la tasa, el plazo y el monto.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta una casa en Encarnación?",
      a: "Depende mucho de la distancia a la costanera y del tamaño del terreno. Arriba mostramos el rango de precios de las casas publicadas hoy en el portal para esta ciudad.",
    },
    {
      q: "¿Las casas se venden en dólares o en guaraníes?",
      a: "Las dos monedas se usan en esta ciudad, con más presencia del dólar cerca de la costanera. Cada aviso muestra la moneda en que la publicó el vendedor.",
    },
    {
      q: "¿Qué documentos le pido al vendedor?",
      a: "Pedí como mínimo el título de propiedad, un informe de condiciones de dominio actualizado y el comprobante de que el impuesto inmobiliario está al día. Conviene que un escribano de tu confianza los revise antes de firmar cualquier adelanto.",
    },
    {
      q: "¿Conviene comprar en Cambyretá o en Encarnación?",
      a: "Depende de tu presupuesto y de qué tan cerca querés estar del microcentro y de la costanera: en Cambyretá suele rendir más terreno por el mismo precio.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Dejanos tu presupuesto y qué tipo de casa buscás en el formulario de esta página. Guardamos ese pedido y te avisamos por WhatsApp la próxima vez que se publique una casa en Encarnación que corresponda.",
    },
  ],
  claimsToVerify: [
    "Encarnación's costanera area commands higher per-square-meter house prices than the rest of the city.",
    "Parts of Encarnación were reordered/resettled in connection with the Yacyretá dam and costanera reconstruction, with associated municipal processes for affected properties.",
    "Cambyretá is a distinct municipality from Encarnación, so a property there falls under a different municipal jurisdiction for taxes and permits.",
    "The impuesto inmobiliario for a house in Encarnación is paid to the Municipalidad de Encarnación.",
    "Tourist traffic in Encarnación rises in the summer season, affecting streets near the costanera.",
    "A property sale deed is signed before an escribano público; an 'informe de condiciones de dominio' shows embargos and hipotecas.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house in Encarnación appears.",
  ],
};
