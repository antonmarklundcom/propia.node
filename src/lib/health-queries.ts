import "server-only";
import { and, eq, isNotNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  agencies,
  agents,
  developers,
  financingPrograms,
  leads,
  listingImages,
  listings,
  locations,
  marketMedians,
  posts,
  projects,
} from "@/db/schema";
import { isR2Configured } from "@/lib/r2";
import { UNDER_CONSTRUCTION } from "@/config/site-status";
import { MIN_RELIABLE_SAMPLE } from "@/lib/precios-queries";

/**
 * Content health — "why is this page empty?", answered from the database
 * instead of by reading the code.
 *
 * Most public pages here render conditionally: the homepage price block, the
 * projects row and the developers grid only appear when their query returns
 * rows, and /precios and /datos degrade to zeros when `market_medians` is
 * empty. That is correct behaviour (better an absent section than a section
 * full of nothing), but it is indistinguishable from a bug when you are
 * looking at the live site: a page that renders "0" looks broken, and a page
 * whose whole section vanished looks finished.
 *
 * So each check names the pages it feeds and the single command or decision
 * that fixes it. A check is deliberately allowed to be `blocked` — waiting on
 * something outside the codebase — because "nothing to do here" is itself the
 * answer most of these needed.
 */

export type HealthStatus = "ok" | "warn" | "blocked";

export interface HealthCheck {
  id: string;
  /** What is being measured, in the founder's words rather than a table name. */
  label: string;
  status: HealthStatus;
  /** The measurement itself — a count, a flag, a list. */
  value: string;
  /** Public routes that visibly change when this check goes green. */
  affects: string[];
  /** What to actually do. A shell command where one exists. */
  action?: string;
  /** Why it is not simply "run something" — set on `blocked`. */
  note?: string;
}

type Countable = Parameters<ReturnType<typeof db.select>["from"]>[0];

async function count(table: Countable, where?: SQL): Promise<number> {
  const q = db.select({ n: sql<number>`COUNT(*)` }).from(table);
  const [row] = where ? await q.where(where) : await q;
  return Number(row?.n ?? 0);
}

/**
 * Every check, ordered by how much of the site each one unblocks. Runs as one
 * batch of counts — this page is opened to answer a question, not polled.
 */
