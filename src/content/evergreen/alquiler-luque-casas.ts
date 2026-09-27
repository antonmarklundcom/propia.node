/**
 * Evergreen page: /alquiler/luque/casas — "casas en alquiler luque" (170/mo)
 * and its merged variants (docs/seo-evergreen-keywords.md, table A #8).
 *
 * Zones covered from a tenant's angle (garantía, expensas, commute by bus),
 * not the pilot's buyer angle — see venta-luque-casas.ts for that one.
 */
import type { EvergreenPage } from "./types";

export const alquilerLuqueCasas: EvergreenPage = {
  path: "/alquiler/luque/casas",
  door: "inmobiliaria",
  keyword: "casas en alquiler luque",
  secondaryKeywords: [
    "alquiler de casa en luque",
    "alquiler de casa en 4to barrio luque",
    "alquiler de casa en luque barato",
    "alquiler de casas en luque zona conmebol",
    "alquiler de casa en luque palma loma",
    "alquiler de casa con piscina en luque",
    "alquiler de casa en barrio molino luque",
    "alquiler de casa en bella vista luque",
    "alquiler de casa en isla bogado luque",
    "alquiler de casa en luque centro",
    "alquiler de casa en mora cue luque",
    "alquiler de casa en villa adela luque",
    "alquiler de casa zona luque",
    "alquiler de casas baratas en luque",
    "alquiler de casas economicas en luque",
  ],
  h1: "Casas en alquiler en Luque",
  lede: "Elegí el rango de alquiler mensual que podés pagar, mirá qué hay disponible hoy y dejanos tu búsqueda si todavía no aparece la casa que necesitás.",
  metaDescription:
    "Casas en alquiler en Luque: filtrá por precio mensual, mirá los avisos disponibles hoy y dejá tu búsqueda para enterarte cuando entre una casa nueva.",
  priceBands: [{ max: 250 }, { min: 251, max: 400 }, { min: 401, max: 600 }, { min: 601 }],
  barrios: {
    title: "Zonas de Luque para alquilar una casa",
    intro:
      "Alquilar una casa en Luque no es lo mismo en cada zona: cambia el trayecto al trabajo y cuánto entra del alquiler en el presupuesto del mes. Esto es lo que conviene saber de cada sector antes de agendar una visita.",
    items: [
      {
        name: "Centro",
        text:
          "Cerca de la plaza y de los comercios del centro se alquilan casas más antiguas, con patios chicos y garaje sobre la calle. La ventaja es ir caminando a hacer trámites; la contra es el ruido en las horas de más movimiento, algo que conviene notar en una visita a esa hora.",
      },
      {
        name: "Zona aeropuerto y autopista",
        text:
          "Quien alquila cerca de la autopista suele elegir la zona por lo rápido que se llega a Asunción para trabajar. Conviene visitar la casa de noche y de día antes de firmar: el paso de aviones no se siente igual en todas las cuadras cercanas al aeropuerto.",
      },
      {
        name: "Zona Conmebol y Ñu Guasu",
        text:
          "Hacia este sector hay casas de alquiler más nuevas, muchas dentro de barrios cerrados con seguridad propia. El alquiler mensual casi nunca incluye las expensas del barrio cerrado: preguntá ese monto aparte antes de comparar precios con una casa de afuera.",
      },
      {
        name: "Palma Loma, Villa Adela y Bella Vista",
        text:
          "Estos sectores hacia los bordes de la ciudad ofrecen casas con patios más grandes y un costo mensual más accesible. A cambio, conviene confirmar la frecuencia del transporte público y el estado de la calle cuando llueve.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los alquileres publicados",
    paragraphs: [
      "El rango de arriba sale de las casas publicadas hoy en este portal para alquilar en Luque: son los montos que pide cada propietario o inmobiliaria, no un promedio de mercado, y se mueve a medida que entran y salen avisos.",
      "Algunos alquileres se publican en guaraníes y otros en dólares. El portal ordena y filtra por el equivalente en dólares, así que convertí tu presupuesto mensual antes de mover los filtros de precio.",
      "El monto del alquiler no siempre es todo lo que vas a pagar: las expensas de un barrio cerrado, la ANDE y el agua corren aparte salvo que el aviso diga lo contrario.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar una casa en Luque",
    intro:
      "Antes de decir que sí a una casa, conviene tener respuesta para estos puntos:",
    items: [
      "Si el contrato pide garantía de un tercero, seguro de caución o un depósito, y qué pasa con ese monto al terminar el contrato.",
      "Qué gastos corren por tu cuenta además del alquiler: expensas si hay barrio cerrado, impuesto inmobiliario si el contrato lo traslada al inquilino, agua y ANDE.",
      "El estado del techo, las aberturas y la instalación eléctrica: esas reparaciones suelen quedar a cargo del propietario, pero conviene dejarlo escrito antes de firmar.",
      "Cuánto dura el contrato de alquiler de la casa y con cuánto tiempo de aviso podés dejarla antes de esa fecha sin perder la garantía.",
      "Cuántas veces por semana pasa el colectivo cerca de la casa y a qué distancia real queda la parada, si no vas a tener auto todos los días.",
      "Si el patio está cercado y en qué estado, sobre todo si vas a tener mascotas o chicos jugando afuera.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en una casa alquilada en Luque",
    paragraphs: [
      "Antes de mudarte, la mayoría de los propietarios pide alguna garantía: un garante con propiedad a su nombre, un seguro de caución o, en algunos casos, un depósito en efectivo. Cuál de las tres pide cada propietario es su decisión, así que conviene preguntarlo antes de enamorarte de una casa.",
      "El primer pago suele incluir el alquiler del mes en curso más lo que se acordó como garantía. Quién paga las expensas cuando la casa está dentro de un barrio cerrado es un punto que el contrato debe dejar claro desde el principio.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar una casa en Luque?",
      a: "Depende de la zona, del tamaño del patio y de si la casa está dentro de un barrio cerrado. Arriba mostramos el rango de las casas publicadas hoy; no damos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿El alquiler incluye las expensas?",
      a: "Casi nunca. Cuando la casa está dentro de un barrio cerrado, las expensas se pagan aparte del alquiler mensual: preguntale al propietario o a la inmobiliaria el monto antes de comparar precios con una casa fuera del barrio.",
    },
    {
      q: "¿Piden garante para alquilar en Luque?",
      a: "La mayoría de los propietarios pide alguna garantía, ya sea un garante, un seguro de caución o un depósito. Cuál exactamente lo decide cada propietario, así que conviene preguntarlo antes de visitar la casa.",
    },
    {
      q: "¿Se puede alquilar una casa en Luque en dólares?",
      a: "Sí, hay avisos publicados en las dos monedas. El portal filtra y ordena por el equivalente en dólares para que puedas comparar, y la moneda final del contrato se acuerda con el propietario.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva en Luque?",
      a: "Dejá tu búsqueda en el formulario de esta página con el presupuesto y la zona que te interesan. Nuestro equipo te escribe por WhatsApp cuando aparece una casa en alquiler en Luque que encaje.",
    },
  ],
  claimsToVerify: [
    "The area near the CONMEBOL headquarters and the Ñu Guasu park in Luque has newer rental houses, many inside barrios cerrados with their own private security.",
    "Palma Loma, Villa Adela and Bella Vista are barrios/compañías of Luque.",
    "Rental houses inside a barrio cerrado in Luque typically charge expensas separately from the monthly rent.",
    "A guarantor, a seguro de caución, or a cash deposit are the common forms of rental guarantee asked by landlords in Paraguay.",
    "The impuesto inmobiliario can be contractually passed on to the tenant in a Paraguayan lease, depending on what the contract states.",
    "Water in Luque can come from the public network, a junta de saneamiento, or a private well, and pressure can drop during peak household use.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching rental house appears in Luque.",
  ],
};
