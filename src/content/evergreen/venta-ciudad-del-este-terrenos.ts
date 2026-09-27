/**
 * Evergreen page: /venta/ciudad-del-este/terrenos — "terrenos en venta cde"
 * (docs/seo-evergreen-keywords.md, table A #29). Land door
 * (terreno.com.py, founder decision S9): loteamientos, mensura,
 * fraccionamiento and servicios, not the generic city-page template.
 */
import type { EvergreenPage } from "./types";

export const ventaCiudadDelEsteTerrenos: EvergreenPage = {
  path: "/venta/ciudad-del-este/terrenos",
  door: "terreno",
  keyword: "terrenos en venta cde",
  secondaryKeywords: [
    "terrenos en venta ciudad del este",
    "loteamientos en ciudad del este",
    "venta de terreno en ciudad del este",
    "venta terrenos ciudad del este",
  ],
  h1: "Terrenos en venta en Ciudad del Este",
  lede: "Ciudad del Este mueve una franja larga de loteamientos entre el casco comercial y la ruta hacia el interior: filtrá por precio y zona antes de ir a ver un lote.",
  metaDescription:
    "Terrenos en venta en Ciudad del Este: filtrá por precio y zona, mirá los lotes publicados hoy y dejá tu búsqueda para enterarte cuando entre uno nuevo.",
  priceBands: [
    { max: 20_000 },
    { min: 20_001, max: 50_000 },
    { min: 50_001, max: 100_000 },
    { min: 100_001 },
  ],
  barrios: {
    title: "Zonas de Ciudad del Este para comprar un terreno",
    intro:
      "Ciudad del Este no lotea de manera pareja: lo que paga un lote cambia mucho según qué tan cerca esté del comercio, de la frontera o de la ruta hacia el interior.",
    items: [
      {
        name: "Microcentro y zona comercial",
        text: "Pegada al movimiento de comercio y de cruce fronterizo. Los lotes vacíos escasean porque casi todo ya se construyó, así que lo que sale a la venta es más caro por metro y suele tener mensura resuelta hace tiempo.",
      },
      {
        name: "Corredor sobre la ruta hacia el interior",
        text: "El tramo que sale rumbo a las localidades vecinas concentra loteamientos recientes, con buen acceso vehicular y crecimiento comercial. Fijate si la red eléctrica y el agua ya llegaron hasta el lote antes de comparar precios.",
      },
      {
        name: "Costa del embalse",
        text: "El sector que mira hacia el lago de la represa binacional tiene lotes con vista y demanda propia, pero una parte de esa costa cae bajo una franja de control de la entidad que administra el embalse. Confirmá eso primero.",
      },
      {
        name: "Compañías hacia el interior de la ciudad",
        text: "Más lejos del asfalto, los lotes rinden más metros por el mismo presupuesto, con caminos de tierra y agua de pozo propio en muchos casos. Cada compañía tiene su propio estado de fraccionamiento.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los precios de arriba salen de los lotes publicados hoy en este portal: son pedidos por el vendedor o la loteadora, no cifras de cierre, y se acomodan según la zona y el estado de la documentación.",
      "En Ciudad del Este es común ver terrenos en guaraníes cuando vende una loteadora con plan de cuotas, y en dólares cuando vende un propietario particular. El portal filtra y ordena por el equivalente en dólares para comparar ambos casos.",
      "El precio por metro cambia fuerte entre un lote urbano ya fraccionado y otro más alejado sin todos los servicios. Fijate si lo publicado incluye mensura y planos aprobados o si eso queda pendiente para quien compra.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un terreno en Ciudad del Este",
    intro:
      "Un lote que se ve bien desde la calle puede esconder papeles sin resolver o servicios que todavía no llegaron. Repasá esto antes de reservar.",
    items: [
      "Si el título ya es individual o el lote sigue dentro de una matriz mayor a la espera de mensura y fraccionamiento.",
      "El plano de mensura y fraccionamiento aprobado por la Municipalidad, con los linderos coincidiendo con lo que ves parado en el terreno.",
      "El impuesto inmobiliario al día ante la Municipalidad de Ciudad del Este, con el comprobante del último pago.",
      "Si el lote cae dentro de la franja de protección del embalse de la represa binacional, con condiciones propias para edificar.",
      "Si la red eléctrica ya llegó hasta el lote o si extenderla queda a cargo de quien compra.",
      "De dónde sale el agua —red de la prestadora o pozo propio— y en qué estado está el camino de acceso.",
      "Si la zona se anega con lluvias fuertes: conviene visitar el lote después de una tormenta, no solo en un día seco.",
    ],
  },
  financing: {
    title: "Cómo se paga un terreno en Ciudad del Este",
    paragraphs: [
      "Buena parte de los loteamientos se venden en cuotas directas con la loteadora, sin banco de por medio, a veces con entrega inicial y otras veces anunciados como sin entrega. Leé el contrato antes de firmar.",
      "También hay crédito hipotecario de bancos y financieras para terreno, en general con más exigencias sobre el título y la mensura. La tasa, el plazo y la entrega los fija cada entidad, así que conviene consultar antes de reservar.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta un terreno en Ciudad del Este?",
      a: "Depende de la zona, de si ya tiene mensura y fraccionamiento propios, y de qué tan cerca esté del comercio o de la ruta. Arriba mostramos el rango de los lotes publicados hoy, no un promedio de la ciudad.",
    },
    {
      q: "¿Los loteamientos ya tienen título individual?",
      a: "No siempre desde el primer día: algunos lotes se venden mientras la mensura y el fraccionamiento están en trámite ante la Municipalidad. Pedile a la loteadora el estado exacto de esos papeles.",
    },
    {
      q: "¿Qué significa que un lote se venda sin entrega?",
      a: "Que el pago arranca directo en cuotas, sin un pago inicial más alto al firmar. Cuántas cuotas y qué pasa si te atrasás lo fija cada loteadora, así que leé el contrato completo antes de comprometerte.",
    },
    {
      q: "¿Se puede construir en cualquier terreno cerca del embalse?",
      a: "No en todos los casos: parte de la costa está bajo una franja de protección con condiciones propias para edificar. Confirmá esa situación antes de avanzar con la compra.",
    },
    {
      q: "¿Qué hago si todavía no aparece el lote que busco?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y la zona que te interesa. Nuestro equipo te escribe por WhatsApp cuando entra un terreno en Ciudad del Este que encaje.",
    },
  ],
  claimsToVerify: [
    "Ciudad del Este is the capital of the Alto Paraná department and borders Brazil.",
    "A national road connects Ciudad del Este with neighboring localities and onward toward the rest of the country; land along that corridor has seen recent loteamiento growth with commercial activity.",
    "The reservoir (embalse) of the Itaipú binational hydroelectric dam sits next to Ciudad del Este, and the entity that runs the dam maintains a protection strip along the reservoir shore where construction can be restricted.",
    "Some low-lying sectors of Ciudad del Este flood in heavy rain.",
    "The impuesto inmobiliario for land in Ciudad del Este is paid to the Municipalidad de Ciudad del Este.",
    "A fraccionamiento (subdivision) needs an approved mensura plan from the municipality before individual titles can issue; land can be sold while still part of a larger matriz title awaiting that process.",
    "Some loteamientos in the area sell land in monthly installments directly with the loteadora, with or without an upfront 'entrega' payment, as an alternative to bank/financiera mortgage credit for land.",
    "Lots outside the paved network commonly rely on well water and unpaved compañía roads.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching terreno appears in Ciudad del Este.",
  ],
};
