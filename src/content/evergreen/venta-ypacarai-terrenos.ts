/**
 * Evergreen page: /venta/ypacarai/terrenos — "terreno en ypacarai" (30/mo)
 * and its merged variants (docs/seo-evergreen-keywords.md, table A #34).
 *
 * Land door (terreno.com.py, decision S9): loteamientos vs. a lot bought
 * from a private owner, cuotas sin entrega vs. contado vs. bank credit,
 * título individual vs. a lot still inside an untitled loteamiento,
 * mensura, servicios (ANDE, agua, caminos) and the lake's flood-prone low
 * ground. No numbers; every factual claim is in `claimsToVerify`.
 */
import type { EvergreenPage } from "./types";

export const ventaYpacaraiTerrenos: EvergreenPage = {
  path: "/venta/ypacarai/terrenos",
  door: "terreno",
  keyword: "terreno en ypacarai",
  secondaryKeywords: ["terrenos con vista al lago ypacarai", "terrenos en venta ypacarai"],
  h1: "Terrenos en venta en Ypacaraí",
  lede: "Comparás lotes frente al Lago Ypacaraí, cerca del centro o camino a San Bernardino, filtrás por presupuesto y dejás tu búsqueda para el próximo terreno que aparezca.",
  metaDescription:
    "Terrenos en venta en Ypacaraí: filtrá por precio, mirá los lotes publicados hoy y dejá tu búsqueda para enterarte cuando entre uno con vista al lago.",
  priceBands: [
    { max: 10_000 },
    { min: 10_001, max: 25_000 },
    { min: 25_001, max: 50_000 },
    { min: 50_001 },
  ],
  barrios: {
    title: "Zonas de Ypacaraí para comprar un terreno",
    intro:
      "Ypacaraí se organiza alrededor del lago que le da nombre, y esa cercanía marca casi todo el precio del terreno. Estas son las zonas que más preguntan quienes buscan lote acá.",
    items: [
      {
        name: "La costa del lago",
        text:
          "Los lotes con frente o vista hacia el Lago Ypacaraí son los más pedidos, sobre todo para casa de fin de semana. También son los que exigen más cuidado: parte de esa costa es baja y se anega en años de mucha lluvia, así que conviene preguntar la cota antes de comprar.",
      },
      {
        name: "El centro",
        text:
          "Cerca de la estación y de la plaza, la trama ya está fraccionada desde hace años, con lotes más chicos y servicios instalados. Es la zona con menos superficie disponible pero con menos trámite pendiente.",
      },
      {
        name: "Camino hacia San Bernardino",
        text:
          "Sobre esta dirección, hacia el otro polo turístico del lago, sigue apareciendo oferta de loteamientos nuevos. Los precios suben cuanto más cerca están de San Bernardino, aunque todavía hay tramos con servicios incompletos.",
      },
      {
        name: "Zonas alejadas del lago",
        text:
          "Más lejos de la costa, el lote rinde más por metro pero pierde la vista al agua. Son terrenos pensados más para uso habitual que para casa de fin de semana.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los valores de arriba salen únicamente de los lotes publicados hoy en este portal: son precios pedidos por quien vende, no cierres de operación, y cambian según entren o salgan loteamientos en Ypacaraí.",
      "En Ypacaraí es común encontrar el lote publicado en dólares por una loteadora y también negociado en guaraníes directo con el propietario; el portal ordena todo por el equivalente en dólares para comparar parejo.",
      "La distancia a la costa del lago pesa más en el precio por metro que el tamaño del lote: un terreno chico con vista al agua puede costar más que uno grande tierra adentro.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un terreno en Ypacaraí",
    intro:
      "La cercanía al lago cambia mucho el trámite y el riesgo de un lote en Ypacaraí. Antes de señar, resolvé cada uno de estos puntos:",
    items: [
      "Si el terreno cuenta con título individual o todavía integra un loteamiento en trámite de titulación.",
      "Si el fraccionamiento está aprobado por la Municipalidad de Ypacaraí, con su plano de mensura.",
      "Que la mensura del lote coincida con la superficie y los linderos que anuncia el aviso.",
      "Si el lote frente al lago queda dentro de una zona baja con antecedentes de inundación.",
      "Si el lote ya tiene conexión de ANDE o si, como pasa cerca del lago, hay que gestionarla antes de construir.",
      "Si el agua llega por la red de la junta de saneamiento de la zona o si hay que perforar un pozo propio.",
      "Cómo es el camino de acceso en época de lluvia, sobre todo en los tramos hacia San Bernardino.",
      "Qué exige la Municipalidad de Ypacaraí para habilitar una construcción en ese terreno.",
    ],
  },
  financing: {
    title: "Cómo se paga un terreno en Ypacaraí",
    paragraphs: [
      "En Ypacaraí, con buena parte de la demanda puesta en la casa de fin de semana junto al lago, los loteamientos suelen vender en cuotas y sin entrega inicial. El plazo y el interés cambian de un proyecto a otro, así que conviene pedirlos por escrito antes de comprometerte.",
      "Comprarle a un dueño directo, fuera de un loteamiento, suele significar pagar al contado o pedir un crédito a un banco o financiera; en la página de financiamiento reunimos los programas que conocemos, con la aprobación final a cargo de quien te preste.",
    ],
  },
  faq: [
    {
      q: "¿Vale la pena un terreno con vista al lago en Ypacaraí?",
      a: "Depende de para qué lo quieras: para casa de fin de semana suele ser la zona más buscada, pero cuesta más por metro y conviene revisar si esa parte de la costa se inunda en años de mucha lluvia.",
    },
    {
      q: "¿Los terrenos de Ypacaraí ya tienen título propio?",
      a: "No todos: algunos loteamientos entregan título individual y otros todavía tramitan el fraccionamiento ante la Municipalidad de Ypacaraí. Pedí esa información antes de señar.",
    },
    {
      q: "¿Se puede pagar un terreno en Ypacaraí en cuotas?",
      a: "Sí, es lo habitual en los loteamientos que vende directamente la loteadora. También podés pagar al contado o pedir un crédito a un banco o financiera si preferís esa vía.",
    },
    {
      q: "¿Qué tan lejos queda Ypacaraí de Asunción?",
      a: "El tiempo de viaje depende de la zona exacta del terreno y de la hora del día. Antes de comprar, hacé el recorrido que harías habitualmente para tener una idea real.",
    },
    {
      q: "¿Qué hago si hoy no hay un terreno que me sirva en Ypacaraí?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y si buscás vista al lago. La recibe nuestro equipo, que te escribe por WhatsApp cuando aparece un lote en Ypacaraí que encaje.",
    },
  ],
  claimsToVerify: [
    "Ypacaraí sits on the shore of Lago Ypacaraí.",
    "Part of Ypacaraí's lakeside area is low-lying and has a history of flooding in years of heavy rain.",
    "Ypacaraí's town center, near its train station and plaza, is already subdivided with services installed.",
    "A route connects Ypacaraí toward San Bernardino, another lake-area town popular with visitors.",
    "Land farther from the lake in Ypacaraí is priced lower per square meter than lakefront land.",
    "Land in Ypacaraí loteamientos is commonly sold on installments, often without a large upfront down payment.",
    "A lot's fraccionamiento in Ypacaraí must be approved by the Municipalidad de Ypacaraí, with a mensura plan.",
    "Travel time between Ypacaraí and Asunción varies by area and time of day.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching lot appears.",
  ],
};
