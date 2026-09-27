/**
 * Evergreen page: /venta/luque/terrenos — "terrenos en venta luque" (70/mo)
 * and its merged variants, competitor-brand searches excluded
 * (docs/seo-evergreen-keywords.md, table A #21).
 *
 * Land door (terreno.com.py, decision S9). Luque already has a pilot page
 * for houses (/venta/luque/casas, another door) — this page shares no
 * sentence with it and reads Luque's zones from a land buyer's angle:
 * vacant lots inside a growth corridor vs. larger, cheaper, less-serviced
 * lots in the outlying compañías. Land-only content per the brief:
 * loteamientos vs. a lot from a private owner, cuotas sin entrega, título
 * individual vs. an untitled loteamiento, mensura, servicios, terrain.
 */
import type { EvergreenPage } from "./types";

export const ventaLuqueTerrenos: EvergreenPage = {
  path: "/venta/luque/terrenos",
  door: "terreno",
  keyword: "terrenos en venta luque",
  secondaryKeywords: [
    "terrenos a cuotas en luque",
    "venta de terreno en luque",
    "venta de terrenos en luque a cuotas",
    "lotes a cuotas en luque",
    "terreno barato en luque",
    "terreno en luque zona aeropuerto",
    "terrenos a cuotas luque",
    "terrenos baratos en luque",
    "terrenos en luque 4to barrio",
    "terrenos en luque paraguay",
    "terrenos en venta en luque",
    "terrenos en venta en luque paraguay",
    "terrenos en yukyry luque",
    "terrenos en zarate isla luque",
    "vendo terreno en luque",
    "vendo terreno en luque laurelty",
    "venta de terrenos en luque paraguay",
  ],
  h1: "Terrenos en venta en Luque",
  lede: "Filtrás lotes en loteamientos y de dueño directo, desde el corredor de la Conmebol hasta las compañías del interior, y dejás tu búsqueda para el próximo terreno que encaje.",
  metaDescription:
    "Terrenos en venta en Luque: filtrá por precio, mirá los lotes publicados hoy y dejá tu búsqueda para enterarte cuando entre uno nuevo.",
  priceBands: [
    { max: 10_000 },
    { min: 10_001, max: 25_000 },
    { min: 25_001, max: 50_000 },
    { min: 50_001 },
  ],
  barrios: {
    title: "Zonas de Luque para comprar un terreno",
    intro:
      "Para quien busca lote, Luque se lee distinto que para quien busca casa: importa más si el terreno ya está fraccionado, qué tan lejos está del asfalto y si todavía queda superficie sin construir. Estas son las zonas donde más se mueve la oferta de terrenos.",
    items: [
      {
        name: "Corredor de la Conmebol y Ñu Guasu",
        text:
          "El crecimiento edilicio de los últimos años empujó el precio del lote en este corredor: los terrenos vacíos que quedan suelen estar dentro de barrios cerrados o loteamientos ya fraccionados, con poca superficie libre fuera de esos proyectos.",
      },
      {
        name: "Zona del aeropuerto",
        text:
          "Cerca del aeropuerto Silvio Pettirossi hay tanto lotes pensados para vivienda como paños ofrecidos para depósito o actividad logística. Antes de comprar para casa, conviene visitar el lote en un horario con tránsito aéreo activo y no solo un domingo tranquilo.",
      },
      {
        name: "Laurelty, Yukyry y Zárate Isla",
        text:
          "En estas compañías hacia las afueras todavía se consiguen lotes de mayor superficie a menor precio por metro, muchos ofrecidos en loteamientos a cuotas. A cambio, el asfalto y la red de agua no siempre llegan hasta el lote: hay que confirmarlo terreno por terreno.",
      },
      {
        name: "Cuarto Barrio y el centro",
        text:
          "Más cerca del centro histórico, la trama ya está fraccionada desde hace años y los lotes vacíos son escasos: lo que aparece suele ser un remanente entre construcciones ya hechas, con servicios instalados desde antes.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los valores de arriba salen únicamente de los lotes publicados hoy en este portal: son precios pedidos por quien vende, no el cierre de una operación, y cambian según entren o salgan loteamientos en Luque.",
      "Muchos terrenos en Luque se ofrecen en dólares desde una loteadora y otros se negocian en guaraníes directamente con el propietario; el portal filtra y ordena por el equivalente en dólares para que la comparación sea pareja.",
      "En Luque el precio por metro varía mucho según la cercanía al asfalto y a la red de agua: dos lotes de igual superficie pueden costar distinto solo por esa diferencia.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un terreno en Luque",
    intro:
      "En Luque conviene resolver estos puntos antes de señar un lote, sobre todo si todavía no conocés bien la zona:",
    items: [
      "Si el terreno tiene título individual o si todavía es parte de un loteamiento en trámite de titulación.",
      "Si el fraccionamiento fue aprobado por la Municipalidad de Luque, con el plano de mensura correspondiente.",
      "Que la mensura del lote confirme la superficie y los linderos que anuncia el aviso.",
      "Si el lote está dentro de un barrio cerrado, y qué cuota de mantenimiento cobra mientras el terreno sigue vacío.",
      "Si el lote ya cuenta con acceso a la red de ANDE o si, como pasa en varias compañías del interior, la conexión queda pendiente.",
      "El estado del camino de acceso en las compañías más alejadas del centro, sobre todo después de lluvia.",
      "Si el ruido de los aviones, en los lotes cercanos al aeropuerto, es aceptable para el uso que pensás darle.",
      "Qué exige la Municipalidad de Luque para habilitar una construcción en ese terreno.",
    ],
  },
  financing: {
    title: "Cómo se paga un terreno en Luque",
    paragraphs: [
      "En Luque, donde varios loteamientos nacieron para acompañar el crecimiento cerca de la Conmebol y del aeropuerto, la venta en cuotas y sin entrega es la modalidad más común: el plazo, el interés y las demás condiciones cambian de una loteadora a otra, y conviene pedirlas por escrito.",
      "Un lote de dueño directo, en cambio, suele pagarse al contado o con un crédito de banco o financiera; la página de financiamiento reúne los programas que conocemos, con la aprobación final a cargo de quien te preste.",
    ],
  },
  faq: [
    {
      q: "¿Se consiguen terrenos baratos en Luque?",
      a: "Sí, sobre todo en compañías como Laurelty, Yukyry o Zárate Isla, donde el lote es más grande y el precio por metro más bajo que cerca del centro o del corredor de la Conmebol.",
    },
    {
      q: "¿Qué significa comprar un terreno a cuotas sin entrega?",
      a: "Que empezás a pagar en cuotas desde la firma, sin un pago inicial grande. Cada loteadora fija su propio plazo e interés, así que conviene pedirlo por escrito antes de comprometerte.",
    },
    {
      q: "¿Los terrenos cerca del aeropuerto sirven para vivienda?",
      a: "Depende del lote y de cuánto te moleste el ruido de los vuelos. Visitalo en un horario con tránsito aéreo activo antes de decidir, no solo un fin de semana tranquilo.",
    },
    {
      q: "¿El lote ya está fraccionado y titulado?",
      a: "No siempre. Algunos loteamientos entregan título individual y otros todavía tramitan el fraccionamiento ante la Municipalidad de Luque. Pedí esa información antes de señar.",
    },
    {
      q: "¿Qué hago si hoy no hay un terreno que me sirva en Luque?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y la zona que te interesa. La recibe nuestro equipo, que te escribe por WhatsApp cuando aparece un lote en Luque que encaje.",
    },
  ],
  claimsToVerify: [
    "The Silvio Pettirossi international airport is in Luque.",
    "The area near the CONMEBOL headquarters and Ñu Guasu park in Luque has seen recent construction growth, including barrios cerrados and loteamientos.",
    "Laurelty, Yukyry, Zárate Isla and Cuarto Barrio are compañías/barrios of Luque with land for sale.",
    "Land near the airport in Luque is offered for both residential use and logistics/storage use.",
    "Outlying compañías in Luque have larger lots at lower per-meter prices than areas nearer the center or the Conmebol corridor.",
    "Land in Luque loteamientos is commonly sold on installments, often without a large upfront down payment ('sin entrega').",
    "A lot's fraccionamiento in Luque must be approved by the Municipalidad de Luque, with a mensura plan.",
    "Some closed neighborhoods (barrios cerrados) in Luque charge a maintenance fee even on a vacant lot.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching lot appears.",
  ],
};
