/**
 * Evergreen page (English door): /alquiler-temporal/asuncion — "short term
 * rentals asuncion", for realestateinparaguay.com.
 *
 * Aimed at people exploring Paraguay before committing to a move, business
 * stays and medical stays. Prose only, no numbers (the page counts those
 * from its own rows).
 */
import type { EvergreenPage } from "./types";

export const enAlquilerTemporalAsuncion: EvergreenPage = {
  path: "/alquiler-temporal/asuncion",
  door: "en",
  keyword: "short term rentals asuncion",
  secondaryKeywords: [
    "short term apartment rental asuncion paraguay",
    "furnished apartments asuncion short stay",
    "monthly rental asuncion paraguay",
    "temporary housing asuncion",
    "corporate housing asuncion paraguay",
    "extended stay asuncion paraguay",
  ],
  h1: "Short-term rentals in Asunción",
  lede:
    "Furnished apartments and houses in Asunción for a few weeks or a few months, ready to move into without buying a thing.",
  metaDescription:
    "Short-term rentals in Asunción: furnished apartments and houses by the week or month. Filter by price and save your search.",
  priceBands: [{ max: 500 }, { min: 501, max: 1000 }, { min: 1001 }],
  barrios: {
    title: "Where to stay in Asunción depending on why you're here",
    intro:
      "Choosing a short stay isn't like choosing a home to settle into: the reason for the trip matters more than the size of the place. These are the areas that tend to fit each reason best.",
    items: [
      {
        name: "Centro and the Casco Histórico",
        text:
          "A fit for anyone here for paperwork, a hearing or meetings at government offices: much of that gets done on foot from this part of the city, without relying on transport across town.",
      },
      {
        name: "Villa Morra and Recoleta",
        text:
          "The part of the city with the most offices, restaurants and private clinics. It's the usual pick for a work trip or a stay built around medical care, given how close the hospitals and sanatoriums sit.",
      },
      {
        name: "The Costanera",
        text:
          "The strip along the river, with walking paths and a different view from the rest of the city. It suits a stay built around rest or a long weekend more than one packed with meetings.",
      },
      {
        name: "San Vicente and the streets around the center",
        text:
          "A more affordable option than Villa Morra for anyone who just needs to be near downtown without paying for the busiest commercial stretch of the city.",
      },
    ],
  },
  prices: {
    title: "What short-stay prices show",
    paragraphs: [
      "The range above comes from short-stay places listed today on this site: unlike an ordinary rental, the price already covers being furnished and ready to move into.",
      "The nightly or weekly rate on a short stay tends to drop the longer you stay, so it's worth asking directly about the length of your trip and the purpose before comparing places purely on the short-stay rate.",
      "Check exactly what each listing includes: some already bundle electricity, water and internet into the price, while others bill those separately based on use during your stay.",
    ],
  },
  checklist: {
    title: "What to check before booking a short stay in Asunción",
    intro:
      "A short stay comes together faster than an ordinary lease, but confirm these points before transferring anything:",
    items: [
      "What the price actually includes: electricity, water, internet, cleaning and linens.",
      "The minimum stay the host accepts, and whether a longer stay earns a lower rate.",
      "What security deposit is required before the keys change hands, and when it's returned.",
      "Whether the host invoices as a business or as an individual, in case you need that paperwork for your employer.",
      "How check-in and check-out work, and whether someone is reachable if you arrive at an unusual hour.",
      "The actual state of the internet connection, especially if you plan to work from the place during your stay.",
      "The host's policy if you need to cancel or change your arrival date.",
    ],
  },
  financing: {
    title: "What's usually included in a short-term rental in Asunción",
    paragraphs: [
      "Unlike an ordinary lease, a short-term stay generally arrives furnished and with electricity, water and internet already bundled into the price; confirm with the host exactly what's left out before you book.",
      "The deposit on a short stay is typically simpler than on a long lease — an advance payment is usually enough, without a guarantor or rental insurance.",
      "If you need an invoice for your stay to submit to your employer or for an expense report, ask before booking whether the host invoices as a business, since not every host does.",
    ],
  },
  faq: [
    {
      q: "What's the difference between a short-term rental and an ordinary lease in Asunción?",
      a: "A short-term rental comes furnished with the utilities already sorted, built for a brief or medium stay, while an ordinary lease is signed for someone settling in for the long run.",
    },
    {
      q: "How much does a short-term rental cost in Asunción?",
      a: "It depends on the length of the stay, the neighborhood and whether utilities are included. Above we show today's range so you can compare before booking.",
    },
    {
      q: "Do hosts ask for a guarantor for a short stay?",
      a: "Almost never. Most hosts are satisfied with an advance payment as security, without asking for a guarantor or rental insurance the way a long lease would.",
    },
    {
      q: "Can I get an invoice for a short stay?",
      a: "It depends on the host: some invoice as a business and others don't. Ask before booking if you need that paperwork for your employer.",
    },
    {
      q: "Can a short-term rental work for an extended stay?",
      a: "Yes, many hosts accept medium-length stays and often lower the rate the longer you stay. Ask directly about the length you need instead of judging only by the short-stay rate.",
    },
    {
      q: "What if nothing available today fits my stay?",
      a: "Leave your search on this page with your budget and how long you'll be staying. Our team reaches out by WhatsApp when a short-term rental in Asunción that fits comes up.",
    },
  ],
  claimsToVerify: [
    "Villa Morra and Recoleta concentrate offices and private clinics/sanatoriums, making the area a common choice for business trips and medically related stays.",
    "The Costanera de Asunción is a riverside promenade area with a different character from the rest of the city.",
    "The Centro/Casco Histórico area of Asunción is within walking distance of a number of government offices, useful for administrative visits.",
    "Short-term furnished rentals in Paraguay are commonly billed with utilities such as electricity, water and internet already included in the price.",
    "Deposit requirements for short-term/furnished rentals are typically simpler (an advance payment) than for a standard long-term lease, which may require a guarantor or rental insurance.",
    "Not every short-term rental host in Paraguay issues a business invoice (factura) for a stay.",
    "Operational promise: a search request left on this page is read by our team, who follow up by WhatsApp when a matching short-term rental in Asunción is listed.",
  ],
};
