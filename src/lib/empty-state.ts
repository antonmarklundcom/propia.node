/**
 * The empty category page (founder decisions E-1..E-4, 2026-10-03;
 * docs/plan-category-pages-build.md phase 3). Pure: no `next/*`, no drizzle —
 * `npm run verify:seo` drives every rule here.
 *
 * - **E-1:** a valid combination renders 200 at 0 listings. "Valid" is a known
 *   operation, a known city (and barrio), and a type the serving door's
 *   `filters` allow: a land-only door never says "no hay casas", it keeps the
 *   old bounce for a type it does not carry.
 * - **E-2:** that page is `noindex,follow` (`getIndexability({ emptyRenders })`)
 *   and out of the sitemap, unless it is evergreen.
 * - **E-4:** the CTAs, in this order: the buyer brief, WhatsApp (when the
 *   number is configured), the saved-search email alert (when email is).
 */
import type { Operation, PropertyType } from "./import/types";

export interface DoorFilters {
  property_type?: string[];
  operation?: string[];
}

/** Whether the serving door can ever hold listings of this operation and type. */
export function doorAllowsCategory(
  filters: DoorFilters | undefined,
  operation: Operation,
  type: PropertyType | null,
): boolean {
  if (filters?.operation && !filters.operation.includes(operation)) return false;
  if (type && filters?.property_type && !filters.property_type.includes(type)) return false;
  return true;
}

export type EmptyCta = "brief" | "whatsapp" | "alert";

/** E-4: brief first, then WhatsApp, then the email alert — each only when it can work. */
export function emptyStateCtas(available: { whatsapp: boolean; email: boolean }): EmptyCta[] {
  const order: EmptyCta[] = ["brief", "whatsapp", "alert"];
  return order.filter((c) => (c === "whatsapp" ? available.whatsapp : c === "alert" ? available.email : true));
}

/**
 * The operations an empty page offers as "the same place in another
 * operation", within what the door serves: a sale page offers rentals, a
 * rental page offers sales, a short-term rental page offers monthly rentals.
 */
export function otherOperationsFor(operation: Operation, filters: DoorFilters | undefined): Operation[] {
  const candidates: Operation[] =
    operation === "venta" ? ["alquiler"] : operation === "alquiler" ? ["venta"] : ["alquiler"];
  return candidates.filter((op) => !filters?.operation || filters.operation.includes(op));
}
