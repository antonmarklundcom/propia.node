/**
 * Evergreen page: /alquiler/luque/departamentos — "alquiler de departamento
 * en luque" (90/mo) and its merged variants
 * (docs/seo-evergreen-keywords.md, table A #19).
 *
 * Written from the apartment-block angle (piso, ascensor, expensas del
 * edificio) — distinct from alquiler-luque-casas.ts and the venta pilot.
 */
import type { EvergreenPage } from "./types";

export const alquilerLuqueDepartamentos: EvergreenPage = {
  path: "/alquiler/luque/departamentos",
  door: "inmobiliaria",
  keyword: "alquiler de departamento en luque",
  secondaryKeywords: [
    "departamentos en alquiler luque",
    "alquiler de departamento en luque económicos",
  ],
  h1: "Departamentos en alquiler en Luque",
  lede: "Filtrá por precio mensual, mirá qué edificios tienen departamentos disponibles hoy y dejanos tu búsqueda si todavía no aparece el que necesitás.",
  metaDescription:
    "Departamentos en alquiler en Luque: filtrá por precio mensual, mirá los avisos disponibles hoy y dejá tu búsqueda para un departamento nuevo.",
  priceBands: [{ max: 250 }, { min: 251, max: 400 }, { min: 401, max: 600 }, { min: 601 }],
  barrios: {
    title: "Dónde alquilar un departamento en Luque",
    intro:
      "Un departamento en Luque no es solo una cuestión de precio: el edificio, el piso y si hay ascensor cambian bastante la vida diaria. Esto es lo que distingue a cada zona.",
    items: [
      {
        name: "Centro",
        text:
          "En los edificios del centro predominan las construcciones más antiguas, muchas sin ascensor, a pocas cuadras de comercios y de la parada de colectivo. Conviene preguntar en qué piso está el departamento antes de ilusionarte con el precio: subir varios pisos con bolsas todos los días pesa.",
      },
      {
        name: "Zona aeropuerto y autopista",
        text:
          "Cerca de la autopista se alquilan departamentos en edificios más nuevos, pensados para quien trabaja en Asunción y quiere salir rápido cada mañana. El ruido de los aviones se nota distinto según el piso y la orientación de las ventanas, así que conviene visitar el departamento antes de firmar.",
      },
      {
        name: "Zona Conmebol y Ñu Guasu",
        text:
          "Los edificios más nuevos de Luque se concentran hacia este sector, muchos con pileta, gimnasio o seguridad en la entrada. Esas comodidades suben las expensas del edificio, que se pagan aparte del alquiler: pedí el monto exacto antes de comparar un departamento con otro.",
      },
      {
        name: "Zonas residenciales más tranquilas",
        text:
          "Alejados del tránsito más pesado hay edificios más chicos, de pocos pisos, con departamentos que rinden más por el mismo alquiler. A cambio, el edificio puede no tener portero ni cámaras, así que preguntá cómo se maneja el acceso de visitas y encomiendas.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los alquileres de departamentos publicados",
    paragraphs: [
      "El rango que ves arriba corresponde a los departamentos publicados hoy en este portal para alquilar en Luque: son los montos que pide cada propietario o inmobiliaria, y cambian a medida que entran y salen avisos.",
      "Hay departamentos publicados en guaraníes y otros en dólares. El portal filtra y ordena por el equivalente en dólares, así que convertí tu presupuesto mensual antes de mover los filtros si pensás en guaraníes.",
      "Las expensas del edificio casi nunca están incluidas en el alquiler que se publica: cubren desde la limpieza de áreas comunes hasta la seguridad, y su monto varía mucho según los servicios del edificio. Pedí ese detalle antes de comparar dos departamentos por precio.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar un departamento en Luque",
    intro:
      "Un departamento se visita distinto a una casa: hay cosas del edificio que no dependen del propietario. Antes de firmar, fijate en:",
    items: [
      "Cuánto son las expensas del edificio y qué cubren exactamente: seguridad, ascensor, limpieza de pasillos, pileta si tiene.",
      "Si el edificio tiene ascensor y, si no lo tiene, en qué piso está el departamento que estás mirando.",
      "Cómo se controla el ingreso de visitas y de encomiendas cuando no estás: portero, cámara, conserje o nada de eso.",
      "Si el agua y la luz de las áreas comunes están incluidas en las expensas o se reparten entre los propietarios de otra forma.",
      "El estado de la cañería y de la instalación eléctrica del departamento puntual, no solo del edificio en general.",
      "Si el edificio permite mascotas y si el reglamento pone algún límite de tamaño o cantidad.",
      "Cuánto dura el contrato del departamento y si el preaviso para dejarlo corre desde que avisás al propietario o desde que avisás a la administración del edificio.",
    ],
  },
  financing: {
    title: "Qué necesitás para mudarte a un departamento alquilado en Luque",
    paragraphs: [
      "Para alquilar un departamento en Luque, la mayoría de los propietarios pide alguna garantía antes de entregar las llaves: un garante con propiedad a su nombre, un seguro de caución o un depósito. Cada propietario decide cuál acepta, así que conviene preguntarlo antes de avanzar con la visita.",
      "El primer pago suele juntar el alquiler del mes en curso con el monto acordado como garantía o depósito, y a veces la primera cuota de expensas. Pedí que el contrato detalle esos montos por separado para no confundirlos con el alquiler mensual.",
      "La duración del contrato y cómo se renueva o se termina antes de tiempo lo fija cada contrato de alquiler: conviene leerlo completo, no solo la cláusula del precio.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar un departamento en Luque?",
      a: "Depende del edificio, el piso y si tiene comodidades como pileta o seguridad en la entrada. Arriba mostramos el rango de los departamentos publicados hoy; no damos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿Las expensas están incluidas en el alquiler?",
      a: "Casi nunca. Las expensas del edificio se cobran aparte y cubren servicios comunes como seguridad o limpieza: pedí el monto exacto antes de comparar un departamento con otro.",
    },
    {
      q: "¿Piden garante para alquilar un departamento en Luque?",
      a: "La mayoría de los propietarios pide alguna garantía, ya sea un garante, un seguro de caución o un depósito. Cada propietario decide cuál acepta, así que conviene preguntarlo antes de visitar el departamento.",
    },
    {
      q: "¿Hay departamentos económicos para alquilar en Luque?",
      a: "Sí, sobre todo en edificios más chicos o alejados de la zona de mayor movimiento. El filtro de precio de esta página te muestra primero los que piden menos por mes.",
    },
    {
      q: "¿Qué hago si hoy no hay un departamento que me sirva en Luque?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto mensual. Nuestro equipo te escribe por WhatsApp cuando aparece un departamento en alquiler en Luque que encaje.",
    },
  ],
  claimsToVerify: [
    "Older buildings in central Luque commonly lack an elevator (ascensor).",
    "Newer apartment buildings in the CONMEBOL / Ñu Guasu area of Luque commonly offer amenities like a pool, gym or entrance security, and tend to charge higher building expensas as a result.",
    "Building expensas (common-area fees) in Paraguay are typically billed separately from the monthly rent and are not usually included in the advertised rent figure.",
    "A guarantor, a seguro de caución, or a cash deposit are the common forms of rental guarantee asked by landlords in Paraguay.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching rental apartment appears in Luque.",
  ],
};
