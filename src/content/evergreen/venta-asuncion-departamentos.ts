/**
 * Evergreen page: /venta/asuncion/departamentos — "departamentos en venta
 * asuncion" (260/mo) and its merged variants (docs/seo-evergreen-keywords.md,
 * table A #6), plus "departamento en asuncion" (founder decision: both the
 * rental and the sale page target that search, each with its own long tail).
 *
 * Targets the sale long tail (comprar, usados, en pozo, financiados,
 * baratos, precio). The "en pozo" section speaks of pre-construction only in
 * general terms and points to the portal's projects page, never promising
 * units.
 */
import type { EvergreenPage } from "./types";

export const ventaAsuncionDepartamentos: EvergreenPage = {
  path: "/venta/asuncion/departamentos",
  door: "inmobiliaria",
  keyword: "departamentos en venta asuncion",
  secondaryKeywords: [
    "venta de departamentos baratos en asuncion paraguay",
    "venta de departamentos en asuncion",
    "departamentos en pozo asuncion",
    "venta de departamentos usados en asuncion",
    "departamentos baratos en asuncion",
    "departamentos en venta en asuncion paraguay",
    "comprar departamento en asuncion",
    "venta de departamentos en asuncion financiados",
    "precio de departamentos en asuncion",
    "departamento en asuncion",
  ],
  h1: "Departamentos en venta en Asunción",
  lede: "Compará precios por metro cuadrado, filtrá entre lo ya construido y lo que todavía está en pozo, y dejá tu búsqueda si no aparece el departamento que buscás.",
  metaDescription:
    "Departamentos en venta en Asunción: comprá con precios comparables por metro cuadrado y dejá tu búsqueda para enterarte de lo nuevo publicado.",
  priceBands: [
    { max: 80_000 },
    { min: 80_001, max: 130_000 },
    { min: 130_001, max: 200_000 },
    { min: 200_001 },
  ],
  barrios: {
    title: "Dónde se venden departamentos en Asunción",
    intro:
      "La oferta de departamentos no se reparte igual por toda la capital: se concentra en corredores puntuales según sea edificio nuevo o edificio reciclado. Esto es lo que cambia entre las zonas donde más aparecen departamentos en venta.",
    items: [
      {
        name: "Torres nuevas en Villa Morra, Carmelitas y Manorá",
        text:
          "Es la zona con más edificios recientes y más oferta en pozo: departamentos que todavía se están construyendo y se venden sobre plano. Antes de comprometerte con una unidad en pozo, pedí el plan de obra y quién respalda el proyecto.",
      },
      {
        name: "Microcentro y alrededores del Palacio de Gobierno",
        text:
          "Concentra los edificios más antiguos de la capital, muchos ya reciclados para vivienda. Los departamentos suelen ser usados, con expensas y reglamentos de copropiedad distintos: conviene pedirlos antes de decidir.",
      },
      {
        name: "Corredor de la Costanera y el Jardín Botánico",
        text:
          "Los desarrollos más nuevos con vista al río se concentran sobre este corredor. Suelen ser los departamentos con el precio pedido más alto por metro cuadrado de la capital, con amenities como pileta o gimnasio cubiertos por las expensas.",
      },
      {
        name: "Barrios intermedios como Trinidad y San Vicente",
        text:
          "Ofrecen edificios más chicos y de menos pisos, con precios de reventa más accesibles que los de las torres nuevas. Son una alternativa para quien busca un departamento usado con buena ubicación sin pagar por amenities que no va a usar.",
      },
    ],
  },
  prices: {
    title: "Qué mirar en el precio de un departamento en Asunción",
    paragraphs: [
      "Los rangos de arriba salen de los departamentos publicados hoy en el portal, con el precio pedido por quien vende: no son precios de cierre ni un promedio de la ciudad, y cambian según lo que se publica y se retira cada semana.",
      "Comparar por metro cuadrado ayuda más que comparar por precio total: un departamento chico en un edificio nuevo puede costar más por metro que uno grande y usado en otra zona. Fijate también qué cubren las expensas, porque portería, pileta o cochera no están en todos los edificios.",
      "Los departamentos en pozo se publican con el precio pedido para esa etapa de la obra, y ese precio suele subir con el avance de la obra. La página de proyectos del portal reúne los desarrollos que conocemos, con información general y sin listar unidades.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un departamento en Asunción",
    intro:
      "Un departamento suma preguntas que una casa no tiene, por el edificio y por la copropiedad. Antes de avanzar, conviene tener respuesta para:",
    items: [
      "El título de propiedad de la unidad y si figura inscripto a nombre de quien vende en el Registro correspondiente.",
      "El monto de las expensas actuales y si hay algún aumento previsto o alguna deuda pendiente del edificio.",
      "El reglamento de copropiedad: qué se puede y qué no se puede hacer con la unidad, y si permite alquilarla.",
      "El estado del ascensor, de la cisterna y de las áreas comunes, no solo el interior de la unidad.",
      "Si la cochera y el depósito forman parte de la escritura o se alquilan por separado.",
      "Cómo llega el agua a los pisos más altos del edificio en horas de mucho consumo.",
      "Si compraste en pozo, qué garantías da la constructora sobre la fecha de entrega y qué pasa si se demora.",
    ],
  },
  financing: {
    title: "Cómo se paga un departamento en Asunción",
    paragraphs: [
      "Igual que una casa, un departamento se paga al contado o con crédito hipotecario de un banco o una financiera. Uno en pozo suele pagarse en cuotas durante la obra y el saldo al momento de la escritura, con condiciones que fija cada desarrollador.",
      "En la página de financiamiento del portal reunimos los programas de primera vivienda que conocemos, incluidos los que usan fondos de la Agencia Financiera de Desarrollo, con una estimación de cuota como referencia y nunca como aprobación.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto cuesta un departamento en Asunción?",
      a: "Depende de la zona, de si es nuevo o usado y de si todavía está en pozo. Los rangos de arriba muestran lo publicado hoy en el portal, no un promedio fijo de la ciudad.",
    },
    {
      q: "¿Qué significa comprar un departamento en pozo?",
      a: "Significa comprar una unidad que todavía se está construyendo, sobre plano, con pagos durante la obra. La página de proyectos del portal junta información general de los desarrollos que conocemos en Asunción, sin prometer disponibilidad de unidades.",
    },
    {
      q: "¿Las expensas están incluidas en el precio de venta?",
      a: "No: las expensas son un gasto mensual aparte que se paga una vez que ya sos propietario. Pedile al vendedor el monto actual antes de comparar precios.",
    },
    {
      q: "¿Conviene un departamento usado o uno en pozo?",
      a: "Cada opción tiene su lógica: uno usado te permite mudarte antes y ver el edificio real; uno en pozo suele salir más accesible por etapa pero exige revisar quién respalda la obra. No hay una respuesta única para todos los casos.",
    },
    {
      q: "Busco alquilar, no comprar, ¿dónde miro?",
      a: "Si buscás alquilar, mirá los departamentos en alquiler de Asunción en el portal: el filtro y los precios funcionan igual, pero sobre avisos de alquiler en vez de venta.",
    },
    {
      q: "¿Y si no encuentro un departamento que me sirva hoy?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto y la zona que preferís. Te escribimos por WhatsApp apenas se publique un departamento en Asunción que encaje.",
    },
  ],
  claimsToVerify: [
    "Villa Morra, Carmelitas and Manorá are Asunción barrios with newer apartment towers and pre-construction (en pozo) developments.",
    "Asunción's microcentro, near the Palacio de Gobierno, has some of the capital's oldest buildings, many recycled into housing.",
    "Newer riverside apartment developments concentrate along the Costanera / Jardín Botánico corridor of Asunción.",
    "Trinidad and San Vicente are intermediate Asunción barrios with smaller, older apartment buildings and generally lower resale prices.",
    "An apartment purchase is registered in the corresponding property Registry.",
    "Some lenders offer first-home mortgages funded by the Agencia Financiera de Desarrollo (AFD); terms are set by each lender.",
    "Pre-construction (en pozo) apartments are typically paid in installments during construction with the balance due at the deed signing, on terms set by each developer.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching apartment appears.",
  ],
};
