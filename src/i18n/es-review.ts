/**
 * Reviews of agencies and agents (plan-admin-next O7) — the visitor-facing
 * copy: the /resena form a buyer opens from the operator's link, and the
 * profile block. `en-review.ts` is its peer.
 */
export const esReview = {
  metaTitle: "Dejá tu reseña",
  title: (name: string) => `¿Cómo fue tu experiencia con ${name}?`,
  intro:
    "Tu opinión ayuda a otras personas a elegir. La revisamos antes de publicarla y nunca mostramos tu teléfono ni tu correo.",
  ratingLabel: "Tu puntuación",
  starLabel: (n: number) => (n === 1 ? "1 estrella" : `${n} estrellas`),
  nameLabel: "Tu nombre, como querés que aparezca",
  namePlaceholder: "María G.",
  bodyLabel: "Contanos más (opcional)",
  bodyPlaceholder: "¿Qué tal la atención, los tiempos, la visita…?",
  submit: "Enviar reseña",
  thanks: "¡Gracias! Revisamos tu reseña y la publicamos en unos días.",
  used: (name: string) => `Ya dejaste tu reseña para ${name}. ¡Gracias!`,
  expired: "Este enlace venció. Pedile uno nuevo a quien te lo envió.",
  invalid: "Este enlace no es válido.",
  invalidForm: "Elegí una puntuación y escribí tu nombre.",
  rateLimited: "Demasiados intentos. Probá de nuevo en unos minutos.",

  sectionTitle: "Reseñas",
  summary: (avg: string, n: number) => `${avg} de 5 · ${n === 1 ? "1 reseña" : `${n} reseñas`}`,
  starsAria: (avg: string) => `${avg} de 5 estrellas`,
  verifiedNote:
    "Solo opinan personas que hicieron una consulta real por el portal. Revisamos cada reseña antes de publicarla.",
};
