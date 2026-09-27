/**
 * Evergreen page: /alquiler/encarnacion/casas — "casas en alquiler
 * encarnacion" (70/mo), no smaller merged variants
 * (docs/seo-evergreen-keywords.md, table A #27).
 *
 * Prose only, no numbers (the page counts those from its own rows); every
 * factual claim is listed in claimsToVerify.
 */
import type { EvergreenPage } from "./types";

export const alquilerEncarnacionCasas: EvergreenPage = {
  path: "/alquiler/encarnacion/casas",
  door: "inmobiliaria",
  keyword: "casas en alquiler encarnacion",
  secondaryKeywords: [],
  h1: "Casas en alquiler en Encarnación",
  lede: "Recorré las casas en alquiler de Encarnación por precio mensual y por zona, y anotá tu búsqueda si hoy no hay ninguna que se acomode a lo que necesitás.",
  metaDescription:
    "Casas en alquiler en Encarnación: filtrá por precio mensual, mirá lo publicado hoy y dejá tu búsqueda para enterarte de lo nuevo.",
  priceBands: [
    { max: 250 },
    { min: 251, max: 400 },
    { min: 401, max: 600 },
    { min: 601 },
  ],
  barrios: {
    title: "Zonas de Encarnación para alquilar una casa",
    intro:
      "En Encarnación buena parte del valor de un alquiler depende de qué tan cerca esté de la costanera y de si el barrio es de los más tradicionales o de los que crecieron después de la reconstrucción de la ciudad.",
    items: [
      {
        name: "Zona de la costanera",
        text: "Es el área renovada tras la reconstrucción que trajo la represa de Yacyretá, con playas artificiales sobre el río. Las casas cerca de la costanera suelen pedir un alquiler más alto que el resto de la ciudad, sobre todo en temporada de verano.",
      },
      {
        name: "Microcentro",
        text: "Concentra el comercio, los bancos y buena parte de las oficinas de la ciudad. Alquilar una casa ahí significa trayectos cortos a pie, pero también más tránsito y menos lugar para estacionar en la calle.",
      },
      {
        name: "Barrios más tradicionales, alejados de la costanera",
        text: "Son barrios más antiguos, con casas de patios grandes y alquileres más accesibles que la zona de la costanera. A cambio, conviene calcular bien el trayecto diario hasta el centro o el trabajo.",
      },
      {
        name: "Cambyretá y las zonas de expansión",
        text: "La ciudad vecina de Cambyretá funciona en la práctica como una extensión de Encarnación hacia la ruta que conecta con la capital, con casas más nuevas y terrenos algo más grandes por un alquiler similar.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los alquileres publicados",
    paragraphs: [
      "Arriba se cuentan únicamente las casas en alquiler publicadas hoy en este portal para Encarnación. El monto es el que pide el propietario, no un contrato firmado, y cambia cada vez que entra o sale una casa de la lista.",
      "En Encarnación es habitual encontrar el alquiler publicado tanto en guaraníes como en dólares, en especial en las casas cercanas a la costanera. El portal ordena y filtra todo por el equivalente en dólares: ajustá tu presupuesto a esa moneda antes de mover los controles de precio.",
      "El precio del aviso no suele incluir ANDE, agua ni, si corresponde, la expensa de un barrio cerrado: preguntá esos gastos aparte antes de fijarte solo en el número del alquiler.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar una casa en Encarnación",
    intro: "Una casa en esta ciudad se firma más tranquilo si ya tenés resueltos estos puntos:",
    items: [
      "Qué exige el propietario como garantía: un garante conocido o un seguro de alquiler, y qué papeles pide para cada camino.",
      "En qué condiciones se devuelve el depósito al final del contrato, y qué se considera desgaste normal frente a un daño que sí se descuenta.",
      "Si la casa queda cerca de la costanera, cómo cambia el movimiento de gente y de tránsito en temporada de verano frente al resto del año.",
      "El estado de la calle y del desagüe pluvial en los barrios más alejados de la costanera, sobre todo después de una lluvia fuerte.",
      "Si la casa tiene conexión a la red cloacal o pozo ciego, y en qué estado está.",
      "Cuánto cambia el tránsito hacia el centro en los meses de mayor turismo, si la casa queda sobre una de las rutas de acceso a la costanera.",
      "En las casas de patio grande, quién corta el pasto y hace arreglos chicos durante el contrato: conviene acordarlo por escrito antes de firmar.",
      "La duración del contrato y las condiciones para renovarlo antes de que termine la temporada.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en una casa alquilada en Encarnación",
    paragraphs: [
      "La mayoría de los propietarios en Encarnación pide un garante propio o, como alternativa, un seguro de alquiler. Antes de salir a ver casas conviene tener resuelto cuál de las dos opciones vas a poder ofrecer.",
      "Al firmar el contrato suele pedirse un depósito y el primer mes de alquiler por adelantado. Los gastos de ANDE, agua y la expensa del barrio cerrado, cuando corresponde, quedan afuera del alquiler: quién paga cada uno se acuerda antes de firmar.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar una casa en Encarnación?",
      a: "Depende sobre todo de la zona: cerca de la costanera el alquiler sube, y en los barrios más tradicionales baja. Arriba mostramos el rango de los alquileres publicados hoy en el portal.",
    },
    {
      q: "¿El alquiler se paga en guaraníes o en dólares?",
      a: "Las dos monedas se usan en esta ciudad, sobre todo en las casas cercanas a la costanera. Cada aviso muestra en qué moneda lo publicó el propietario.",
    },
    {
      q: "¿Conviene alquilar cerca de la costanera?",
      a: "Depende de qué busques: cerca de la costanera ganás cercanía a las playas y al paseo, pero el alquiler es más alto y en temporada hay más movimiento de gente.",
    },
    {
      q: "¿Piden garante para alquilar una casa en Encarnación?",
      a: "La mayoría de los propietarios pide un garante o un seguro de alquiler en su reemplazo. Conviene preguntarlo antes de visitar la casa.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Contanos cuánto podés pagar por mes y qué buscás en el formulario de esta página. Anotamos tu pedido y te escribimos por WhatsApp apenas se publique una casa en Encarnación que encaje.",
    },
  ],
  claimsToVerify: [
    "Encarnación's costanera area was rebuilt/expanded after the Yacyretá dam raised the river's water level, and includes artificial beaches.",
    "Rental demand and prices near Encarnación's costanera rise notably during the summer season.",
    "Cambyretá is a neighboring municipality that functions in practice as an extension of Encarnación's urban area, along the route toward the capital.",
    "It is common in Encarnación for rent to be quoted in both PYG and USD, especially for houses near the costanera.",
    "Landlords in Paraguay typically require either a personal guarantor or a rental-guarantee insurance product before signing a lease.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house in Encarnación appears.",
  ],
};
