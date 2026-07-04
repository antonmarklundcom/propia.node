/**
 * propia.com.py — single shared schema for every domain (ARCHITECTURE.md §2).
 *
 * Rules that keep the Postgres escape hatch open:
 *  - No stored procedures, no MySQL-specific JSON tricks in hot paths.
 *  - Geo = plain lat/lng bounding boxes (idx_geo), no spatial extensions.
 *  - All filtering on indexed scalar columns; JSON columns are display-only.
 */
import {
  bigint,
  boolean,
  char,
  date,
  datetime,
  decimal,
  index,
  int,
  json,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  smallint,
  text,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

const id = () =>
  bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey();
const fk = (name: string) => bigint(name, { mode: "number", unsigned: true });
const createdAt = () =>
  datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);

/* ------------------------------------------------------------------ */
/* 2.1 Core: listings — wide, denormalized where it serves filtering   */
/* ------------------------------------------------------------------ */

export const listings = mysqlTable(
  "listings",
  {
    id: id(),
    publicId: char("public_id", { length: 10 }).notNull().unique(), // /propiedad/{slug}-{public_id}
    slug: varchar("slug", { length: 180 }).notNull(),
    operation: mysqlEnum("operation", [
      "venta",
      "alquiler",
      "alquiler_temporal",
    ]).notNull(),
    propertyType: mysqlEnum("property_type", [
      "casa",
      "departamento",
      "terreno",
      "duplex",
      "comercial",
      "oficina",
      "deposito",
      "quinta",
    ]).notNull(),
    status: mysqlEnum("status", [
      "draft",
      "pending_review",
      "published",
      "paused",
      "sold",
      "rented",
      "removed",
    ])
      .notNull()
      .default("draft"),

    title: varchar("title", { length: 180 }).notNull(),
    descriptionEs: text("description_es"),
    descriptionEn: text("description_en"), // filled lazily (Claude API) for realestateinparaguay.com

    priceAmount: decimal("price_amount", { precision: 14, scale: 2 }).notNull(),
    priceCurrency: mysqlEnum("price_currency", ["USD", "PYG"]).notNull(),
    priceUsd: decimal("price_usd", { precision: 12, scale: 2 }).notNull(), // normalized at write time; ALL filtering uses this
    cuotaGs: decimal("cuota_gs", { precision: 14, scale: 0 }), // cached monthly payment, recomputed by cron (src/lib/cuota.ts)

    bedrooms: tinyint("bedrooms", { unsigned: true }), // NULL = N/A (terreno); 0 = monoambiente
    bathrooms: tinyint("bathrooms", { unsigned: true }),
    parking: tinyint("parking", { unsigned: true }),
    areaM2: decimal("area_m2", { precision: 10, scale: 2 }), // interior
    landM2: decimal("land_m2", { precision: 12, scale: 2 }), // terreno / lote
    propertyState: mysqlEnum("property_state", [
      "entrega_inmediata",
      "en_construccion",
      "en_pozo",
      "usado",
    ]),
    amenities: json("amenities"), // display only, never filtered in SQL v1

    locationId: fk("location_id").notNull(), // deepest known level, ideally barrio
    addressText: varchar("address_text", { length: 255 }), // never shown publicly at full precision
    lat: decimal("lat", { precision: 9, scale: 6 }),
    lng: decimal("lng", { precision: 9, scale: 6 }),

    agencyId: fk("agency_id"),
    agentId: fk("agent_id"),
    projectId: fk("project_id"), // links preventa units to a development
    ownerUserId: fk("owner_user_id"), // FSBO ("particular") listings from the ads funnel

    isVerified: boolean("is_verified").notNull().default(false),
    verifiedAt: datetime("verified_at"),
    featuredUntil: datetime("featured_until"), // paid placement
    foreignExposure: boolean("foreign_exposure").notNull().default(true), // opt-in to realestateinparaguay.com

    videoUrl: varchar("video_url", { length: 500 }), // YouTube/social link v1; feeds the video engine

    publishedAt: datetime("published_at"),
    createdAt: createdAt(),
    updatedAt: datetime("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_search").on(
      t.status,
      t.operation,
      t.propertyType,
      t.locationId,
      t.priceUsd,
    ),
    index("idx_location").on(t.locationId, t.status, t.publishedAt),
    index("idx_geo").on(t.status, t.lat, t.lng),
    index("idx_agency").on(t.agencyId, t.status),
    index("idx_project").on(t.projectId, t.status),
    index("idx_fresh").on(t.status, t.publishedAt),
  ],
);

