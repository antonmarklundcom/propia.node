/**
 * Evergreen page: /venta/san-lorenzo/casas — "casas en venta san lorenzo" and
 * its merged variants (docs/seo-evergreen-keywords.md, table A #16).
 *
 * Venta page: the financing section covers how a purchase gets paid for, and
 * links to /financiamiento.
 */
import type { EvergreenPage } from "./types";

export const ventaSanLorenzoCasas: EvergreenPage = {
  path: "/venta/san-lorenzo/casas",
  door: "inmobiliaria",
  keyword: "casas en venta san lorenzo",
  secondaryKeywords: [
    "casa venta san lorenzo",
    "casa de venta en san lorenzo",
    "casas baratas en san lorenzo",
    "casas de venta en san lorenzo",
    "casas en venta san lorenzo listado nuevo",
    "chalet san lorenzo",
    "comprar casa san lorenzo",
    "casa en venta en san lorenzo paraguay",
    "casas en venta san lorenzo paraguay",
    "compra de casas en san lorenzo",
    "clasificados venta de casas en san lorenzo",
  ],
  h1: "Casas en venta en San Lorenzo",
  lede: "Comparás precios pedidos hoy por casas en San Lorenzo, filtrás por presupuesto y dejás tu búsqueda para enterarte de lo nuevo.",
  metaDescription:
    "Casas en venta en San Lorenzo: comparás precios publicados hoy, filtrás por zona y presupuesto, y dejás tu búsqueda para lo que entre nuevo.",
  priceBands: [
    { max: 60_000 },
    { min: 60_001, max: 100_000 },
    { min: 100_001, max: 180_000 },
    { min: 180_001 },
  ],
  barrios: {
    title: "Qué mirar según la zona de San Lorenzo",
    intro:
      "Comprar una casa en San Lorenzo no es lo mismo en el centro que cerca del límite con otra ciudad: el precio por metro de terreno y el tipo de construcción cambian bastante de una zona a otra.",
    items: [
      {
        name: "Centro y su entorno municipal",
        text:
          "Las casas más antiguas del centro suelen estar sobre terrenos consolidados y cerca de bancos, comercios y oficinas públicas, lo que las hace atractivas para quien no quiere depender del auto para hacer trámites.",
      },
      {
        name: "Entorno de la Ciudad Universitaria",
        text:
          "Comprar cerca del campus tiene la ventaja de la demanda constante si en algún momento pensás alquilar parte de la propiedad, aunque las calles internas suelen tener más tránsito peatonal en horario de clases.",
      },
      {
        name: "Sobre la ruta hacia el interior",
        text:
          "Las propiedades sobre esa ruta o a pocas cuadras ganan en conectividad con otras ciudades del Central, pero conviene visitarlas de día y de noche para evaluar el ruido antes de decidir la compra.",
      },
      {
        name: "Zona Sinalco y el límite con Fernando de la Mora",
        text:
          "Hacia ese sector, ya lindando con Fernando de la Mora, el precio por el mismo presupuesto suele rendir un lote más grande, aunque conviene confirmar el estado de las calles internas antes de comprar.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los precios de arriba salen de los avisos publicados hoy en el portal: son valores pedidos por quien vende, no el precio final de cierre, que suele negociarse entre comprador y vendedor.",
      "En San Lorenzo se ven avisos tanto en dólares como en guaraníes; el portal filtra y ordena por el equivalente en dólares, así que conviene tener tu presupuesto convertido antes de mover los filtros de precio.",
      "El tamaño del terreno pesa mucho en el precio final: dos casas de superficie construida parecida pueden pedir montos distintos según cuánto lote tengan alrededor.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar una casa en San Lorenzo",
    intro: "Antes de avanzar con una seña, conviene tener respuesta para cada uno de estos puntos:",
    items: [
      "El título de propiedad y un informe de condiciones de dominio que descarte embargos o hipotecas sobre el inmueble.",
      "Que el impuesto inmobiliario esté al día y a nombre de quien te vende, algo para confirmar en la Municipalidad de San Lorenzo antes de firmar cualquier adelanto.",
      "Si las construcciones adicionales (piezas, quinchos, garajes) cuentan con planos aprobados por la municipalidad.",
      "De dónde viene el agua de la vivienda y cómo es la presión en las horas de mayor consumo del barrio.",
      "Si la casa está conectada a la red de desagüe cloacal o depende de un pozo ciego.",
      "Cómo se comporta la calle de acceso con lluvias fuertes, sobre todo si la casa está lejos de una avenida principal.",
      "El trayecto real hasta tu trabajo o tu facultad en hora pico, hecho el mismo día de la visita.",
      "Quién va a firmar la escritura y qué honorarios cobra el escribano antes de comprometer un anticipo.",
    ],
  },
  financing: {
    title: "Cómo se financia una casa en San Lorenzo",
    paragraphs: [
      "No todas las compras se pagan de la misma forma: hay quien cierra al contado y quien recurre a un crédito hipotecario de un banco o una financiera, y algunas de esas entidades ofrecen líneas para primera vivienda con fondos de la Agencia Financiera de Desarrollo.",
      "La página de financiamiento del portal junta los programas vigentes que conocemos con una estimación de la cuota mensual, útil para planificar aunque la tasa final, el plazo y el monto los termina fijando la entidad que te preste.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta una casa en San Lorenzo?",
      a: "Depende de la zona, del tamaño del terreno y del estado de la construcción. Arriba mostramos el rango de precios pedidos hoy en los avisos publicados; no damos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿Conviene comprar cerca de la Ciudad Universitaria?",
      a: "Si valorás la cercanía a la facultad o el movimiento constante de gente en la zona, sí; si preferís una calle más tranquila, otras zonas de San Lorenzo se ajustan mejor a eso.",
    },
    {
      q: "¿Las casas se venden en dólares o en guaraníes?",
      a: "Las dos monedas aparecen en los avisos. Cada publicación muestra la moneda en que la fijó quien vende, y la moneda final de la operación se acuerda entre las partes antes de firmar.",
    },
    {
      q: "¿Qué documentos le pido al vendedor antes de comprar?",
      a: "Como mínimo el título de propiedad, un informe de condiciones de dominio actualizado, el impuesto inmobiliario al día y los planos de cualquier ampliación. Un escribano de tu confianza puede revisarlos antes de que señes.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva en San Lorenzo?",
      a: "Dejanos tu presupuesto y lo que estás buscando en el formulario de esta página, y seguimos atentos: en cuanto entra una casa en San Lorenzo que encaje, te escribimos por WhatsApp.",
    },
  ],
  claimsToVerify: [
    "The Universidad Nacional de Asunción's main campus is in San Lorenzo.",
    "A route connecting San Lorenzo to the interior of the country passes near/through the city (referenced only as 'esa ruta hacia el interior').",
    "There is an area known as Zona Sinalco near the border with Fernando de la Mora, where lots tend to be larger for the same budget.",
    "The impuesto inmobiliario for a San Lorenzo property is paid to the Municipalidad de San Lorenzo; additions/extensions need municipally approved plans.",
    "A property sale deed is signed before an escribano público; an 'informe de condiciones de dominio' shows embargos and hipotecas.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house appears.",
  ],
};
