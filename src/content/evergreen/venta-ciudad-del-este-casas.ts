/**
 * Evergreen page: /venta/ciudad-del-este/casas — "casas ciudad del este"
 * (70/mo) and its merged variants (docs/seo-evergreen-keywords.md, table A
 * #26).
 *
 * Prose only, no numbers (the page counts those from its own rows); every
 * factual claim is listed in claimsToVerify.
 */
import type { EvergreenPage } from "./types";

export const ventaCiudadDelEsteCasas: EvergreenPage = {
  path: "/venta/ciudad-del-este/casas",
  door: "inmobiliaria",
  keyword: "casas ciudad del este",
  secondaryKeywords: [
    "casa en venta en ciudad del este paraguay",
    "casas baratas en venta en ciudad del este paraguay",
    "casas en venta ciudad del este paraguay",
    "casas en venta en ciudad del este paraguay",
  ],
  h1: "Casas en venta en Ciudad del Este",
  lede: "Mirá las casas en venta publicadas hoy en Ciudad del Este, filtrá por presupuesto y dejá tu búsqueda para que te avisemos cuando entre una que se ajuste.",
  metaDescription:
    "Casas en venta en Ciudad del Este: filtrá por presupuesto, mirá los avisos publicados hoy y dejá tu búsqueda para lo nuevo.",
  priceBands: [
    { max: 60_000 },
    { min: 60_001, max: 100_000 },
    { min: 100_001, max: 180_000 },
    { min: 180_001 },
  ],
  barrios: {
    title: "Zonas de Ciudad del Este para comprar una casa",
    intro:
      "El valor de una casa en Ciudad del Este cambia mucho según la distancia al comercio de frontera y a las rutas de salida de la ciudad. Antes de comparar precios conviene tener claro qué ofrece cada zona.",
    items: [
      {
        name: "Microcentro y alrededores del puente",
        text: "Es la zona de mayor movimiento comercial. Las pocas casas que quedan ahí valen más como terreno o como local que como vivienda familiar, por el ruido y el tránsito de carga durante el día.",
      },
      {
        name: "Barrios sobre las rutas hacia Minga Guazú y Hernandarias",
        text: "Concentran buena parte de las casas construidas en los últimos años, muchas dentro de condominios cerrados. Los vecinos ubican cada tramo por su distancia sobre la ruta más que por un nombre de barrio, así que pedí referencias claras antes de ir a verla.",
      },
      {
        name: "Zona cercana al aeropuerto",
        text: "Ofrece casas con patios más amplios y menos movimiento que el microcentro. El ruido de los aviones varía de una cuadra a otra, así que conviene visitar más de una vez antes de decidir.",
      },
      {
        name: "Barrios residenciales más alejados del centro",
        text: "Ahí el mismo presupuesto compra terrenos más grandes, pero los servicios cambian de una calle a otra: agua de red o aguatería, calle asfaltada, empedrada o de tierra. Eso se confirma casa por casa, no por la fama del barrio.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Lo que ves arriba se calcula solo con las casas en venta publicadas hoy en este portal para la ciudad. Es el precio que pide el vendedor, no el precio final de una venta cerrada, y cambia cada vez que se publica o se retira un aviso.",
      "Por el peso del comercio con Brasil en la economía local, buena parte de las casas se publica en dólares. El portal filtra por ese equivalente, así que convertí tu presupuesto en guaraníes antes de tocar los filtros.",
      "Al comparar dos casas no te quedes solo con los metros construidos: en varias zonas el lote pesa tanto o más que la construcción en el precio final.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar una casa en Ciudad del Este",
    intro: "Antes de señar una casa en esta ciudad conviene tener respuesta para cada uno de estos puntos:",
    items: [
      "El título de propiedad a nombre de quien vende, con un informe de condiciones de dominio sin embargos ni hipotecas.",
      "El comprobante del impuesto inmobiliario al día en la Municipalidad de Ciudad del Este, sobre todo si la casa tuvo alguna vez uso comercial.",
      "Si alguna ampliación — un local, un depósito, un garaje — tiene plano aprobado por la comuna o se construyó sin ese trámite.",
      "Si el agua llega por red pública o por aguatería, y si ese servicio queda a nombre de la casa o hay que darlo de alta después de la escritura.",
      "Si la calle se inunda después de una lluvia fuerte: mejor preguntarlo antes que visitar solo en un día seco.",
      "El movimiento de comercio o de carga cerca de la casa a distintas horas, sobre todo si queda a pocas cuadras del microcentro.",
      "Quién certifica la escritura — un escribano público — y sus honorarios, sobre todo si el precio se pactó en dólares por el peso del comercio en la zona.",
      "Si la casa está en un condominio, qué cubre la expensa y desde cuándo se paga.",
    ],
  },
  financing: {
    title: "Financiar una casa en Ciudad del Este",
    paragraphs: [
      "En Ciudad del Este las casas se compran tanto al contado como con un préstamo hipotecario tramitado en un banco o una financiera. Para el primer inmueble, algunas entidades trabajan con fondos de la Agencia Financiera de Desarrollo (AFD), aunque cada una fija sus propias condiciones y las va cambiando.",
      "La página de financiamiento del portal junta los programas que tenemos identificados junto con una estimación de la cuota mensual, pensada para comparar opciones y no como una aprobación: el plazo, la tasa y el monto final los termina de definir la entidad que otorgue el crédito.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta una casa en Ciudad del Este?",
      a: "Depende sobre todo de la zona, el tamaño del terreno y el estado de la casa. Arriba mostramos el rango de precios de las casas publicadas hoy en el portal para esta ciudad.",
    },
    {
      q: "¿Las casas se venden en dólares o en guaraníes?",
      a: "Las dos monedas se usan en esta ciudad por el peso del comercio de frontera. Cada aviso muestra la moneda en que la publicó el vendedor, y la moneda final de la operación se acuerda entre las partes.",
    },
    {
      q: "¿Qué documentos le pido al vendedor?",
      a: "Como mínimo el título de propiedad, un informe de condiciones de dominio reciente y el comprobante del impuesto inmobiliario al día. Un escribano de tu confianza puede revisarlos antes de que señes.",
    },
    {
      q: "¿Conviene comprar cerca del microcentro?",
      a: "Depende de para qué la quieras: cerca del microcentro ganás cercanía al comercio y perdés tranquilidad, por el movimiento de gente y de carga durante el día.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Escribinos tu presupuesto y qué tipo de casa necesitás en el formulario de esta página. El equipo guarda el pedido y te contacta por WhatsApp cuando aparece una casa en Ciudad del Este que corresponda.",
    },
  ],
  claimsToVerify: [
    "Ciudad del Este is the capital of the Alto Paraná department.",
    "Ciudad del Este's economy centers heavily on cross-border commerce with Brazil near the bridge and downtown commercial galerías.",
    "Minga Guazú and Hernandarias are neighboring municipalities along the routes leaving Ciudad del Este, where recent construction including barrios cerrados concentrates.",
    "Areas of Ciudad del Este along those routes are commonly referred to informally by their distance from the center rather than by a formal barrio name.",
    "An international airport (Aeropuerto Guaraní) serves the Ciudad del Este area, though it sits in neighboring Minga Guazú, and aircraft noise varies block by block near it.",
    "Water in Ciudad del Este comes either from the public network or from private aguateras depending on the zone.",
    "It is common in Ciudad del Este for house prices to be quoted in USD given the cross-border commerce.",
    "The impuesto inmobiliario for a house in Ciudad del Este is paid to the Municipalidad de Ciudad del Este.",
    "A property sale deed is signed before an escribano público; an 'informe de condiciones de dominio' shows embargos and hipotecas.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house in Ciudad del Este appears.",
  ],
};
