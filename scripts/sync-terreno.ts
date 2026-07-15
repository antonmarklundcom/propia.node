/**
 * Inbound cron sync from terreno.com.py (ARCHITECTURE.md §2.5 addendum, per
 * terreno's ARCHITECTURE.md §5 and docs/PROPIA-MIGRATION.md). Fetches
 * terreno's own-origin land listings and upserts them through the EXISTING
 * import pipeline (normalize → dedup → upsert, src/lib/import/upsert.ts) —
 * no new dedup mechanism, just a new source.
 *
 *   npx tsx scripts/sync-terreno.ts
 *   npm run cron:sync-terreno
 *
 * Idempotent: re-running produces zero duplicates (same guarantee as every
 * other importer source, via listing_sources' (source, source_external_id)
 * uniqueness). Imported listings land in pending_review — a human reviews a
 * cross-posted listing before it's live on propia.com.py, same as any other
 * external source.
 */
import { db } from "../src/db";
import { importListings } from "../src/lib/import/upsert";
import type { RawListing } from "../src/lib/import/types";

const FEED_URL = process.env.TERRENO_FEED_URL;
const SECRET = process.env.FEED_SHARED_SECRET;

/** Terreno's land sub-types → propia's property_type enum. */
function mapTipo(tipo: string | null): "terreno" | "quinta" {
  return tipo === "quinta" ? "quinta" : "terreno";
}

interface TerrenoFeedListing {
  dedup_key: string; // 'terreno:{public_id}' — the wire-contract identity
  canonical_slug: string;
  tipo: string | null;
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
  owner: { telefono_wa: string | null } | null;
  images: string[];
  status: "published" | "paused";
}

function toRaw(item: TerrenoFeedListing): RawListing {
  return {
    source: "terreno",
    sourceExternalId: item.dedup_key,
    sourceUrl: `https://terreno.com.py/terreno/${item.canonical_slug}`,
    operation: "venta", // terreno has no rental concept
    propertyType: mapTipo(item.tipo),
    title: item.titulo,
    descriptionEs: item.descripcion ?? undefined,
    priceAmount: item.precio.monto,
    priceCurrency: item.precio.moneda,
    landM2: item.superficie_m2 ?? undefined,
    locationName: item.ubicacion.barrio ?? item.ubicacion.ciudad ?? undefined,
    lat: item.ubicacion.lat ?? undefined,
    lng: item.ubicacion.lng ?? undefined,
    contactPhone: item.owner?.telefono_wa ?? undefined,
    imageUrls: item.images,
  };
}

async function main() {
  if (!FEED_URL || !SECRET) {
    console.error(
      "TERRENO_FEED_URL and FEED_SHARED_SECRET must both be set — skipping sync.",
    );
    process.exit(0); // not configured yet is not a failure (cron keeps running)
  }

  const res = await fetch(FEED_URL, {
    headers: { authorization: `Bearer ${SECRET}` },
  });
  if (!res.ok) {
    console.error(`terreno feed fetch failed: ${res.status}`);
    process.exit(1);
  }

  const body = (await res.json()) as { listings: TerrenoFeedListing[] };
  // Paused listings on terreno's side just aren't re-imported this run; the
  // importer's own last_seen_at pausing (absent-from-feed) handles removal.
  const rows = body.listings
    .filter((l) => l.status === "published")
    .map(toRaw);

  const report = await importListings(db, rows, { publish: false });
  console.log(
    `sync terreno.com.py → propia\n` +
      `  created:   ${report.created}\n` +
      `  updated:   ${report.updated}\n` +
      `  unchanged: ${report.unchanged}\n` +
      `  deduped:   ${report.deduped}\n` +
      `  skipped:   ${report.skipped}`,
  );
  for (const e of report.errors) console.log(`  skip  row ${e.row}: ${e.reason}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