export const listingImages = mysqlTable(
  "listing_images",
  {
    id: id(),
    listingId: fk("listing_id").notNull(),
    r2Key: varchar("r2_key", { length: 500 }).notNull(),
    position: tinyint("position", { unsigned: true }).notNull().default(0), // 0 = cover; importer reorders (watermark scoring)
    width: int("width", { unsigned: true }),
    height: int("height", { unsigned: true }),
    watermarkScore: tinyint("watermark_score", { unsigned: true }), // 0–100; watermarked photos never become the cover
    createdAt: createdAt(),
  },
  (t) => [index("idx_listing").on(t.listingId, t.position)],
);

/* ------------------------------------------------------------------ */
/* 2.2 Locations — the hierarchy that drives SEO pages                 */
/* ------------------------------------------------------------------ */

export const locations = mysqlTable(
  "locations",
  {
    id: id(),
    parentId: fk("parent_id"),
    level: mysqlEnum("level", [
      "pais",
      "departamento",
      "ciudad",
      "barrio",
    ]).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    fullSlug: varchar("full_slug", { length: 300 }).notNull().unique(), // 'asuncion/recoleta' — precomputed for URL building
    lat: decimal("lat", { precision: 9, scale: 6 }),
    lng: decimal("lng", { precision: 9, scale: 6 }),
    listingCounts: json("listing_counts"), // cached {venta:{casa:12,...}} refreshed hourly by cron; powers the thin-page rule
    guideContentEs: mediumtext("guide_content_es"), // Claude-generated barrio guide (§4.4)
    guideContentEn: mediumtext("guide_content_en"),
    guideUpdatedAt: datetime("guide_updated_at"),
  },
  (t) => [index("idx_parent").on(t.parentId, t.level)],
);

/* ------------------------------------------------------------------ */
/* 2.3 Supply side: agencies, agents, developers, projects             */
/* ------------------------------------------------------------------ */

