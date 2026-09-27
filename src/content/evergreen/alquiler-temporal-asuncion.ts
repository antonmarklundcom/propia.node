/**
 * Evergreen page: /alquiler-temporal/asuncion — "alquiler temporal asuncion"
 * (40/mo), no merged secondary phrases (docs/seo-evergreen-keywords.md,
 * table A #33).
 *
 * Short/medium-stay furnished rentals. The barrio section is about zones for
 * short stays (why you're visiting), distinct from the other three Asunción
 * rental pages' lifestyle/tower/lot angles.
 */
import type { EvergreenPage } from "./types";

export const alquilerTemporalAsuncion: EvergreenPage = {
  path: "/alquiler-temporal/asuncion",
  door: "inmobiliaria",
  keyword: "alquiler temporal asuncion",
  secondaryKeywords: [],
  h1: "Alquiler temporal en Asunción",
  lede: "Departamentos y casas amueblados para estadías cortas o medias en Asunción, listos para entrar sin comprar nada.",
  metaDescription:
    "Alquiler temporal en Asunción: departamentos y casas amueblados para estadías cortas. Filtrá por precio y dejá tu búsqueda por WhatsApp.",
  priceBands: [{ max: 500 }, { min: 501, max: 1000 }, { min: 1001 }],
  barrios: {
    title: "Zonas de Asunción según el motivo de la estadía",
    intro:
      "Una estadía temporal no se elige igual que una vivienda para instalarse: el motivo del viaje pesa más que el tamaño del lugar. Estas son las zonas que más se ajustan a cada motivo.",
    items: [
      {
        name: "Centro y Casco Histórico",
        text:
          "Conviene para quien viene por trámites, audiencias o reuniones en oficinas públicas: gran parte de esas gestiones se resuelven caminando desde ahí, sin depender de moverte por toda la ciudad.",
      },
      {
        name: "Villa Morra y Recoleta",
        text:
          "La zona con más oficinas, restaurantes y clínicas privadas de la ciudad. Es la opción más elegida para viajes de trabajo y para estadías relacionadas con un tratamiento médico, por la cercanía a los sanatorios.",
      },
      {
        name: "Costanera",
        text:
          "La franja junto al río, con paseos y una vista distinta a la del resto de la ciudad. Sirve más para una estadía de descanso o de fin de semana que para una agenda de reuniones.",
      },
      {
        name: "San Vicente y alrededores del centro",
        text:
          "Una opción más económica que Villa Morra para quien solo necesita estar cerca del centro sin pagar la zona con más movimiento comercial de la ciudad.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios del alquiler temporal",
    paragraphs: [
      "El rango de arriba sale de los alojamientos temporales publicados hoy en el portal: el precio ya incluye estar amueblado y listo para entrar, a diferencia de un alquiler común.",
      "El precio de una estadía temporal suele bajar cuanto más larga es la estadía, así que conviene preguntar directamente por el motivo y el tiempo que necesitás antes de comparar solo el valor por corto plazo.",
      "Fijate bien qué incluye cada aviso: hay lugares que ya suman ANDE, agua e internet en el precio y otros que los cobran aparte según el consumo del período.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de reservar un alquiler temporal en Asunción",
    intro:
      "Una estadía temporal se acuerda más rápido que un contrato de alquiler común, pero conviene confirmar estos puntos antes de transferir nada:",
    items: [
      "Qué está incluido exactamente en el precio: ANDE, agua, internet, limpieza y ropa de cama.",
      "Cuál es la estadía mínima que acepta el propietario y si hay descuento por quedarte más tiempo.",
      "Qué depósito de garantía pide antes de entregarte las llaves y en qué momento te lo devuelve.",
      "Si el lugar factura como empresa o como persona física, en caso de que necesités ese comprobante para tu trabajo.",
      "Cómo es el check-in y el check-out, y si hay alguien disponible si llegás en un horario poco habitual.",
      "El estado real de la conexión a internet, sobre todo si vas a trabajar desde ahí durante tu estadía.",
      "Qué política tiene el lugar si necesitás cancelar o cambiar la fecha de entrada.",
    ],
  },
  financing: {
    title: "Qué incluye el precio de un alquiler temporal en Asunción",
    paragraphs: [
      "A diferencia de un alquiler común, un alojamiento temporal ya viene amueblado y casi siempre con ANDE, agua e internet incluidos en el precio; confirmá con el propietario qué queda afuera antes de reservar.",
      "El depósito de garantía en una estadía temporal suele ser más simple que en un contrato largo: normalmente alcanza con un pago por adelantado, sin garante ni seguro de caución.",
      "Si necesitás factura por tu estadía para tu trabajo o para rendir un viaje, preguntá antes de reservar si el lugar factura como empresa: no todos los propietarios lo hacen.",
    ],
  },
  faq: [
    {
      q: "¿Qué diferencia hay entre alquiler temporal y alquiler común en Asunción?",
      a: "El alquiler temporal viene amueblado, con los servicios ya resueltos y pensado para una estadía corta o media, mientras que un contrato de alquiler común se firma para quedarte a vivir de forma estable.",
    },
    {
      q: "¿Cuánto sale un alquiler temporal en Asunción?",
      a: "Depende del tiempo de estadía, de la zona y de si el precio incluye los servicios. Arriba mostramos el rango de lo publicado hoy para que compares antes de reservar.",
    },
    {
      q: "¿Piden garante para un alquiler temporal?",
      a: "Casi nunca. La mayoría de los propietarios se conforman con un pago por adelantado como garantía, sin pedir garante ni seguro de caución como en un contrato largo.",
    },
    {
      q: "¿Puedo pedir factura por una estadía temporal?",
      a: "Depende del propietario: algunos facturan como empresa y otros no. Preguntalo antes de reservar si necesitás ese comprobante para tu trabajo.",
    },
    {
      q: "¿Sirve el alquiler temporal para quedarme varios meses?",
      a: "Sí, muchos lugares aceptan estadías medias y suelen bajar el precio cuanto más tiempo te quedás. Consultá directamente por el tiempo que necesitás en lugar de guiarte solo por el valor de corto plazo.",
    },
    {
      q: "¿Qué hago si hoy no hay un alquiler temporal que me sirva en Asunción?",
      a: "Dejá tu búsqueda con tu presupuesto y el tiempo de estadía que necesitás. El equipo te escribe por WhatsApp cuando entra una estadía temporal en Asunción que encaje.",
    },
  ],
  claimsToVerify: [
    "Villa Morra and Recoleta concentrate offices and private clinics/sanatoriums, making them a common choice for business trips and medical-related stays.",
    "The Costanera de Asunción is a riverside promenade area distinct in character from the rest of the city.",
    "The Centro/Casco Histórico is within walking distance of many government offices, useful for administrative visits.",
    "Short/medium-term furnished rentals in Paraguay are commonly billed with utilities (ANDE, water, internet) included in the price.",
    "Deposit requirements for temporary/furnished rentals are typically simpler (an advance payment) than for a standard long-term lease that may require a guarantor or rental insurance.",
    "Not all short-term rental hosts in Paraguay issue a company invoice (factura) for a stay.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching temporary rental in Asunción appears.",
  ],
};
