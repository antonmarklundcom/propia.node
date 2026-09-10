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
  /**
   * URL segment under `/servicios` — the Spanish door's URL, and the stable
   * identity of the service everywhere else: `dictKey` keys the copy, `slug`
   * keys the URL, and R2 changed only the second one *on the English door*.
   */
  slug: string;
  /**
   * URL segment under `/services` — the English door's URL (R2, plan §5.1 /
   * Stage 1 C2). `rentparaguay.com` is pitched at people who do not read
   * Spanish, and `/servicios/administracion-de-departamentos` asks them to
   * type a sentence in a language they came here to avoid; the old WordPress
   * site published these pages under English paths, which is also what the
   * links still pointing at it expect.
   *
   * Never derive one slug from the other: they are two published URLs, and a
   * transliteration would silently move a live page the day someone edits the
   * Spanish one. Both are read through `rentalPath()` (`src/design/sections.ts`),
   * never concatenated at a call site.
   */
  slugEn: string;
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
    slugEn: "rent",
    dictKey: "alquiler",
    image: "/img/rental/alquiler.webp",
    oldPath: "/rent-apartment-house/",
    leadType: "renter",
  },
  {
    slug: "administracion-airbnb",
    slugEn: "airbnb-management",
    dictKey: "administracionAirbnb",
    image: "/img/rental/administracion-airbnb.webp",
    oldPath: "/airbnb-management/",
    leadType: "seller",
  },
  {
    slug: "administracion-de-departamentos",
    slugEn: "apartment-management",
    dictKey: "administracionDepartamentos",
    image: "/img/rental/administracion-de-departamentos.webp",
    oldPath: "/apartment-management/",
    leadType: "seller",
  },
  {
    slug: "inmobiliaria-asuncion",
    slugEn: "realtor-asuncion",
    dictKey: "inmobiliariaAsuncion",
    image: "/img/rental/inmobiliaria-asuncion.webp",
    oldPath: "/realtor-asuncion/",
    leadType: "buyer",
  },
  {
    slug: "residencia-paraguay",
    slugEn: "residency-paraguay",
    dictKey: "residenciaParaguay",
    image: "/img/rental/residencia-paraguay.webp",
    oldPath: "/residency-paraguay/",
    leadType: "renter",
  },
  {
    slug: "invertir-en-paraguay",
    slugEn: "invest-in-paraguay",
    dictKey: "invertirEnParaguay",
    image: "/img/rental/invertir-en-paraguay.webp",
    oldPath: "/invest-in-paraguay/",
    leadType: "buyer",
  },
  {
    slug: "domicilio-virtual",
    // The old site's own misspelling was `/virtual-adress/`; the new English
    // URL is spelled correctly and S1's redirect map points the old one here.
    slugEn: "virtual-address",
    dictKey: "domicilioVirtual",
    image: "/img/rental/domicilio-virtual.webp",
    oldPath: "/virtual-adress/", // the old site's own spelling — S1 redirects it verbatim
    leadType: "renter",
  },
] as const;

/**
 * The rental business's own pages, per language (R2, plan §5.1 / Stage 1 C2).
 *
 * Every other URL in this app is built from Spanish slugs on every door
 * (`src/lib/urls.ts`) — a listing is the same row whatever language describes
 * it, so one path is right for all of them. The rental family's own pages are
 * the exception, and the reason is not symmetry: `rentparaguay.com` sells to
 * people who do not read Spanish, the WordPress site it replaces published
 * these pages under English paths, and the inbound links that still exist
 * expect them. `/propiedad/*` is emphatically NOT in this table — that is the
 * marketplace's page type, owned in English by `realestateinparaguay.com`, and
 * it stays Spanish-slugged on every door.
 *
 * This lives beside the slugs, in a module with no runtime imports at all, so
 * `next.config.ts` can build the cross-language 301s from it — see the
 * re-export in `src/design/sections.ts`, which is where the app imports it
 * from.
 */
export type RentalPageKind = "services" | "about" | "contact";

const RENTAL_PATHS: Record<RentalPageKind, Record<"es" | "en", string>> = {
  services: { es: "/servicios", en: "/services" },
  about: { es: "/nosotros", en: "/about" },
  contact: { es: "/contacto", en: "/contact" },
};

/**
 * Where one of the rental business's pages lives on a door of this language.
 *
 * The one place a rental URL is spelled. Nav, footer, home, the hub, the
 * service pages, the canonical tags, the hreflang map, the sitemap and the
 * cross-language 301s all go through it, so the seven services' two sets of
 * slugs cannot drift apart between the link that points at a page and the
 * route that serves it.
 *
 * `service` is only meaningful for `"services"`, where it selects one
 * service's page under the hub; nothing else takes it.
 */
export function rentalPath(
  locale: "es" | "en",
  page: RentalPageKind,
  service?: Pick<RentalService, "slug" | "slugEn">,
): string {
  const base = RENTAL_PATHS[page][locale];
  if (!service) return base;
  return `${base}/${locale === "en" ? service.slugEn : service.slug}`;
}

/**
 * The same page in both languages, shaped for `languageAlternates()`'s
 * `pathByLocale`. Built from `rentalPath()` rather than written out at each
 * call site: hreflang that points at a URL which 301s somewhere else is worse
 * than no hreflang, and that is exactly what a hand-typed second copy of these
 * strings decays into.
 */
export function rentalPathsByLocale(
  page: RentalPageKind,
  service?: Pick<RentalService, "slug" | "slugEn">,
): Record<"es" | "en", string> {
  return {
    es: rentalPath("es", page, service),
    en: rentalPath("en", page, service),
  };
}

/**
 * A URL segment back to its service, in whichever language the door speaks.
 * The route handlers' one lookup — `/servicios/<slug>` on a Spanish door and
 * `/services/<slugEn>` on an English one resolve to the same row, and a
 * segment from the *other* language resolves to nothing here (the route
 * redirects it, so it never reaches this function twice).
 */
export function rentalServiceBySlug(
  slug: string,
  locale: "es" | "en",
): RentalService | null {
  const key = locale === "en" ? "slugEn" : "slug";
  return RENTAL_SERVICES.find((s) => s[key] === slug) ?? null;
}
