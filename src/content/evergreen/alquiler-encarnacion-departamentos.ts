/**
 * Evergreen page: /alquiler/encarnacion/departamentos — "alquiler de
 * departamentos en encarnación" (70/mo) and its merged variants
 * (docs/seo-evergreen-keywords.md, table A #23).
 *
 * Prose only, no numbers (the page counts those from its own rows); every
 * factual claim is listed in claimsToVerify.
 */
import type { EvergreenPage } from "./types";

export const alquilerEncarnacionDepartamentos: EvergreenPage = {
  path: "/alquiler/encarnacion/departamentos",
  door: "inmobiliaria",
  keyword: "alquiler de departamentos en encarnación",
  secondaryKeywords: [
    "departamentos en alquiler encarnacion",
    "alquiler departamento encarnacion",
    "alquiler de departamentos encarnacion",
    "alquiler de departamento en encarnacion",
    "alquiler de departamentos en encarnacion",
    "alquiler de departamentos en encarnacion paraguay",
    "alquiler departamento en encarnacion paraguay",
  ],
  h1: "Departamentos en alquiler en Encarnación",
  lede: "Filtrá los departamentos en alquiler de Encarnación según lo que podés pagar por mes y dejá cargada tu búsqueda para enterarte de lo nuevo.",
  metaDescription:
    "Departamentos en alquiler en Encarnación: filtrá por precio y zona, mirá lo publicado hoy y dejá tu búsqueda para lo nuevo.",
  priceBands: [
    { max: 250 },
    { min: 251, max: 400 },
    { min: 401, max: 600 },
    { min: 601 },
  ],
  barrios: {
    title: "Zonas de Encarnación para alquilar un departamento",
    intro:
      "Para un departamento en Encarnación pesan la vista, la cercanía a la costanera y si el edificio tiene seguridad y cochera propia, más que el tamaño del patio que sí importa en una casa.",
    items: [
      {
        name: "Edificios frente o cerca de la costanera",
        text: "Son los departamentos que piden el alquiler más alto de la ciudad, en especial los que tienen vista al río. En temporada de verano la demanda sube y conviene reservar con más anticipación que el resto del año.",
      },
      {
        name: "Microcentro",
        text: "Concentra los edificios más antiguos de la ciudad, con trayectos cortos a pie hasta el comercio y los bancos. A cambio, muchos no tienen cochera propia y el auto queda en la calle.",
      },
      {
        name: "Zonas cercanas a la universidad",
        text: "Los departamentos de uno o dos ambientes se alquilan rápido entre estudiantes que llegan de otras ciudades para cursar en Encarnación, sobre todo al inicio del año académico.",
      },
      {
        name: "Cambyretá y barrios de expansión",
        text: "En la ciudad vecina de Cambyretá se construyeron edificios más nuevos con alquileres algo más bajos que los de la costanera, a cambio de un trayecto más largo hasta el microcentro.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los alquileres publicados",
    paragraphs: [
      "Arriba se muestran solamente los departamentos en alquiler publicados hoy en este portal para Encarnación: el valor es el que pide quien alquila, no un contrato cerrado, y varía según se publiquen o se retiren avisos.",
      "Los departamentos con vista a la costanera suelen publicarse en dólares, mientras que en el resto de la ciudad es más frecuente ver el precio en guaraníes. El portal filtra y ordena todo por el equivalente en dólares.",
      "El alquiler del aviso no incluye la expensa: antes de comparar dos departamentos por el mismo precio, fijate cuánto cobra cada edificio de expensa y qué servicios cubre — portería, seguridad, mantenimiento común.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar un departamento en Encarnación",
    intro: "Antes de firmar, conviene resolver estos puntos, sobre todo si el departamento queda cerca de la costanera:",
    items: [
      "Qué incluye la expensa del edificio antes de sumarla al alquiler: portería, seguridad, mantenimiento de las áreas comunes.",
      "Si el edificio tiene cochera propia, algo menos frecuente en los edificios más antiguos del microcentro, donde el auto suele quedar en la calle.",
      "Cómo cambia el movimiento y el ruido en los departamentos cercanos a la costanera durante la temporada de verano.",
      "Si el ascensor funciona sin cortes frecuentes, sobre todo en los edificios más antiguos cerca de la costanera.",
      "Si el contrato permite vivir de a dos o tres, algo común entre estudiantes que llegan a Encarnación solo para cursar.",
      "Qué garantía pide el propietario o la administración del edificio: garante personal o un seguro de alquiler equivalente.",
      "Si el edificio acepta contratos por menos de un año, pensados para quienes cursan solo parte del ciclo académico.",
      "Si hay tanque de reserva de agua en el edificio, un dato a confirmar en las construcciones más viejas del microcentro.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en un departamento alquilado en Encarnación",
    paragraphs: [
      "Además del garante o el seguro de alquiler, en un edificio hay que sumar la expensa al presupuesto mensual desde el primer mes: es parte del costo real de vivir ahí, no un gasto aparte.",
      "Al firmar suele pedirse depósito y el primer mes por adelantado. Si el contrato es por un período corto, como el ciclo de estudio de un año, conviene dejarlo escrito desde el principio para no discutirlo al momento de renovar o de irte.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar un departamento en Encarnación?",
      a: "Depende de si tiene vista a la costanera, del edificio y de la temporada. Arriba mostramos el rango de los departamentos publicados hoy en el portal.",
    },
    {
      q: "¿Los departamentos cerca de la costanera son más caros?",
      a: "Sí, en general, sobre todo los que tienen vista al río y en temporada de verano, cuando sube la demanda.",
    },
    {
      q: "¿Hay departamentos para estudiantes en Encarnación?",
      a: "Sí, sobre todo departamentos chicos cerca de la universidad, que se alquilan rápido al inicio del año académico.",
    },
    {
      q: "¿Piden garante para alquilar un departamento?",
      a: "Sí: casi siempre pide garante el propietario, y si no tiene uno a mano, la administración del edificio suele aceptar un seguro de alquiler en su lugar.",
    },
    {
      q: "¿Qué hago si hoy no hay un departamento que me sirva?",
      a: "Cargá tu búsqueda en el formulario con tu presupuesto mensual y el tipo de departamento que buscás. En cuanto entra uno en Encarnación que se ajuste, te avisamos por WhatsApp.",
    },
  ],
  claimsToVerify: [
    "Encarnación has university presence that draws student renters, especially around the start of the academic year.",
    "Apartments with a view of Encarnación's costanera command higher rents, particularly during the summer season.",
    "Cambyretá is a neighboring municipality with newer apartment buildings than Encarnación's older downtown stock.",
    "Encarnación's microcentro has older buildings, some without their own parking.",
    "Landlords or building-managing agencies in Encarnación commonly require a guarantor or rental-guarantee insurance.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching apartment in Encarnación appears.",
  ],
};
