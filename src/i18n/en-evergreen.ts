/**
 * English peer of `es-evergreen.ts` — see that file. The evergreen content
 * files are Spanish-only in this phase, so on the English door these strings
 * only render if a page is ever made evergreen there.
 */
import type { esEvergreen } from "./es-evergreen";

type Widened<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widened<R>
    : { [K in keyof T]: Widened<T[K]> };

export const enEvergreen = {
  chipsAria: "Search shortcuts",
  typesLabel: "Type",
  pricesLabel: "Price",
  barriosLabel: "Neighbourhood",
  chipZeroHint: "No listings today: leave your search",
  bandUpTo: (max: string) => `Up to ${max}`,
  bandFrom: (min: string) => `Over ${min}`,
  bandRange: (min: string, max: string) => `${min} to ${max}`,
  seeAll: (n: number) => `See ${n} ${n === 1 ? "property" : "properties"}`,
  notifyMe: "Tell me when there are some",
  briefTitle: (where: string) => `Tell us what you're looking for in ${where}`,
  briefTitleEmpty: (what: string, where: string, _fem: boolean) =>
    `No ${what} listed in ${where} today. Leave your search and we'll let you know`,
  briefIntro:
    "A short form, no commitment. Our team reads it and writes to you when something that fits comes up.",
  whatsappCta: "Ask on WhatsApp",
  whatsappText: (what: string) => `Hello, I'm looking for ${what}.`,
  listingsTitle: (what: string, _fem: boolean) => `${what} listed today`,
  nearbyTitle: (what: string, where: string) => `${what} near ${where}`,
  nearbyNote: (where: string, places: string) =>
    `There are no listings in ${where} today. These are in nearby cities: ${places}.`,
  nearbyNone: (where: string) =>
    `There are no listings in ${where} or nearby cities today. Leave your search above and we'll let you know.`,
  nearbyChip: "Nearby",
  factsCount: (countNoun: string, where: string, _fem: boolean) =>
    `There are ${countNoun} listed in ${where} on this site today.`,
  factsRange: (min: string, max: string) =>
    min === max ? `The asking price is ${min}.` : `Asking prices range from ${min} to ${max}.`,
  factsEmpty: (what: string, where: string, _fem: boolean) =>
    `No ${what} are listed in ${where} on this site today, so we show no prices: we would rather not give you a number we cannot back.`,
  financingCta: "See programmes and estimate the payment",
  faqTitle: "Frequently asked questions",
  guidesTitle: "Related guides",
} satisfies Widened<typeof esEvergreen>;
