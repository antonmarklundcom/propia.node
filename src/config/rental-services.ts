/**
 * The rental family's seven services — the one list that the home page, the
 * services hub, the service route, the footer, the sitemap and S1's redirect
 * map all read.
 *
 * It lives here rather than in the dictionary because a service is structure,
 * not copy: its slug is a URL, its `dictKey` names the object that holds its
 * words in both languages, its image is a file that has to exist, and `oldPath`
 * is the URL the previous WordPress site published — which is what S1's 301s
 * are built from. The words themselves live in `rental.services[dictKey]`
 * (card title and one-liner) and, from S3, `rentalServices[dictKey]` (the full
 * page), so a Spanish and an English door read the same list and different
 * sentences.
 *
 * Order is the order they are shown in, on every surface. It leads with what
 * most visitors arrive for (a place to live) and ends with the two services
 * that only make sense once someone has decided to stay.
 *
 * O3 adds `leadType` here and the `/servicios/[slug]` route that consumes it.
 */
import type { LeadFormType } from "@/components/LeadForm";

export interface RentalService {
  /** URL segment under /servicios — Spanish on both doors (plan §1 item 8). */
  slug: string;
  /** Key into `rental.services` and (from S3) `rentalServices`. */
  dictKey:
    | "alquiler"
    | "administracionAirbnb"
    | "administracionDepartamentos"
    | "inmobiliariaAsuncion"
    | "residenciaParaguay"
    | "invertirEnParaguay"
    | "domicilioVirtual";
  /** Hero/card image. Written by S1 from plan Appendix B. */
  image: string;
  /** The path the old rentparaguay.com published this at — S1's 301 source. */
  oldPath: string;
  /**
   * Which lane a lead from this service's page belongs in. The existing
   * `lead_type` enum, deliberately: someone renting, applying for residency or
   * taking a virtual address is a `renter` (they want something from us);
   * someone handing us a property to manage is a `seller` (the "I own a
   * property" lane); someone buying or investing is a `buyer`. Adding
   * `airbnb_management` and friends as enum members would be a migration for
   * information the service name already carries — which travels instead as
   * `utm.source = "rental:<slug>"`, the marker `/vender` established
   * (plan §1 item 7).
   */
  leadType: LeadFormType;
}

export const RENTAL_SERVICES: readonly RentalService[] = [
  {
    slug: "alquiler",
    dictKey: "alquiler",
    image: "/img/rental/alquiler.webp",
    oldPath: "/rent-apartment-house/",
    leadType: "renter",
  },
  {
    slug: "administracion-airbnb",
    dictKey: "administracionAirbnb",
    image: "/img/rental/administracion-airbnb.webp",
    oldPath: "/airbnb-management/",
    leadType: "seller",
  },
  {
    slug: "administracion-de-departamentos",
    dictKey: "administracionDepartamentos",
    image: "/img/rental/administracion-de-departamentos.webp",
    oldPath: "/apartment-management/",
    leadType: "seller",
  },
  {
    slug: "inmobiliaria-asuncion",
    dictKey: "inmobiliariaAsuncion",
    image: "/img/rental/inmobiliaria-asuncion.webp",
    oldPath: "/realtor-asuncion/",
    leadType: "buyer",
  },
  {
    slug: "residencia-paraguay",
    dictKey: "residenciaParaguay",
    image: "/img/rental/residencia-paraguay.webp",
    oldPath: "/residency-paraguay/",
    leadType: "renter",
  },
  {
    slug: "invertir-en-paraguay",
    dictKey: "invertirEnParaguay",
    image: "/img/rental/invertir-en-paraguay.webp",
    oldPath: "/invest-in-paraguay/",
    leadType: "buyer",
  },
  {
    slug: "domicilio-virtual",
    dictKey: "domicilioVirtual",
    image: "/img/rental/domicilio-virtual.webp",
    oldPath: "/virtual-adress/", // the old site's own spelling — S1 redirects it verbatim
    leadType: "renter",
  },
] as const;

/** The URLs the rental sitemap lists for the services (plan §5.1, appended in O3). */
export const RENTAL_SERVICE_PATHS: readonly string[] = RENTAL_SERVICES.map(
  (s) => `/servicios/${s.slug}`,
);
