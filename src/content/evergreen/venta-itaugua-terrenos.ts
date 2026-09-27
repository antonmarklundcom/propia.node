/**
 * Evergreen page: /venta/itaugua/terrenos — "terreno en itaugua" (50/mo) and
 * its merged variants (docs/seo-evergreen-keywords.md, table A #30).
 *
 * Land door (terreno.com.py, decision S9): loteamientos vs. a lot bought
 * from a private owner, cuotas sin entrega vs. contado vs. bank credit,
 * título individual vs. a lot still inside an untitled loteamiento,
 * mensura, servicios (ANDE, agua, caminos) and the ruta-frontage zoning
 * question. No numbers; every factual claim is in `claimsToVerify`.
 */
import type { EvergreenPage } from "./types";

export const ventaItauguaTerrenos: EvergreenPage = {
  path: "/venta/itaugua/terrenos",
  door: "terreno",
  keyword: "terreno en itaugua",
  secondaryKeywords: ["lotes en itaugua", "terrenos en venta itaugua"],
  h1: "Terrenos en venta en Itauguá",
  lede: "Elegís entre lotes sobre la Ruta Mariscal Estigarribia, cerca del centro artesanal o hacia las compañías del interior, y dejás tu búsqueda para el próximo terreno que aparezca.",
  metaDescription:
    "Terrenos en venta en Itauguá: filtrá por precio, mirá los lotes publicados hoy y dejá tu búsqueda para enterarte cuando entre un terreno nuevo.",
  priceBands: [
    { max: 10_000 },
    { min: 10_001, max: 25_000 },
    { min: 25_001, max: 50_000 },
    { min: 50_001 },
  ],
  barrios: {
    title: "Zonas de Itauguá para comprar un terreno",
    intro:
      "En Itauguá el precio del lote cambia mucho según qué tan cerca está de la ruta y del centro artesanal, o qué tan adentro está en las compañías más rurales. Estas son las diferencias que más importan a la hora de elegir.",
    items: [
      {
        name: "Sobre la Ruta Mariscal Estigarribia",
        text:
          "Los lotes con frente sobre la ruta que atraviesa Itauguá se cotizan más por la salida directa hacia Asunción y hacia el interior. Muchos ya tienen uso comercial o mixto, así que conviene confirmar qué se puede construir antes de comprar pensando solo en vivienda.",
      },
      {
        name: "El centro y la zona artesanal",
        text:
          "Alrededor de la plaza y de los talleres de ñandutí que hicieron conocida a la ciudad, la trama ya está fraccionada y los lotes son más chicos, con calle y luz instaladas desde hace tiempo.",
      },
      {
        name: "Compañías hacia el interior",
        text:
          "Alejándose de la ruta aparecen lotes de mayor superficie, muchos todavía con uso de quinta o cultivo. Rinden más por metro, pero conviene revisar si llega la red de agua o si hay que perforar.",
      },
      {
        name: "Camino hacia Itá y Guarambaré",
        text:
          "Sobre esta dirección siguen abriéndose loteamientos nuevos, con precios más bajos que los del centro pero con servicios todavía incompletos en varios tramos.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los números de arriba salen exclusivamente de los lotes publicados hoy en este portal: son precios pedidos por quien vende, no cierres de operación, y varían según entren o salgan loteamientos en Itauguá.",
      "Buena parte de la oferta se publica en guaraníes, sobre todo la que viene directo de una loteadora local; el portal convierte todo al equivalente en dólares para que puedas comparar sin hacer la cuenta a mano.",
      "El frente sobre la Ruta Mariscal Estigarribia pesa más en el precio por metro que la superficie total: dos lotes del mismo tamaño valen distinto según qué tan cerca están del asfalto.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un terreno en Itauguá",
    intro:
      "Un lote sobre la ruta se ve distinto a uno en una compañía del interior. Antes de señar en Itauguá, conviene tener respuesta para cada uno de estos puntos:",
    items: [
      "Si el terreno tiene título individual o todavía forma parte de un loteamiento en trámite de titulación.",
      "Si el fraccionamiento está aprobado por la Municipalidad de Itauguá, con su plano de mensura.",
      "Que una mensura reciente confirme la superficie y los linderos que anuncia la publicación.",
      "Si el lote tiene frente sobre la ruta, qué usos permite la normativa municipal además de vivienda.",
      "Si la luz de ANDE llega hasta el lote o si, en los tramos más alejados de la ruta, todavía hay que extender la línea.",
      "De dónde sale el agua en las compañías más alejadas de la ruta: red de la junta de saneamiento o perforación propia.",
      "Cómo es el camino de acceso en época de lluvia, sobre todo en los tramos hacia el interior.",
      "Qué exige la Municipalidad de Itauguá para habilitar una construcción en ese terreno.",
    ],
  },
  financing: {
    title: "Cómo se paga un terreno en Itauguá",
    paragraphs: [
      "En Itauguá, sobre todo en los loteamientos que se abren camino a Itá y Guarambaré, el pago en cuotas directo con la loteadora es la forma más habitual de vender un lote, muchas veces sin una entrega inicial grande. Cada loteadora fija su propio plazo e interés.",
      "Comprarle a un propietario directo, sin loteadora de por medio, suele implicar pagar al contado o gestionar un crédito con un banco o financiera; la página de financiamiento reúne lo que conocemos, aunque la última palabra la tiene quien te preste.",
    ],
  },
  faq: [
    {
      q: "¿Por qué hay lotes más baratos lejos de la ruta en Itauguá?",
      a: "Porque se alejan del frente comercial y de los servicios ya instalados. Son lotes más grandes por el mismo dinero, pero conviene confirmar si llega agua y luz antes de comprar.",
    },
    {
      q: "¿Los terrenos sobre la ruta sirven para casa?",
      a: "Depende del lote y de la normativa municipal: algunos frentes están pensados para uso comercial o mixto. Preguntá en la Municipalidad de Itauguá qué se puede construir antes de decidir.",
    },
    {
      q: "¿El terreno ya tiene título propio?",
      a: "No siempre: algunos loteamientos entregan título individual y otros todavía tramitan el fraccionamiento. Pedí esa información al vendedor antes de señar.",
    },
    {
      q: "¿Se puede pagar un terreno en Itauguá en cuotas?",
      a: "Sí, es habitual en los loteamientos que se venden directo con la loteadora. También existe la opción de pagar al contado o pedir un crédito a un banco o financiera.",
    },
    {
      q: "¿Qué hago si hoy no hay un terreno que me sirva en Itauguá?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y la zona que preferís. La recibe nuestro equipo, que te escribe por WhatsApp cuando aparece un lote en Itauguá que encaje.",
    },
  ],
  claimsToVerify: [
    "Itauguá is known nationally as a center of ñandutí lace craftsmanship, with workshops near its town center.",
    "The Ruta Mariscal Estigarribia (Ruta 2) passes through Itauguá.",
    "Land with frontage on that route in Itauguá has commercial or mixed-use zoning in parts, not only residential.",
    "Outer compañías of Itauguá have land still used for quintas/cultivo, with larger and cheaper-per-meter lots.",
    "A route connects Itauguá toward Itá and Guarambaré, both nearby towns.",
    "Land in Itauguá loteamientos is commonly sold on installments, often without a large upfront down payment.",
    "A lot's fraccionamiento in Itauguá must be approved by the Municipalidad de Itauguá, with a mensura plan.",
    "Water in outlying compañías of Itauguá can come from a junta de saneamiento network or a private well.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching lot appears.",
  ],
};
