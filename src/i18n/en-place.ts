import type { esPlace } from "./es-place";

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : T[K] };

/** Place pages, English door: a peer of `es-place.ts`, not a word-for-word copy. */
export const enPlace: Widen<typeof esPlace> = {
  metaNotFound: "Area not found",
  breadcrumbHome: "Home",
  photosTitle: "Photos",
  faqTitle: "Frequently asked questions",
  listingsTitle: (place: string) => `Properties in ${place} today`,
  listingsLink: (typeLabel: string, opLabel: string) => `${typeLabel} ${opLabel}`,
  listingsNone: (place: string) =>
    `There are no listings in ${place} today. Tell us what you are looking for and we will let you know when something comes in.`,
  barriosTitle: (city: string) => `Neighbourhood guides for ${city}`,
  cityGuideLink: (city: string) => `${city} area guide`,
  briefTitle: (place: string) => `Looking for property in ${place}?`,
  briefIntro: "Tell us what you need and we will let you know when something that fits is listed.",
  excerptTitle: (place: string) => `About ${place}`,
  excerptLink: (place: string) => `Read the ${place} area guide`,
  photoCredit: (credit: string) => credit,
};
