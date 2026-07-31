/**
 * Site navigation — the single source of truth for the header menu, the
 * mobile drawer and the footer columns.
 *
 * Kept in one module on purpose: header and footer used to drift (the footer
 * knew about /precios and /tasacion, the header didn't), which is how pages
 * end up reachable only sideways. Anything user-facing that isn't a category
 * URL gets an entry here, or it doesn't exist as far as visitors and crawlers
 * are concerned.
 */
import { PROPERTY_TYPE_OPTIONS } from "@/lib/property-types";
import { categoryUrl } from "@/lib/urls";

export interface NavLink {
  label: string;
  href: string;
  /** Shown in the desktop dropdown panel only — one line of context. */
  desc?: string;
}

export interface NavGroup {
  label: string;
  /** Where the group label itself points (a real page, never "#"). */
  href: string;
  links: NavLink[];
}

export const HEADER_NAV: NavGroup[] = [
  {
    label: "Comprar",
    href: "/venta/asuncion",
    links: [
      {
        label: "Casas en venta",
        href: "/venta/asuncion/casas",
        desc: "Asunción y área metropolitana",
      },
      {
        label: "Departamentos en venta",
        href: "/venta/asuncion/departamentos",
        desc: "Desde monoambientes a penthouses",
      },
      {
        label: "Terrenos",
        href: "/venta/asuncion/terrenos",
        desc: "Lotes y loteamientos",
      },
      {
        label: "Duplex",
        href: "/venta/asuncion/duplex",
        desc: "Duplex y townhouses",
      },
      {
        label: "Proyectos nuevos",
        href: "/proyectos",
        desc: "Obra nueva, en pozo y preventa",
      },
    ],
  },
  {
    label: "Alquilar",
    href: "/alquiler/asuncion",
    links: [
      {
        label: "Departamentos en alquiler",
        href: "/alquiler/asuncion/departamentos",
        desc: "Amoblados y sin amoblar",
      },
      {
        label: "Casas en alquiler",
        href: "/alquiler/asuncion/casas",
        desc: "Familiares y barrios cerrados",
      },
      {
        label: "Oficinas",
        href: "/alquiler/asuncion/oficinas",
        desc: "Espacios corporativos",
      },
      {
        label: "Locales comerciales",
        href: "/alquiler/asuncion/comerciales",
        desc: "Sobre avenida y en shopping",
      },
    ],
  },
  {
    label: "Proyectos",
    href: "/proyectos",
    links: [
      {
        label: "Todos los proyectos",
        href: "/proyectos",
        desc: "Edificios, condominios y loteamientos",
      },
      {
        label: "Departamentos en pozo",
        href: "/venta/asuncion/departamentos",
        desc: "Preventa con plan de pagos",
      },
    ],
  },
  {
    label: "Herramientas",
    href: "/precios",
    links: [
      {
        label: "Precios por ciudad",
        href: "/precios",
        desc: "Medianas de m² del mercado real",
      },
      {
        label: "¿Cuánto vale tu propiedad?",
        href: "/tasacion",
        desc: "Tasación online gratis",
      },
      {
        label: "Financiamiento y cuotas",
        href: "/financiamiento",
        desc: "Che Roga Porã, AFD y bancos",
      },
      {
        label: "Cómo funciona",
        href: "/como-funciona",
        desc: "Comprar, alquilar y vender paso a paso",
      },
    ],
  },
  {
    label: "Profesionales",
    href: "/para-inmobiliarias",
    links: [
      {
        label: "Para inmobiliarias y agentes",
        href: "/para-inmobiliarias",
        desc: "Publicá tu cartera completa",
      },
      {
        label: "Planes y precios",
        href: "/planes",
        desc: "Gratis para empezar",
      },
      {
        label: "Directorio de inmobiliarias",
        href: "/inmobiliarias",
        desc: "Quiénes ya publican con nosotros",
      },
      {
        label: "Ingresar al panel",
        href: "/login",
        desc: "Gestioná tus avisos y consultas",
      },
    ],
  },
];

/** Footer column: buying and renting entry points. */
export const FOOTER_BUY: NavLink[] = [
  { label: "Casas en venta", href: "/venta/asuncion/casas" },
  { label: "Departamentos en venta", href: "/venta/asuncion/departamentos" },
  { label: "Terrenos", href: "/venta/asuncion/terrenos" },
  { label: "Alquileres en Asunción", href: "/alquiler/asuncion" },
  { label: "Proyectos nuevos", href: "/proyectos" },
];

/** Footer column: the tools, i.e. the reasons to come back between searches. */
export const FOOTER_TOOLS: NavLink[] = [
  { label: "Precios por ciudad", href: "/precios" },
  { label: "Tasación gratis", href: "/tasacion" },
  { label: "Financiamiento y cuotas", href: "/financiamiento" },
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
];

/** Footer column: the sell-side. This is the revenue lane — keep it visible. */
export const FOOTER_PRO: NavLink[] = [
  { label: "Publicar una propiedad", href: "/publicar" },
  { label: "Para inmobiliarias y agentes", href: "/para-inmobiliarias" },
  { label: "Planes y precios", href: "/planes" },
  { label: "Directorio de inmobiliarias", href: "/inmobiliarias" },
  { label: "Crear cuenta", href: "/registro" },
  { label: "Ingresar", href: "/login" },
];

/** Footer column: who we are — the "is this a real business?" answers. */
export const FOOTER_COMPANY: NavLink[] = [
  { label: "Sobre nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
  { label: "Términos y condiciones", href: "/terminos" },
  { label: "Política de privacidad", href: "/privacidad" },
];

/** Curated cities — a fixed list, not a DB query (the footer is on every page). */
export const FOOTER_LOCATIONS: NavLink[] = [
  { label: "Propiedades en Asunción", href: categoryUrl({ operation: "venta", citySlug: "asuncion" }) },
  { label: "Propiedades en Luque", href: categoryUrl({ operation: "venta", citySlug: "luque" }) },
  { label: "Propiedades en San Lorenzo", href: categoryUrl({ operation: "venta", citySlug: "san-lorenzo" }) },
  { label: "Propiedades en Lambaré", href: categoryUrl({ operation: "venta", citySlug: "lambare" }) },
  { label: "Propiedades en Ciudad del Este", href: categoryUrl({ operation: "venta", citySlug: "ciudad-del-este" }) },
  { label: "Propiedades en Encarnación", href: categoryUrl({ operation: "venta", citySlug: "encarnacion" }) },
];

export const FOOTER_TYPES: NavLink[] = PROPERTY_TYPE_OPTIONS.slice(0, 6).map(
  (t) => ({
    label: t.label,
    href: categoryUrl({ operation: "venta", citySlug: "asuncion", type: t.value }),
  }),
);

/**
 * Static (non-category) pages that belong in the sitemap. Category, listing,
 * price and profile URLs are derived from the DB in src/lib/sitemap.ts; these
 * are the hand-authored ones, listed once so adding a page here is enough.
 */
export const STATIC_SITEMAP_PATHS: string[] = [
  "/",
  "/nosotros",
  "/contacto",
  "/como-funciona",
  "/para-inmobiliarias",
  "/planes",
  "/inmobiliarias",
  "/proyectos",
  "/financiamiento",
  "/preguntas-frecuentes",
  "/tasacion",
  "/terminos",
  "/privacidad",
];
