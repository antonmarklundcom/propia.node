/**
 * English peer of `es-brief.ts` — see that file. Pitched at the English
 * door's foreign buyers: same fields, same promise, nothing the Spanish does
 * not say.
 */
import type { esBrief } from "./es-brief";

type Widened<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widened<R>
    : { [K in keyof T]: Widened<T[K]> };

export const enBrief = {
  titleEmpty: "Can't find what you're looking for? Tell us what you need",
  titleFew: "Only a few matches? Tell us what you're looking for",
  intro:
    "Share the details of your search and we'll help you find properties in Paraguay that fit.",
  open: "Tell us what you're looking for",
  operationLabel: "Buy or rent",
  typeLabel: "Property type",
  typeAny: "Any type",
  whereLabel: "Area",
  wherePlaceholder: "City or neighbourhood",
  budgetLabel: "Maximum budget",
  budgetPlaceholder: "e.g. 150000",
  currencyLabel: "Currency",
  currency: { USD: "USD", PYG: "Guaraní (PYG)" } as Record<string, string>,
  bedroomsLabel: "Bedrooms (optional)",
  bedroomsAny: "Any",
  bedroomsOption: (n: number) => `${n} or more`,
  timelineLabel: "When?",
  timelinePlaceholder: "Choose one",
  timeline: {
    now: "As soon as possible",
    "3m": "Within the next 3 months",
    "6m": "In 6 months or later",
    browsing: "Just looking",
  } as Record<string, string>,
  noteLabel: "Anything else (optional)",
  notePlaceholder: "e.g. a garden, close to a school",
  operation: {
    venta: "Buy",
    alquiler: "Rent",
    alquiler_temporal: "Short-term rental",
  } as Record<string, string>,
  submit: "Send my search",
  invalidBudget: "Enter the budget as a number only.",
  // The operator's copy — kept for the dictionary's shape; `/api/leads`
  // always writes the Spanish one (see es-brief.ts).
  lead: {
    heading: "Search request",
    lookingFor: "Looking for",
    where: "Area",
    budget: "Max budget",
    bedrooms: "Bedrooms",
    timeline: "Timeline",
    note: "Note",
    from: "From",
    anyType: "Any type",
    operation: {
      venta: "purchase",
      alquiler: "rental",
      alquiler_temporal: "short-term rental",
    } as Record<string, string>,
    propertyType: {
      casa: "House",
      departamento: "Apartment",
      terreno: "Land",
      duplex: "Duplex",
      comercial: "Commercial space",
      oficina: "Office",
      deposito: "Warehouse",
      quinta: "Country house",
    } as Record<string, string>,
    timelineOption: {
      now: "as soon as possible",
      "3m": "next 3 months",
      "6m": "6 months or later",
      browsing: "just looking",
    } as Record<string, string>,
    bedroomsValue: (n: number) => `${n}+`,
  },
  adminBadge: "Search request",
} satisfies Widened<typeof esBrief>;
