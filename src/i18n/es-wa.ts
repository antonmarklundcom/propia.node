/**
 * Copy for "WhatsApp enquiries become leads": the "Registrar consulta de
 * WhatsApp" form and the buyer-history line on /admin/leads.
 *
 * Its own file, like `es-a1.ts`, so parallel sessions do not all append to
 * `es.ts`. `en-wa.ts` is the peer, checked by `satisfies` where the
 * dictionaries are assembled and walked by `npm run verify:i18n`. The panel
 * is Spanish-only today; the English peer keeps the dictionaries one shape.
 *
 * The listing's WhatsApp prefill itself (`inquiryPrefillFor`, with its
 * "Ref." code) lives in `es.ts` / `en.ts` next to the rest of the detail page.
 */
export const esWa = {
  formTitle: "Registrar consulta de WhatsApp",
  formHint:
    "Para una consulta que llegó a tu WhatsApp: copiá el número y el código «Ref.» del mensaje. Se guarda como cualquier consulta del sitio: mismo ruteo y la misma copia a VenderCRM.",
  whatsappLabel: "WhatsApp del interesado",
  whatsappPlaceholder: "0981 123 456",
  nameLabel: "Nombre (opcional)",
  refLabel: "Ref. del aviso, enlace o el mensaje pegado (opcional)",
  refPlaceholder: "AB12CD34EF",
  messageLabel: "Mensaje o nota (opcional)",
  typeLabel: "Tipo",
  typeAuto: "Según el aviso",
  siteLabel: "Sitio",
  submit: "Registrar consulta",
  sending: "Guardando…",

  /** `lane` is the panel's own label for `routed_to` (Interno, Inmobiliaria…). */
  saved: (lane: string) => `Consulta registrada. Quedó en: ${lane}.`,
  savedListing: (lane: string, listingTitle: string) =>
    `Consulta registrada sobre «${listingTitle}». Quedó en: ${lane}.`,
  /** A staff user only sees the internal lane, so say where the lead went. */
  savedHiddenFromStaff:
    "El aviso tiene quien lo publique, así que la consulta quedó en su bandeja y no aparece en esta lista.",
  errorPhone: "Ese número no parece un WhatsApp válido.",
  errorRef:
    "No encontramos un aviso con esa referencia. Revisá el código (10 letras y números) o dejalo vacío.",
  errorInvalid: "Revisá los datos del formulario.",
  errorRate: "Registraste muchas consultas seguidas. Esperá unos minutos.",

  /** The chip on a lead card that was logged by hand from WhatsApp. */
  sourceChip: "WhatsApp (manual)",

  /* Buyer history — other leads from the same WhatsApp number or email. */
  historyTitle: (n: number) =>
    n === 1 ? "También consultó por 1 más" : `También consultó por ${n} más`,
  historyNoListing: "Sin aviso",
  historySameEmail: "mismo email",
  historyMore: (n: number) => `y ${n} más`,
} as const;
