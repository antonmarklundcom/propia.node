/**
 * The locations tree `seed:locations` writes (see `seed-locations.ts` for the
 * job). Pure data plus its flattening — no `server-only`, no database — so
 * `npm run verify:seo` can check that every evergreen category URL
 * (`src/content/evergreen/`) names a city and barrio that actually exist.
 */
import { slugify, joinSlug } from "../slug";

export type Level = "pais" | "departamento" | "ciudad" | "barrio";

export interface Node {
  name: string;
  level: Level;
  lat?: number;
  lng?: number;
  children?: Node[];
}

/**
 * Asunción is both the capital district and its own "ciudad" for URL purposes
 * (full_slug 'asuncion/recoleta'), so it sits at ciudad level, not under a
 * departamento. Central is the surrounding metro departamento.
 */
export const TREE: Node[] = [
  {
    name: "Asunción",
    level: "ciudad",
    lat: -25.2637,
    lng: -57.5759,
    children: [
      { name: "Recoleta", level: "barrio", lat: -25.2865, lng: -57.5759 },
      { name: "Villa Morra", level: "barrio", lat: -25.2937, lng: -57.5679 },
      { name: "Las Mercedes", level: "barrio", lat: -25.2828, lng: -57.6003 },
      { name: "Carmelitas", level: "barrio", lat: -25.2986, lng: -57.5546 },
      { name: "Mburicaó", level: "barrio", lat: -25.2789, lng: -57.6108 },
      { name: "Ycuá Satí", level: "barrio", lat: -25.2999, lng: -57.5471 },
      { name: "Manorá", level: "barrio", lat: -25.3055, lng: -57.5624 },
      { name: "Los Laureles", level: "barrio", lat: -25.3097, lng: -57.5732 },
      { name: "Sajonia", level: "barrio", lat: -25.3009, lng: -57.6247 },
      { name: "Trinidad", level: "barrio", lat: -25.2569, lng: -57.5478 },
      { name: "San Vicente", level: "barrio", lat: -25.2705, lng: -57.6218 },
      { name: "Barrio Jara", level: "barrio", lat: -25.2761, lng: -57.5877 },
      // Decision S10 (2026-09-27): ~90 searches/month for cheap house rentals.
      // Centroid approximate, to verify (docs/decisions-needed.md S10).
      { name: "Loma Pytã", level: "barrio", lat: -25.23, lng: -57.56 },
    ],
  },
  {
    name: "Central",
    level: "departamento",
    lat: -25.35,
    lng: -57.52,
    children: [
      { name: "Luque", level: "ciudad", lat: -25.267, lng: -57.4872 },
      { name: "San Lorenzo", level: "ciudad", lat: -25.34, lng: -57.5087 },
      {
        name: "Fernando de la Mora",
        level: "ciudad",
        lat: -25.3319,
        lng: -57.5427,
      },
      { name: "Lambaré", level: "ciudad", lat: -25.3419, lng: -57.6083 },
      { name: "Capiatá", level: "ciudad", lat: -25.3556, lng: -57.4453 },
      { name: "Ñemby", level: "ciudad", lat: -25.3944, lng: -57.5358 },
      {
        name: "Mariano Roque Alonso",
        level: "ciudad",
        lat: -25.2058,
        lng: -57.5325,
      },
      { name: "Villa Elisa", level: "ciudad", lat: -25.3639, lng: -57.5906 },
      { name: "Limpio", level: "ciudad", lat: -25.1683, lng: -57.4869 },
      { name: "Itauguá", level: "ciudad", lat: -25.3928, lng: -57.3536 },
      { name: "Areguá", level: "ciudad", lat: -25.3078, lng: -57.4239 },
      { name: "Villa Hayes", level: "ciudad", lat: -25.0928, lng: -57.5242 },
      { name: "San Antonio", level: "ciudad", lat: -25.4128, lng: -57.5461 },
      { name: "Guarambaré", level: "ciudad", lat: -25.4886, lng: -57.4544 },
      { name: "Itá", level: "ciudad", lat: -25.5083, lng: -57.3617 },
    ],
  },
  {
    name: "Alto Paraná",
    level: "departamento",
    lat: -25.5,
    lng: -54.75,
    children: [
      {
        name: "Ciudad del Este",
        level: "ciudad",
        lat: -25.5097,
        lng: -54.6111,
      },
      {
        name: "Presidente Franco",
        level: "ciudad",
        lat: -25.5636,
        lng: -54.6114,
      },
      { name: "Hernandarias", level: "ciudad", lat: -25.3947, lng: -54.6383 },
      { name: "Minga Guazú", level: "ciudad", lat: -25.4761, lng: -54.8214 },
    ],
  },
  {
    name: "Itapúa",
    level: "departamento",
    lat: -27.0,
    lng: -55.75,
    children: [
      { name: "Encarnación", level: "ciudad", lat: -27.3306, lng: -55.8667 },
      { name: "Cambyretá", level: "ciudad", lat: -27.2831, lng: -55.8258 },
    ],
  },
  {
    name: "Amambay",
    level: "departamento",
    lat: -22.55,
    lng: -55.75,
    children: [
      {
        name: "Pedro Juan Caballero",
        level: "ciudad",
        lat: -22.5472,
        lng: -55.7333,
      },
    ],
  },
  {
    name: "Cordillera",
    level: "departamento",
    lat: -25.3,
    lng: -57.0,
    children: [
      { name: "Caacupé", level: "ciudad", lat: -25.3858, lng: -57.1414 },
      { name: "Tobatí", level: "ciudad", lat: -25.2586, lng: -57.0742 },
      // Decision S10 (2026-09-27): the biggest land search in the keyword
      // export (210/month). Centroid to verify.
      { name: "San Bernardino", level: "ciudad", lat: -25.3094, lng: -57.2964 },
      // District seats added 2026-09-30 WITHOUT coordinates on purpose: no
      // cited source was reachable when they were added, and a guessed
      // centroid mis-plots every listing that inherits it. Until lat/lng are
      // filled in here (then `seed:locations` + `cron:geo`), a listing in one
      // of these has no map pin; `cron:geo` names them. Names: the district
      // list of the department (verify against DGEEC before relying on it).
      { name: "Altos", level: "ciudad" },
      { name: "Arroyos y Esteros", level: "ciudad" },
      { name: "Atyrá", level: "ciudad" },
      { name: "Caraguatay", level: "ciudad" },
      { name: "Emboscada", level: "ciudad" },
      { name: "Eusebio Ayala", level: "ciudad" },
      { name: "Isla Pucú", level: "ciudad" },
      { name: "Itacurubí de la Cordillera", level: "ciudad" },
      { name: "Juan de Mena", level: "ciudad" },
      { name: "Loma Grande", level: "ciudad" },
      { name: "Mbocayaty del Yhaguy", level: "ciudad" },
      { name: "Nueva Colombia", level: "ciudad" },
      { name: "Piribebuy", level: "ciudad" },
      { name: "Primero de Marzo", level: "ciudad" },
      { name: "San José Obrero", level: "ciudad" },
      { name: "Santa Elena", level: "ciudad" },
      { name: "Valenzuela", level: "ciudad" },
    ],
  },
  {
    name: "Paraguarí",
    level: "departamento",
    lat: -25.63,
    lng: -57.15,
    children: [
      { name: "Paraguarí", level: "ciudad", lat: -25.6314, lng: -57.1461 },
      { name: "Ypacaraí", level: "ciudad", lat: -25.4058, lng: -57.2839 },
      // Requested by an agency with a listing there (lead 2026-09-04).
      { name: "Yaguarón", level: "ciudad", lat: -25.5617, lng: -57.2833 },
      // District seats added 2026-09-30 WITHOUT coordinates on purpose: no
      // cited source was reachable when they were added, and a guessed
      // centroid mis-plots every listing that inherits it. Until lat/lng are
      // filled in here (then `seed:locations` + `cron:geo`), a listing in one
      // of these has no map pin; `cron:geo` names them. Names: the district
      // list of the department (verify against DGEEC before relying on it).
      { name: "Acahay", level: "ciudad" },
      { name: "Caapucú", level: "ciudad" },
      { name: "Carapeguá", level: "ciudad" },
      { name: "Escobar", level: "ciudad" },
      { name: "General Bernardino Caballero", level: "ciudad" },
      { name: "La Colmena", level: "ciudad" },
      { name: "Mbuyapey", level: "ciudad" },
      { name: "Pirayú", level: "ciudad" },
      { name: "Quiindy", level: "ciudad" },
      { name: "Quyquyhó", level: "ciudad" },
      { name: "San Roque González de Santa Cruz", level: "ciudad" },
      { name: "Sapucai", level: "ciudad" },
      { name: "Tebicuary-mí", level: "ciudad" },
      { name: "Ybycuí", level: "ciudad" },
      { name: "Ybytymí", level: "ciudad" },
    ],
  },
];

