/**
 * Evergreen page: /alquiler/luque/duplex — "duplex en alquiler luque"
 * (50/mo) and its merged variants (docs/seo-evergreen-keywords.md, table A
 * #28).
 *
 * Written from the duplex angle (shared wall, shared gate/driveway,
 * per-unit vs shared meters) — distinct from the other two Luque rental
 * pages and from the venta pilot.
 */
import type { EvergreenPage } from "./types";

export const alquilerLuqueDuplex: EvergreenPage = {
  path: "/alquiler/luque/duplex",
  door: "inmobiliaria",
  keyword: "duplex en alquiler luque",
  secondaryKeywords: [
    "alquiler de duplex en luque",
    "alquiler duplex económicos en luque",
    "alquilo duplex en luque",
  ],
  h1: "Dúplex en alquiler en Luque",
  lede: "Filtrá por precio mensual, mirá qué dúplex hay disponibles hoy en Luque y dejanos tu búsqueda si todavía no aparece el que necesitás.",
  metaDescription:
    "Dúplex en alquiler en Luque: filtrá por precio mensual, mirá los avisos disponibles hoy y dejá tu búsqueda para cuando entre un dúplex nuevo.",
  priceBands: [{ max: 250 }, { min: 251, max: 400 }, { min: 401, max: 600 }, { min: 601 }],
  barrios: {
    title: "Zonas de Luque para alquilar un dúplex",
    intro:
      "El dúplex es un término amplio en Luque: puede ser una vivienda de dos plantas con pared compartida, o una casa más grande dividida en dos unidades. La zona cambia sobre todo el tipo de conjunto que vas a encontrar.",
    items: [
      {
        name: "Centro",
        text:
          "En el centro los dúplex suelen ser viviendas más antiguas divididas en dos unidades, cada una con su entrada propia sobre la calle. No siempre hay medidor de agua o de luz separado para cada mitad, así que conviene confirmarlo antes de firmar.",
      },
      {
        name: "Zona aeropuerto y autopista",
        text:
          "Cerca de la autopista aparecen conjuntos chicos de dúplex, pensados para quien busca salir rápido hacia Asunción sin pagar el alquiler de una casa entera. Suelen compartir un solo portón de entrada, así que preguntá cómo se reparte el uso del espacio común para autos.",
      },
      {
        name: "Zona Conmebol y Ñu Guasu",
        text:
          "Los conjuntos de dúplex más nuevos de Luque están hacia este sector, muchas veces con mejores terminaciones y un portón con cámara. El mantenimiento del espacio común suele cobrarse aparte del alquiler: pedí ese monto antes de decidir.",
      },
      {
        name: "Barrios hacia las afueras",
        text:
          "Hacia los barrios más alejados del centro los dúplex tienden a estar solos, sin formar un conjunto, con un patio algo más grande de cada lado. Revisá el estado de la pared compartida con la otra mitad antes de mudarte: una humedad de un lado casi siempre termina afectando al otro.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los alquileres de dúplex publicados",
    paragraphs: [
      "El rango de arriba junta los dúplex publicados hoy en este portal para alquilar en Luque: son los montos que pide cada propietario, y se actualiza a medida que entran y salen avisos.",
      "Algunos dúplex se publican en guaraníes y otros en dólares. El portal filtra y ordena por el equivalente en dólares, así que convertí tu presupuesto antes de mover los filtros.",
      "Cuando el dúplex forma parte de un conjunto chico, el mantenimiento del portón o del espacio común puede cobrarse aparte del alquiler: preguntá si ese gasto existe antes de comparar precios.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar un dúplex en Luque",
    intro:
      "Un dúplex tiene puntos propios que no aparecen al alquilar una casa entera. Antes de firmar, confirmá:",
    items: [
      "Si el agua y la luz tienen medidor propio para tu unidad o se comparten y después se dividen con la otra mitad.",
      "El estado de la pared o el techo que compartís con la otra unidad, y si hay humedad o ruido que se pasa de un lado al otro.",
      "Cómo se reparte el uso del patio, el portón de entrada o el lugar para el auto cuando el dúplex forma parte de un conjunto chico.",
      "Quién arregla una rotura en una parte compartida del dúplex: el propietario de tu unidad, el de la otra, o los dos entre sí.",
      "Cuánto dura el contrato del dúplex y si el preaviso para dejarlo es el mismo que el de la otra unidad del conjunto.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en un dúplex alquilado en Luque",
    paragraphs: [
      "Antes de entregarte las llaves de un dúplex, la mayoría de los propietarios pide alguna garantía: un garante con propiedad a su nombre, un seguro de caución o un depósito. Cuál de las tres acepta cada propietario es su decisión particular.",
      "El primer pago junta habitualmente el alquiler del mes en curso con el monto de la garantía acordado. Si el conjunto tiene un gasto común de mantenimiento, pedí que el contrato diga si ese monto entra en el alquiler o se paga aparte.",
    ],
  },
  faq: [
    {
      q: "¿Qué diferencia hay entre un dúplex y una casa para alquilar?",
      a: "El dúplex comparte una pared o un techo con otra unidad, y muchas veces un portón de entrada o un patio. Una casa entera no comparte esas partes con un vecino directo.",
    },
    {
      q: "¿Cuánto sale alquilar un dúplex en Luque?",
      a: "Depende de la zona, si forma parte de un conjunto y del estado de la unidad. Arriba mostramos el rango de los dúplex publicados hoy; no damos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿El agua y la luz vienen separadas en un dúplex?",
      a: "Depende de cada dúplex. Algunos tienen medidor propio para cada unidad y otros comparten uno solo que después se divide: confirmalo con el propietario antes de firmar.",
    },
    {
      q: "¿Piden garante para alquilar un dúplex en Luque?",
      a: "Sí, casi siempre alguna garantía: un garante, un seguro de caución o un depósito. Cuál de las tres se acepta lo decide el propietario de la unidad, no una regla del conjunto.",
    },
    {
      q: "¿Qué hago si hoy no hay un dúplex que me sirva en Luque?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y la zona que te interesa. Nuestro equipo te escribe por WhatsApp cuando aparece un dúplex en alquiler en Luque que encaje.",
    },
  ],
  claimsToVerify: [
    "A 'dúplex' listing in Paraguay commonly refers either to a house split into two independent semi-detached units sharing a wall, or a small complex of a few such units sharing one entrance gate.",
    "Small duplex complexes near the CONMEBOL / Ñu Guasu area of Luque tend to have better finishes and gated/camera entrances than older central units.",
    "Water and electricity meters in a duplex may be separate per unit or shared and later divided between the two units, depending on the property.",
    "A guarantor, a seguro de caución, or a cash deposit are the common forms of rental guarantee asked by landlords in Paraguay.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching duplex appears in Luque.",
  ],
};
