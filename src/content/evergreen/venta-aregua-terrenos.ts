/**
 * Evergreen page: /venta/aregua/terrenos — "terreno en aregua" (110/mo) and
 * its merged variants (docs/seo-evergreen-keywords.md, table A #15).
 *
 * Land door (terreno.com.py, decision S9): loteamientos vs. a lot bought
 * from a private owner, cuotas sin entrega vs. contado vs. bank credit,
 * título individual vs. a lot still inside an untitled loteamiento,
 * mensura, servicios (ANDE, agua, caminos) and the lake's flood-prone low
 * ground. No numbers (the page counts those from its own rows); every
 * factual claim is in `claimsToVerify`.
 */
import type { EvergreenPage } from "./types";

export const ventaAreguaTerrenos: EvergreenPage = {
  path: "/venta/aregua/terrenos",
  door: "terreno",
  keyword: "terreno en aregua",
  secondaryKeywords: [
    "terreno aregua",
    "terrenos a cuotas sin entrega en areguá",
    "loteamientos en areguá",
    "terreno en areguá con vista al lago",
    "terrenos a cuotas en aregua",
    "terrenos a cuotas en areguá",
    "terrenos baratos en aregua",
    "terrenos baratos en areguá",
    "terrenos en aregua a cuotas",
    "terrenos en areguá",
    "terrenos en caacupemi aregua",
    "terrenos en venta aregua",
  ],
  h1: "Terrenos en venta en Areguá",
  lede: "Comparás lotes frente al lago, en las lomas o camino al interior, filtrás por tu presupuesto y dejás tu búsqueda para el próximo terreno que aparezca.",
  metaDescription:
    "Terrenos en venta en Areguá: filtrá por precio, mirá los lotes publicados hoy y dejá tu búsqueda para enterarte cuando entre uno frente al lago.",
  priceBands: [
    { max: 10_000 },
    { min: 10_001, max: 25_000 },
    { min: 25_001, max: 50_000 },
    { min: 50_001 },
  ],
  barrios: {
    title: "Zonas de Areguá para comprar un terreno",
    intro:
      "Areguá se abre entre el lago y las lomas, y esa geografía separa muy bien los precios: no es lo mismo un lote a metros de la costa que uno tierra adentro, camino a Ypacaraí. Estas son las zonas que más preguntan quienes buscan terreno.",
    items: [
      {
        name: "La costa del lago",
        text:
          "Los loteamientos que miran hacia el Lago Ypacaraí son los más buscados por la vista y por el fresco de las tardes. También son los que más conviene revisar antes de comprar: parte de esa costa se anega en años de mucha lluvia, así que preguntá la cota del lote y no lo mires solo en un día seco.",
      },
      {
        name: "El centro y la zona de la alfarería",
        text:
          "Alrededor de la plaza y de los talleres de alfarería que le dieron fama a Areguá, los lotes suelen ser más chicos y ya fraccionados hace tiempo, con calle empedrada o asfaltada y luz cerca. Cuestan más por metro, pero llegan con menos trámite pendiente.",
      },
      {
        name: "Las lomas",
        text:
          "Hacia el interior, el terreno se vuelve más ondulado. Ahí aparecen lotes más grandes y más baratos por metro, pero conviene fijarse en la pendiente: un desnivel fuerte encarece después la construcción y el acceso en época de lluvia.",
      },
      {
        name: "Camino a Ypacaraí y San Bernardino",
        text:
          "Sobre la ruta que conecta Areguá con los pueblos del lago siguen abriéndose loteamientos nuevos, pensados sobre todo para casa de fin de semana. Son tramos donde los servicios todavía se están completando, así que conviene confirmar caso por caso qué llega y qué no.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los valores de arriba salen de los lotes publicados hoy en este portal: son precios pedidos por quien vende, no cierres de operación, y se mueven según entren o salgan loteamientos en Areguá.",
      "En Areguá convive el lote publicado en dólares por una loteadora con el que se pacta directamente en guaraníes con el propietario; el portal ordena todo por su equivalente en dólares para que puedas comparar aunque vengan en monedas distintas.",
      "La vista al lago y la distancia a la costa pesan más en el precio por metro que la superficie total del lote: dos terrenos del mismo tamaño pueden valer muy distinto según qué tan cerca están del agua.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un terreno en Areguá",
    intro:
      "Un lote lindo desde la calle puede esconder trámites o riesgos que no se ven a simple vista. Antes de señar, conviene tener respuesta para cada uno de estos puntos:",
    items: [
      "Si el lote ya tiene título individual o todavía forma parte de un loteamiento en trámite de titulación.",
      "Si el fraccionamiento del loteamiento está aprobado por la Municipalidad de Areguá, con su plano de mensura.",
      "Que los linderos medidos coincidan con la superficie que figura en la publicación.",
      "Si el terreno queda dentro de una zona baja cercana al lago con antecedentes de inundación.",
      "Si la red de ANDE ya pasa frente al lote o si hay que gestionar la conexión antes de construir.",
      "De dónde sale el agua para el lote: red de la junta de saneamiento local o perforación propia.",
      "Cómo es el camino de acceso en época de lluvia, sobre todo en las zonas de lomas.",
      "Qué exige la Municipalidad de Areguá para habilitar una construcción en ese lote en particular.",
    ],
  },
  financing: {
    title: "Cómo se paga un terreno en Areguá",
    paragraphs: [
      "En Areguá, donde buena parte de la oferta son loteamientos de fin de semana con vista al lago, el pago en cuotas y sin entrega inicial es la forma más habitual de vender: se empieza a pagar desde la firma, sin un desembolso grande por adelantado, aunque el plazo y el interés los fija cada loteadora.",
      "También se puede pagar al contado o pedir un crédito a un banco o financiera para comprar el lote; en la página de financiamiento reunimos los programas que conocemos, aunque las condiciones finales las define quien te preste.",
    ],
  },
  faq: [
    {
      q: "¿Qué significa que un terreno se venda sin entrega?",
      a: "Que no se pide un pago inicial grande: empezás a pagar en cuotas desde la firma. Las condiciones exactas las fija cada loteadora, así que conviene pedirlas por escrito antes de comprometerte.",
    },
    {
      q: "¿Los terrenos cerca del lago se inundan en Areguá?",
      a: "Algunas zonas bajas de la costa sí se anegan en años de mucha lluvia. Antes de comprar un lote con vista al lago, preguntá la cota del terreno y si tiene antecedentes de inundación.",
    },
    {
      q: "¿El lote ya tiene título propio?",
      a: "Depende del loteamiento: algunos entregan título individual y otros todavía están en trámite de fraccionamiento ante la Municipalidad de Areguá. Pedí esa información antes de señar, no después.",
    },
    {
      q: "¿Se puede pagar un terreno en Areguá en cuotas?",
      a: "Sí, es lo más común en los loteamientos de la zona. También existe la opción de pagar al contado o de pedir un crédito a un banco o financiera si preferís esa vía.",
    },
    {
      q: "¿Qué hago si hoy no hay un terreno que me sirva en Areguá?",
      a: "Dejá tu búsqueda en el formulario de esta página con lo que buscás y tu presupuesto. La recibe nuestro equipo, que te escribe por WhatsApp cuando aparece un lote en Areguá que encaje.",
    },
  ],
  claimsToVerify: [
    "Areguá sits on the shore of Lago Ypacaraí.",
    "Areguá is known for pottery/ceramics workshops (alfarería) near its town center.",
    "Parts of the lakeside area of Areguá are low-lying and have a history of flooding in years of heavy rain.",
    "Areguá's terrain becomes hillier (lomas) toward its interior, away from the lake.",
    "A route connects Areguá with Ypacaraí and San Bernardino, both nearby lake-area towns.",
    "Land in loteamientos here is commonly sold on installments without a large upfront down payment ('sin entrega'), with terms set by each loteadora.",
    "A lot's fraccionamiento must be approved by the Municipalidad de Areguá, which also sets requirements for building permits.",
    "Water in the area can come from a local junta de saneamiento network or a private well.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching lot appears.",
  ],
};
