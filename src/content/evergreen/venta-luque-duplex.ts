/**
 * Evergreen page: /venta/luque/duplex — "duplex en venta luque" (50/mo), no
 * secondary phrases in the table (docs/seo-evergreen-keywords.md, table A
 * #31).
 *
 * The pilot (/venta/luque/casas) already covers Luque's zones from the
 * house angle, and the sibling /venta/luque/departamentos page covers it
 * from the apartment angle. This page's zone section is written fresh, from
 * the duplex angle — shared walls, condominios, individual titles per
 * unit — and shares no sentence with either.
 */
import type { EvergreenPage } from "./types";

export const ventaLuqueDuplex: EvergreenPage = {
  path: "/venta/luque/duplex",
  door: "inmobiliaria",
  keyword: "duplex en venta luque",
  secondaryKeywords: [],
  h1: "Dúplex en venta en Luque",
  lede: "Mirá los dúplex publicados en Luque, revisá si cada unidad tiene título propio y dejá tu búsqueda si todavía no aparece el que buscás.",
  metaDescription:
    "Dúplex en venta en Luque: comparás precio, expensas del condominio y título de cada unidad, y dejás tu búsqueda para lo nuevo publicado.",
  priceBands: [{ max: 70_000 }, { min: 70_001, max: 120_000 }, { min: 120_001 }],
  barrios: {
    title: "Dónde se construyen los dúplex en Luque",
    intro:
      "El dúplex tiene su propia lógica de zona, distinta de la casa aislada y del edificio: importa mucho si está dentro de un condominio cerrado o sobre un lote suelto del casco urbano. Así se reparte la oferta según la parte de Luque.",
    items: [
      {
        name: "Condominios cerrados en la zona de la Conmebol y Ñu Guasu",
        text:
          "Buena parte de los dúplex nuevos de Luque se construyen dentro de condominios cerrados de este sector, en fila y con paredes medianeras compartidas entre unidades. El guardia de acceso y el mantenimiento de los espacios comunes suelen quedar cubiertos por las expensas del condominio.",
      },
      {
        name: "Loteos y barrios cercanos al centro de Luque",
        text:
          "En terrenos más chicos del casco urbano, algunos propietarios construyen unidades independientes bajo un mismo techo para vender por separado. Ahí conviene confirmar si cada unidad ya tiene su propio título o si todavía comparten una sola escritura sin dividir.",
      },
      {
        name: "Zona del aeropuerto y la autopista",
        text:
          "Los dúplex de este corredor se promocionan sobre todo por la salida rápida hacia Asunción, algo que pesa para quien trabaja fuera de Luque. Antes de decidir, conviene chequear cuánto ruido de tránsito o de vuelos llega hasta el patio y los dormitorios de arriba.",
      },
      {
        name: "Barrios hacia las afueras de Luque",
        text:
          "En sectores como Yukyry o Laurelty aparecen desarrollos de dúplex más nuevos sobre terrenos antes destinados a otro uso, con precios que rinden más metros por el mismo presupuesto. La contrapartida suele ser una oferta de transporte público más limitada.",
      },
    ],
  },
  prices: {
    title: "Qué mirar en el precio de un dúplex en Luque",
    paragraphs: [
      "Los rangos de arriba salen de los dúplex publicados hoy en el portal en Luque, con el precio que pide quien vende: no son cifras de cierre ni un promedio fijo, y se mueven según lo que entra y sale de la lista.",
      "Un dúplex con pared medianera suele pedirse más barato que una casa aislada de tamaño parecido, porque el terreno se comparte entre unidades. Fijate si el precio incluye el patio completo o si ese espacio también se divide con la unidad vecina.",
      "Cuando el dúplex está dentro de un condominio cerrado, sumá el monto de las expensas al momento de comparar contra una casa o un dúplex fuera de un condominio: cambia bastante el costo mensual real.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de comprar un dúplex en Luque",
    intro:
      "Un dúplex trae preguntas propias por la pared compartida y, muchas veces, por el condominio donde está. Antes de avanzar, confirmá:",
    items: [
      "Si cada unidad del dúplex tiene su propio título de propiedad o si ambas comparten una sola escritura sin dividir.",
      "Cómo está resuelta la pared medianera: quién puede hacer modificaciones sobre ella y qué dice el reglamento del condominio, si lo hay.",
      "Si el patio, la cochera o el lavadero son de uso exclusivo de tu unidad o compartidos con la unidad vecina.",
      "El reglamento del condominio, cuando el dúplex está dentro de uno, y el monto actual de las expensas.",
      "El impuesto inmobiliario municipal de Luque al día, con el comprobante del último pago.",
      "Si hay humedad o filtraciones en la pared que da hacia la otra unidad, un problema más frecuente en dúplex que en casas aisladas.",
      "El acceso real en auto hasta tu trabajo o el colegio, probado en un día de semana en hora de mucho tránsito.",
      "Quién administra el condominio y cómo se cobran y rinden las expensas entre los propietarios.",
    ],
  },
  financing: {
    title: "Cómo financiar un dúplex en Luque",
    paragraphs: [
      "Un dúplex se compra al contado o con crédito hipotecario de un banco o una financiera, con el mismo trámite que para una casa. Algunas entidades suman líneas para primera vivienda con fondos de la Agencia Financiera de Desarrollo, y cada entidad fija sus propias condiciones.",
      "En la página de financiamiento del portal reunimos los programas que conocemos junto con una estimación de cuota mensual. Es una referencia para armar tu presupuesto, no una aprobación: la decisión final queda del lado del banco o la financiera.",
    ],
  },
  faq: [
    {
      q: "¿Qué diferencia hay entre un dúplex y una casa en Luque?",
      a: "El dúplex comparte al menos una pared con la unidad vecina y suele estar en un terreno más chico que una casa aislada de tamaño parecido, lo que en general se refleja en un precio pedido más bajo.",
    },
    {
      q: "¿Cuánto cuesta un dúplex en Luque?",
      a: "Depende de la zona, de si está dentro de un condominio cerrado y del estado de la construcción. Los rangos de arriba muestran lo publicado hoy en el portal, no un promedio general.",
    },
    {
      q: "¿Los dúplex de Luque tienen expensas?",
      a: "Solo cuando están dentro de un condominio cerrado con áreas o servicios compartidos. Un dúplex fuera de un condominio no suele tener expensas fijas más allá del impuesto inmobiliario.",
    },
    {
      q: "¿Puedo comprar una sola unidad del dúplex?",
      a: "Depende de si esa unidad ya tiene su propio título separado de la otra. Confirmalo con el vendedor antes de avanzar, porque no todos los dúplex tienen la escritura dividida.",
    },
    {
      q: "¿Y si no hay un dúplex publicado que me sirva hoy?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto. Te escribimos por WhatsApp apenas se publique un dúplex en Luque que encaje con lo que pediste.",
    },
  ],
  claimsToVerify: [
    "The area around the CONMEBOL headquarters and the Ñu Guasu park concentrates newer closed-condominio duplex developments in Luque.",
    "Yukyry and Laurelty are barrios/compañías toward the outskirts of Luque.",
    "The Silvio Pettirossi international airport is in Luque and an autopista links it with Asunción.",
    "The impuesto inmobiliario for a Luque property is paid to the Municipalidad de Luque.",
    "Some lenders offer first-home mortgages funded by the AFD (Agencia Financiera de Desarrollo); terms are set by each lender.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching duplex appears.",
  ],
};
