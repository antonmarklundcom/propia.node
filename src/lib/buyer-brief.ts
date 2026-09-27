/**
 * The buyer brief — "tell us what you're looking for" — shown where a search
 * found nothing or very little (the listing browser's empty / thin state and
 * the 404 that doubles as the zero-match category page).
 *
 * **It is the existing lead pipeline, not a new one.** The form posts to
 * `/api/leads` with a structured `brief` object; the route folds it into the
 * lead's `message` as readable text, stamps `utm.source: "brief"` and picks
 * `buyer` / `renter` from the operation. No column, no new `routed_to` lane —
 * the same reasoning as `/vender` and the directory form (no `leads.source`).
 *
 * **Pure on purpose** — no `next/*`, no drizzle. The client form imports the
 * vocabulary below, and the route imports the same lists to validate against,
 * so the two cannot spell a timeline or a surface differently.
 */
import type { Operation, PropertyType } from "./import/types";
import { OPERATIONS, PROPERTY_TYPES } from "./import/types";
import { parseCategorySegments, parseOperation } from "./urls";

export const BRIEF_SOURCE = "brief";

/** How soon the visitor means to move. Optional in the form. */
export const BRIEF_TIMELINES = ["now", "3m", "6m", "browsing"] as const;
export type BriefTimeline = (typeof BRIEF_TIMELINES)[number];

export const BRIEF_CURRENCIES = ["USD", "PYG"] as const;
export type BriefCurrency = (typeof BRIEF_CURRENCIES)[number];

/** Which surface the brief was filled on — rides in `utm.brief_surface`. */
/** `evergreen`: the lead block of an evergreen category page (src/content/evergreen/). */
export const BRIEF_SURFACES = ["empty", "few", "not_found", "evergreen"] as const;
export type BriefSurface = (typeof BRIEF_SURFACES)[number];

/** Minimum-bedroom choices, same scale as the category filter's `dormitorios`. */
export const BRIEF_BEDROOMS = [1, 2, 3, 4] as const;

/** Below this many results the thin-results brief is offered under the grid. */
export const BRIEF_FEW_RESULTS = 3;

/** What the page knows about the search, handed to the form as its starting values. */
export interface BriefPrefill {
  operation?: Operation;
  propertyType?: PropertyType;
  where?: string;
  /** Always USD: the category price filter runs on `price_usd`. */
  budgetMaxUsd?: number;
  bedrooms?: number;
}

/** The choices a door offers — its `filters` may only narrow, never widen. */
export interface BriefChoices {
  operations: readonly Operation[];
  propertyTypes: readonly PropertyType[];
}

/**
 * A door's hard filters as form choices. Pure over the vertical's `filters`
 * shape so the client never needs `verticals.ts`: terreno.com.py offers only
 * terrenos, the rental doors only the two rental operations. An unknown value
 * in the config is dropped rather than trusted.
 */
export function briefChoices(filters?: {
  operation?: string[];
  property_type?: string[];
}): BriefChoices {
  const ops = filters?.operation?.length
    ? OPERATIONS.filter((o) => filters.operation!.includes(o))
    : OPERATIONS;
  const types = filters?.property_type?.length
    ? PROPERTY_TYPES.filter((t) => filters.property_type!.includes(t))
    : PROPERTY_TYPES;
  return {
    operations: ops.length ? ops : OPERATIONS,
    propertyTypes: types.length ? types : PROPERTY_TYPES,
  };
}

/** `buyer` for a sale, `renter` for either rental — both existing enum members. */
export function briefLeadType(operation: Operation | undefined): "buyer" | "renter" {
  return operation === "alquiler" || operation === "alquiler_temporal"
    ? "renter"
    : "buyer";
}

/**
 * What a 404's path says about the search that produced it. `app/not-found.tsx`
 * has no params, only the `x-pathname` header the middleware sets; a category
 * URL that matched nothing still spells its operation, city and type. Anything
 * that is not a category shape yields an empty object — the form then starts
 * blank, which is the right answer for a dead listing link.
 */
export function briefFromPath(pathname: string | null | undefined): {
  operation?: Operation;
  propertyType?: PropertyType;
  citySlug?: string;
  barrioSlug?: string;
} {
  if (!pathname) return {};
  const [opSeg, ...rest] = pathname.split("/").filter(Boolean);
  const operation = opSeg ? parseOperation(opSeg) ?? undefined : undefined;
  if (!operation) return {};
  const shape = rest.length ? parseCategorySegments(rest) : null;
  if (!shape) return { operation };
  return {
    operation,
    citySlug: shape.citySlug,
    ...(shape.kind === "barrio-type" ? { barrioSlug: shape.barrioSlug } : {}),
    ...(shape.kind !== "city" ? { propertyType: shape.type } : {}),
  };
}

/** The structured brief the route accepts (validated there with zod). */
export interface BriefPayload {
  surface: BriefSurface;
  operation?: Operation;
  propertyType?: PropertyType;
  where?: string;
  budgetMax?: number;
  currency?: BriefCurrency;
  bedrooms?: number;
  timeline?: BriefTimeline;
  note?: string;
  path?: string;
}

/** The labels `formatBriefMessage` needs — the `brief.lead` dictionary slice. */
export interface BriefMessageLabels {
  heading: string;
  lookingFor: string;
  where: string;
  budget: string;
  bedrooms: string;
  timeline: string;
  note: string;
  from: string;
  anyType: string;
  operation: Record<string, string>;
  propertyType: Record<string, string>;
  timelineOption: Record<string, string>;
  bedroomsValue: (n: number) => string;
}

/**
 * The brief as the readable text that goes into `leads.message` — what the
 * operator reads in `/admin/leads`, and what VenderCRM receives. Only the
 * answers the visitor gave appear; a skipped field is a skipped line.
 */
export function formatBriefMessage(
  b: BriefPayload,
  t: BriefMessageLabels,
  numberLocale: string,
): string {
  const what = [
    b.propertyType ? t.propertyType[b.propertyType] : t.anyType,
    b.operation ? t.operation[b.operation] : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const lines = [
    t.heading,
    `${t.lookingFor}: ${what}`,
    b.where ? `${t.where}: ${b.where}` : null,
    b.budgetMax
      ? `${t.budget}: ${b.currency === "PYG" ? "Gs." : "USD"} ${Math.round(b.budgetMax).toLocaleString(numberLocale)}`
      : null,
    b.bedrooms ? `${t.bedrooms}: ${t.bedroomsValue(b.bedrooms)}` : null,
    b.timeline ? `${t.timeline}: ${t.timelineOption[b.timeline]}` : null,
    b.note ? `${t.note}: ${b.note}` : null,
    b.path ? `${t.from}: ${b.path}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}
