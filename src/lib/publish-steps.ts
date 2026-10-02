/**
 * Which wizard step owns which field. Pure (no `next/*`), shared by the
 * client wizard and `npm run verify:publish`.
 *
 * Each step validates ONLY its own fields: Detalles (operation, type, title),
 * Ubicación (location), Precio y publicación (price). Checking a later step's
 * field on "Siguiente" is how /publicar once showed "Ingresá un precio válido"
 * on Detalles, before the price field had been shown.
 */
export type PublishStepFields = {
  operation: string;
  propertyType: string;
  title: string;
  locationId: number | null;
  priceAmount: string | number;
};

export type PublishStepError =
  | "operation"
  | "propertyType"
  | "title"
  | "location"
  | "price";

/**
 * The wizard's price box as a number. Paraguayans write thousands with dots
 * ("150.000.000"), and `Number()` reads that as NaN and "85.000" as 85: the
 * draft was then saved with price 0, and the publish step refused it as
 * "No encontramos tu borrador". Separators (dot, comma, space) are dropped; a
 * trailing one- or two-digit group after a dot or comma is cents and ignored.
 * Returns 0 for anything without a digit.
 */
export function parsePriceInput(raw: string | number | null | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : 0;
  const s = String(raw ?? "").trim().replace(/[.,]\d{1,2}$/, "");
  const digits = s.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function validatePublishStep(
  step: number,
  s: PublishStepFields,
): PublishStepError | null {
  if (step === 0) {
    if (!s.operation) return "operation";
    if (!s.propertyType) return "propertyType";
    if (s.title.trim().length < 8) return "title";
    return null;
  }
  if (step === 1) return s.locationId ? null : "location";
  if (step === 2) return parsePriceInput(s.priceAmount) > 0 ? null : "price";
  return null;
}
