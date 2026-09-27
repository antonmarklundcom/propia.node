/**
 * Evergreen page: /alquiler/san-lorenzo/casas — "alquiler de casa en san
 * lorenzo" and its merged variants (docs/seo-evergreen-keywords.md, table A
 * #5).
 *
 * Rental page: the financing section covers move-in costs, not a mortgage,
 * and links nowhere — /financiamiento is for buyers only.
 */
import type { EvergreenPage } from "./types";

export const alquilerSanLorenzoCasas: EvergreenPage = {
  path: "/alquiler/san-lorenzo/casas",
  door: "inmobiliaria",
  keyword: "alquiler de casa en san lorenzo",
  secondaryKeywords: [
    "casa en alquiler san lorenzo",
    "casas en alquiler san lorenzo",
    "alquiler de casas en san lorenzo baratos",
    "alquiler de casa en san lorenzo barato",
    "alquiler de casas baratas en san lorenzo",
    "casa alquiler san lorenzo ruta 2",
    "alquiler de casa con piscina en san lorenzo",
    "alquiler de casa en calle i san lorenzo",
    "alquiler de casa en san lorenzo zona sinalco",
    "alquiler de casa independiente en san lorenzo",
    "alquiler de casa zona san lorenzo",
  ],
  h1: "Casas en alquiler en San Lorenzo",
  lede: "Encontrá casas para alquilar en San Lorenzo con el monto mensual claro y el contacto directo de quien publicó el aviso.",
  metaDescription:
    "Casas en alquiler en San Lorenzo: mirá los avisos publicados con precio mensual, filtrá por zona y dejá tu búsqueda para lo que entre nuevo.",
  priceBands: [{ max: 250 }, { min: 251, max: 400 }, { min: 401, max: 600 }, { min: 601 }],
  barrios: {
    title: "Zonas de San Lorenzo para quien busca alquilar una casa",
    intro:
      "San Lorenzo mezcla calles tranquilas con sectores de mucho movimiento, y eso cambia bastante el tipo de casa que vas a encontrar y su precio mensual. Antes de fijarte en un aviso, conviene ubicar en qué parte de la ciudad está.",
    items: [
      {
        name: "Centro y alrededores de la municipalidad",
        text:
          "Cerca de la plaza y de las oficinas municipales hay casas más viejas sobre calles con comercio a la vista, ideales si querés todo cerca y sin depender tanto del auto. El tránsito de esa zona se pone pesado en horario de oficina y de salida de clases.",
      },
      {
        name: "Zona de la Ciudad Universitaria",
        text:
          "Alrededor del campus de la Universidad Nacional de Asunción se alquila mucho a estudiantes y a familias de docentes, así que las casas chicas rotan rápido según el año lectivo. Preguntá si el propietario acepta un contrato corto o solo uno largo.",
      },
      {
        name: "Sobre la ruta que sale hacia el interior",
        text:
          "Las casas ubicadas sobre esa ruta o a pocas cuadras tienen ventaja para moverse hacia otras ciudades del Central, pero el ruido de camiones y colectivos se siente fuerte en las que están sobre la calzada principal.",
      },
      {
        name: "Zona Sinalco y el límite con Fernando de la Mora",
        text:
          "Hacia el sector que se conoce localmente como Zona Sinalco, ya cerca del límite con Fernando de la Mora, las casas suelen tener patios más grandes y alquileres más accesibles, a cambio de quedar algo alejadas del comercio del centro.",
      },
    ],
  },
  prices: {
    title: "Qué mirar en el precio del alquiler",
    paragraphs: [
      "El monto que ves en cada aviso es el alquiler mensual que pide el propietario o la inmobiliaria, no un promedio de la ciudad: cambia según la zona, el tamaño del terreno y el estado de la casa.",
      "Algunos avisos publican el alquiler en guaraníes y otros muestran también su equivalente en dólares; el portal ordena y filtra por ese equivalente, así que conviene tenerlo presente si tu presupuesto está pensado en una sola moneda.",
      "El alquiler mensual casi nunca incluye la factura de ANDE ni la de agua, y en una casa independiente no suele haber expensas: esos gastos se acuerdan aparte con el propietario antes de firmar.",
    ],
  },
  checklist: {
    title: "Qué preguntar antes de alquilar una casa en San Lorenzo",
    intro:
      "Una casa que se ve bien en las fotos puede esconder detalles que solo salen a la luz si preguntás antes de firmar. Repasá esta lista con el propietario o la inmobiliaria:",
    items: [
      "Si el contrato se hace por escrito y qué duración mínima pide el propietario antes de dejarte renovar.",
      "Qué garantía acepta: un garante propietario en la zona, una garantía de un tercero o un seguro de caución.",
      "Si el patio o el jardín tienen tanque de agua o cisterna propia, algo común en las casas más alejadas del centro.",
      "El estado del techo y de las paredes ante lluvias fuertes, sobre todo en las casas más antiguas del centro.",
      "Si la cochera es techada o descubierta, y si entra más de un vehículo sin bloquear la salida.",
      "Cómo se reparten los gastos de mantenimiento entre propietario e inquilino durante el contrato.",
      "El trayecto real hasta tu trabajo o tu facultad en hora pico, no en un horario tranquilo.",
      "Si se permite tener mascotas y si el patio está realmente cercado para eso, no solo mencionado de palabra.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir",
    paragraphs: [
      "Alquilar una casa acá casi siempre implica algo más que el primer pago: el propietario suele pedir un garante, una garantía de una empresa especializada o un depósito, y cada opción cambia lo que necesitás tener listo antes de firmar.",
      "Repasá también quién se hace cargo de ANDE, de agua y del impuesto inmobiliario durante el contrato, y cada cuánto se renueva de forma automática si nadie avisa lo contrario: esos detalles pesan tanto como el monto del alquiler.",
    ],
  },
  faq: [
    {
      q: "¿Qué garantía piden para alquilar una casa en San Lorenzo?",
      a: "Depende de cada propietario: algunos aceptan un garante dueño de un inmueble en la zona, otros prefieren una garantía de una empresa especializada y otros piden un depósito. Conviene preguntarlo antes de coordinar una visita.",
    },
    {
      q: "¿El alquiler se paga en guaraníes o en dólares?",
      a: "La mayoría de los avisos publican el alquiler mensual en guaraníes, aunque algunos muestran también su equivalente en dólares para comparar. La moneda final de pago se acuerda con el propietario.",
    },
    {
      q: "¿Las casas en alquiler en San Lorenzo incluyen los servicios?",
      a: "Normalmente no: el alquiler cubre solo el uso de la casa, y la factura de ANDE, la de agua y a veces el impuesto inmobiliario se pagan aparte. Confirmalo con el propietario antes de firmar.",
    },
    {
      q: "¿Conviene alquilar cerca de la Ciudad Universitaria?",
      a: "Si tu prioridad es la cercanía a la facultad, sí, aunque esa zona suele tener más movimiento y rotación de inquilinos según el año lectivo. Si buscás tranquilidad, otras zonas de San Lorenzo se adaptan mejor.",
    },
    {
      q: "¿Qué hago si no encuentro una casa que me sirva hoy?",
      a: "Contanos tu presupuesto mensual y lo que buscás en el formulario de esta página. Un miembro de nuestro equipo revisa tu búsqueda y te escribe por WhatsApp en cuanto aparece una casa en San Lorenzo que encaje.",
    },
  ],
  claimsToVerify: [
    "The Universidad Nacional de Asunción's main campus (Ciudad Universitaria) is in San Lorenzo.",
    "A route connecting San Lorenzo to the interior of the country passes near/through the city (referenced in the text only as 'la ruta que sale hacia el interior').",
    "There is an area of San Lorenzo popularly known as 'Zona Sinalco', near the border with Fernando de la Mora.",
    "San Lorenzo borders Fernando de la Mora.",
    "House rentals in San Lorenzo typically require a guarantor, a rental-guarantee company, or a deposit, and monthly rent usually excludes ANDE and water bills, with no expensas on a standalone house.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching house appears.",
  ],
};
