/**
 * Copy for build A2 — owners (`/registro` owner kind, `/mis-avisos/cuenta`,
 * the "want a realtor" request and the price-per-m² comparison).
 *
 * Its own file so the parallel wave-A builds do not collide in `es.ts`; the
 * shape is the contract `en-a2.ts` satisfies, same as every other namespace.
 * The `/mis-avisos` panel is Spanish-only (like `esOwner`), but the English
 * peer still exists so the dictionary stays total.
 */
export const esA2 = {
  // /registro — the third account kind.
  registerKindOwner: "Soy dueño/a (vendo o alquilo mi propiedad)",
  registerOwnerNote:
    "Si sos dueño/a, no necesitás completar el nombre de inmobiliaria: tu cuenta es para publicar y seguir tus propios avisos.",

  // /mis-avisos tabs and flashes.
  accountTab: "Mi cuenta",
  accountTitle: "Mi cuenta",
  accountNote:
    "Para cambiar tu contraseña o tu email, confirmá con tu contraseña actual.",
  welcome:
    "Tu cuenta está lista. Publicá tu primera propiedad y seguí acá las consultas que recibas.",

  // "Quiero que una inmobiliaria lo venda" — one request per listing.
  realtorCta: (operation: string) =>
    operation === "venta"
      ? "Quiero que una inmobiliaria lo venda"
      : "Quiero que una inmobiliaria lo alquile",
  realtorExplainer:
    "Le pasamos tu propiedad a una inmobiliaria de confianza de la zona y te contacta por WhatsApp. No tiene costo pedirlo y no te obliga a nada.",
  realtorWhatsappLabel: "Tu WhatsApp",
  realtorMessageLabel: "Mensaje (opcional)",
  realtorMessagePlaceholder: "Por ejemplo: cuándo se puede visitar, si hay apuro…",
  realtorSubmit: "Enviar pedido",
  realtorSent:
    "Recibimos tu pedido. Una inmobiliaria de la zona te va a contactar por WhatsApp.",
  realtorAlready:
    "Ya recibimos un pedido para este aviso en las últimas 24 horas. Te vamos a contactar.",
  realtorInvalid:
    "No pudimos enviar el pedido. Revisá tu número de WhatsApp e intentá de nuevo.",
  realtorLeadMessage: (listingTitle: string, note: string | null) =>
    [
      `El dueño/a pide que una inmobiliaria gestione su aviso: ${listingTitle}.`,
      note ? `Mensaje: ${note}` : null,
    ]
      .filter(Boolean)
      .join("\n"),

  // /mis-avisos/aviso/[id] — price per m² against the zone's median.
  priceTitle: "Tu precio por m² frente a la zona",
  priceYours: "Precio por m² de tu aviso",
  priceMedian: (zone: string) => `Mediana de avisos publicados en ${zone}`,
  priceSample: (count: number, period: string) =>
    `${count} avisos del mismo tipo y operación, ${period}`,
  priceAbove: (pct: number) => `Tu precio por m² está un ${pct}% por encima de la mediana.`,
  priceBelow: (pct: number) => `Tu precio por m² está un ${pct}% por debajo de la mediana.`,
  priceEqual: "Tu precio por m² está en línea con la mediana.",
  priceConverted:
    "Tu precio está en guaraníes; lo convertimos a dólares con el tipo de cambio que usa el portal para comparar.",
  priceDisclaimer:
    "Es una comparación con precios pedidos en avisos publicados, no una tasación ni una recomendación de precio.",
} as const;
