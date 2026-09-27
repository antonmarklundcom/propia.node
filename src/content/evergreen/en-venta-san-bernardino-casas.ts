/**
 * Evergreen page (English door): /venta/san-bernardino/casas — "houses for
 * sale in san bernardino paraguay", for realestateinparaguay.com.
 *
 * San Bernardino splits between a weekend/summer market on the lakeshore and
 * full-time residents elsewhere in town; this page names both honestly
 * instead of assuming one. Prose only, no numbers (the page counts those
 * from its own rows); every factual claim is listed in claimsToVerify.
 */
import type { EvergreenPage } from "./types";

export const enVentaSanBernardinoCasas: EvergreenPage = {
  path: "/venta/san-bernardino/casas",
  door: "en",
  keyword: "houses for sale in san bernardino paraguay",
  secondaryKeywords: [
    "houses for sale san bernardino paraguay",
    "san bernardino paraguay real estate",
    "san bernardino houses for sale",
    "homes for sale in san bernardino paraguay",
    "lake ypacarai houses for sale",
    "buy a house in san bernardino paraguay",
    "san bernardino lakefront homes",
  ],
  h1: "Houses for sale in San Bernardino",
  lede:
    "Browse houses for sale beside Lake Ypacaraí, from summer retreats to year-round homes, and filter by what you can spend.",
  metaDescription:
    "Houses for sale in San Bernardino, Paraguay: filter by price, from lakeside weekend homes to year-round houses near Lago Ypacaraí.",
  priceBands: [
    { max: 80_000 },
    { min: 80_001, max: 150_000 },
    { min: 150_001, max: 300_000 },
    { min: 300_001 },
  ],
  barrios: {
    title: "Which part of San Bernardino fits how you plan to use the house",
    intro:
      "San Bernardino is built around its edge on Lake Ypacaraí, and that distance from the water changes the kind of house you find, whether you want somewhere for weekends or a place to live full time.",
    items: [
      {
        name: "The shoreline",
        text:
          "Houses closest to the water tend to be built with weekends and the summer season in mind: wide patios, an outdoor kitchen, sometimes a dock. Ask how the house held up after being closed for a stretch, especially dampness and the wiring.",
      },
      {
        name: "The town center",
        text:
          "Near the plaza and the local shops is where full-time residents cluster, with a school, a pharmacy and everyday errands within easy reach. Houses here are usually smaller than those on the shoreline, on more modest lots.",
      },
      {
        name: "Along the road into town",
        text:
          "Houses along the route that links San Bernardino to the rest of Cordillera suit someone who drives to Asunción often for work, though traffic and noise on that road shift a lot from one block to the next.",
      },
      {
        name: "Farther from the water",
        text:
          "Away from the shoreline, lots get bigger and prices ease, with houses built mostly for full-time living rather than a season. Weigh the real distance to the center, the school and work before deciding that trade-off is worth it.",
      },
    ],
  },
  prices: {
    title: "What the listed prices show",
    paragraphs: [
      "The range above comes only from houses currently listed in San Bernardino on this site: asking prices set by whoever is selling, not closed sales, and they shift as houses join or leave the list.",
      "Many shoreline houses are listed in dollars, while houses set back from the lake often appear in guaraníes as well; the site filters and sorts by the dollar equivalent, so convert your budget before using the price filter.",
      "Between two similar houses, distance to the water and whether the house was built for a season or for daily living usually explain the price gap more than the floor plan does.",
    ],
  },
  checklist: {
    title: "What to check before buying a house in San Bernardino",
    intro:
      "A viewing and a friendly chat with the seller are not enough here. Before you put down a deposit, get a clear answer on each of the following:",
    items: [
      "The title in the seller's own name, backed by a current lien search confirming there are no outstanding embargoes or mortgages.",
      "Whether the property tax owed to the Municipalidad is paid up to date, with a receipt for the most recent payment.",
      "Whether any extension to the house — a covered patio, an extra room, a garage — was built with plans approved by the Municipalidad.",
      "Where the water supply comes from — a junta de saneamiento or a private well — and any signs of dampness tied to the lake.",
      "Whether the lot has a history of flooding when the lake rises, worth asking neighbors as well as the seller.",
      "How the plumbing, wiring and appliances have held up if the house sat closed for long stretches.",
      "The real driving time to Asunción if you plan to use the house on weekdays, not only weekends.",
      "Which escribano público will certify the deed, and getting their fee and the transfer costs in writing beforehand.",
    ],
  },
  financing: {
    title: "Paying for a house in San Bernardino",
    paragraphs: [
      "Many buyers here pay in cash, especially for a weekend house, but a mortgage from a bank or a lender is also an option for a house you plan to live in full time. Eligibility for a non-resident buyer is set by each lender, so confirm directly before assuming you qualify.",
      "Our financing page gathers the programs we know about along with an estimated monthly payment for comparison. It is a planning reference, not an approval — the rate, the term and the final amount are set by whichever lender you approach.",
    ],
  },
  faq: [
    {
      q: "How much does a house in San Bernardino cost?",
      a: "It depends mostly on distance to the lake and whether the house was built for weekends or for year-round living. Above we show the range for houses listed today; we don't publish a town average because we can't back it with our own data.",
    },
    {
      q: "Are San Bernardino houses only for weekend use?",
      a: "Not all of them. Houses right on the shoreline lean toward seasonal use, but around the town center and further inland plenty of people live there full time. Ask directly how each seller used the house before you buy it.",
    },
    {
      q: "Are houses in San Bernardino priced in dollars or guaraníes?",
      a: "Both currencies are common, with dollars more frequent along the shoreline. Each listing shows the currency the seller chose, and the final currency of the sale is agreed before signing.",
    },
    {
      q: "What documents should I ask the seller for?",
      a: "At minimum the title, a current lien search, proof the property tax is paid and, if the house was extended, the approved plans for that work. A Paraguayan lawyer or an escribano público you trust can review these before you put down a deposit.",
    },
    {
      q: "What if nothing available today fits what I need?",
      a: "Leave your search on this page along with whether you want a weekend house or a year-round one. We reach out by WhatsApp as soon as a matching house in San Bernardino is listed.",
    },
  ],
  claimsToVerify: [
    "San Bernardino is a town on the shore of Lake Ypacaraí, in the Cordillera department.",
    "Houses on or near the shoreline in San Bernardino are more commonly built or used as weekend/summer houses than as full-time residences.",
    "The town center around the plaza is where more full-time residents live, with a school, a pharmacy and everyday shops nearby.",
    "A road connects San Bernardino to the rest of the Cordillera department and is used by commuters traveling to and from Asunción.",
    "Houses farther from the lake tend to sit on larger, less expensive lots and are more often built for full-time living.",
    "Houses along the San Bernardino shoreline are commonly listed in US dollars; houses farther from the lake are also commonly listed in Paraguayan guaraníes.",
    "Some land near the San Bernardino lakeshore has a history of flooding when the lake's water level rises.",
    "A house left closed for long periods can develop plumbing, wiring or appliance issues not obvious on a short visit.",
    "Property tax (impuesto inmobiliario) on a San Bernardino house is paid to the Municipalidad de San Bernardino; house extensions require plans approved by the Municipalidad.",
    "A property sale deed in Paraguay is signed before an escribano público, and a lien search ('informe de condiciones de dominio') shows embargoes and mortgages against the title.",
    "Mortgage eligibility for a non-resident buyer in Paraguay is set individually by each lender.",
    "Operational promise: a search request left on this page is read by our team, who follow up by WhatsApp when a matching house in San Bernardino is listed.",
  ],
};
