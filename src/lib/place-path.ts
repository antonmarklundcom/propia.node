/**
 * The place page URL, spelled in one place (plan decision P-1: `/zonas/…` on
 * every door). A later change of spelling — say `/areas/…` on the English
 * door — is an edit to this function, not to every call site (the
 * `rentalPath()` lesson). Import-free on purpose.
 */
export const PLACE_ROOT = "zonas";

export function placePath(citySlug: string, barrioSlug?: string): string {
  return barrioSlug ? `/${PLACE_ROOT}/${citySlug}/${barrioSlug}` : `/${PLACE_ROOT}/${citySlug}`;
}
