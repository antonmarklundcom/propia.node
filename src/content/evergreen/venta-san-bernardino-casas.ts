/**
 * Evergreen page: /venta/san-bernardino/casas — "casas en venta en san
 * bernardino paraguay" (30/mo) and its merged variants
 * (docs/seo-evergreen-keywords.md, table C1 / decision S10).
 *
 * San Bernardino is new to the location tree (S10): this page 404s until
 * `npm run seed:locations` and `npm run cron:geo` run on production. Houses
 * here split between a weekend/summer market and full-time residents —
 * this page covers both honestly instead of assuming one.
 */
import type { EvergreenPage } from "./types";

export const ventaSanBernardinoCasas: EvergreenPage = {
  path: "/venta/san-bernardino/casas",
  door: "inmobiliaria",
  keyword: "casas en venta en san bernardino paraguay",
  secondaryKeywords: [
    "casas en san bernardino paraguay",
    "casas en venta san bernardino paraguay",
  ],
  h1: "Casas en venta en San Bernardino",
  lede: "Filtrá las casas publicadas junto al lago Ypacaraí, tanto las pensadas para el fin de semana como las que se habitan todo el año.",
  metaDescription:
    "Casas en venta en San Bernardino: filtrá por precio entre casas de fin de semana y casas para vivir todo el año junto al lago Ypacaraí.",
  priceBands: [
    { max: 80_000 },
    { min: 80_001, max: 150_000 },
    { min: 150_001, max: 300_000 },
    { min: 300_001 },
  ],
  barrios: {
    title: "Qué zona de San Bernardino conviene según el uso que le vas a dar",
    intro:
      "San Bernardino se organiza en gran parte alrededor de su cercanía al lago Ypacaraí, y esa distancia importa distinto según busques una casa de fin de semana o un lugar para vivir todo el año.",
    items: [
      {
        name: "Sobre la costa",
        text:
          "Las casas más cercanas a la orilla suelen construirse pensando en el fin de semana o el verano: patios grandes, quinchos, muelle o salida al agua. Preguntá cómo quedó la casa después de haber estado cerrada varios meses, sobre todo la humedad y las instalaciones.",
      },
      {
        name: "El casco céntrico",
        text:
          "Cerca de la plaza y del comercio local es donde más se ve gente que vive en San Bernardino todo el año, con colegio, farmacia y almacén a mano. Las casas suelen ser más chicas que las de la costa, sobre terrenos más modestos.",
      },
      {
        name: "Sobre el camino de acceso",
        text:
          "Las viviendas ubicadas sobre la vía que conecta San Bernardino con el resto de Cordillera convienen a quien viaja seguido hacia Asunción por trabajo, aunque el tránsito y el ruido de esa calle cambian mucho de una cuadra a otra.",
      },
      {
        name: "Zonas más alejadas del lago",
        text:
          "Más lejos de la costa aparecen terrenos más grandes a precios más accesibles, con casas pensadas mayormente para vivir de forma permanente. A cambio, conviene medir bien la distancia real hasta el centro y hasta el colegio o el trabajo.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los precios de arriba corresponden solo a las casas publicadas hoy en San Bernardino en este portal: son valores pedidos por quien vende, no ventas ya cerradas, y suben o bajan según qué casas tengan aviso activo.",
      "Muchas casas de la zona costera se publican en dólares, mientras que las más alejadas del lago aparecen también en guaraníes; el portal filtra por el equivalente en dólares, así que convertí tu presupuesto antes de usarlo.",
      "Entre dos casas parecidas, lo que más mueve el precio es la distancia al agua y si está pensada para uso permanente o solo de temporada.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar una casa en San Bernardino",
    intro:
      "Antes de avanzar con una seña conviene despejar estos puntos, más aún si la casa estuvo cerrada buena parte del año:",
    items: [
      "El título de propiedad a nombre de quien vende y un informe de condiciones de dominio que descarte embargos o hipotecas.",
      "El impuesto inmobiliario al día ante la Municipalidad de San Bernardino, con el comprobante del último pago.",
      "Si la casa estuvo deshabitada largas temporadas, probar a fondo cañerías, instalación eléctrica y artefactos antes de cerrar el precio.",
      "De dónde sale el agua —junta de saneamiento o pozo propio— y si hay señales de humedad por la cercanía al lago.",
      "Si el terreno tiene algún antecedente de anegamiento cuando sube el lago, algo que conviene preguntar a los vecinos y no solo a quien vende.",
      "Si las ampliaciones —quincho, garaje, piezas— tienen planos aprobados por la municipalidad.",
      "El tiempo real de viaje hasta Asunción si vas a usar la casa entre semana y no solo el fin de semana.",
    ],
  },
  financing: {
    title: "Financiar una casa en San Bernardino",
    paragraphs: [
      "Además del pago al contado, existe el crédito hipotecario de bancos y financieras para comprar una vivienda en San Bernardino, con sus propios requisitos de garantía y de ingresos comprobables.",
      "Algunas entidades ofrecen líneas para primera vivienda con fondos de la Agencia Financiera de Desarrollo (AFD); las condiciones cambian de una entidad a otra y conviene consultarlas antes de comprometerte con una fecha de cierre.",
      "En la página de financiamiento reunimos los programas que conocemos junto con una estimación de la cuota mensual para comparar: sirve para planificar, no reemplaza la aprobación final de la entidad que te preste.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta una casa en San Bernardino?",
      a: "Depende mucho de la distancia al lago y de si la casa está pensada para el fin de semana o para vivir todo el año. Arriba mostramos el rango de las casas publicadas hoy; no damos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿Las casas de San Bernardino son solo para el fin de semana?",
      a: "No todas: junto al lago predominan las casas de temporada, pero alrededor del centro y hacia el interior de la ciudad también hay gente que vive todo el año. Conviene preguntar directamente por el uso que tuvo cada casa antes de comprarla.",
    },
    {
      q: "¿En qué moneda se venden las casas en San Bernardino?",
      a: "Las dos: dólares y guaraníes conviven, sobre todo porque muchas casas costeras se publican en dólares. Cada aviso muestra la moneda que eligió quien vende y la moneda final se acuerda antes de firmar.",
    },
    {
      q: "¿Qué documentos le pido al vendedor?",
      a: "Como mínimo el título de propiedad, un informe de condiciones de dominio reciente, el impuesto inmobiliario al día y los planos de cualquier ampliación. Un escribano de confianza puede revisarlos antes de que señes.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Dejá tu búsqueda en el formulario de esta página, contando si la buscás para el fin de semana o para vivir todo el año. Te avisamos por WhatsApp cuando entra una casa en San Bernardino que encaje.",
    },
  ],
  claimsToVerify: [
    "San Bernardino is a city in the Cordillera department, on the shore of Lake Ypacaraí.",
    "Houses close to the lakeshore in San Bernardino are more often built/used as weekend or summer houses than as full-time residences.",
    "The town center around the plaza is where more full-time (year-round) residents live, with local shops, a school and a pharmacy nearby.",
    "A road connects San Bernardino to the rest of the Cordillera department, used by people commuting to/from Asunción.",
    "Houses farther from the lake tend to sit on larger, cheaper land and are more often built for permanent living.",
    "Coastal houses in San Bernardino are commonly listed in USD, while houses farther from the lake are also listed in PYG.",
    "A house left closed for long stretches of the year is more likely to have plumbing, electrical or appliance issues that only show up on close inspection.",
    "Some land near the lakeshore in San Bernardino has a history of waterlogging when the lake's level rises.",
    "The impuesto inmobiliario is paid to the Municipalidad de San Bernardino; house extensions need municipally approved plans.",
    "A property sale deed is signed before an escribano público; an 'informe de condiciones de dominio' shows embargos and hipotecas.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Operational promise: a search left on this page is read by the team, who write back by WhatsApp when a matching house in San Bernardino appears.",
  ],
};
