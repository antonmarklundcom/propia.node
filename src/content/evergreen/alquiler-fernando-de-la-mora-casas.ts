/**
 * Evergreen page: /alquiler/fernando-de-la-mora/casas — "alquiler de casa en
 * fernando de la mora" and its merged variants
 * (docs/seo-evergreen-keywords.md, table A #13).
 *
 * Rental page: the financing section covers move-in costs, not a mortgage,
 * and links nowhere — /financiamiento is for buyers only.
 */
import type { EvergreenPage } from "./types";

export const alquilerFernandoDeLaMoraCasas: EvergreenPage = {
  path: "/alquiler/fernando-de-la-mora/casas",
  door: "inmobiliaria",
  keyword: "alquiler de casa en fernando de la mora",
  secondaryKeywords: [
    "casas en alquiler fernando de la mora",
    "alquiler de casa fernando de la mora",
    "alquiler casa fernando de la mora",
    "alquiler de casa con piscina en fernando dela mora",
    "alquiler de casas baratas en fernando dela mora paraguay",
    "alquiler de casas economicas en fernando dela mora zona norte",
    "alquiler de casas economicas en fernando dela mora zona sur",
    "alquiler de casas economicas fernando de la mora",
    "alquiler de casa en fernando dela mora",
    "alquiler de casa independiente en fernando dela mora",
  ],
  h1: "Casas en alquiler en Fernando de la Mora",
  lede: "Mirá las casas en alquiler publicadas hoy en Fernando de la Mora, con el monto mensual y contacto directo para preguntar antes de visitar.",
  metaDescription:
    "Casas en alquiler en Fernando de la Mora: precio mensual claro, filtro por zona norte o sur, y aviso cuando entra una casa nueva.",
  priceBands: [{ max: 250 }, { min: 251, max: 400 }, { min: 401, max: 600 }, { min: 601 }],
  barrios: {
    title: "Zona norte, zona sur y el resto de Fernando de la Mora",
    intro:
      "En Fernando de la Mora es común escuchar hablar de zona norte y zona sur como dos mitades de la ciudad, y a eso se suma la franja que está prácticamente pegada a Asunción. Conviene tener claro en qué mitad está la casa antes de comparar precios.",
    items: [
      {
        name: "Zona norte",
        text:
          "La mitad norte concentra buena parte de las casas más consultadas en alquiler, con un mix de construcciones antiguas y algunas más nuevas sobre lotes divididos. El movimiento de comercio y transporte suele ser mayor ahí que en la mitad sur.",
      },
      {
        name: "Zona sur",
        text:
          "Hacia la mitad sur las casas suelen estar en calles más tranquilas, aunque conviene confirmar el estado del asfalto o del empedrado antes de comprometerte, porque no toda la zona sur tiene el mismo nivel de servicios.",
      },
      {
        name: "El sector que limita con Asunción",
        text:
          "Fernando de la Mora está prácticamente pegada a la capital, y en ese sector cruzar de una ciudad a la otra se siente casi inmediato. Las casas ahí suelen alquilarse rápido por la cercanía al trabajo en Asunción.",
      },
      {
        name: "Hacia San Lorenzo y Ñemby",
        text:
          "En el sector que conecta con San Lorenzo y Ñemby las casas suelen tener terrenos algo más amplios, y el alquiler mensual tiende a ser más accesible que en las zonas más cercanas al centro de Fernando de la Mora.",
      },
    ],
  },
  prices: {
    title: "Qué mirar en el precio del alquiler",
    paragraphs: [
      "El alquiler mensual que ves en cada aviso lo fija quien publica, y cambia según si la casa está en zona norte, en zona sur o en el sector que limita con Asunción; no hay un valor único para toda la ciudad.",
      "Como en el resto del Central, algunos avisos muestran el alquiler en guaraníes y otros agregan el equivalente en dólares; el portal ordena y filtra por ese equivalente, así que conviene tenerlo en cuenta al mover los filtros de precio.",
      "El alquiler de una casa independiente en Fernando de la Mora casi nunca incluye la factura de ANDE ni la de agua, y esos montos se acuerdan aparte con el propietario.",
    ],
  },
  checklist: {
    title: "Qué preguntar antes de alquilar una casa en Fernando de la Mora",
    intro: "Antes de firmar un contrato, conviene aclarar estos puntos con el propietario o la inmobiliaria:",
    items: [
      "Si la casa está en zona norte o zona sur, y qué tan lejos queda de la avenida principal que separa ambas mitades.",
      "Qué garantía acepta el propietario: garante, garantía de alquiler de una empresa o un depósito a convenir.",
      "El estado del portón, del cerco perimetral y de la iluminación de la calle si vas a volver de noche seguido.",
      "Si hay perforación o tanque de reserva propio, algo que conviene confirmar en las casas de zona sur más alejadas de la red.",
      "Cómo se reparte el pago del impuesto inmobiliario y de los servicios mientras dure el contrato.",
      "Cuánto tarda el trayecto hacia Asunción o hacia San Lorenzo si lo hacés en el horario en que realmente lo vas a hacer todos los días.",
      "Si el propietario permite reformas menores, como pintar o cambiar aberturas, y en qué condiciones.",
      "Si el propietario acepta mascotas y qué pasa con el depósito si el patio o el cerco sufren algún daño.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir",
    paragraphs: [
      "Antes de mudarte a una casa en alquiler acá, definí con el propietario qué garantía vas a presentar: un garante, una garantía de una empresa o un depósito, cada una con requisitos distintos que conviene conocer con anticipación.",
      "Sumá a esa cuenta quién paga el impuesto inmobiliario y los servicios durante el contrato, y si el alquiler se ajusta con el tiempo: son puntos que en Fernando de la Mora conviene dejar escritos y no solo hablados.",
    ],
  },
  faq: [
    {
      q: "¿Qué diferencia hay entre alquilar en zona norte y en zona sur?",
      a: "No hay una regla fija, pero en general la zona norte tiene más movimiento de comercio y transporte, mientras que la zona sur suele ofrecer calles más tranquilas. Conviene visitar la cuadra específica antes de decidir.",
    },
    {
      q: "¿Las casas en alquiler en Fernando de la Mora incluyen los servicios?",
      a: "Normalmente no: el alquiler cubre el uso de la casa, y la factura de ANDE, la de agua y a veces el impuesto inmobiliario se pagan aparte. Confirmalo con el propietario antes de firmar.",
    },
    {
      q: "¿Qué garantía piden para alquilar una casa acá?",
      a: "Depende del propietario: puede aceptar un garante, una garantía de una empresa especializada o pedir un depósito. Preguntalo antes de coordinar una visita para no perder tiempo.",
    },
    {
      q: "¿Conviene alquilar cerca del límite con Asunción?",
      a: "Si tu prioridad es llegar rápido a la capital, sí, aunque esas casas suelen tener más demanda y menos margen para negociar el alquiler. Otras zonas de Fernando de la Mora pueden ofrecer más espacio por el mismo monto.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva?",
      a: "Escribí tu presupuesto y lo que necesitás en el formulario de esta página. Nuestro equipo revisa cada búsqueda y te avisa por WhatsApp cuando hay una casa en Fernando de la Mora que se ajusta a lo que pediste.",
    },
  ],
  claimsToVerify: [
    "Fernando de la Mora is commonly divided by locals into 'zona norte' and 'zona sur'.",
    "Fernando de la Mora directly borders Asunción, with the crossing between the two cities feeling near-immediate in some sectors.",
    "Fernando de la Mora borders San Lorenzo and Ñemby.",
    "House rentals in Fernando de la Mora typically require a guarantor, a rental-guarantee company or a deposit, and monthly rent usually excludes ANDE and water bills on a standalone house.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house appears.",
  ],
};
