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
  if (step === 2) return Number(s.priceAmount) > 0 ? null : "price";
  return null;
}
