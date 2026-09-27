/**
 * Evergreen page: /venta/capiata/terrenos — "terrenos en venta capiata"
 * (docs/seo-evergreen-keywords.md, table A #38). Land door
 * (terreno.com.py, founder decision S9): loteamientos, mensura,
 * fraccionamiento and servicios, not the generic city-page template.
 */
import type { EvergreenPage } from "./types";

export const ventaCapiataTerrenos: EvergreenPage = {
  path: "/venta/capiata/terrenos",
  door: "terreno",
  keyword: "terrenos en venta capiata",
  secondaryKeywords: ["terrenos baratos en capiata ruta 2"],
  h1: "Terrenos en venta en Capiatá",
  lede: "Capiatá sigue loteándose rápido a los costados de la ruta que va hacia el interior: revisá los precios publicados y dejanos tu búsqueda si todavía no aparece el lote que te sirve.",
  metaDescription:
    "Terrenos en venta en Capiatá: filtrá por precio y zona, mirá los lotes y loteamientos publicados y dejá tu búsqueda para enterarte cuando entre uno nuevo.",
  priceBands: [
    { max: 10_000 },
    { min: 10_001, max: 25_000 },
    { min: 25_001, max: 50_000 },
    { min: 50_001 },
  ],
  barrios: {
    title: "Zonas de Capiatá para comprar un terreno",
    intro:
      "Capiatá tiene una identidad marcada por la ruta que la atraviesa y por sus talleres de muebles, y esa mezcla de comercio y vida de compañía influye directo en lo que vale un lote según dónde esté.",
    items: [
      {
        name: "Sobre la ruta que va hacia el interior",
        text: "El tramo que cruza la ciudad rumbo al interior del país concentra comercios, talleres madereros y loteamientos con salida directa al asfalto. Ahí un lote se paga más caro por metro.",
      },
      {
        name: "Casco urbano de Capiatá",
        text: "Alrededor de la zona céntrica, los lotes vacíos escasean porque buena parte ya está construida entre viviendas y comercios chicos. La mensura suele estar más resuelta, con menos margen de negociación.",
      },
      {
        name: "Compañías alejadas de la ruta",
        text: "Más lejos del asfalto, los lotes rinden más superficie por el mismo presupuesto, con caminos internos de tierra y agua de pozo propio en muchos casos.",
      },
      {
        name: "Barrios linderos con otras ciudades del área metropolitana",
        text: "En los límites con las ciudades vecinas, la mezcla de usos —vivienda, algún depósito, algún taller— puede afectar lo que se puede construir en un lote puntual.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los precios de arriba salen de los lotes publicados hoy en este portal: son pedidos por el vendedor o la loteadora, no cifras de cierre, y varían según la zona y los papeles de cada terreno.",
      "En Capiatá es habitual encontrar loteamientos con precio fijado en guaraníes y plan de cuotas propio, junto con lotes de dueños particulares que suelen publicarse en dólares. El portal ordena por el equivalente en dólares para comparar ambos casos.",
      "Un lote con frente sobre la ruta principal casi siempre cuesta más por metro que uno parecido en una compañía más adentro. Fijate si el precio incluye la mensura propia y los planos aprobados.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un terreno en Capiatá",
    intro:
      "Antes de reservar un lote en Capiatá, conviene tener respuesta para cada uno de estos puntos y no fiarte solo de lo que cuenta el vendedor.",
    items: [
      "Si el lote tiene título separado o si sigue siendo parte de un lote madre pendiente de mensura en esa compañía.",
      "El plano de mensura y fraccionamiento aprobado por la Municipalidad de Capiatá, chequeando que los linderos coincidan con el lote real.",
      "El impuesto inmobiliario al día ante la Municipalidad de Capiatá, con el comprobante correspondiente al último pago.",
      "Qué uso de suelo tiene esa zona, sobre todo si el lote está cerca de talleres o depósitos sobre la ruta principal.",
      "Si esa compañía ya cuenta con cableado eléctrico cerca del lote o si hace falta extenderlo hasta ahí.",
      "De dónde sale el agua en esa compañía —red de la prestadora o pozo propio— y el estado real de la calle de acceso.",
      "Qué cláusula cubre un atraso en el pago si compraste el lote en cuotas con la loteadora.",
    ],
  },
  financing: {
    title: "Cómo se paga un terreno en Capiatá",
    paragraphs: [
      "Muchos loteamientos de Capiatá se venden en cuotas mensuales fijadas por la propia loteadora, con o sin entrega inicial según el plan de cada una. Pedí el contrato completo y no te quedes solo con el folleto de la cuota.",
      "La otra vía es el crédito de un banco o una financiera para terreno, con exigencias sobre el título y la mensura que suelen ser mayores que las de una compra directa en cuotas. Cada entidad fija sus condiciones y estas cambian con el tiempo.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta un terreno en Capiatá?",
      a: "Depende de qué tan cerca esté de la ruta principal y de si ya tiene mensura y fraccionamiento propios. Arriba mostramos el rango de los lotes publicados hoy, no un promedio de la ciudad.",
    },
    {
      q: "¿Los terrenos sobre la ruta principal son más caros?",
      a: "En general sí, porque el frente sobre la ruta suma acceso y visibilidad comercial. Un lote parecido en una compañía más adentro suele costar menos por metro.",
    },
    {
      q: "¿Los loteamientos en Capiatá ya tienen título propio?",
      a: "No siempre desde el inicio: algunos lotes se venden mientras la mensura y el fraccionamiento todavía están en trámite ante la Municipalidad. Pedile a la loteadora el estado exacto de esos papeles.",
    },
    {
      q: "¿Puedo construir cualquier cosa en un lote cerca de un taller?",
      a: "No necesariamente: el uso de suelo de esa zona puede combinar vivienda con actividad comercial o de depósito, y eso condiciona lo que se puede edificar. Confirmalo con la Municipalidad.",
    },
    {
      q: "¿Qué hago si todavía no aparece el lote que busco?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y la zona que te interesa. Nuestro equipo te escribe por WhatsApp cuando entra un terreno en Capiatá que encaje.",
    },
  ],
  claimsToVerify: [
    "Capiatá is a city in the Central department of Paraguay, part of the Área Metropolitana de Asunción.",
    "Capiatá has long been known for woodworking and furniture-making workshops along its main route.",
    "A national road toward the interior of the country runs through Capiatá and is referenced as 'ruta 2' in local search behavior.",
    "The impuesto inmobiliario for land in Capiatá is paid to the Municipalidad de Capiatá.",
    "A fraccionamiento (subdivision) needs an approved mensura plan from the municipality before individual titles can issue; land can be sold while still part of a larger matriz title awaiting that process.",
    "Zoning (uso de suelo) near workshops or warehouses along the main route can differ from purely residential compañías further from it.",
    "Many loteamientos in Capiatá sell land in monthly installments set directly by the loteadora, with or without an upfront 'entrega' payment, as an alternative to bank/financiera mortgage credit for land.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching terreno appears in Capiatá.",
  ],
};
