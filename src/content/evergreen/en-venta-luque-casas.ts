/**
 * Evergreen page (English door): /venta/luque/casas — "houses for sale in
 * luque paraguay", for realestateinparaguay.com.
 *
 * Luque neighbors Asunción and hosts the international airport; both are
 * factual claims listed in claimsToVerify. Prose only, no numbers (the page
 * counts those from its own rows).
 */
import type { EvergreenPage } from "./types";

export const enVentaLuqueCasas: EvergreenPage = {
  path: "/venta/luque/casas",
  door: "en",
  keyword: "houses for sale in luque paraguay",
  secondaryKeywords: [
    "houses for sale luque paraguay",
    "luque paraguay real estate",
    "homes for sale in luque",
    "buy a house in luque paraguay",
    "property for sale near asuncion airport",
    "luque houses for sale near asuncion",
    "cheap houses in luque paraguay",
  ],
  h1: "Houses for sale in Luque",
  lede:
    "Compare houses for sale in Luque by price, see what's listed right now, and save your search so we can flag a fresh match.",
  metaDescription:
    "Houses for sale in Luque, Paraguay: filter by price, browse today's listings and save a search for new houses that fit.",
  priceBands: [
    { max: 60_000 },
    { min: 60_001, max: 100_000 },
    { min: 100_001, max: 180_000 },
    { min: 180_001 },
  ],
  barrios: {
    title: "Neighborhoods of Luque worth knowing before you buy",
    intro:
      "Luque isn't one single market for a house buyer: the same budget buys something quite different depending on the neighborhood, so these differences are worth weighing early.",
    items: [
      {
        name: "The town center",
        text:
          "Around the plaza and the Municipalidad, where older houses sit on generous lots close to shops, banks and schools. The tradeoff is traffic at busy hours and houses that often need some updating.",
      },
      {
        name: "Near the airport and the highway",
        text:
          "Neighborhoods close to Silvio Pettirossi International Airport and the highway that links Luque to Asunción, valued for the fast commute into the capital. Visit at different times of day before deciding — aircraft noise varies sharply from one block to the next.",
      },
      {
        name: "Near CONMEBOL and Ñu Guasú",
        text:
          "The area around the CONMEBOL headquarters and Ñu Guasú park, home to much of the newest construction, including gated communities. Houses here tend to be newer and often carry an association fee where they sit inside a gated development, so ask what that fee covers before comparing prices.",
      },
      {
        name: "The outer neighborhoods",
        text:
          "Farther out, lots get bigger and prices go further, but services differ block by block — paved, cobbled or dirt streets, a piped water network or a private well, sewer connection or a septic system. Confirm each of those house by house, not by neighborhood.",
      },
    ],
  },
  prices: {
    title: "What the listed prices show",
    paragraphs: [
      "The figures above come only from houses for sale listed today in Luque on this site: asking prices set by the seller, not closed sales, and they shift as houses appear and disappear from the list.",
      "Plenty of houses in Luque are listed in dollars, others in guaraníes. To make comparison possible, the site filters and sorts by the dollar equivalent; convert a guaraní budget before you use the price filter.",
      "When comparing two houses, look at lot size as much as the built area — in Luque it's common for a large share of the value to sit in the land itself.",
    ],
  },
  checklist: {
    title: "What to check before buying a house in Luque",
    intro:
      "A visit and a conversation with the seller aren't enough on their own. Before putting down a deposit, have an answer for each of these:",
    items: [
      "The title in the seller's own name, along with a current lien search confirming there are no embargoes, mortgages or other restrictions.",
      "Whether the property tax owed to the Municipalidad de Luque is paid up to date, with a receipt for the last payment.",
      "Whether extensions to the house — an outdoor kitchen, extra rooms, a garage — were built with plans approved by the Municipalidad.",
      "Where the water supply comes from — a piped network, a junta de saneamiento or a private well — and how the pressure holds up at peak use.",
      "Whether the house connects to a sewer line or relies on a septic system, and its condition.",
      "How the street handles a heavy downpour: a visit right after a storm tells you more than any description will.",
      "The real commute to your job or your children's school, driven at rush hour rather than on a quiet Sunday.",
      "Who handles the deed — an escribano público signs it — and asking their fee and the transfer costs upfront.",
    ],
  },
  financing: {
    title: "Paying for a house in Luque",
    paragraphs: [
      "Some buyers pay outright, others use a mortgage from a bank or a lender. Some lenders offer first-home loans backed by the Agencia Financiera de Desarrollo, though eligibility and terms are set by each lender and change over time.",
      "Our financing page brings together the programs we're aware of, plus an estimated monthly payment for comparison. Treat it as a planning tool, not an approval — the rate, the term and the final amount rest with whichever lender extends the loan.",
    ],
  },
  faq: [
    {
      q: "How much does a house in Luque cost?",
      a: "It mostly depends on the neighborhood, the lot size and the condition of the house. Above we show the range for houses listed today; we don't publish a citywide average because we can't back one with our own data.",
    },
    {
      q: "Are houses in Luque priced in dollars or guaraníes?",
      a: "Both. Each listing shows the currency the seller chose along with its equivalent, and the currency of the sale itself is agreed with the seller before signing.",
    },
    {
      q: "What documents should I ask the seller for?",
      a: "At minimum the title, a recent lien search, proof the property tax is current and, if the house has extensions, their approved plans. A trusted escribano público or a Paraguayan lawyer can review these before you put down a deposit.",
    },
    {
      q: "Is Luque far from Asunción?",
      a: "Luque borders Asunción, but travel time depends heavily on the neighborhood and the time of day. Drive the exact route you'd take daily, at the time you'd actually take it, before deciding.",
    },
    {
      q: "What if nothing available today works for me?",
      a: "Leave your search on this page's form with your budget and what you need. Our team reads it and follows up by WhatsApp when a house in Luque comes up that fits.",
    },
  ],
  claimsToVerify: [
    "Silvio Pettirossi International Airport is located in Luque.",
    "A highway connects Luque with Asunción.",
    "The CONMEBOL headquarters and Ñu Guasú park are in or adjacent to Luque, and much of the area's newest construction, including gated communities, is concentrated there.",
    "Luque's town center has older houses on larger lots, with shops, banks and schools nearby.",
    "Outer neighborhoods of Luque have larger, cheaper lots, and services such as paved streets, piped water and sewer connections vary street by street.",
    "Many houses in Luque are listed in US dollars and others in Paraguayan guaraníes; a significant share of a house's value is often attributed to the land.",
    "Property tax (impuesto inmobiliario) on a Luque house is paid to the Municipalidad de Luque, and house extensions require Municipalidad-approved plans.",
    "Water in Luque can come from a piped network (ESSAP), a junta de saneamiento, or a private well; houses have either a sewer connection or a septic system (pozo ciego).",
    "A property sale deed in Paraguay is signed before an escribano público, and a lien search ('informe de condiciones de dominio') shows embargoes and mortgages against the title.",
    "Some lenders offer first-home mortgages funded by the Agencia Financiera de Desarrollo (AFD); terms are set by each lender.",
    "Luque borders the city of Asunción.",
    "Operational promise: a search request left on this page is read by our team, who follow up by WhatsApp when a matching house in Luque is listed.",
  ],
};
