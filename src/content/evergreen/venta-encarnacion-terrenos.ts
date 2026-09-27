/**
 * Evergreen page: /venta/encarnacion/terrenos — "terrenos en venta
 * encarnacion" (docs/seo-evergreen-keywords.md, table A #36). Land door
 * (terreno.com.py, founder decision S9): loteamientos, mensura,
 * fraccionamiento and servicios, not the generic city-page template.
 */
import type { EvergreenPage } from "./types";

export const ventaEncarnacionTerrenos: EvergreenPage = {
  path: "/venta/encarnacion/terrenos",
  door: "terreno",
  keyword: "terrenos en venta encarnacion",
  secondaryKeywords: [
    "terrenos en venta en encarnacion paraguay",
    "terrenos en venta encarnacion paraguay",
    "venta de terrenos en encarnacion paraguay",
  ],
  h1: "Terrenos en venta en Encarnación",
  lede: "En Encarnación un lote sobre la Costanera no se compara con uno del interior de la ciudad: usá los filtros de precio para separar ambos mundos antes de escribirle al vendedor.",
  metaDescription:
    "Terrenos en venta en Encarnación: filtrá por precio y zona, mirá los lotes publicados hoy y dejá tu búsqueda para enterarte cuando entre uno nuevo.",
  priceBands: [
    { max: 20_000 },
    { min: 20_001, max: 50_000 },
    { min: 50_001, max: 100_000 },
    { min: 100_001 },
  ],
  barrios: {
    title: "Zonas de Encarnación para comprar un terreno",
    intro:
      "Encarnación cambió de forma después de las obras de la represa que está río arriba, y esa historia todavía se nota en el precio de un lote según en qué parte de la ciudad esté.",
    items: [
      {
        name: "Costanera y zona reurbanizada",
        text: "La franja frente al río que se rehízo tras la crecida del embalse es hoy la parte con más movimiento turístico y de inversión. Confirmá si queda alguna condición especial ligada a esa reurbanización.",
      },
      {
        name: "Casco céntrico",
        text: "Alrededor de la zona comercial tradicional, los lotes vacíos escasean porque casi todo ya está construido. Lo que sale a la venta suele tener la mensura bien definida, con menos margen para negociar precio.",
      },
      {
        name: "Cerca del puente internacional",
        text: "El sector próximo al cruce hacia la orilla argentina recibe tránsito constante y demanda de quienes cruzan seguido. Eso empuja el precio del metro comparado con barrios similares más alejados del cruce.",
      },
      {
        name: "Barrios hacia el interior de la ciudad",
        text: "Más lejos del río, los lotes rinden más superficie por el mismo presupuesto, con carácter todavía mixto entre lo urbano y lo rural.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los precios de arriba salen de los lotes publicados hoy en este portal: son pedidos por el vendedor, no cifras de cierre, y cambian según la zona y la documentación de cada terreno.",
      "En Encarnación conviven anuncios en dólares y en guaraníes, y una parte de la demanda llega desde el otro lado del puente internacional. El portal ordena y filtra por el equivalente en dólares para comparar todos los casos.",
      "Un lote frente a la Costanera o cerca del cruce internacional suele costar mucho más por metro que uno equivalente pero alejado del río. Fijate si el precio incluye mensura y planos aprobados.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un terreno en Encarnación",
    intro:
      "Un lote con buena vista puede tener papeles pendientes o condiciones especiales por la historia reciente de la ciudad. Repasá esto antes de reservar.",
    items: [
      "Si el título del lote ya salió a nombre propio o si continúa unido a una matriz mayor sin fraccionar.",
      "El plano de mensura y fraccionamiento aprobado por la Municipalidad de Encarnación, comparando linderos con lo que efectivamente ves en el terreno.",
      "El impuesto inmobiliario al día en la Municipalidad de Encarnación, con el recibo del último pago en mano.",
      "Si el lote ya tiene conexión eléctrica cercana o si falta gestionar la extensión de la red hasta ahí.",
      "De dónde proviene el agua del lote —red de la prestadora local o pozo propio— y cómo llega el camino de acceso hasta ahí.",
      "Si el lote está dentro de alguna franja con condiciones especiales de construcción por su cercanía al río y a la reurbanización posterior a la represa.",
      "Cómo queda redactado el compromiso de compraventa si el pago es en cuotas, incluido qué pasa ante un atraso.",
    ],
  },
  financing: {
    title: "Cómo se paga un terreno en Encarnación",
    paragraphs: [
      "Muchos loteamientos de la zona ofrecen su propio plan de cuotas, a veces con entrega inicial y otras veces anunciados como sin entrega. Pedí el contrato completo y confirmá qué pasa si te atrasás.",
      "También hay opción de crédito hipotecario para comprar terreno, generalmente con exigencias sobre el título y la mensura más estrictas que una compra en cuotas directa con la loteadora. Cada entidad fija su propia tasa y plazo.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta un terreno en Encarnación?",
      a: "Depende de qué tan cerca esté del río, del puente internacional o de la mensura ya resuelta. Arriba mostramos el rango de los lotes publicados hoy, no un promedio de la ciudad.",
    },
    {
      q: "¿Los terrenos cerca de la Costanera tienen restricciones para construir?",
      a: "Algunos sectores reurbanizados tras la crecida del embalse pueden tener condiciones especiales de edificación. Confirmá esa situación con la Municipalidad antes de avanzar con la compra.",
    },
    {
      q: "¿Se puede pagar un terreno en cuotas en Encarnación?",
      a: "Sí, es habitual con loteamientos que ofrecen su propio plan, con o sin entrega inicial según cada proyecto. Leé el contrato completo, porque las condiciones cambian de una loteadora a otra.",
    },
    {
      q: "¿Los precios cambian según si el comprador viene de Argentina?",
      a: "La cercanía con el otro lado del puente mueve una parte de la demanda y puede influir en el precio de algunos lotes bien ubicados. No es una regla fija: comparalo caso por caso.",
    },
    {
      q: "¿Qué hago si todavía no aparece el lote que busco?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y la zona que te interesa. Nuestro equipo te escribe por WhatsApp cuando entra un terreno en Encarnación que encaje.",
    },
  ],
  claimsToVerify: [
    "Encarnación is the capital of the Itapúa department and sits on the Paraná river, across from Posadas, Argentina, connected by an international bridge.",
    "After the Yacyretá dam raised the reservoir's water level, Encarnación built a new Costanera (waterfront) and reurbanized areas affected by that flooding.",
    "Some land near the reurbanized waterfront may carry building conditions tied to that post-dam reurbanization.",
    "Encarnación receives cross-border demand and traffic from Posadas, Argentina, via the international bridge, which can influence prices in well-located sectors.",
    "The impuesto inmobiliario for land in Encarnación is paid to the Municipalidad de Encarnación.",
    "A fraccionamiento (subdivision) needs an approved mensura plan from the municipality before individual titles can issue; land can be sold while still part of a larger matriz title awaiting that process.",
    "Some loteamientos in the area sell land in installments directly with the loteadora, with or without an upfront 'entrega' payment, as an alternative to bank/financiera mortgage credit for land.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching terreno appears in Encarnación.",
  ],
};
