/**
 * Outbound feed for terreno.com.py (ARCHITECTURE.md §2.5 addendum — cross-
 * posting with the sibling site, per its ARCHITECTURE.md §5 and
 * docs/PROPIA-MIGRATION.md). Exposes propia's OWN land listings so terreno
 * can import them; consumed by `GET /api/feed/terreno`.
 *
 * Loop guard: only listings NOT sourced from terreno are exported — a
 * terreno-origin listing living in propia's DB (imported via the `terreno`
 * source, see scripts/sync-terreno.ts) is never re-exported back to terreno.
 *
 * The `dedup_key`/`content_hash` fields in this payload are a SEPARATE,
 * synthetic contract for the wire format — NOT propia's internal
 * listing_sources.dedup_key/content_hash columns, which mean something else
 * entirely (a fuzzy same-property-different-source match, see
 * src/lib/import/normalize.ts). Never expose those columns here.
 */
import "server-only";
import { createHash } from "node:crypto";
import { eq, and, notInArray, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  agencies,
  agents,
  listingImages,
  listings,
  listingSources,
  users,
} from "@/db/schema";
import { VERTICALS } from "@/config/verticals";
import { locationChain } from "@/lib/queries";
import { imageUrl } from "@/lib/format";
import { listingUrl } from "@/lib/urls";

/** The land-adjacent property_type set — verticals.ts is the source of truth. */
const LAND_PROPERTY_TYPES = VERTICALS["terreno.com.py"].filters?.property_type ?? [
  "terreno",
];

export interface FeedOwner {
  tipo: "broker" | "casa_propia";
  nombre: string;
  telefono_wa: string | null;
  inmobiliaria: string | null;
}

export interface FeedListing {
  dedup_key: string; // 'propia:{public_id}' — the wire-contract identity, synthetic
  canonical_slug: string;
  content_hash: string; // sha256 of this object (order-stable, nulls stripped)
  status: "published" | "paused";
  tipo: string | null; // propia has no land sub-type; terreno defaults on null
  titulo: string;
  descripcion: string | null;
  ubicacion: {
    departamento: string | null;
    ciudad: string | null;
    barrio: string | null;
    lat: number | null;
    lng: number | null;
  };
  superficie_m2: number | null;
  precio: { monto: number; moneda: "USD" | "PYG" };
  frente_m: null;
  fondo_m: null;
  esquina: null;
  servicios: [];
  estado_titulo: null;
  financiacion: null;
  owner: FeedOwner | null;
  images: string[];
  updated_at: string;
}

/** sha256 of the payload with keys sorted and nulls stripped (deterministic). */
function hashPayload(obj: Record<string, unknown>): string {
  const strip = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        const val = (v as Record<string, unknown>)[k];
        if (val !== null && val !== undefined) out[k] = strip(val);
      }
      return out;
    }
    return v;
  };
  return createHash("sha256").update(JSON.stringify(strip(obj))).digest("hex");
}

async function resolveOwner(listing: {
  agencyId: number | null;
  agentId: number | null;
  ownerUserId: number | null;
}): Promise<FeedOwner | null> {
  if (listing.agencyId) {
    const [row] = await db
      .select({ name: agencies.name, whatsapp: agencies.whatsapp })
      .from(agencies)
      .where(eq(agencies.id, listing.agencyId))
      .limit(1);
    if (row) {
      return {
        tipo: "broker",
        nombre: row.name,
        telefono_wa: row.whatsapp,
        inmobiliaria: row.name,
      };
    }
  }
  if (listing.agentId) {
    const [row] = await db
      .select({ name: agents.name, whatsapp: agents.whatsapp })
      .from(agents)
      .where(eq(agents.id, listing.agentId))
      .limit(1);
    if (row) {
      return {
        tipo: "broker",
        nombre: row.name,
        telefono_wa: row.whatsapp,
        inmobiliaria: null,
      };
    }
  }
  if (listing.ownerUserId) {
    const [row] = await db
      .select({ name: users.name, whatsapp: users.whatsapp })
      .from(users)
      .where(eq(users.id, listing.ownerUserId))
      .limit(1);
    if (row) {
      return {
        tipo: "casa_propia",
        nombre: row.name ?? "Propietario",
        telefono_wa: row.whatsapp,
        inmobiliaria: null,
      };
    }
  }
  return null;
}

/** Build the outbound feed: propia's own published land listings. */
export async function buildTerrenoFeed(): Promise<FeedListing[]> {
  // Loop guard: exclude listings whose provenance is a terreno import.
  const terrenoSourced = await db
    .select({ listingId: listingSources.listingId })
    .from(listingSources)
    .where(eq(listingSources.source, "terreno"));
  const excludeIds = terrenoSourced.map((r) => r.listingId);

  const rows = await db
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.status, "published"),
        inArray(listings.propertyType, LAND_PROPERTY_TYPES as (typeof listings.$inferSelect)["propertyType"][]),
        excludeIds.length > 0 ? notInArray(listings.id, excludeIds) : undefined,
      ),
    );

  const out: FeedListing[] = [];
  for (const l of rows) {
    const chain = await locationChain(l.locationId);
    const departamento = chain.find((c) => c.level === "departamento")?.name ?? null;
    const ciudad = chain.find((c) => c.level === "ciudad")?.name ?? null;
    const barrio = chain.find((c) => c.level === "barrio")?.name ?? null;

    const images = await db
      .select({ r2Key: listingImages.r2Key })
      .from(listingImages)
      .where(eq(listingImages.listingId, l.id))
      .orderBy(listingImages.position);

    const owner = await resolveOwner(l);

    const base = {
      dedup_key: `propia:${l.publicId}`,
      canonical_slug: listingUrl(l).replace(/^\/propiedad\//, ""),
      status: l.status === "published" ? ("published" as const) : ("paused" as const),
      tipo: null,
      titulo: l.title,
      descripcion: l.descriptionEs ?? null,
      ubicacion: {
        departamento,
        ciudad,
        barrio,
        lat: l.lat != null ? Number(l.lat) : null,
        lng: l.lng != null ? Number(l.lng) : null,
      },
      superficie_m2: l.landM2 != null ? Number(l.landM2) : l.areaM2 != null ? Number(l.areaM2) : null,
      precio: { monto: Number(l.priceAmount), moneda: l.priceCurrency },
      frente_m: null,
      fondo_m: null,
      esquina: null,
      servicios: [] as [],
      estado_titulo: null,
      financiacion: null,
      owner,
      images: images.map((i) => imageUrl(i.r2Key)).filter((u): u is string => !!u),
      updated_at: l.updatedAt.toISOString(),
    };

    out.push({ ...base, content_hash: hashPayload(base) });
  }
  return out;
}
