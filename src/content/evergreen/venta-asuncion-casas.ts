/**
 * Evergreen page: /venta/asuncion/casas — "casas en venta asuncion" (390/mo)
 * and its merged variants (docs/seo-evergreen-keywords.md, table A #4).
 *
 * "casas en remate en asunción" is deliberately left out of
 * `secondaryKeywords`: the portal carries no foreclosure listings, and this
 * page must never imply that it does (founder decision).
 */
import type { EvergreenPage } from "./types";

export const ventaAsuncionCasas: EvergreenPage = {
  path: "/venta/asuncion/casas",
  door: "inmobiliaria",
  keyword: "casas en venta asuncion",
  secondaryKeywords: [
    "casa en venta en asuncion",
    "casas a la venta en asuncion",
    "casas baratas en asuncion",
    "venta de casas economicas en asuncion paraguay",
    "casas en asuncion paraguay",
    "casas en venta asuncion paraguay",
  ],
  h1: "Casas en venta en Asunción",
  lede: "Explorá las casas publicadas por barrio y por precio, y dejá tu búsqueda guardada si todavía no encontrás la que se ajusta a lo que necesitás.",
  metaDescription:
    "Casas en venta en Asunción por barrio y por precio: mirá los avisos publicados hoy y dejá tu búsqueda para enterarte de las casas nuevas.",
  priceBands: [
    { max: 100_000 },
    { min: 100_001, max: 200_000 },
    { min: 200_001, max: 350_000 },
    { min: 350_001 },
  ],
  barrios: {
    title: "Barrios de Asunción y qué tipo de casa vas a encontrar en cada uno",
    intro:
      "La capital es chica en superficie pero muy variada en lo que ofrece: el mismo presupuesto compra una casa muy distinta según el barrio. Estos son los grupos de zonas que más aparecen entre las casas publicadas.",
    items: [
      {
        name: "Barrios residenciales del norte",
        text:
          "Villa Morra, Carmelitas y Las Lomas concentran buena parte de las casas más amplias de la capital, con lotes generosos y calles arboladas. Es la zona con más oferta de comercios, oficinas y colegios privados a pocas cuadras, y eso se refleja en el precio pedido por metro cuadrado.",
      },
      {
        name: "Alrededores del Jardín Botánico y la Costanera",
        text:
          "Los barrios que rodean la reserva del Botánico y se acercan a la avenida costanera ofrecen casas con más verde y algo de distancia del tránsito pesado del microcentro. Conviene revisar el acceso en auto hacia el resto de la ciudad en horas de mucho tránsito.",
      },
      {
        name: "Barrios tradicionales cercanos al centro histórico",
        text:
          "Recoleta, Trinidad y Sajonia son barrios más antiguos, con casas de distintas épocas mezcladas entre sí: desde construcciones que piden reforma hasta viviendas ya renovadas. La cercanía a oficinas públicas y bancos pesa en el precio y también en el ruido y el tránsito diario.",
      },
      {
        name: "Barrios hacia los límites de la ciudad",
        text:
          "San Vicente, Republicano y otros barrios hacia el sur y el este de la capital suelen rendir más metros cuadrados por el mismo presupuesto, aunque conviene comparar caso por caso el estado de las calles y la cercanía real a una parada de colectivo o a un centro de salud.",
      },
    ],
  },
  prices: {
    title: "Cómo leer los precios publicados",
    paragraphs: [
      "Los rangos de arriba se calculan sobre los avisos activos en este portal en este momento: son precios que pide quien vende, no precios de cierre, así que una misma casa puede terminar vendiéndose por otra cifra tras la negociación.",
      "En Asunción convive la publicación en dólares con la publicación en guaraníes según prefiera el vendedor. El portal ordena por el equivalente en dólares, así que si tu presupuesto está pensado en guaraníes convertilo antes de usar los filtros de precio.",
      "El barrio pesa más que la superficie construida a la hora de explicar la diferencia de precio entre dos casas parecidas.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar una casa en Asunción",
    intro:
      "Antes de avanzar con una oferta, conviene tener respuesta para estos puntos, más allá de lo que diga el aviso:",
    items: [
      "Que el título esté a nombre de quien firma como vendedor, con un informe de dominio que descarte hipotecas y embargos vigentes.",
      "Que el impuesto inmobiliario municipal esté al día, con el comprobante del último pago a mano.",
      "Si hubo ampliaciones o construcciones posteriores a la escritura original, y si esas obras tienen plano aprobado por la Municipalidad de Asunción.",
      "Cómo llega el agua a la casa y qué presión tiene en horas de mayor consumo.",
      "El estado real de la vereda y de la calle frente a la casa, sobre todo tras una lluvia fuerte.",
      "El tiempo real de traslado hasta tu trabajo o el colegio de tus hijos, probado en día de semana.",
      "Quién redacta la escritura y qué gastos de transferencia quedan a tu cargo además del precio acordado.",
    ],
  },
  financing: {
    title: "Cómo se financia una casa en Asunción",
    paragraphs: [
      "Buena parte de las casas de la capital se compran al contado, pero también hay crédito hipotecario disponible en bancos y financieras para quien prefiere financiar una parte. Algunas entidades ofrecen líneas para primera vivienda con fondos de la Agencia Financiera de Desarrollo, con condiciones propias de cada entidad.",
      "En la página de financiamiento del portal reunimos los programas que conocemos junto con una estimación de cuota mensual para comparar alternativas. Es una guía para ordenar el presupuesto, no una aprobación: la tasa y el plazo definitivos los fija la entidad que otorgue el crédito.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta una casa en Asunción?",
      a: "Depende mucho del barrio, del tamaño del lote y del estado de la construcción. Los rangos de arriba salen de los avisos publicados hoy en el portal; no damos un promedio general de la ciudad porque cambia todo el tiempo según lo que entra y sale.",
    },
    {
      q: "¿Las casas se venden en dólares o en guaraníes?",
      a: "Las dos monedas se usan según lo que decida quien publica el aviso. El portal muestra el equivalente en dólares para que puedas comparar y ordenar por precio sin depender de la moneda original.",
    },
    {
      q: "¿Qué documentos debería pedir antes de avanzar?",
      a: "Como mínimo el título de propiedad, un informe de dominio actualizado, el comprobante del impuesto inmobiliario al día y los planos de cualquier ampliación. Un escribano de tu confianza puede revisarlos antes de que firmes nada.",
    },
    {
      q: "¿Qué barrio conviene si trabajo en el microcentro?",
      a: "No hay una respuesta única: depende del presupuesto y de cuánto tránsito estés dispuesto a tolerar. Revisá el trayecto real en auto o en colectivo antes de decidirte por un barrio en particular.",
    },
    {
      q: "¿Y si ninguna casa publicada hoy me sirve?",
      a: "Dejá tu búsqueda en el formulario de esta página con el presupuesto y lo que necesitás. El equipo del portal te escribe por WhatsApp apenas se publica una casa en Asunción que encaje con lo que pediste.",
    },
  ],
  claimsToVerify: [
    "Villa Morra, Carmelitas and Las Lomas are residential barrios of Asunción known for larger houses on generous lots.",
    "The Jardín Botánico is a nature reserve in Asunción, near the Costanera avenue.",
    "Recoleta, Trinidad and Sajonia are older, traditional barrios of Asunción close to the historic center.",
    "San Vicente and Republicano are barrios toward the southern/eastern edge of Asunción with generally more affordable prices.",
    "The impuesto inmobiliario for an Asunción property is paid to the Municipalidad de Asunción; extensions need a municipally approved plan.",
    "A property sale deed is signed before an escribano; an informe de dominio shows hipotecas and embargos.",
    "Some lenders offer first-home mortgages funded by the Agencia Financiera de Desarrollo (AFD); terms are set by each lender.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house appears.",
  ],
};
