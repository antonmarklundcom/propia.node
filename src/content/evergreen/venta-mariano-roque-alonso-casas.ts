/**
 * Evergreen page: /venta/mariano-roque-alonso/casas — "casas en venta
 * mariano roque alonso" (70/mo) and its merged variant
 * (docs/seo-evergreen-keywords.md, table A #25).
 *
 * Buyer angle (título, escritura, financiamiento) — pairs with
 * alquiler-mariano-roque-alonso-casas.ts (tenant angle); the two differ in
 * substance, not just in operation.
 */
import type { EvergreenPage } from "./types";

export const ventaMarianoRoqueAlonsoCasas: EvergreenPage = {
  path: "/venta/mariano-roque-alonso/casas",
  door: "inmobiliaria",
  keyword: "casas en venta mariano roque alonso",
  secondaryKeywords: ["casa en venta en mariano roque alonso"],
  h1: "Casas en venta en Mariano Roque Alonso",
  lede: "Filtrá por precio, mirá lo publicado hoy en Mariano Roque Alonso y dejá tu búsqueda para que te avisemos cuando entre una casa que encaje.",
  metaDescription:
    "Casas en venta en Mariano Roque Alonso: filtrá por precio, mirá los avisos publicados hoy y dejá tu búsqueda para cuando entre una casa nueva.",
  priceBands: [
    { max: 60_000 },
    { min: 60_001, max: 100_000 },
    { min: 100_001, max: 180_000 },
    { min: 180_001 },
  ],
  barrios: {
    title: "Zonas de Mariano Roque Alonso para comprar una casa",
    intro:
      "El valor de una casa en Mariano Roque Alonso cambia según qué tan cerca está de la ruta, del centro o de la bahía. Antes de tomar un precio como referencia, conviene mirar estas diferencias.",
    items: [
      {
        name: "Centro",
        text:
          "Alrededor de la municipalidad y de la plaza se venden casas más antiguas sobre terrenos ya definidos, muchas con una construcción que pide alguna reforma. Es la zona con más trámites y comercios a mano.",
      },
      {
        name: "Zona costanera",
        text:
          "Las casas más cercanas a la bahía suelen tener terrenos más generosos y una vista poco común en el resto de la ciudad. Confirmá si el lote puntual se anegó alguna vez con crecidas del río, porque eso afecta el uso y la reventa a futuro.",
      },
      {
        name: "Zona sobre la ruta e industrial",
        text:
          "La cercanía a los depósitos y fábricas de la zona hace que muchas casas se compren pensando en alquilarlas después a quien trabaja ahí mismo. El tránsito de camiones es el costo de esa ubicación.",
      },
      {
        name: "Barrios hacia el límite con Luque y Limpio",
        text:
          "Hacia los bordes de la ciudad los terrenos son más grandes y el precio por metro rinde más que en el centro. Los servicios cambian de una calle a otra, así que confirmá agua, calle y desagüe antes de comparar precios.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados en Mariano Roque Alonso",
    paragraphs: [
      "Los números de arriba salen de las casas publicadas hoy en este portal para vender en Mariano Roque Alonso: son precios pedidos por el vendedor, no precios de venta cerrados, y se mueven a medida que entran y salen avisos.",
      "Algunas casas se publican en dólares y otras en guaraníes. Para que puedas comparar, el portal filtra y ordena por el equivalente en dólares; si tenés un presupuesto en guaraníes, convertilo antes de usar los filtros de precio.",
      "En esta ciudad el tamaño del terreno pesa mucho en el precio final: dos casas de superficie construida parecida pueden valer bastante distinto si una tiene un lote más grande.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar una casa en Mariano Roque Alonso",
    intro: "Antes de señar, conviene tener respuesta para cada uno de estos puntos:",
    items: [
      "Que el título de propiedad esté efectivamente a nombre de quien te vende, respaldado por un informe de condiciones de dominio reciente que descarte embargos e hipotecas sobre el inmueble.",
      "Que el impuesto inmobiliario esté al día en la comuna, con el comprobante del último pago a la vista.",
      "Si el lote puntual se anegó alguna vez con una crecida del río, sobre todo en las zonas más cercanas a la bahía.",
      "Si las ampliaciones de la casa tienen planos aprobados por la municipalidad o se hicieron sin ese permiso.",
      "De dónde viene el agua y si la casa tiene conexión a desagüe cloacal o pozo ciego.",
      "El trayecto real hasta tu trabajo, tanto si vas hacia Asunción como si te movés dentro de la ciudad, hecho en el horario en que realmente lo harías todos los días.",
      "Quién hace la escritura y qué honorarios y gastos de transferencia cobra el escribano antes de firmar nada.",
    ],
  },
  financing: {
    title: "Financiar una casa en Mariano Roque Alonso",
    paragraphs: [
      "Hay compras que se pagan al contado y otras con un crédito hipotecario de un banco o una financiera. Algunas entidades ofrecen créditos para primera vivienda con fondos de la Agencia Financiera de Desarrollo (AFD); las condiciones las fija cada entidad y cambian con el tiempo.",
      "La página de financiamiento del portal junta las opciones que conocemos con una estimación de la cuota para que puedas comparar antes de acercarte a un banco. Ahí también se explica que la tasa y el plazo finales los define la entidad que te preste.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta una casa en Mariano Roque Alonso?",
      a: "Sobre todo pesan la distancia a la ruta, a la bahía o al centro, y el tamaño del terreno. El rango de arriba junta las casas publicadas hoy en el portal; no ofrecemos un precio promedio de la ciudad porque no tenemos datos propios para respaldarlo.",
    },
    {
      q: "¿Las casas se venden en dólares o en guaraníes?",
      a: "Las dos cosas. Cada aviso muestra la moneda en que la publicó el vendedor y su equivalente, y la moneda final de la operación se acuerda con el vendedor antes de firmar.",
    },
    {
      q: "¿Qué documentos le pido al vendedor?",
      a: "Al menos el título de propiedad, un informe de condiciones de dominio actualizado y el comprobante de que el impuesto inmobiliario está al día. Si la casa tiene alguna ampliación, pedí también los planos aprobados por la municipalidad, y llevale todo a un escribano de tu confianza antes de señar.",
    },
    {
      q: "¿Se puede comprar una casa en Mariano Roque Alonso con crédito?",
      a: "Sí, algunos bancos y financieras ofrecen crédito hipotecario, y algunas entidades tienen líneas para primera vivienda. En la página de financiamiento del portal reunimos las que conocemos con una estimación de cuota.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva en Mariano Roque Alonso?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y lo que necesitás. La recibe nuestro equipo, que te escribe por WhatsApp cuando aparece una casa en Mariano Roque Alonso que encaje.",
    },
  ],
  claimsToVerify: [
    "Mariano Roque Alonso borders both Asunción and Luque, and fronts the Bahía de Asunción (the bay of the Paraguay river).",
    "Low-lying lots near the bay/river in Mariano Roque Alonso can have a history of flooding (anegamiento) during high water.",
    "Mariano Roque Alonso has significant warehouse/industrial activity due to its highway access, making nearby houses attractive as rentals to workers there.",
    "Mariano Roque Alonso also borders Limpio.",
    "A property sale deed is signed before an escribano público; an 'informe de condiciones de dominio' shows embargos and hipotecas.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house appears in Mariano Roque Alonso.",
  ],
};
