/**
 * Evergreen page: /venta/luque/departamentos — "departamentos en luque"
 * (260/mo), no secondary phrases in the table (docs/seo-evergreen-keywords.md,
 * table A #7).
 *
 * The pilot (/venta/luque/casas) already covers Luque's zones from the house
 * angle. This page's zone section is written fresh, from the apartment
 * angle — where buildings get built, shared walls, cocheras, expensas,
 * condominios — and shares no sentence with the pilot or with the sibling
 * duplex page.
 */
import type { EvergreenPage } from "./types";

export const ventaLuqueDepartamentos: EvergreenPage = {
  path: "/venta/luque/departamentos",
  door: "inmobiliaria",
  keyword: "departamentos en luque",
  secondaryKeywords: [],
  h1: "Departamentos en venta en Luque",
  lede: "Mirá los edificios con departamentos en venta en Luque, compará expensas y cochera entre unidades y dejá tu búsqueda si todavía no aparece la tuya.",
  metaDescription:
    "Departamentos en venta en Luque: compará precio, expensas y cochera entre edificios y dejá tu búsqueda para enterarte de lo nuevo publicado.",
  priceBands: [{ max: 60_000 }, { min: 60_001, max: 100_000 }, { min: 100_001 }],
  barrios: {
    title: "Dónde se construyen los edificios de departamentos en Luque",
    intro:
      "Un departamento no se elige solo por el barrio: pesa también el edificio, la copropiedad y si está dentro de un condominio. Así se reparte la oferta de departamentos según la zona de Luque.",
    items: [
      {
        name: "Edificios en el centro de Luque",
        text:
          "En el casco céntrico, cerca de la plaza y de la municipalidad, los departamentos suelen estar en edificios de pocos pisos, sin demasiadas amenities pero con todo el comercio y los colegios a pie. Las expensas ahí tienden a cubrir poco más que portería y mantenimiento de las áreas comunes.",
      },
      {
        name: "Condominios sobre el corredor de la Conmebol y Ñu Guasu",
        text:
          "Es la zona con más edificios de departamentos recientes de Luque, muchos dentro de condominios cerrados con seguridad permanente y cochera propia incluida en la unidad. Las expensas suelen ser más altas que en el centro, así que conviene pedir el monto exacto antes de comparar unidades.",
      },
      {
        name: "Edificios cerca del aeropuerto y la autopista",
        text:
          "Los departamentos sobre este corredor atraen a quien viaja seguido o trabaja cerca del aeropuerto Silvio Pettirossi, por la salida directa hacia Asunción. Conviene visitar la unidad en distintos horarios para chequear cuánto se filtra el ruido del tránsito y de los vuelos hacia el interior del edificio.",
      },
      {
        name: "Edificios en barrios más alejados del centro",
        text:
          "Hacia sectores como Zárate Isla o Mora Cué aparecen menos edificios de departamentos, casi siempre con pocas unidades y sin muchas comodidades compartidas. Suelen pedirse precios más bajos por metro cuadrado, a cambio de una oferta de transporte público más limitada.",
      },
    ],
  },
  prices: {
    title: "Precios de los departamentos publicados en Luque",
    paragraphs: [
      "Los rangos de arriba se calculan sobre los departamentos publicados hoy en este portal en Luque: son precios pedidos por quien vende, no cifras de cierre, y varían según lo que entra y sale de la lista cada semana.",
      "El piso, la vista y si la unidad tiene cochera propia o compartida cambian bastante el precio pedido dentro de un mismo edificio. Preguntá siempre si el precio incluye cochera y depósito o si esos van aparte.",
      "Al comparar dos departamentos en Luque conviene mirar también el monto de las expensas, porque un precio de venta más bajo puede quedar compensado por expensas más altas mes a mes.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un departamento en Luque",
    intro:
      "Comprar en un edificio suma preguntas sobre la copropiedad que una casa no tiene. Antes de avanzar, conviene chequear:",
    items: [
      "El reglamento de copropiedad del edificio y si permite alquilar la unidad más adelante.",
      "El monto de las expensas actuales y si el edificio tiene alguna deuda o gasto extraordinario pendiente.",
      "El estado del ascensor, del tanque de agua y de las bombas, no solo el interior de la unidad.",
      "Si la cochera está incluida en la escritura de la unidad o se compra o se alquila por separado.",
      "El impuesto inmobiliario municipal de Luque al día, con comprobante del último pago.",
      "Si la unidad tiene humedad en la pared medianera compartida con el departamento vecino.",
      "El acceso real al edificio en auto en horas de mucho tránsito, sobre todo si queda cerca del aeropuerto o de la autopista.",
      "Quién administra el edificio y cómo se resuelven los reclamos entre copropietarios.",
    ],
  },
  financing: {
    title: "Cómo financiar un departamento en Luque",
    paragraphs: [
      "Un departamento en Luque se puede comprar al contado o con crédito hipotecario de un banco o una financiera, igual que una casa. Algunas entidades ofrecen líneas para primera vivienda con fondos de la Agencia Financiera de Desarrollo, con condiciones propias de cada entidad.",
      "En la página de financiamiento del portal juntamos los programas que conocemos con una estimación de cuota mensual para comparar. Sirve para planificar el presupuesto, no reemplaza la aprobación final del banco o la financiera que elijas.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta un departamento en Luque?",
      a: "Depende del edificio, del piso y de si la unidad tiene cochera propia. Los rangos de arriba muestran lo publicado hoy en el portal, no un promedio de la ciudad.",
    },
    {
      q: "¿Los departamentos en Luque tienen cochera incluida?",
      a: "No siempre: en algunos edificios la cochera va con la unidad y en otros se compra o se alquila aparte. Confirmalo con el vendedor antes de comparar precios entre dos departamentos.",
    },
    {
      q: "¿Qué son las expensas y quién las paga?",
      a: "Son el gasto mensual que cubre el mantenimiento de las áreas comunes del edificio, y las paga quien vive en la unidad, sea propietario o inquilino. El monto varía mucho de un edificio a otro.",
    },
    {
      q: "¿Conviene un departamento cerca del aeropuerto de Luque?",
      a: "Depende de tu rutina: si viajás seguido o trabajás cerca, la cercanía pesa a favor; si te molesta el ruido, conviene visitar la unidad en distintos horarios antes de decidir.",
    },
    {
      q: "¿Y si hoy no hay un departamento que me sirva en Luque?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto. Te avisamos por WhatsApp en cuanto se publique un departamento en Luque que encaje.",
    },
  ],
  claimsToVerify: [
    "The CONMEBOL headquarters and the Ñu Guasu park are in / next to Luque, and newer apartment buildings and closed condominios concentrate along that corridor.",
    "The Silvio Pettirossi international airport is in Luque, and an autopista links Luque with Asunción.",
    "Zárate Isla and Mora Cué are barrios/compañías of Luque with fewer apartment buildings, mostly smaller developments.",
    "The impuesto inmobiliario for a Luque property is paid to the Municipalidad de Luque.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching apartment appears.",
  ],
};
