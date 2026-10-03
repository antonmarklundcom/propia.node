/**
 * Seller financing (plan-admin-next O8) — the edit form's copy on /admin,
 * /agencia and /mis-avisos. Panel copy, Spanish only like the rest of the
 * panels. The public listing page's copy is `esListing.sellerFinancing*` /
 * `enListing.sellerFinancing*`.
 */
export const esFinancing = {
  title: "Financiación propia",
  hint:
    "Si vos (o el banco o la desarrolladora con la que trabajás) financiás esta propiedad, escribí las condiciones. En el aviso se muestran tal cual, con la línea «Datos provistos por …, no por el portal», en lugar de la cuota estimada del portal.",
  enabled: "Mostrar financiación propia en el aviso",
  entity: "Quién financia",
  entityPlaceholder: "El propietario, Banco …, la desarrolladora",
  rate: "Tasa",
  ratePlaceholder: "Ej.: 8 % anual, sin interés",
  term: "Plazo",
  termPlaceholder: "Ej.: hasta 60 meses",
  downPayment: "Entrega inicial",
  downPaymentPlaceholder: "Ej.: 30 %",
  notes: "Otras condiciones",
  save: "Guardar financiación",
  saved: "Financiación guardada.",
  empty: "Para mostrarla, escribí al menos la tasa, el plazo, la entrega o una condición.",
  notFound: "No encontramos ese aviso entre los tuyos.",
  onlySale: "Solo se muestra en avisos de venta.",
  cuotaNote:
    "Mientras esté encendida, este aviso no muestra la cuota estimada del portal. Si la apagás, la cuota vuelve con el próximo recálculo.",
};
