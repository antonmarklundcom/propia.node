/**
 * Evergreen page: /venta/limpio/terrenos — "terrenos en venta limpio"
 * (docs/seo-evergreen-keywords.md, table A #35). Land door
 * (terreno.com.py, founder decision S9): loteamientos, mensura,
 * fraccionamiento and servicios, not the generic city-page template.
 */
import type { EvergreenPage } from "./types";

export const ventaLimpioTerrenos: EvergreenPage = {
  path: "/venta/limpio/terrenos",
  door: "terreno",
  keyword: "terrenos en venta limpio",
  secondaryKeywords: [
    "terrenos a cuotas en limpio",
    "terrenos a cuotas limpio",
    "terrenos en limpio paraguay",
    "venta de terreno en limpio",
  ],
  h1: "Terrenos en venta en Limpio",
  lede: "Entre la salida hacia el Chaco y los barrios linderos con Luque, un lote en Limpio vale muy distinto según qué tan lejos esté del asfalto: usá los filtros de precio antes de ir a mirarlo.",
  metaDescription:
    "Terrenos en venta en Limpio: filtrá por precio, mirá los lotes y loteamientos publicados y dejá tu búsqueda para enterarte cuando entre uno nuevo.",
  priceBands: [
    { max: 10_000 },
    { min: 10_001, max: 25_000 },
    { min: 25_001, max: 50_000 },
    { min: 50_001 },
  ],
  barrios: {
    title: "Zonas de Limpio para comprar un terreno",
    intro:
      "Limpio crece pegado a la ruta que sale de Asunción y a los barrios que comparte con sus ciudades vecinas, y eso marca la diferencia de precio de un lote más que cualquier otra cosa.",
    items: [
      {
        name: "Sobre la ruta que sale hacia el Chaco",
        text: "El tramo que atraviesa Limpio rumbo al Chaco concentra comercios, depósitos y loteamientos con salida directa al asfalto. Es la zona donde un lote se paga más caro por metro.",
      },
      {
        name: "Barrios que lindan con Luque",
        text: "El sector que limita con Luque se benefició del crecimiento que trajo el área metropolitana en los últimos años. Los lotes acá suelen tener la mensura mejor definida por estar en zonas loteadas hace más tiempo.",
      },
      {
        name: "Compañías del interior de Limpio",
        text: "Alejándose del asfalto, los lotes rinden más superficie por el mismo presupuesto, con caminos internos de tierra y agua de pozo propio en muchos casos.",
      },
      {
        name: "Zonas bajas cerca de arroyos",
        text: "Algunos sectores de Limpio están cerca de cursos de agua que se desbordan con lluvias fuertes. Preguntá por el historial de esa manzana puntual, no solo por el estado del lote en un día seco.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los precios de arriba salen de los lotes publicados hoy en este portal: son pedidos por el vendedor o la loteadora, no cifras ya cerradas, y varían según la zona y los papeles de cada terreno.",
      "En Limpio son comunes los loteamientos con plan de cuotas fijado en guaraníes por la propia loteadora, además de lotes de dueños particulares que suelen publicarse en dólares. El portal ordena por el equivalente en dólares para comparar ambos casos.",
      "Un lote sin mensura propia todavía, dentro de un loteamiento en trámite, casi siempre cuesta menos por metro que uno ya individualizado con los servicios llegando.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un terreno en Limpio",
    intro:
      "Antes de reservar un lote en Limpio, conviene tener respuesta para cada uno de estos puntos y no fiarte solo de lo que cuenta el vendedor.",
    items: [
      "Si el lote ya cuenta con título propio o todavía depende de una matriz sin subdividir en Limpio.",
      "El plano de mensura y fraccionamiento aprobado por la Municipalidad de Limpio, revisando que los linderos coincidan con la realidad del lote.",
      "El impuesto inmobiliario pagado al día en la Municipalidad de Limpio, con comprobante del último pago a la vista.",
      "Si el tendido eléctrico ya alcanza ese lote puntual o si la extensión corre por cuenta del comprador.",
      "De dónde sale el agua en esa compañía puntual —red de la prestadora o pozo propio— y qué tan transitable es el camino de acceso.",
      "Si la manzana tiene antecedentes de anegarse con lluvias fuertes, sobre todo si el lote está cerca de un arroyo.",
      "Cómo queda redactado el contrato si el pago es en cuotas con la loteadora, incluido qué pasa ante un atraso.",
    ],
  },
  financing: {
    title: "Cómo se paga un terreno en Limpio",
    paragraphs: [
      "La mayoría de los loteamientos de Limpio se venden en cuotas mensuales fijadas por la loteadora, con o sin entrega inicial según el plan que ofrezca cada una. Pedí el contrato completo y no solo el folleto con el precio de la cuota.",
      "Otra vía es el crédito de un banco o una financiera para comprar terreno, con exigencias sobre el título y la mensura más estrictas que una compra directa en cuotas. Cada entidad fija sus propias condiciones y estas cambian con el tiempo.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta un terreno en Limpio?",
      a: "Depende de qué tan cerca esté de la ruta y de si ya tiene mensura y fraccionamiento propios. Arriba mostramos el rango de los lotes publicados hoy, no un promedio de la ciudad.",
    },
    {
      q: "¿Los terrenos a cuotas en Limpio tienen título propio?",
      a: "No siempre de entrada: muchos loteamientos venden antes de que la mensura y el fraccionamiento terminen su trámite ante la Municipalidad. Pedile a la loteadora el estado exacto de esos papeles.",
    },
    {
      q: "¿Qué pasa si me atraso con una cuota?",
      a: "Depende del contrato de cada loteadora: algunas dan un margen y otras cobran recargo o pueden rescindir el compromiso. Leé esa cláusula antes de firmar cualquier reserva.",
    },
    {
      q: "¿Se puede construir apenas se compra el lote?",
      a: "Depende del uso de suelo de esa zona y de si ya contás con el permiso de construcción de la Municipalidad de Limpio. Consultalo antes de comprometerte.",
    },
    {
      q: "¿Qué hago si todavía no aparece el lote que busco?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y la zona que te interesa. Nuestro equipo te escribe por WhatsApp cuando entra un terreno en Limpio que encaje.",
    },
  ],
  claimsToVerify: [
    "Limpio is a city in the Central department of Paraguay, part of the Área Metropolitana de Asunción, and borders Luque.",
    "A road out of Asunción toward the Chaco runs through Limpio and is a commercial corridor with warehouses and businesses.",
    "Some sectors of Limpio near streams (arroyos) flood in heavy rain.",
    "The impuesto inmobiliario for land in Limpio is paid to the Municipalidad de Limpio.",
    "A fraccionamiento (subdivision) needs an approved mensura plan from the municipality before individual titles can issue; land can be sold while still part of a larger matriz title awaiting that process.",
    "Many loteamientos in Limpio sell land in monthly installments set directly by the loteadora, with or without an upfront 'entrega' payment, as an alternative to bank/financiera mortgage credit for land.",
    "Building on a lot requires municipal zoning compliance (uso de suelo) and a permiso de construcción, and lots away from the paved network commonly rely on well water and unpaved compañía roads.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching terreno appears in Limpio.",
  ],
};
