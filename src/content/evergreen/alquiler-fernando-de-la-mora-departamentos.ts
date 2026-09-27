/**
 * Evergreen page: /alquiler/fernando-de-la-mora/departamentos — "alquiler
 * departamento fernando de la mora" and its merged variants
 * (docs/seo-evergreen-keywords.md, table A #22).
 *
 * Rental page: the financing section covers move-in costs, not a mortgage,
 * and links nowhere — /financiamiento is for buyers only.
 */
import type { EvergreenPage } from "./types";

export const alquilerFernandoDeLaMoraDepartamentos: EvergreenPage = {
  path: "/alquiler/fernando-de-la-mora/departamentos",
  door: "inmobiliaria",
  keyword: "alquiler departamento fernando de la mora",
  secondaryKeywords: [
    "alquiler de departamento en fernando de la mora",
    "alquiler de departamentos fernando de la mora",
    "departamentos en alquiler fernando de la mora",
    "alquiler de departamentos baratos en fernando de la mora",
    "alquiler de departamentos en fernando de la mora zona norte",
    "alquiler de departamentos en fernando dela mora zona sur",
    "alquiler de departamentos fernando de la mora zona norte",
  ],
  h1: "Departamentos en alquiler en Fernando de la Mora",
  lede: "Filtrá los departamentos en alquiler publicados en Fernando de la Mora por zona y por precio mensual, y escribí directo a quien publicó el aviso.",
  metaDescription:
    "Departamentos en alquiler en Fernando de la Mora: precio mensual, filtro por zona norte o sur, y aviso directo si entra un departamento nuevo.",
  priceBands: [{ max: 250 }, { min: 251, max: 400 }, { min: 401, max: 600 }, { min: 601 }],
  barrios: {
    title: "Dónde se concentran los departamentos en Fernando de la Mora",
    intro:
      "La oferta de departamentos en Fernando de la Mora es más chica que la de casas y tiende a agruparse en ciertos tramos de la ciudad. Ubicar la zona ayuda a entender el rango de alquiler que vas a encontrar.",
    items: [
      {
        name: "Zona norte",
        text:
          "En la mitad norte se ven más edificios de pocos pisos sobre las avenidas con comercio, pensados para quien busca estar cerca del transporte y de los negocios del día a día.",
      },
      {
        name: "Zona sur",
        text:
          "Hacia la mitad sur los departamentos suelen estar en construcciones más chicas o en casas divididas en unidades, con un alquiler que en general rinde más para el mismo presupuesto.",
      },
      {
        name: "El sector pegado a Asunción",
        text:
          "En el tramo que casi se funde con la capital, los departamentos se alquilan sobre todo a quien trabaja en Asunción y prefiere no perder tiempo cruzando toda la ciudad todos los días.",
      },
      {
        name: "Hacia San Lorenzo",
        text:
          "En el sector que conecta con San Lorenzo la oferta de departamentos es más escasa, y buena parte de las unidades disponibles están en edificios chicos recién habilitados.",
      },
    ],
  },
  prices: {
    title: "Cómo leer el alquiler de un departamento acá",
    paragraphs: [
      "El alquiler mensual de un departamento en Fernando de la Mora depende mucho de si el edificio queda en zona norte, en zona sur o en el tramo que limita con Asunción, además del estado y el tamaño de la unidad.",
      "En un departamento casi siempre hay que sumar la expensa del edificio al alquiler; esa expensa suele cubrir seguridad, limpieza de áreas comunes y mantenimiento básico, y se paga aparte del monto que ves en el aviso.",
      "Algunos avisos agregan el valor también en su equivalente en dólares para comparar; la moneda final de pago la fija quien publica el aviso o administra el edificio.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar un departamento en Fernando de la Mora",
    intro: "Conviene visitar el edificio y no solo el departamento antes de decidir. Repasá estos puntos:",
    items: [
      "Cuánto es la expensa mensual y si incluye seguridad, limpieza o solo mantenimiento básico del edificio.",
      "Si el edificio queda en zona norte o zona sur, y qué tan cerca está de una avenida con transporte público.",
      "El estado de las cañerías y de la presión de agua, sobre todo en edificios con más años de construcción.",
      "Si el reglamento interno permite mascotas o pone restricciones al uso de espacios comunes.",
      "Cuántas cocheras vienen incluidas en el alquiler y si son propias o compartidas con otras unidades.",
      "Si el departamento se alquila amoblado y qué elementos quedan detallados por escrito en el contrato.",
      "Cómo se paga la expensa: junto con el alquiler o directo a la administración del edificio.",
      "El tiempo real que se tarda en llegar a Asunción o a San Lorenzo en hora pico desde ese edificio.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en un departamento",
    paragraphs: [
      "Para entrar a un departamento en Fernando de la Mora vas a necesitar, además del primer alquiler, una garantía que la inmobiliaria te va a pedir por escrito: puede ser un garante, una garantía de una empresa o un depósito según lo que acuerden.",
      "Preguntá si la expensa del edificio ya está incluida en el monto del alquiler o si se cobra por separado, y por cuánto tiempo queda firmado el contrato antes de renovarse solo.",
    ],
  },
  faq: [
    {
      q: "¿Hay más departamentos en zona norte o en zona sur de Fernando de la Mora?",
      a: "La oferta suele concentrarse más en la zona norte, cerca de las avenidas con comercio, aunque también aparecen unidades en la zona sur a un alquiler distinto. Conviene comparar ambas antes de decidir.",
    },
    {
      q: "¿Qué es la expensa y quién la paga?",
      a: "La expensa es el gasto común del edificio: seguridad, limpieza y mantenimiento de las áreas compartidas. En algunos avisos va incluida en el alquiler y en otros se paga aparte; confirmalo antes de firmar.",
    },
    {
      q: "¿Los departamentos en Fernando de la Mora se alquilan amoblados?",
      a: "Hay de los dos tipos. Cada aviso indica si el departamento incluye muebles y electrodomésticos o si se entrega vacío.",
    },
    {
      q: "¿Qué garantía piden para alquilar un departamento acá?",
      a: "Depende de la inmobiliaria o del propietario: puede ser un garante, una garantía de una empresa especializada o un depósito. Preguntalo antes de coordinar una visita.",
    },
    {
      q: "¿Qué hago si hoy no hay un departamento que me sirva?",
      a: "Contanos en el formulario de esta página cuánto podés pagar de alquiler y qué tipo de departamento buscás, y te escribimos por WhatsApp en cuanto aparece una unidad en Fernando de la Mora que encaje.",
    },
  ],
  claimsToVerify: [
    "Fernando de la Mora is commonly divided by locals into 'zona norte' and 'zona sur'.",
    "Fernando de la Mora directly borders Asunción and San Lorenzo.",
    "Apartment buildings in Fernando de la Mora commonly charge expensas covering security, cleaning and basic maintenance of common areas, separate from rent.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching apartment appears.",
  ],
};
