/**
 * Place page: /zonas/asuncion — the city guide every Asunción category page
 * borrows its excerpt from. Keyword group "casa en asuncion venta" (the
 * largest place group in docs/kwp/real-estate-paraguay-2026-10-01.md); the
 * category searches themselves are owned by the evergreen pages, so this page
 * takes the "what is each part of the city like" angle.
 *
 * DRAFT (plan decision P-6): written without the founder's notes or photos.
 * Live but noindex until every claim below is checked and the file is flipped
 * to `status: "verified"` with 5–8 real photos.
 */
import type { PlacePage } from "./types";

export const asuncion: PlacePage = {
  city: "asuncion",
  door: "inmobiliaria",
  status: "draft",
  keyword: "vivir en asunción",
  secondaryKeywords: ["barrios de asunción", "mejores barrios de asunción", "zonas de asunción para vivir"],
  h1: "Vivir en Asunción: barrios, accesos y qué mirar antes de mudarte",
  metaDescription:
    "Cómo es cada zona de Asunción, quién vive en cada una, cómo moverse y qué revisar antes de comprar o alquilar, con lo publicado hoy.",
  lede:
    "La capital concentra oficinas, hospitales, universidades y la mayor oferta de departamentos del país. Esta guía resume cómo cambia la ciudad de un barrio a otro.",
  excerpt:
    "Asunción cambia mucho de un barrio a otro: torres y oficinas sobre los grandes ejes del este, casas con patio en los barrios residenciales, y zonas bajas cerca del río donde conviene preguntar por el agua antes de firmar. La guía de la ciudad explica cada zona y qué revisar antes de comprar o alquilar.",
  overview: {
    title: "Una capital que se vive por barrios",
    paragraphs: [
      "Asunción está sobre la orilla del río Paraguay y es el centro de un área metropolitana que se extiende hacia Luque, San Lorenzo, Lambaré y Fernando de la Mora. Mucha gente trabaja en la capital y vive en esas ciudades vecinas, así que el tránsito de entrada por la mañana y de salida por la tarde es parte de la vida diaria.",
      "Quien busca vivienda en la ciudad suele elegir primero el barrio y después la propiedad: entre una calle arbolada con casas bajas y una avenida con torres hay pocas cuadras, pero la experiencia de vivir en cada una es muy distinta.",
    ],
  },
  zones: {
    title: "Las zonas de Asunción y qué se encuentra en cada una",
    intro:
      "No hay una frontera oficial entre estas zonas; es la forma en que la gente las nombra al buscar casa.",
    items: [
      {
        name: "Villa Morra, Recoleta y Carmelitas",
        text:
          "El este comercial de la ciudad: shoppings, restaurantes, oficinas y la mayor parte de los edificios de departamentos nuevos. Hay casas, pero lo que más se publica son departamentos y oficinas.",
        typicalTypes: ["departamento", "oficina", "comercial"],
      },
      {
        name: "Las Mercedes, Manorá y Los Laureles",
        text:
          "Barrios residenciales con calles más tranquilas y casas con patio, cerca de los ejes comerciales sin estar sobre ellos. Atraen a familias que quieren quedarse dentro de la capital.",
        typicalTypes: ["casa", "duplex", "departamento"],
      },
      {
        name: "El centro histórico",
        text:
          "Edificios de gobierno, bancos y comercio tradicional cerca del río. De día tiene mucho movimiento y de noche se vacía; abundan los locales y las oficinas, y algunos edificios antiguos se reciclan como departamentos.",
        typicalTypes: ["comercial", "oficina", "departamento"],
      },
      {
        name: "Sajonia, Mburicaó y los barrios hacia el río",
        text:
          "Barrios tradicionales con casas de varias épocas y calles con mucha vida de barrio. Las partes más bajas, cerca de la costa, conviene mirarlas con el río crecido en mente.",
        typicalTypes: ["casa", "terreno"],
      },
      {
        name: "Trinidad, Barrio Jara y Loma Pytã",
        text:
          "Hacia el norte y el noreste la ciudad se vuelve más residencial y los precios de alquiler suelen ser más accesibles; es donde más se buscan casas y departamentos económicos.",
        typicalTypes: ["casa", "departamento"],
      },
    ],
  },
  whoItSuits: {
    title: "Para quién conviene cada parte de la ciudad",
    paragraphs: [
      "Quien trabaja en oficinas del este suele buscar departamento cerca de los grandes ejes para caminar o hacer trayectos cortos. Las familias con chicos en edad escolar miran más los barrios residenciales, donde una casa con patio todavía es posible sin salir de la capital.",
      "Estudiantes y personas que llegan del interior suelen empezar alquilando en barrios cercanos a las universidades y a las líneas de colectivo principales, y los inversores apuntan a departamentos chicos que se alquilan con facilidad.",
    ],
  },
  access: {
    title: "Cómo moverse en Asunción",
    paragraphs: [
      "No hay tren ni metro: el transporte público son los colectivos, con muchas líneas que entran desde las ciudades vecinas. Avenidas como Mariscal López, España y Aviadores del Chaco ordenan el movimiento hacia el este, y la Costanera bordea el río en la zona norte del centro.",
      "El aeropuerto internacional queda en la vecina Luque. Antes de decidir, conviene hacer el trayecto de casa al trabajo en el horario real: la diferencia entre la hora pico y el resto del día puede ser grande.",
    ],
  },
  services: {
    title: "Servicios: salud, educación y compras",
    paragraphs: [
      "La capital reúne los principales hospitales y sanatorios privados del país, además de colegios y universidades públicas y privadas. Los shoppings y supermercados grandes se concentran en el este, mientras que en los barrios tradicionales todavía pesa mucho el almacén y la despensa de la esquina.",
    ],
  },
  buying: {
    title: "Qué revisar antes de comprar en Asunción",
    paragraphs: [
      "La compra se formaliza ante un escribano, que verifica el título en los Registros Públicos y que no haya deudas ni embargos. Pedí también el estado del impuesto inmobiliario municipal y, en un departamento, las expensas y el reglamento del edificio.",
      "En las zonas bajas cercanas al río, preguntá a los vecinos cómo se comportó la calle en las últimas crecidas y lluvias fuertes. En casas antiguas, revisá la instalación eléctrica y la potencia contratada con la ANDE antes de sumar aires acondicionados.",
    ],
  },
  renting: {
    title: "Alquilar en Asunción",
    paragraphs: [
      "Lo habitual es un contrato por un plazo fijo con un depósito y una garantía: un garante con propiedad o una garantía ofrecida por una empresa. Leé quién paga la ANDE, el agua de la ESSAP y las expensas, y si el precio está en guaraníes o en dólares.",
      "Los departamentos amueblados cerca de los ejes comerciales se alquilan rápido; si encontrás uno que te sirve, conviene tener los papeles de la garantía listos antes de visitarlo.",
    ],
  },
  faq: [
    {
      q: "¿Cuál es el mejor barrio de Asunción para vivir?",
      a: "Depende de lo que busques: los barrios del este quedan cerca de oficinas y comercios, los residenciales ofrecen calles tranquilas y casas con patio, y los del norte suelen tener alquileres más accesibles. Recorrelos en distintos horarios antes de decidir.",
    },
    {
      q: "¿Es mejor alquilar en Asunción o en una ciudad vecina?",
      a: "Las ciudades del área metropolitana suelen ofrecer más metros por el mismo presupuesto, a cambio de más tiempo de viaje. Si trabajás en la capital, medí el trayecto en hora pico antes de elegir.",
    },
    {
      q: "¿Qué piden para alquilar un departamento?",
      a: "En general documento de identidad, comprobante de ingresos, un depósito y una garantía, que puede ser un garante con propiedad o una garantía contratada con una empresa.",
    },
    {
      q: "¿Qué zonas de Asunción se inundan?",
      a: "Las más expuestas son las zonas bajas cercanas al río y algunas calles donde el agua de lluvia corre con fuerza. Antes de comprar o alquilar, preguntá a los vecinos y mirá la calle un día de lluvia.",
    },
  ],
  photos: [],
  claimsToVerify: [
    "Asunción is on the bank of the río Paraguay.",
    "The metropolitan area extends to Luque, San Lorenzo, Lambaré and Fernando de la Mora, and many people commute into the capital.",
    "Villa Morra, Recoleta and Carmelitas are the commercial east, with shopping centres, restaurants, offices and most new apartment buildings.",
    "Las Mercedes, Manorá and Los Laureles are quieter residential barrios with houses with yards, near the commercial axes.",
    "The historic centre near the river holds government buildings, banks and traditional commerce, is busy by day and empties at night, and some old buildings are converted to flats.",
    "Sajonia and Mburicaó are traditional barrios toward the river; their lowest parts are exposed when the river rises.",
    "Trinidad, Barrio Jara and Loma Pytã (north/north-east) are more residential with more affordable rents.",
    "Asunción has no train or metro; public transport is buses (colectivos), with many lines from the neighbouring cities.",
    "Mariscal López, España and Aviadores del Chaco are main avenues toward the east; the Costanera runs along the river north of the centre.",
    "The international airport is in Luque.",
    "The capital concentrates the main hospitals and private sanatoriums, and public and private universities.",
    "Large shopping centres and supermarkets concentrate in the east.",
    "A purchase is formalised before an escribano who checks the title in the Registros Públicos for debts and embargos.",
    "The impuesto inmobiliario is municipal; flats have expensas and a building reglamento.",
    "Low areas near the river flood in river rises and heavy rain.",
    "Electricity is ANDE; water in Asunción is ESSAP; contracted power matters when adding air conditioners.",
    "Rentals usually require a fixed-term contract, a deposit and a guarantee (a property-owning guarantor or a company-issued guarantee).",
    "Rents may be quoted in guaraníes or dollars.",
    "Furnished flats near the commercial axes rent quickly.",
    "Renting usually requires ID and proof of income.",
  ],
};
