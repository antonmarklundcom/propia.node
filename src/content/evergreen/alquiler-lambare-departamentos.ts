/**
 * Evergreen page: /alquiler/lambare/departamentos — "alquiler de
 * departamentos en lambaré baratos" (90/mo) and its merged variants
 * (docs/seo-evergreen-keywords.md, table A #18).
 *
 * Same shape as the pilot; written for renting an apartment in Lambaré, a
 * different property type and a different set of concerns (consorcio,
 * expensas) from the house pages, no sentence shared with them.
 */
import type { EvergreenPage } from "./types";

export const alquilerLambareDepartamentos: EvergreenPage = {
  path: "/alquiler/lambare/departamentos",
  door: "inmobiliaria",
  keyword: "alquiler de departamentos en lambaré baratos",
  secondaryKeywords: [
    "departamentos en alquiler lambare",
    "alquiler de departamento en lambare",
    "alquiler de departamentos baratos en lambare",
    "alquiler de departamentos en lambare baratos",
  ],
  h1: "Departamentos en alquiler en Lambaré",
  lede: "Comparás departamentos en alquiler en Lambaré por precio y por zona, con la opción de dejar tu búsqueda anotada si todavía no aparece el que buscás.",
  metaDescription:
    "Departamentos en alquiler en Lambaré: comparalos por precio, mirá qué incluye cada aviso y anotá tu búsqueda si hoy no hay uno que te sirva.",
  priceBands: [
    { max: 250 },
    { min: 251, max: 400 },
    { min: 401, max: 600 },
    { min: 601 },
  ],
  barrios: {
    title: "Dónde se concentran los departamentos en alquiler en Lambaré",
    intro:
      "Los departamentos en Lambaré no se reparten igual que las casas: se agrupan más sobre las calles principales y cerca del límite con Asunción, y eso pesa en el precio y en la comodidad del día a día.",
    items: [
      {
        name: "Sobre las avenidas principales",
        text:
          "Los edificios se ubican mayormente sobre las calles con más tránsito de colectivos y comercios cerca, así que quien no tiene auto ahorra tiempo, aunque el ruido de la calle se nota más en los pisos bajos.",
      },
      {
        name: "Zona limítrofe con Asunción",
        text:
          "Aquí conviene mirar los edificios más recientes, pensados para quien trabaja en la capital y quiere un trayecto corto sin vivir dentro de Asunción propiamente.",
      },
      {
        name: "Zona más nueva de construcción",
        text:
          "En los emprendimientos construidos en los últimos años suele haber ascensor, portería y cochera incluidos, algo que los edificios más antiguos de la ciudad no siempre ofrecen.",
      },
      {
        name: "Hacia la periferia de la ciudad",
        text:
          "Alejándose del centro los edificios son más chicos y el alquiler pedido baja, a cambio de menos comercios a pie y de una frecuencia de colectivo menor.",
      },
    ],
  },
  prices: {
    title: "Qué dicen los alquileres publicados",
    paragraphs: [
      "Los montos de arriba salen únicamente de los avisos activos hoy en el portal: son lo que pide cada propietario o administradora, no un precio ya cerrado, y cambian a medida que entran y salen departamentos de la lista.",
      "El filtro de precio trabaja sobre el equivalente en dólares aunque el aviso esté publicado en guaraníes, así que si tenés un presupuesto en guaraníes conviene convertirlo antes de mover el filtro.",
      "El alquiler de un departamento casi nunca incluye las expensas del edificio: esas se pagan aparte y cubren cosas como la limpieza de los espacios comunes, la portería y a veces el agua; conviene pedir el monto exacto antes de decidirte, porque cambia mucho de un edificio a otro.",
    ],
  },
  checklist: {
    title: "Qué revisar antes de alquilar un departamento en Lambaré",
    intro:
      "Un departamento se elige por el edificio tanto como por la unidad. Antes de firmar, conviene preguntar por estos puntos:",
    items: [
      "Cuánto se paga de expensas por mes y qué incluyen exactamente: limpieza, portería, agua, mantenimiento de ascensor.",
      "Si el edificio tiene ascensor en funcionamiento y qué piso ocupa la unidad que estás mirando.",
      "Si el departamento tiene cochera incluida en el alquiler o si esa se paga aparte.",
      "Si el edificio tiene tanque propio y sistema de bombeo, y cómo llega el agua en los pisos más altos cuando hay corte.",
      "Si el consorcio o la administración tiene reglas sobre mascotas dentro de las unidades.",
      "Qué garantía pide la administradora: fiador con propiedad propia o una garantía de alquiler contratada con una aseguradora.",
      "Cuántos meses de depósito se piden y si se devuelven al terminar el contrato, descontando algún desperfecto.",
      "Si el edificio tiene portería permanente o solo cámaras, y si eso te alcanza para sentirte cómodo dejando la unidad sola.",
    ],
  },
  financing: {
    title: "Qué necesitás para entrar a vivir en un departamento alquilado en Lambaré",
    paragraphs: [
      "Para mudarte a un departamento en alquiler en Lambaré, además del primer mes suele pedirse un depósito de garantía y un fiador con propiedad a su nombre, o en su lugar una garantía de alquiler contratada con una aseguradora; a eso se le suma el pago de las expensas desde el primer mes de contrato.",
      "El contrato se firma por un plazo acordado con la administradora, con posibilidad de renovación si ambas partes están de acuerdo; conviene leer con atención qué pasa con el depósito si decidís dejar el departamento antes de esa fecha.",
    ],
  },
  faq: [
    {
      q: "¿Cuánto sale alquilar un departamento en Lambaré?",
      a: "Depende del edificio, del piso y de si incluye cochera. Arriba mostramos el rango de lo que piden los avisos activos hoy; no damos un promedio de la ciudad porque no lo podemos respaldar con datos propios.",
    },
    {
      q: "¿El alquiler incluye las expensas del edificio?",
      a: "Casi nunca. Las expensas se pagan aparte del alquiler y cubren los gastos comunes del edificio; pedile a la administradora el monto exacto antes de decidirte.",
    },
    {
      q: "¿Qué me van a pedir para firmar el contrato?",
      a: "Como mínimo un depósito de garantía y, casi siempre, un fiador o una garantía de alquiler contratada con una aseguradora. Algunas administradoras también piden un comprobante de tus ingresos.",
    },
    {
      q: "¿Los departamentos en Lambaré tienen cochera?",
      a: "Depende del edificio: los más nuevos suelen incluirla, mientras que en los más antiguos la cochera se paga o se consigue aparte. Conviene confirmarlo aviso por aviso.",
    },
    {
      q: "¿Qué hago si hoy no hay un departamento que me sirva?",
      a: "Dejá tu búsqueda en el formulario de esta página con tu presupuesto. La recibe nuestro equipo, que te escribe por WhatsApp cuando entra un departamento en alquiler en Lambaré que encaje.",
    },
  ],
  claimsToVerify: [
    "Apartment buildings in Lambaré concentrate along the main avenues and near the border with Asunción rather than being spread evenly across the city.",
    "In Paraguayan apartment rentals, expensas (building common-area fees) are typically billed separately from the rent and are not usually included in the advertised rent.",
    "Many apartment buildings in the Asunción metro area rely on a rooftop or ground water tank with a pumping system rather than direct mains pressure to upper floors.",
    "A common rental guarantee structure in Paraguay is either a fiador who owns property, or a garantía de alquiler bought from an insurer, plus a deposit.",
    "Operational promise: a brief left on this page is read by the team, who write back by WhatsApp when a matching apartment for rent appears.",
  ],
};
