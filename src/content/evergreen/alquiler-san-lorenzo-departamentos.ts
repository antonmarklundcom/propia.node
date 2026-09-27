/**
 * Evergreen page: /alquiler/san-lorenzo/departamentos — "departamentos en
 * alquiler san lorenzo" and its merged variants
 * (docs/seo-evergreen-keywords.md, table A #17).
 *
 * Rental page: the financing section covers move-in costs, not a mortgage,
 * and links nowhere — /financiamiento is for buyers only.
 */
import type { EvergreenPage } from "./types";

export const alquilerSanLorenzoDepartamentos: EvergreenPage = {
  path: "/alquiler/san-lorenzo/departamentos",
  door: "inmobiliaria",
  keyword: "departamentos en alquiler san lorenzo",
  secondaryKeywords: [
    "alquiler de departamento en san lorenzo",
    "alquiler de apartamentos en san lorenzo",
    "alquiler de departamento en san lorenzo económicos",
  ],
  h1: "Departamentos en alquiler en San Lorenzo",
  lede: "Mirá los departamentos publicados hoy en San Lorenzo, con el alquiler mensual y el contacto directo de quien los publica.",
  metaDescription:
    "Departamentos en alquiler en San Lorenzo: alquiler mensual claro, filtros por precio y zona, y aviso directo si entra un departamento nuevo.",
  priceBands: [{ max: 250 }, { min: 251, max: 400 }, { min: 401, max: 600 }, { min: 601 }],
  barrios: {
    title: "Dónde conviene buscar un departamento en San Lorenzo",
    intro:
      "La oferta de departamentos en San Lorenzo está mucho más concentrada que la de casas, y suele agruparse cerca de los puntos que mueven gente todos los días. Estas son las zonas donde más se ven avisos.",
    items: [
      {
        name: "Alrededor de la Ciudad Universitaria",
        text:
          "Es la zona con más movimiento de estudiantes y docentes, así que los departamentos chicos y los que se alquilan amoblados tienen alta demanda mientras dura el año lectivo. Preguntá si el contrato se puede ajustar a ese calendario.",
      },
      {
        name: "Sobre las avenidas comerciales del centro",
        text:
          "En los edificios de pocos pisos sobre las avenidas con más comercio conviene preguntar si el departamento da a la calle o al interior del edificio, porque el ruido cambia mucho de una unidad a otra dentro del mismo bloque.",
      },
      {
        name: "Cerca de la ruta hacia el interior",
        text:
          "Los complejos de departamentos ubicados cerca de esa ruta ofrecen salida rápida hacia otras ciudades del Central, aunque conviene revisar el aislamiento acústico si el edificio da directo a la calzada principal.",
      },
      {
        name: "Hacia Zona Sinalco y el límite con Fernando de la Mora",
        text:
          "En los departamentos más alejados del centro, hacia Zona Sinalco y el límite con Fernando de la Mora, el alquiler suele ser más bajo a cambio de un edificio más simple y menos amenities.",
      },
    ],
  },
  prices: {
    title: "Cómo leer el alquiler de un departamento",
    paragraphs: [
      "El alquiler mensual que muestra cada aviso es lo que pide quien publica, y en un departamento casi siempre hay que sumarle la expensa del edificio, que cubre limpieza de áreas comunes, seguridad y mantenimiento.",
      "Muchos avisos de departamentos en San Lorenzo se publican amoblados, pensando en estudiantes o en quien llega por poco tiempo; eso suele reflejarse en un alquiler más alto que el de una unidad sin muebles.",
      "Como con las casas, algunos avisos muestran el valor también en su equivalente en dólares para poder comparar; la moneda de pago final la fija el propietario o la administración del edificio.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar un departamento en San Lorenzo",
    intro:
      "Un departamento se conoce mejor visitándolo en persona que mirando las fotos del aviso. Antes de firmar, confirmá estos puntos:",
    items: [
      "Cuánto es la expensa del edificio y qué incluye exactamente: seguridad, limpieza, ascensor o solo mantenimiento básico.",
      "Si el edificio tiene ascensor en funcionamiento y en qué piso queda el departamento.",
      "Si el reglamento del edificio permite mascotas o restringe el uso de espacios comunes.",
      "Cuántas cocheras vienen incluidas en el alquiler y si son fijas o rotativas entre vecinos.",
      "El estado de la instalación eléctrica y de la presión de agua en el piso donde está el departamento.",
      "Si el departamento se alquila amoblado y qué muebles y electrodomésticos quedan detallados por escrito.",
      "Cómo se paga la expensa: junto con el alquiler a la inmobiliaria o directo a la administración del edificio.",
      "El tiempo real hasta tu facultad o trabajo en hora pico, y no en un trayecto sin tráfico.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en un departamento",
    paragraphs: [
      "En un departamento, a la garantía que te pida el propietario o la inmobiliaria se suma la expensa del edificio, que en algunos casos se paga junto con el alquiler y en otros aparte: confirmá cuál es tu caso antes de reservar la unidad.",
      "Si el departamento se alquila amoblado, pedí por escrito qué muebles y electrodomésticos quedan incluidos, porque eso suele influir en el monto final que se acuerda con el propietario.",
    ],
  },
  faq: [
    {
      q: "¿Los departamentos en San Lorenzo se alquilan amoblados?",
      a: "Muchos sí, sobre todo los pensados para estudiantes de la Ciudad Universitaria, pero también hay departamentos sin muebles a un alquiler más bajo. Cada aviso indica si está amoblado o no.",
    },
    {
      q: "¿Qué es la expensa y quién la paga?",
      a: "La expensa es el gasto común del edificio: seguridad, limpieza y mantenimiento de las áreas compartidas. En algunos avisos va incluida en el alquiler y en otros se paga aparte; conviene confirmarlo antes de firmar.",
    },
    {
      q: "¿Hay departamentos económicos cerca de la Ciudad Universitaria?",
      a: "Sí, es una de las zonas con más oferta de departamentos chicos pensados para estudiantes, aunque el alquiler puede subir en los meses de mayor demanda del año lectivo.",
    },
    {
      q: "¿Qué garantía piden para alquilar un departamento?",
      a: "Depende de la inmobiliaria o del propietario: puede ser un garante, una garantía de una empresa especializada o un depósito. Preguntalo antes de reservar una visita.",
    },
    {
      q: "¿Qué hago si hoy no hay un departamento que me sirva?",
      a: "Completá el formulario de esta página con tu presupuesto y el tipo de departamento que buscás. Te contactamos por WhatsApp apenas entra una unidad en San Lorenzo que se ajuste a lo que pediste.",
    },
  ],
  claimsToVerify: [
    "The Universidad Nacional de Asunción's main campus is in San Lorenzo and its academic calendar drives demand for furnished apartments nearby.",
    "A route connecting San Lorenzo to the interior of the country passes near the city (referenced only as 'esa ruta hacia el interior').",
    "There is an area known as Zona Sinalco near the border with Fernando de la Mora, farther from San Lorenzo's centro.",
    "Apartment buildings in San Lorenzo commonly charge expensas covering security, cleaning and maintenance of common areas, separate from rent.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching apartment appears.",
  ],
};
