/**
 * Evergreen page: /venta/luque/casas — "casas en venta luque" (170/mo) and
 * its merged variants (docs/seo-evergreen-keywords.md, table A #11).
 *
 * The PR 1 pilot, and the model every other content file follows: prose
 * only, no numbers (the page counts those from its own rows), every factual
 * claim listed in `claimsToVerify`.
 */
import type { EvergreenPage } from "./types";

export const ventaLuqueCasas: EvergreenPage = {
  path: "/venta/luque/casas",
  door: "inmobiliaria",
  keyword: "casas en venta luque",
  secondaryKeywords: [
    "casas en venta en luque paraguay",
    "casas en luque",
    "casas baratas en luque",
    "casas economicas en luque",
    "casas en luque venta",
    "casa en venta en luque paraguay",
    "chalet en luque",
  ],
  h1: "Casas en venta en Luque",
  lede: "Filtrá por precio, mirá lo publicado hoy y dejá tu búsqueda para que te avisemos cuando entre una casa que encaje.",
  metaDescription:
    "Casas en venta en Luque: filtrá por precio, mirá los avisos publicados y dejá tu búsqueda para enterarte cuando entre una casa nueva.",
  priceBands: [
    { max: 60_000 },
    { min: 60_001, max: 100_000 },
    { min: 100_001, max: 180_000 },
    { min: 180_001 },
  ],
  barrios: {
    title: "Zonas de Luque y qué esperar de cada una",
    intro:
      "Luque no es una sola ciudad para quien busca casa: la misma plata compra cosas muy distintas según la zona. Estas son las diferencias que más pesan a la hora de elegir.",
    items: [
      {
        name: "Centro",
        text:
          "Alrededor de la plaza y de la municipalidad. Es donde más se ven casas antiguas sobre terrenos amplios, con comercios, bancos y colegios a pocas cuadras. A cambio, el tránsito del centro se siente en las horas pico y muchas casas piden alguna reforma.",
      },
      {
        name: "Zona aeropuerto y autopista",
        text:
          "Los barrios cercanos al aeropuerto Silvio Pettirossi y a la autopista que une Luque con Asunción. Su punto fuerte es la salida rápida hacia la capital. Antes de decidir, visitá la casa en distintos horarios: el ruido de los aviones cambia mucho de una cuadra a otra.",
      },
      {
        name: "Zona Conmebol y Ñu Guasu",
        text:
          "El sector cercano a la sede de la Conmebol y al parque Ñu Guasu, donde se concentra buena parte de la construcción más reciente, incluidos barrios cerrados y condominios. Suele tener casas más nuevas, con expensas cuando están dentro de un barrio cerrado: preguntá el monto y qué cubre antes de comparar precios.",
      },
      {
        name: "Barrios hacia las afueras",
        text:
          "Cuarto Barrio, Laurelty, Yukyry, Zárate Isla, Isla Bogado o Mora Cué, entre otros. Terrenos más grandes y precios que rinden más, pero los servicios cambian de una calle a otra: asfalto, empedrado o tierra, red de agua o pozo, desagüe o pozo ciego. Todo eso se confirma casa por casa, no por barrio.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "Los números de arriba salen solamente de los avisos publicados hoy en este portal: son precios pedidos por el vendedor, no precios de venta cerrados, y cambian a medida que entran y salen casas.",
      "Muchas casas en Luque se publican en dólares y otras en guaraníes. Para que puedas comparar, el portal filtra y ordena por el equivalente en dólares; si buscás con un presupuesto en guaraníes, convertilo antes de usar los filtros de precio.",
      "Cuando compares dos casas, mirá también el tamaño del terreno y no solo los metros construidos: en Luque es común que una parte grande del valor esté en el lote.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar una casa en Luque",
    intro:
      "Una visita y una charla con el vendedor no alcanzan. Antes de señar, conviene tener respuesta para cada uno de estos puntos:",
    items: [
      "El título de propiedad a nombre de quien vende, y un informe de condiciones de dominio que confirme que no hay embargos, hipotecas ni otras restricciones.",
      "El impuesto inmobiliario al día en la Municipalidad de Luque, con el comprobante del último pago.",
      "Si las ampliaciones (quinchos, piezas, garajes) tienen planos aprobados por la municipalidad o se hicieron sin permiso.",
      "De dónde viene el agua — red pública, junta de saneamiento o pozo propio — y cómo es la presión en horas de mucho uso.",
      "Si la casa tiene conexión a desagüe cloacal o pozo ciego, y en qué estado está.",
      "Cómo se comporta la calle con lluvia fuerte: una visita después de una tormenta dice más que cualquier descripción.",
      "El trayecto real hasta tu trabajo o el colegio, hecho en hora pico y no un domingo.",
      "Quién va a hacer la escritura: la firma la hace un escribano público, y sus honorarios y los gastos de transferencia conviene conocerlos de antemano.",
    ],
  },
  financing: {
    title: "Financiar una casa en Luque",
    paragraphs: [
      "Hay compras que se pagan al contado y otras con crédito hipotecario de un banco o una financiera. Algunas entidades ofrecen créditos para primera vivienda con fondos de la Agencia Financiera de Desarrollo (AFD); las condiciones las fija cada entidad y cambian con el tiempo.",
      "En la página de financiamiento reunimos los programas que conocemos y una estimación de la cuota mensual para comparar. Es una referencia para planificar, no una aprobación: la tasa, el plazo y el monto final los define la entidad que te preste.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta una casa en Luque?",
      a: "Depende sobre todo de la zona, del tamaño del terreno y del estado de la casa. Arriba mostramos el rango de precios de las casas publicadas hoy en el portal; no publicamos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿Las casas se venden en dólares o en guaraníes?",
      a: "Las dos cosas. Cada aviso muestra la moneda en que la publicó el vendedor y su equivalente, y la moneda de la operación se acuerda con el vendedor antes de firmar.",
    },
    {
      q: "¿Qué documentos le pido al vendedor?",
      a: "Como mínimo el título de propiedad, un informe de condiciones de dominio reciente, el impuesto inmobiliario al día y, si la casa tiene ampliaciones, sus planos aprobados. Un escribano de tu confianza puede revisarlos antes de que señes.",
    },
    {
      q: "¿Luque queda lejos de Asunción?",
      a: "Luque limita con Asunción, pero el tiempo de viaje depende mucho de la zona y de la hora. Antes de decidir, hacé el trayecto que vas a hacer todos los días en el horario en que lo vas a hacer.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y lo que necesitás. La recibe nuestro equipo, que te escribe por WhatsApp cuando aparece una casa en Luque que encaje.",
    },
  ],
  claimsToVerify: [
    "The Silvio Pettirossi international airport is in Luque.",
    "An autopista links Luque with Asunción (named in the text only as 'la autopista que une Luque con Asunción').",
    "The CONMEBOL headquarters and the Ñu Guasu park are in / next to Luque, and recent construction including barrios cerrados and condominios concentrates in that sector.",
    "Cuarto Barrio, Laurelty, Yukyry, Zárate Isla, Isla Bogado and Mora Cué are barrios/compañías of Luque.",
    "The centro of Luque has many older houses on larger lots, with commerce, banks and schools nearby.",
    "Outer barrios have larger lots and cheaper prices; services (asphalt, water network, sewage) vary street by street.",
    "Many houses in Luque are listed in USD and others in PYG; a large part of a house's value is often in the lot.",
    "The impuesto inmobiliario is paid to the Municipalidad de Luque; extensions need municipally approved plans.",
    "Water can come from the public network (ESSAP), a junta de saneamiento or a private well; houses have either sewer connection or pozo ciego.",
    "A property sale deed is signed before an escribano público; an 'informe de condiciones de dominio' shows embargos and hipotecas.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Luque borders Asunción.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house appears.",
  ],
};