export async function getContentHealth(): Promise<HealthCheck[]> {
  const [
    publishedListings,
    totalListings,
    realImages,
    medianRows,
    reliableGroups,
    activePrograms,
    cheRogaActive,
    ventaWithCuota,
    ventaTotal,
    locationRows,
    agencyRows,
    agentRows,
    projectRows,
    developerRows,
    publishedPosts,
    leadRows,
  ] = await Promise.all([
    count(listings, eq(listings.status, "published")),
    count(listings),
    // The seeded dataset points covers at picsum.photos, which are not photos
    // of the property — isPlaceholderPhoto() treats them as "no photo", so
    // counting rows in listing_images would badly overstate this.
    db
      .select({ n: sql<number>`COUNT(*)` })
      .from(listingImages)
      .where(sql`${listingImages.r2Key} NOT LIKE '%picsum.photos%'`)
      .then((r) => Number(r[0]?.n ?? 0)),
    count(marketMedians),
    db
      .select({ n: sql<number>`COUNT(*)` })
      .from(marketMedians)
      .where(sql`${marketMedians.sampleSize} >= ${MIN_RELIABLE_SAMPLE}`)
      .then((r) => Number(r[0]?.n ?? 0)),
    db
      .select({ code: financingPrograms.code, rate: financingPrograms.annualRate })
      .from(financingPrograms)
      .where(eq(financingPrograms.active, true)),
    db
      .select({ n: sql<number>`COUNT(*)` })
      .from(financingPrograms)
      .where(
        and(
          eq(financingPrograms.code, "che_roga_pora"),
          eq(financingPrograms.active, true),
        ),
      )
      .then((r) => Number(r[0]?.n ?? 0)),
    count(
      listings,
      and(eq(listings.operation, "venta"), isNotNull(listings.cuotaGs)),
    ),
    count(listings, eq(listings.operation, "venta")),
    count(locations),
    count(agencies),
    count(agents),
    count(projects),
    count(developers),
    count(posts, eq(posts.status, "published")),
    count(leads),
  ]);

  const checks: HealthCheck[] = [];

  /* ---- Inventory: the thing everything else is downstream of ---------- */

  checks.push({
    id: "listings",
    label: "Avisos publicados",
    status: publishedListings === 0 ? "warn" : "ok",
    value: `${publishedListings} publicados de ${totalListings} cargados`,
    affects: ["/", "/venta/…", "/alquiler/…", "/propiedad/…"],
    action:
      publishedListings === 0
        ? "Ningún aviso visible — revisá la cola en /admin"
        : undefined,
  });

  checks.push({
    id: "photos",
    label: "Fotos reales de propiedades",
    status: realImages === 0 ? "blocked" : "ok",
    value:
      realImages === 0
        ? "0 — todas las tarjetas muestran «Foto próximamente»"
        : `${realImages} imágenes reales cargadas`,
    affects: ["/", "todas las grillas", "/propiedad/…"],
    note: isR2Configured()
      ? "R2 está configurado: faltan las fotos en sí, no la infraestructura."
      : "R2 no está configurado (R2_* sin definir). El código está listo; falta crear la cuenta y el bucket en Cloudflare. No se puede resolver desde acá.",
  });

  /* ---- Market data: the reason /precios and /datos exist -------------- */

  checks.push({
    id: "medians",
    label: "Medianas de precio calculadas",
    status: medianRows === 0 ? "warn" : reliableGroups === 0 ? "warn" : "ok",
    value:
      medianRows === 0
        ? "0 filas en market_medians — el cron nunca corrió"
        : `${medianRows} grupos calculados, ${reliableGroups} con muestra suficiente (≥ ${MIN_RELIABLE_SAMPLE})`,
    affects: ["/precios", "/precios/[ciudad]", "/datos", "bloque de precios en la portada"],
    action: medianRows === 0 ? "npm run cron:medians" : undefined,
    note:
      medianRows > 0 && reliableGroups === 0
        ? `Las medianas existen pero ningún grupo (ciudad × tipo × operación) llega a ${MIN_RELIABLE_SAMPLE} avisos, así que no se publica ninguna cifra. Esto se resuelve con más inventario, no con código.`
        : medianRows === 0
          ? "Mientras esté en 0, /precios y /datos muestran ceros y el bloque de precios de la portada no se renderiza."
          : undefined,
  });

  /* ---- Financing: the numbers printed on every venta card ------------- */

  const programList =
    activePrograms.length > 0
      ? activePrograms
          .map((p) => `${p.code} (${Number(p.rate).toLocaleString("es-PY")}%)`)
          .join(", ")
      : "ninguno";

  checks.push({
    id: "financing",
    label: "Programas de financiamiento activos",
    status: cheRogaActive > 0 ? "warn" : activePrograms.length === 0 ? "warn" : "ok",
    value: programList,
    affects: ["/datos", "/financiamiento", "cuota en cada tarjeta de venta"],
    action:
      cheRogaActive > 0
        ? "npm run seed:financing && npm run cron:cuotas"
        : undefined,
    note:
      cheRogaActive > 0
        ? "La base todavía tiene Che Róga Porã activo, pero el seed lo declara inactivo (decisión del 2026-08-16). Hasta correr esos dos comandos, las tarjetas siguen mostrando cuotas de un programa que no corresponde cotizar en todos los avisos."
        : undefined,
  });

  checks.push({
    id: "cuotas",
    label: "Cuotas cacheadas en avisos de venta",
    status: ventaTotal > 0 && ventaWithCuota === 0 ? "warn" : "ok",
    value: `${ventaWithCuota} de ${ventaTotal} avisos de venta tienen cuota`,
    affects: ["tarjetas de venta", "/propiedad/…"],
    action:
      ventaTotal > 0 && ventaWithCuota === 0 ? "npm run cron:cuotas" : undefined,
    note:
      ventaWithCuota > 0 && ventaWithCuota < ventaTotal
        ? "Los que no tienen cuota están por encima del tope del programa — es el comportamiento esperado, no un error."
        : undefined,
  });

  /* ---- Directories: pages that exist but may have nothing to list ----- */

  checks.push({
    id: "locations",
    label: "Ciudades y barrios cargados",
    status: locationRows === 0 ? "warn" : "ok",
    value: `${locationRows} ubicaciones`,
    affects: ["buscador", "todas las páginas de categoría"],
    action: locationRows === 0 ? "npm run seed:locations" : undefined,
  });

  checks.push({
    id: "agencies",
    label: "Inmobiliarias y agentes",
    status: agencyRows === 0 && agentRows === 0 ? "warn" : "ok",
    value: `${agencyRows} inmobiliarias, ${agentRows} agentes`,
    affects: ["/inmobiliarias", "/agentes", "/inmobiliaria/…", "/agente/…"],
    note:
      agencyRows === 0 && agentRows === 0
        ? "Los directorios cargan vacíos. Se llena con altas reales, no con un comando."
        : undefined,
  });

  checks.push({
    id: "projects",
    label: "Proyectos y desarrolladoras",
    status: projectRows === 0 ? "warn" : "ok",
    value: `${projectRows} proyectos, ${developerRows} desarrolladoras`,
    affects: ["/proyectos", "/desarrolladoras", "bloque de proyectos en la portada"],
    note:
      projectRows === 0
        ? "Con 0 proyectos, el bloque de la portada no se renderiza (es intencional) y /proyectos queda vacío."
        : undefined,
  });

  checks.push({
    id: "posts",
    label: "Guías y notas publicadas",
    status: publishedPosts === 0 ? "warn" : "ok",
    value: `${publishedPosts} publicadas`,
    affects: ["/guias", "/guias/[slug]"],
    action: publishedPosts === 0 ? "Escribir la primera en /admin/guias" : undefined,
  });

  /* ---- Site-wide switches -------------------------------------------- */

  checks.push({
    id: "under-construction",
    label: "Aviso de «sitio en construcción»",
    status: UNDER_CONSTRUCTION ? "warn" : "ok",
    value: UNDER_CONSTRUCTION ? "visible en todas las páginas públicas" : "oculto",
    affects: ["todas las páginas públicas"],
    note: UNDER_CONSTRUCTION
      ? "Se apaga con NEXT_PUBLIC_UNDER_CONSTRUCTION=false y un redeploy — pero solo cuando el inventario sea real y con permiso. Apagarlo antes es el problema, no la solución."
      : undefined,
  });

  const whatsapp = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "");
  checks.push({
    id: "contact",
    label: "Canal de contacto del portal",
    status: whatsapp ? "ok" : "warn",
    value: whatsapp ? `WhatsApp ${whatsapp}` : "sin WhatsApp — todo cae al mail",
    affects: ["/contacto", "pie de página", "CTA de publicar", "newsletter"],
    note: whatsapp
      ? undefined
      : "Sin NEXT_PUBLIC_CONTACT_WHATSAPP, esos enlaces caen a hola@propia.com.py, un dominio que no está registrado: hoy no llega ningún mensaje.",
  });

  checks.push({
    id: "leads",
    label: "Consultas recibidas",
    status: "ok",
    value: `${leadRows} en total`,
    affects: ["/admin/leads"],
  });

  return checks;
}