export const agencies = mysqlTable("agencies", {
  id: id(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  logoUrl: varchar("logo_url", { length: 500 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  email: varchar("email", { length: 190 }),
  isVerified: boolean("is_verified").notNull().default(false),
  plan: mysqlEnum("plan", ["free", "destacado", "partner"])
    .notNull()
    .default("free"),
  ghlSubAccountId: varchar("ghl_sub_account_id", { length: 80 }), // future: agency GHL sub-account (CRM product lane)
  createdAt: createdAt(),
});

export const agents = mysqlTable(
  "agents",
  {
    id: id(),
    agencyId: fk("agency_id"), // NULL = independent
    userId: fk("user_id"), // linked once they claim their profile
    name: varchar("name", { length: 140 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    photoUrl: varchar("photo_url", { length: 500 }),
    whatsapp: varchar("whatsapp", { length: 30 }),
    isVerified: boolean("is_verified").notNull().default(false),
  },
  (t) => [index("idx_agency").on(t.agencyId)],
);

export const developers = mysqlTable("developers", {
  id: id(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  logoUrl: varchar("logo_url", { length: 500 }),
  website: varchar("website", { length: 300 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
});

export const projects = mysqlTable(
  "projects", // edificios / loteamientos / condominios
  {
    id: id(),
    developerId: fk("developer_id"),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull().unique(),
    projectType: mysqlEnum("project_type", [
      "edificio",
      "loteamiento",
      "condominio",
      "barrio_cerrado",
    ]).notNull(),
    locationId: fk("location_id").notNull(),
    lat: decimal("lat", { precision: 9, scale: 6 }),
    lng: decimal("lng", { precision: 9, scale: 6 }),
    stage: mysqlEnum("stage", [
      "en_pozo",
      "en_construccion",
      "entrega_inmediata",
    ]),
    deliveryDate: date("delivery_date"),
    descriptionEs: text("description_es"),
    heroImageUrl: varchar("hero_image_url", { length: 500 }),
  },
  (t) => [index("idx_loc").on(t.locationId)],
);

/* ------------------------------------------------------------------ */
/* 2.4 Provenance & dedup: listing_sources                             */
/* ------------------------------------------------------------------ */

export const listingSources = mysqlTable(
  "listing_sources",
  {
    id: id(),
    listingId: fk("listing_id").notNull(),
    source: mysqlEnum("source", [
      "manual",
      "fsbo_ads",
      "whiteglove",
      "import_tulugar",
      "import_infocasas",
      "import_clasipar",
      "import_agency_site",
      "api",
    ]).notNull(),
    sourceUrl: varchar("source_url", { length: 600 }),
    sourceExternalId: varchar("source_external_id", { length: 120 }),
    contentHash: char("content_hash", { length: 40 }).notNull(), // sha1(normalized title|price|m2|barrio) → change detection
    dedupKey: char("dedup_key", { length: 40 }).notNull(), // sha1(normalized phone|price_bucket|m2_bucket|location_id)
    firstSeenAt: datetime("first_seen_at").notNull(),
    lastSeenAt: datetime("last_seen_at").notNull(), // importer pauses listings whose source disappears
  },
  (t) => [
    uniqueIndex("uq_source").on(t.source, t.sourceExternalId),
    index("idx_dedup").on(t.dedupKey),
    index("idx_listing").on(t.listingId),
  ],
);

/* ------------------------------------------------------------------ */
/* 2.5 Demand side: leads — GHL owns messaging, this table owns record */
/* ------------------------------------------------------------------ */

export const leads = mysqlTable(
  "leads",
  {
    id: id(),
    leadType: mysqlEnum("lead_type", [
      "buyer",
      "renter",
      "seller",
      "valuation",
      "developer",
      "agent_signup",
    ]).notNull(),
    vertical: varchar("vertical", { length: 40 }).notNull(), // which domain captured it: 'propia','alquiler','en',...
    listingId: fk("listing_id"),
    projectId: fk("project_id"),
    name: varchar("name", { length: 140 }),
    whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
    email: varchar("email", { length: 190 }),
    message: text("message"),
    utm: json("utm"),
    routedTo: mysqlEnum("routed_to", [
      "agency",
      "agent",
      "internal",
      "developer",
    ]).notNull(),
    ghlContactId: varchar("ghl_contact_id", { length: 80 }), // set by the GHL webhook response
    createdAt: createdAt(),
  },
  (t) => [
    index("idx_listing").on(t.listingId),
    index("idx_type").on(t.leadType, t.createdAt),
  ],
);

/* ------------------------------------------------------------------ */
/* 2.6 Money math: market_medians + financing_programs                 */
/* ------------------------------------------------------------------ */

export const marketMedians = mysqlTable(
  "market_medians",
  {
    id: id(),
    period: char("period", { length: 7 }).notNull(), // '2026-07'
    locationId: fk("location_id").notNull(),
    propertyType: varchar("property_type", { length: 20 }).notNull(),
    operation: varchar("operation", { length: 20 }).notNull(),
    medianPriceUsd: decimal("median_price_usd", { precision: 12, scale: 2 }),
    medianPriceM2Usd: decimal("median_price_m2_usd", {
      precision: 10,
      scale: 2,
    }),
    sampleSize: int("sample_size", { unsigned: true }).notNull(), // context module renders only when >= 8
    source: mysqlEnum("source", ["own", "blended"]).notNull(),
  },
  (t) => [
    uniqueIndex("uq").on(t.period, t.locationId, t.propertyType, t.operation),
  ],
);

export const financingPrograms = mysqlTable("financing_programs", {
  code: varchar("code", { length: 40 }).primaryKey(), // 'che_roga_pora','afd_primera_vivienda'
  name: varchar("name", { length: 120 }).notNull(),
  annualRate: decimal("annual_rate", { precision: 5, scale: 2 }).notNull(),
  maxTermMonths: smallint("max_term_months").notNull(),
  maxAmountGs: decimal("max_amount_gs", { precision: 14, scale: 0 }),
  minDownPct: decimal("min_down_pct", { precision: 5, scale: 2 }).notNull(),
  active: boolean("active").notNull().default(true),
  updatedAt: datetime("updated_at"),
});

/* ------------------------------------------------------------------ */
/* 2.7 Users & OTP (WhatsApp OTP delivered via GHL)                    */
/* ------------------------------------------------------------------ */

export const users = mysqlTable("users", {
  id: id(),
  name: varchar("name", { length: 140 }),
  email: varchar("email", { length: 190 }).unique(),
  whatsapp: varchar("whatsapp", { length: 30 }).unique(),
  whatsappVerifiedAt: datetime("whatsapp_verified_at"),
  role: mysqlEnum("role", [
    "consumer",
    "agent",
    "agency_admin",
    "developer",
    "admin",
  ])
    .notNull()
    .default("consumer"),
  locale: mysqlEnum("locale", ["es", "en"]).notNull().default("es"),
  createdAt: createdAt(),
});

export const otpCodes = mysqlTable(
  "otp_codes",
  {
    id: id(),
    whatsapp: varchar("whatsapp", { length: 30 }).notNull(),
    code: char("code", { length: 6 }).notNull(),
    expiresAt: datetime("expires_at").notNull(), // 10-min expiry, resend cooldown
    attempts: tinyint("attempts").notNull().default(0),
    consumedAt: datetime("consumed_at"),
  },
  (t) => [index("idx_wa").on(t.whatsapp, t.expiresAt)],
);
