/**
 * Evergreen page: /venta/san-bernardino/terrenos — "terrenos en san
 * bernardino" (210/mo) and its merged land variants
 * (docs/seo-evergreen-keywords.md, table C1 / decision S10).
 *
 * San Bernardino is new to the location tree (S10): this page 404s on
 * `terreno.com.py` until `npm run seed:locations` and `npm run cron:geo`
 * run on production. Land-only content per the "Land pages" rule: this door
 * is the land specialist, so financing, titling and servicios are covered
 * here in depth and the casas search for the same city has its own page.
 */
import type { EvergreenPage } from "./types";

export const ventaSanBernardinoTerrenos: EvergreenPage = {
  path: "/venta/san-bernardino/terrenos",
  door: "terreno",
  keyword: "terrenos en san bernardino",
  secondaryKeywords: [
    "loteamientos en san bernardino",
    "terrenos en venta san bernardino",
    "terrenos en venta en san bernardino",
    "venta de terreno en san bernardino",
    "terrenos de venta en san bernardino",
    "lotes en venta en san bernardino",
    "san bernardino terrenos",
    "terrenos baratos en san bernardino",
    "venta de lotes en san bernardino",
  ],
  h1: "Terrenos en San Bernardino",
  lede: "Mirá los lotes publicados hoy junto al lago Ypacaraí, filtrá por precio y dejá tu búsqueda si buscás algo puntual que todavía no está publicado.",
  metaDescription:
    "Terrenos en San Bernardino, junto al lago Ypacaraí: filtrá por precio y dejá tu búsqueda si no encontrás lo que buscás.",
  priceBands: [
    { max: 20_000 },
    { min: 20_001, max: 50_000 },
    { min: 50_001, max: 100_000 },
    { min: 100_001 },
  ],
  barrios: {
    title: "Zonas de San Bernardino para elegir un lote",
    intro:
      "San Bernardino queda en el departamento de Cordillera, sobre la orilla del lago Ypacaraí, y la cercanía al agua marca buena parte de la diferencia entre un lote y otro. Estas son las zonas que conviene distinguir antes de comparar precios.",
    items: [
      {
        name: "Frente al lago",
        text:
          "La franja más próxima a la orilla concentra la demanda de quien busca un lote con salida al agua. Preguntá cómo se comporta ese lote puntual cuando sube el lago tras lluvias fuertes: no todos los terrenos ribereños reaccionan igual.",
      },
      {
        name: "Alrededor del centro",
        text:
          "Los lotes cercanos a la plaza y al casco urbano suelen ser más chicos y ya tener título individual, por venir de loteamientos antiguos. Lo que se gana en trámite simple, se pierde en superficie disponible.",
      },
      {
        name: "Sobre el camino de acceso",
        text:
          "Los terrenos que dan al camino que conecta San Bernardino con la ruta hacia el resto de Cordillera convienen a quien viaja seguido a Asunción, aunque conviene revisar esa vía en distintos horarios antes de decidir.",
      },
      {
        name: "Más retirado del lago",
        text:
          "Loteamientos más nuevos, más lejos de la costa, donde el metro cuadrado rinde más y los lotes suelen ser más grandes. A cambio, es más probable que el fraccionamiento siga en trámite o falte algún servicio: conviene preguntarlo.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los precios publicados",
    paragraphs: [
      "El rango de arriba sale de los lotes publicados hoy en San Bernardino en este portal: son precios pedidos por quien vende, no cierres de operación, y se mueven según qué loteamientos tengan aviso activo.",
      "En esta zona turística es habitual encontrar lotes publicados en dólares; el portal filtra por el equivalente en esa moneda, así que convertí tu presupuesto en guaraníes antes de mover los filtros.",
      "Entre dos lotes de superficie parecida, lo que más cambia el precio es la distancia al agua y si el título ya está individualizado o depende de una mensura del loteamiento completo.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un terreno en San Bernardino",
    intro:
      "Un lote lindo a la vista no dice nada sobre su situación legal ni sobre sus servicios. Antes de comprometer una seña, conviene tener resuelto cada uno de estos puntos:",
    items: [
      "Si el lote ya tiene título individual o depende de la mensura y el fraccionamiento de un loteamiento más grande, todavía en trámite ante la municipalidad.",
      "El informe de condiciones de dominio, para confirmar que el lote no tiene embargos ni hipotecas a nombre de quien lo vende.",
      "Si el pago es al contado o en cuotas directas con el loteador, y qué pasa con la posesión hasta cancelar la última cuota.",
      "Si hay conexión de ANDE cercana o hay que costear el tendido, y de dónde sale el agua: junta de saneamiento o pozo propio.",
      "Si el lote se encharca o queda bajo respecto de la calle, algo que se nota después de una lluvia y no en una visita en día seco.",
      "Qué se puede construir según el uso del suelo municipal, y si la zona pide algún permiso adicional por su cercanía al lago.",
    ],
  },
  financing: {
    title: "Cómo se paga un terreno en San Bernardino",
    paragraphs: [
      "La forma más simple sigue siendo el contado, pero buena parte de los loteamientos ofrece cuotas directas con el loteador, sin pasar por un banco. Las condiciones —cantidad de cuotas, interés, qué pasa si te atrasás— las fija cada loteador y conviene pedirlas por escrito.",
      "Un lote 'sin entrega' significa que se firma el compromiso y se empieza a pagar sin recibir la posesión física todavía, algo común mientras el loteamiento termina sus trabajos: preguntá desde cuándo vas a poder ocuparlo.",
      "También existe el crédito bancario o de una financiera para comprar terreno, con sus propios requisitos de garantía, distintos de las cuotas que ofrece el loteador.",
    ],
  },
  faq: [
    {
      q: "¿Los terrenos en San Bernardino se pueden pagar en cuotas?",
      a: "Muchos loteamientos de la zona ofrecen cuotas directas con quien vende el lote, además de la opción de pagar al contado. Cada loteador fija sus propias condiciones, así que conviene pedirlas por escrito antes de señar.",
    },
    {
      q: "¿Qué diferencia hay entre un lote de loteamiento y uno de un dueño particular?",
      a: "Un lote dentro de un loteamiento depende de la mensura y el fraccionamiento de todo el conjunto, que puede estar aprobado o seguir en trámite. Un lote de un dueño particular suele tener su propio título individual desde antes, pero conviene confirmarlo igual con el informe de condiciones de dominio.",
    },
    {
      q: "¿Los terrenos junto al lago valen más que los del interior?",
      a: "En general sí, pero conviene comparar lote por lote: algunos terrenos ribereños tienen situaciones de anegamiento que otros no tienen.",
    },
    {
      q: "¿Qué servicios tiene un terreno en San Bernardino?",
      a: "Varía según la zona y el loteamiento: hay sectores con conexión de ANDE y agua de una junta de saneamiento ya instaladas, y otros donde falta parte del tendido. Conviene preguntarlo lote por lote antes de comparar precios.",
    },
    {
      q: "¿Qué hago si hoy no hay un terreno que me sirva?",
      a: "Dejá tu búsqueda en el formulario de esta página con la zona y el presupuesto que buscás. La recibe nuestro equipo, que te escribe por WhatsApp cuando entra un terreno en San Bernardino que encaje.",
    },
  ],
  claimsToVerify: [
    "San Bernardino is a city in the Cordillera department of Paraguay, on the shore of Lake Ypacaraí.",
    "Land close to the lakeshore in San Bernardino carries higher demand / commands a premium versus land farther from the water.",
    "Some lakeshore land in San Bernardino is subject to flooding or waterlogging after the lake level rises from heavy rain.",
    "Older, more central loteamientos around San Bernardino's town center tend to have smaller, already-individually-titled lots.",
    "There is a road connecting San Bernardino to the wider Cordillera road network, used by people commuting to/from Asunción.",
    "Newer loteamientos farther from the lake tend to offer larger lots at a lower price per square meter, and some may still be pending municipal fraccionamiento approval.",
    "A lot inside a loteamiento can depend on that loteamiento's overall mensura/fraccionamiento being approved by the Municipalidad de San Bernardino before it gets an individual title.",
    "Land in San Bernardino is commonly listed in USD, consistent with it being a lake-tourism destination.",
    "ANDE is Paraguay's national electricity utility; water in areas without an ESSAP network can come from a junta de saneamiento or a private well.",
    "Loteadoras (land developers) commonly offer direct installment plans ('cuotas') as an alternative to paying contado, with their own terms.",
    "'Sin entrega' in a land sale means the buyer signs and starts paying before receiving physical possession of the lot.",
    "Banks and financieras also offer credit specifically for land purchase, with their own collateral requirements, separate from a loteadora's own installment plan.",
    "Operational promise: a search left on this page is read by the team, who write back by WhatsApp when a matching lot in San Bernardino appears.",
  ],
};
