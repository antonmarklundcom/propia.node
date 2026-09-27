/**
 * Evergreen page: /alquiler/mariano-roque-alonso/casas — "alquiler de casa
 * en mariano roque alonso" (90/mo) and its merged variants
 * (docs/seo-evergreen-keywords.md, table A #20).
 *
 * Tenant angle. Pairs with venta-mariano-roque-alonso-casas.ts (buyer
 * angle) — the two must differ in substance, not just in operation.
 */
import type { EvergreenPage } from "./types";

export const alquilerMarianoRoqueAlonsoCasas: EvergreenPage = {
  path: "/alquiler/mariano-roque-alonso/casas",
  door: "inmobiliaria",
  keyword: "alquiler de casa en mariano roque alonso",
  secondaryKeywords: [
    "alquiler de casa en mariano roque alonso barato",
    "casas en alquiler mariano roque alonso",
    "alquiler de casa en roque alonso",
    "alquiler de casas baratas en mariano roque alonso",
  ],
  h1: "Casas en alquiler en Mariano Roque Alonso",
  lede: "Filtrá por precio mensual, mirá qué casas hay disponibles hoy en Mariano Roque Alonso y dejanos tu búsqueda si todavía no aparece la que necesitás.",
  metaDescription:
    "Casas en alquiler en Mariano Roque Alonso: filtrá por precio mensual, mirá los avisos disponibles hoy y dejá tu búsqueda para una casa nueva.",
  priceBands: [{ max: 250 }, { min: 251, max: 400 }, { min: 401, max: 600 }, { min: 601 }],
  barrios: {
    title: "Zonas de Mariano Roque Alonso para alquilar una casa",
    intro:
      "Mariano Roque Alonso no es uniforme para quien busca alquilar: la cercanía a la ruta, a la bahía o al centro cambia bastante el tipo de casa y el precio. Esto es lo que distingue a cada sector.",
    items: [
      {
        name: "Centro",
        text:
          "Cerca de la municipalidad y de la plaza principal se alquilan casas más antiguas, a poca distancia de comercios y de la parada de colectivo hacia Asunción. El tránsito se siente más en las horas de entrada y salida del trabajo.",
      },
      {
        name: "Zona costanera",
        text:
          "Hacia la costa, sobre la bahía, hay casas de alquiler con más espacio de patio y una vista poco frecuente en el resto de la ciudad. Preguntá si la zona puntual de la casa se anega con las crecidas del río en los meses de más lluvia.",
      },
      {
        name: "Zona sobre la ruta e industrial",
        text:
          "Mariano Roque Alonso tiene bastante actividad de depósitos y fábricas por su acceso a las rutas hacia Asunción y hacia el interior. Alquilar cerca de esa zona conviene a quien trabaja ahí mismo, aunque el tránsito de camiones se nota más que en un barrio residencial.",
      },
      {
        name: "Barrios hacia el límite con Luque y Limpio",
        text:
          "Hacia los bordes de la ciudad, cerca del límite con las ciudades vecinas, el alquiler rinde más y los patios son más grandes. Conviene confirmar la frecuencia del transporte público y el estado de la calle cuando llueve.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los alquileres publicados en Mariano Roque Alonso",
    paragraphs: [
      "El rango de arriba junta las casas publicadas hoy en este portal para alquilar en Mariano Roque Alonso: son los montos que pide cada propietario, y cambian a medida que entran y salen avisos.",
      "Hay avisos publicados en guaraníes y otros en dólares. El portal ordena y filtra por el equivalente en dólares, así que convertí tu presupuesto mensual antes de mover los filtros.",
      "El alquiler mensual no siempre incluye todo: el agua, la ANDE y, si la casa está dentro de un pequeño conjunto cerrado, el mantenimiento común suelen correr aparte.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar una casa en Mariano Roque Alonso",
    intro:
      "Antes de decir que sí a una casa en Mariano Roque Alonso, conviene tener respuesta para estos puntos:",
    items: [
      "Si la zona puntual de la casa se anega o se moja con lluvias fuertes, sobre todo en los sectores más cercanos a la bahía.",
      "Qué gastos corren por tu cuenta además del alquiler: agua, ANDE y, si corresponde, el mantenimiento de un conjunto cerrado.",
      "Qué garantía te pide exactamente el propietario para firmar, y qué pasa con ese monto si decidís dejar la casa antes de que termine el contrato.",
      "El estado del techo, las aberturas y la instalación eléctrica, y si esas reparaciones quedan a cargo del propietario durante el contrato.",
      "El trayecto real hasta tu trabajo, tanto si queda sobre la ruta como si queda del lado de Asunción, en el horario en que realmente lo vas a hacer.",
      "Cuánto dura el contrato de alquiler en Mariano Roque Alonso y qué preaviso pide el propietario si necesitás dejar la casa antes de esa fecha.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en Mariano Roque Alonso",
    paragraphs: [
      "Antes de entregarte las llaves, la mayoría de los propietarios en Mariano Roque Alonso pide alguna garantía: un garante con propiedad a su nombre, un seguro de caución o un depósito. Cuál de las tres acepta cada propietario es su decisión.",
      "El primer pago suele juntar el alquiler del mes en curso con el monto acordado como garantía. Si la casa está dentro de un conjunto cerrado, pedí que el contrato diga si el mantenimiento común entra en ese pago o se cobra aparte.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar una casa en Mariano Roque Alonso?",
      a: "Depende de la zona y de si la casa está cerca de la ruta, del centro o de la costa. Arriba mostramos el rango de las casas publicadas hoy; no damos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿Hay casas económicas para alquilar en Mariano Roque Alonso?",
      a: "Sí, sobre todo hacia los barrios más alejados del centro y de la costa. El filtro de precio de esta página te muestra primero las que piden menos por mes.",
    },
    {
      q: "¿Conviene alquilar cerca de la ruta en Mariano Roque Alonso?",
      a: "Depende de para qué la uses: si trabajás cerca o necesitás salir rápido hacia Asunción o el interior puede convenirte, pero el tránsito de camiones se nota más que en un barrio alejado de la ruta.",
    },
    {
      q: "¿Piden garante para alquilar una casa en Mariano Roque Alonso?",
      a: "Casi siempre se pide alguna garantía antes de entregar las llaves: un garante, un seguro de caución o un depósito. Es el propietario, no una norma general, quien decide cuál de las tres acepta.",
    },
    {
      q: "¿Qué hago si hoy no hay una casa que me sirva en Mariano Roque Alonso?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y la zona que te interesa. Nuestro equipo te escribe por WhatsApp cuando aparece una casa en alquiler en Mariano Roque Alonso que encaje.",
    },
  ],
  claimsToVerify: [
    "Mariano Roque Alonso borders both Asunción and Luque, and fronts the Bahía de Asunción (the bay of the Paraguay river).",
    "Low-lying areas of Mariano Roque Alonso near the bay/river can flood (anegarse) during periods of heavy rain or high river levels.",
    "Mariano Roque Alonso has significant warehouse/industrial (depósitos y fábricas) activity due to its highway access toward Asunción and the interior.",
    "Mariano Roque Alonso also borders Limpio.",
    "A guarantor, a seguro de caución, or a cash deposit are the common forms of rental guarantee asked by landlords in Paraguay.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching rental house appears in Mariano Roque Alonso.",
  ],
};
