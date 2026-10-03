/**
 * Exclusive listings (plan-admin-next O1) — /admin copy, Spanish only like
 * the rest of the panels. Admin only: nothing here reaches a visitor.
 */
export const esExclusive = {
  title: "Exclusiva",
  hint: "Solo para el panel: marcá los avisos que tenés en exclusiva (con el propietario o la «exclusiva de marketing» de un socio). Los visitantes no ven nada.",
  checkbox: "Este aviso es exclusivo nuestro",
  untilLabel: "Vence el (opcional)",
  noteLabel: "Nota (opcional)",
  notePlaceholder: "Firmado con el propietario, socio: Inmo X…",
  save: "Guardar exclusiva",
  saved: "Exclusiva guardada.",
  invalidUntil: "La fecha de vencimiento no es válida.",
  since: (when: string) => `Marcada el ${when}.`,
  badge: "Exclusiva",
  badgeExpired: "Exclusiva vencida",
  badgeUntil: (day: string) => `hasta ${day}`,
  filter: "Exclusivas",
};