export interface FlatNode {
  name: string;
  level: Level;
  lat?: number;
  lng?: number;
  slug: string;
  fullSlug: string;
  parentFullSlug: string | null;
}

/**
 * The tree, parents before children. Flattening first is what lets the dry run
 * exist: the recursive writer had to insert a parent to learn its id before it
 * could touch a child, so there was no way to describe the whole change without
 * making part of it.
 */
export function flatten(
  nodes: Node[],
  parentFullSlug: string,
  into: FlatNode[] = [],
): FlatNode[] {
  for (const node of nodes) {
    const slug = slugify(node.name);
    const fullSlug = joinSlug(parentFullSlug, slug);
    into.push({
      name: node.name,
      level: node.level,
      lat: node.lat,
      lng: node.lng,
      slug,
      fullSlug,
      parentFullSlug: parentFullSlug === "" ? null : parentFullSlug,
    });
    if (node.children) flatten(node.children, fullSlug, into);
  }
  return into;
}


/**
 * A place by its URL slugs, from the tree `seed:locations` writes — the
 * fallback a category page renders from when production has not been seeded
 * with a place the code already links (report 2026-10-03 §A: the evergreen
 * San Bernardino and Loma Pytã pages 404'd until the seed ran). Null when the
 * code does not know the place either: that URL is a real 404.
 */
export function treePlace(
  citySlug: string,
  barrioSlug?: string,
): { city: FlatNode; barrio: FlatNode | null } | null {
  const all = flatten(TREE, "");
  const city = all.find((n) => n.level === "ciudad" && n.slug === citySlug);
  if (!city) return null;
  if (!barrioSlug) return { city, barrio: null };
  const barrio = all.find((n) => n.level === "barrio" && n.slug === barrioSlug && n.parentFullSlug === city.fullSlug);
  return barrio ? { city, barrio } : null;
}