export interface RouteRow {
  path: string;
  label: string;
  /** Which health check decides whether this page has anything to show. */
  dependsOn: string[];
  /** Public and indexable, or a staff/utility route. */
  kind: "público" | "panel";
}

/**
 * The public route map, by hand rather than by walking `app/`.
 *
 * A filesystem walk would list the routes but not what feeds them, and the
 * whole point of this screen is the second column. Adding a page means adding
 * a line here — cheap, and it keeps the map honest about intent rather than
 * about which files happen to exist.
 */
export const ROUTES: RouteRow[] = [
  { path: "/", label: "Portada", dependsOn: ["listings", "photos", "medians", "projects"], kind: "público" },
  { path: "/venta/[ciudad]", label: "Búsqueda de venta", dependsOn: ["listings", "photos", "locations"], kind: "público" },
  { path: "/alquiler/[ciudad]", label: "Búsqueda de alquiler", dependsOn: ["listings", "photos", "locations"], kind: "público" },
  { path: "/propiedad/[slug]", label: "Ficha de propiedad", dependsOn: ["listings", "photos", "cuotas"], kind: "público" },
  { path: "/precios", label: "Precios por ciudad", dependsOn: ["medians"], kind: "público" },
  { path: "/precios/[ciudad]", label: "Precios de una ciudad", dependsOn: ["medians"], kind: "público" },
  { path: "/datos", label: "Datos del mercado", dependsOn: ["medians", "financing", "listings"], kind: "público" },
  { path: "/financiamiento", label: "Financiamiento y cuotas", dependsOn: ["financing"], kind: "público" },
  { path: "/tasacion", label: "Tasación online", dependsOn: ["listings"], kind: "público" },
  { path: "/proyectos", label: "Proyectos", dependsOn: ["projects"], kind: "público" },
  { path: "/desarrolladoras", label: "Desarrolladoras", dependsOn: ["projects"], kind: "público" },
  { path: "/inmobiliarias", label: "Directorio de inmobiliarias", dependsOn: ["agencies"], kind: "público" },
  { path: "/agentes", label: "Directorio de agentes", dependsOn: ["agencies"], kind: "público" },
  { path: "/guias", label: "Guías y notas", dependsOn: ["posts"], kind: "público" },
  { path: "/como-funciona", label: "Cómo funciona", dependsOn: [], kind: "público" },
  { path: "/para-inmobiliarias", label: "Para inmobiliarias", dependsOn: [], kind: "público" },
  { path: "/planes", label: "Planes", dependsOn: [], kind: "público" },
  { path: "/preguntas-frecuentes", label: "Preguntas frecuentes", dependsOn: [], kind: "público" },
  { path: "/nosotros", label: "Nosotros", dependsOn: [], kind: "público" },
  { path: "/contacto", label: "Contacto", dependsOn: ["contact"], kind: "público" },
  { path: "/terminos", label: "Términos", dependsOn: [], kind: "público" },
  { path: "/privacidad", label: "Privacidad", dependsOn: [], kind: "público" },
  { path: "/publicar", label: "Publicar propiedad", dependsOn: [], kind: "público" },
  { path: "/admin", label: "Panel de administración", dependsOn: [], kind: "panel" },
  { path: "/agencia", label: "Panel de inmobiliaria", dependsOn: [], kind: "panel" },
];
