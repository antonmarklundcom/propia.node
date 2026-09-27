/**
 * Evergreen page (English door): /venta/encarnacion/casas — "houses for sale
 * in encarnacion paraguay", for realestateinparaguay.com.
 *
 * Prose only, no numbers (the page counts those from its own rows); every
 * factual claim is listed in claimsToVerify.
 */
import type { EvergreenPage } from "./types";

export const enVentaEncarnacionCasas: EvergreenPage = {
  path: "/venta/encarnacion/casas",
  door: "en",
  keyword: "houses for sale in encarnacion paraguay",
  secondaryKeywords: [
    "houses for sale encarnacion paraguay",
    "encarnacion paraguay real estate",
    "homes for sale in encarnacion",
    "cheap houses in encarnacion paraguay",
    "buy a house in encarnacion paraguay",
    "encarnacion houses for sale",
    "property for sale encarnacion paraguay",
  ],
  h1: "Houses for sale in Encarnación",
  lede:
    "Search houses for sale in Encarnación by budget and leave your search on file if today's listings don't have the one you need.",
  metaDescription:
    "Houses for sale in Encarnación, Paraguay: filter by budget, browse today's listings and leave your search for new matches.",
  priceBands: [
    { max: 60_000 },
    { min: 60_001, max: 100_000 },
    { min: 100_001, max: 180_000 },
    { min: 180_001 },
  ],
  barrios: {
    title: "Where to look for a house in Encarnación",
    intro:
      "House prices in Encarnación turn mainly on distance to the costanera and on whether the neighborhood is one of the older, established ones or part of the newer growth toward Cambyretá.",
    items: [
      {
        name: "Near the costanera",
        text:
          "Houses closest to the rebuilt riverside promenade and its beaches ask the highest price per square meter in the city. This is also where new construction has replaced some of the older housing stock.",
      },
      {
        name: "The microcentro",
        text:
          "Close to shops and offices, but few houses remain for sale here: most lots were already built up with commercial buildings, so what does come up often carries extra value as land rather than as a house.",
      },
      {
        name: "The older, established neighborhoods",
        text:
          "Set back from the costanera, these are older parts of the city with larger lots and gentler prices. Check the condition of the older construction carefully before comparing it against newer houses elsewhere.",
      },
      {
        name: "Cambyretá and the growth areas",
        text:
          "In the neighboring town of Cambyretá, much of the newest housing is going up, often on bigger lots for less than a comparable spot closer to Encarnación's costanera.",
      },
    ],
  },
  prices: {
    title: "What the listed prices show",
    paragraphs: [
      "The range above reflects only the houses for sale listed today in Encarnación on this site: figures the seller is asking, not completed sales, and they move as listings come and go.",
      "Near the costanera it is more common to see the asking price in dollars, while houses in the outer neighborhoods are often listed in guaraníes instead. The site filters and sorts by the dollar equivalent, so convert your budget to dollars before checking the ranges.",
      "Lot size carries a lot of weight in this city's prices: a small older house on a large lot near the costanera can be worth more than a newer house on a smaller lot farther out.",
    ],
  },
  checklist: {
    title: "What to check before buying a house in Encarnación",
    intro: "Settle these points before putting down a deposit on a house in this city:",
    items: [
      "That the title sits in the name of whoever is selling, backed by a current lien search showing no outstanding embargoes or mortgages.",
      "Proof that the property tax is paid up to date with the Municipalidad, and whether the lot was affected by any resettlement tied to the costanera reconstruction.",
      "Whether extensions on older houses — common in the established neighborhoods — were ever approved with plans filed at the Municipalidad.",
      "Where the water supply comes from and how the house connects to sewage or to a septic system.",
      "How the lot handles heavy rain, a detail that matters more in the lower-lying neighborhoods near the river.",
      "Whether the summer tourist season adds noticeably to daily traffic near the house, especially close to the costanera.",
      "The fees the escribano público will charge to certify the deed and the transfer costs, worth budgeting separately from the price of the house.",
      "Whether the house sits in Cambyretá or in Encarnación itself, since that decides which Municipalidad handles the paperwork.",
    ],
  },
  financing: {
    title: "Paying for a house in Encarnación",
    paragraphs: [
      "A house here can be paid in cash or through a mortgage arranged with a bank or a lender. Some lenders work with first-home programs funded by the Agencia Financiera de Desarrollo, though terms vary by lender and change over time.",
      "Our financing page lists the programs we're aware of along with an estimated monthly payment to help you plan. It's a reference, not an approval — whichever lender finances the purchase sets the final rate, term and amount.",
    ],
  },
  faq: [
    {
      q: "How much does a house cost in Encarnación?",
      a: "It depends heavily on distance to the costanera and on lot size. Above we show the range for houses currently listed in the city.",
    },
    {
      q: "Are houses in Encarnación sold in dollars or guaraníes?",
      a: "Both currencies come up in this city, with dollars more common near the costanera. Each listing states the currency the seller chose.",
    },
    {
      q: "What paperwork should I ask the seller for?",
      a: "Ask for the title, an up-to-date lien search and proof the property tax is current. Have a Paraguayan lawyer or a trusted escribano público review these before you sign anything or hand over a deposit.",
    },
    {
      q: "Is it better to buy in Cambyretá or in Encarnación?",
      a: "It comes down to budget and how close you want to be to the microcentro and the costanera: Cambyretá often stretches a budget further in land.",
    },
    {
      q: "What if nothing today fits what I'm looking for?",
      a: "Tell us your budget and the kind of house you want through this page's form. We keep that on file and reach out by WhatsApp the next time a matching house in Encarnación is listed.",
    },
  ],
  claimsToVerify: [
    "Houses near Encarnación's costanera command a higher price per square meter than houses elsewhere in the city.",
    "Parts of Encarnación were resettled or reorganized in connection with the Yacyretá dam and the costanera reconstruction, with municipal processes affecting some properties.",
    "Cambyretá is a separate municipality from Encarnación, so a property there falls under a different Municipalidad for taxes and permits.",
    "Property tax (impuesto inmobiliario) on a house in Encarnación is paid to the Municipalidad de Encarnación.",
    "Tourist traffic in Encarnación increases during the summer season, affecting streets near the costanera.",
    "A property sale deed in Paraguay is signed before an escribano público, and a lien search ('informe de condiciones de dominio') shows embargoes and mortgages against the title.",
    "Some lenders offer first-home mortgage programs funded by the Agencia Financiera de Desarrollo (AFD); terms are set individually by each lender.",
    "Operational promise: a search request left on this page is read by our team, who follow up by WhatsApp when a matching house in Encarnación is listed.",
  ],
};
