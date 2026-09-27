/**
 * Evergreen page: /alquiler/lambare/casas — "alquiler de casa en lambare"
 * (170/mo) and its merged variants (docs/seo-evergreen-keywords.md, table A
 * #10).
 *
 * Same shape as the pilot (`venta-luque-casas.ts`); prose written fresh for
 * Lambaré and for renting a house specifically, no sentence reused.
 */
import type { EvergreenPage } from "./types";

export const alquilerLambareCasas: EvergreenPage = {
  path: "/alquiler/lambare/casas",
  door: "inmobiliaria",
  keyword: "alquiler de casa en lambare",
  secondaryKeywords: [
    "casas en alquiler lambare",
    "alquiler de casa 3 dormitorios lambaré",
    "alquiler de casas baratas en lambaré",
    "alquiler de casa en lambaré",
    "casas para alquilar en lambare",
    "alquiler de casa con piscina en lambaré",
    "alquiler de casa independiente en lambare",
    "alquiler de casas economicas en lambare",
  ],
  h1: "Casas en alquiler en Lambaré",
  lede: "Filtrá casas para alquilar en Lambaré por precio y por zona, y dejá tu búsqueda si ninguna de las publicadas hoy encaja con lo que necesitás.",
  metaDescription:
    "Casas en alquiler en Lambaré: filtrá por precio y zona, mirá los avisos activos hoy y dejá tu búsqueda para enterarte de las nuevas.",
  priceBands: [
    { max: 250 },
    { min: 251, max: 400 },
    { min: 401, max: 600 },
    { min: 601 },
  ],
  barrios: {
    title: "Zonas de Lambaré para alquilar una casa",
    intro:
      "Lambaré es chica en superficie pero muy variada en lo que ofrece para quien busca alquilar: la cercanía con Asunción, el río y el crecimiento de los últimos años cambian bastante de una punta a la otra.",
    items: [
      {
        name: "Centro",
        text:
          "Alrededor de la municipalidad, con comercios, farmacias y paradas de colectivo a mano. Hay menos casas independientes en alquiler que departamentos, y las que salen suelen ser construcciones más antiguas con patios chicos.",
      },
      {
        name: "Zona sobre la costanera y el río",
        text:
          "Los barrios más próximos a la ribera del Paraguay tienen la mejor vista y la brisa del río, pero conviene preguntar si la calle o el terreno se inundó alguna vez cuando el río sube: no todos los años pasa, pero cuando pasa afecta justo a esas cuadras.",
      },
      {
        name: "Límite con Asunción",
        text:
          "Las manzanas pegadas a la capital tienen la ventaja de un viaje corto al centro asunceno, así que se alquilan rápido y con menos margen para negociar el precio pedido.",
      },
      {
        name: "Zonas alejadas del centro",
        text:
          "Hacia los límites con las ciudades vecinas las casas tienen patios más grandes y el alquiler pedido baja, a cambio de una calle que no siempre está asfaltada y de un colectivo que pasa con menos frecuencia.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los alquileres publicados",
    paragraphs: [
      "Los montos de arriba salen de lo que pide hoy cada propietario en los avisos activos: no es un precio de cierre ni un promedio de la ciudad, y cambia según entren o salgan casas de la lista.",
      "El portal ordena y filtra los alquileres por su equivalente en dólares aunque el propietario haya puesto el precio en guaraníes, así que conviene convertir tu presupuesto antes de mover el filtro si pensás en guaraníes.",
      "El alquiler pedido no siempre incluye lo mismo: una casa con pileta o recién pintada suele pedir más que una vecina igual de grande sin esos extras, así que conviene comparar casa por casa y no solo por el número.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar una casa en Lambaré",
    intro:
      "Antes de dar una seña o firmar el contrato, conviene tener respuesta para estos puntos:",
    items: [
      "Si la calle o el patio de la casa se inundaron alguna vez cuando subió el río, sobre todo en las cuadras más cercanas a la costanera.",
      "Quién paga la factura de ANDE y quién la de la junta de saneamiento o de ESSAP: en una casa alquilada suele quedar a cargo de quien la habita, pero conviene confirmarlo antes de firmar.",
      "Si la casa tiene pozo ciego o conexión a desagüe cloacal, y en qué estado está.",
      "Si el contrato permite tener mascotas y si pone alguna condición sobre el patio para eso.",
      "Qué garantía pide el propietario para alquilar: un fiador con propiedad propia o una garantía de alquiler contratada con una aseguradora.",
      "Cuánto pide de depósito y de cuántos meses adelantados, y si ese monto se devuelve al terminar el contrato.",
      "El estado de la pileta si el aviso la menciona: quién se encarga de mantenerla y con qué frecuencia.",
      "El trayecto real hasta tu trabajo, hecho en hora pico y no en un horario tranquilo.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en una casa alquilada en Lambaré",
    paragraphs: [
      "Para alquilar una casa en Lambaré, además del primer alquiler suele pedirse un depósito de garantía y, en muchos casos, un fiador con una propiedad a su nombre; algunas inmobiliarias aceptan en su lugar una garantía de alquiler contratada con una aseguradora.",
      "El contrato se firma por un plazo fijado entre las partes, con la posibilidad de renovarlo si ambas están de acuerdo cuando se acerca el vencimiento; conviene leer con cuidado qué pasa si querés dejar la casa antes de esa fecha.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar una casa en Lambaré?",
      a: "Depende de la zona, del tamaño del patio y de si la casa tiene extras como pileta. Arriba mostramos el rango de lo que pide cada propietario en los avisos activos hoy; no publicamos un promedio de la ciudad porque no tenemos datos propios para respaldarlo.",
    },
    {
      q: "¿El alquiler se paga en guaraníes o en dólares?",
      a: "Cada aviso muestra la moneda en que lo publicó el propietario y su equivalente; la moneda en que efectivamente vas a pagar todos los meses se acuerda con él antes de firmar el contrato.",
    },
    {
      q: "¿Qué me van a pedir para alquilar?",
      a: "Como mínimo un depósito de garantía y, casi siempre, un fiador o una garantía de alquiler contratada con una aseguradora. Algunas inmobiliarias además piden tus últimos recibos de sueldo o un comprobante de ingresos.",
    },
    {
      q: "¿Se puede alquilar una casa en Lambaré con mascotas?",
      a: "Depende del propietario: algunos avisos lo permiten y otros no. Conviene preguntarlo antes de visitar la casa para no perder tiempo si la respuesta va a ser negativa.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y lo que necesitás. La recibe nuestro equipo, que te escribe por WhatsApp cuando entra una casa en alquiler en Lambaré que encaje.",
    },
  ],
  claimsToVerify: [
    "Lambaré is on the bank of the Paraguay river and its riverside blocks have flooded in past years when the river rose.",
    "Lambaré borders Asunción directly.",
    "In a rented house in Paraguay, the tenant is customarily responsible for the ANDE electricity bill and the water bill (ESSAP or a junta de saneamiento), unless the listing states otherwise.",
    "Houses can have either sewer (desagüe cloacal) connection or a pozo ciego septic system.",
    "A common rental guarantee structure in Paraguay is either a fiador who owns property, or a garantía de alquiler bought from an insurer, plus a deposit.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house for rent appears.",
  ],
};
